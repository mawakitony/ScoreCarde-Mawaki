import { randomBytes } from "node:crypto"
import { expect, test, type Page } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const SHOT = "docs/saas/auth-confirm-invite"

/**
 * Real Auth confirmation path:
 * - UI signUp (Confirm email stays ON)
 * - confirmation link retrieved via admin.generateLink (same link Auth emails — NOT email_confirm:true)
 * - invite collaborator + accept
 *
 * Stops immediately if Auth email rate limit is still active (no signup loops).
 */
test.describe("SaaS Auth confirm + collaborator invite (staging)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(240_000)

  const suffix = randomBytes(3).toString("hex")
  // Avoid example.com — staging Auth rejects it as invalid.
  const ownerEmail = `woloyem.owner.${suffix}@inbox.testmail.app`
  const ownerPassword = `Owner-${suffix}-Aa1!`
  const collabEmail = `woloyem.collab.${suffix}@inbox.testmail.app`
  const collabPassword = `Collab-${suffix}-Aa1!`
  const orgSlug = `auth-org-${suffix}`
  const orgName = `Maison Auth ${suffix}`

  let ownerId: string | null = null
  let collabId: string | null = null
  let organizationId: string | null = null
  let blockedReason: string | null = null

  test.afterAll(async () => {
    if (!ready) return
    const admin = e2eAdminClient()
    if (organizationId) {
      await admin.from("organization_invitations").delete().eq("organization_id", organizationId)
      await admin.from("organization_members").delete().eq("organization_id", organizationId)
      await admin.from("subscriptions").delete().eq("organization_id", organizationId)
      await admin.from("audit_logs").delete().eq("organization_id", organizationId)
      await admin.from("email_jobs").delete().eq("organization_id", organizationId)
      await admin.from("organizations").delete().eq("id", organizationId)
    }
    if (ownerId) await admin.auth.admin.deleteUser(ownerId)
    if (collabId) await admin.auth.admin.deleteUser(collabId)
  })

  test("01 signup UI + real email confirmation (no email_confirm bypass)", async ({ page }) => {
    // Single UI signup only — no probe loops that burn Auth email quota.
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: /Essayer gratuitement|Créer/i })).toBeVisible()
    await page.locator("#fullName").fill("Camille Auth")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(ownerEmail)
    await page.locator("#password").fill(ownerPassword)
    await page.getByRole("button", { name: /Créer le compte/i }).click()

    const outcome = await Promise.race([
      page.getByText(/Compte créé\. Ouvrez le lien reçu/i).waitFor({ timeout: 45_000 }).then(() => "message" as const),
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /Trop d'e-mails|rate|SMTP|minutes|heure/i })
        .first()
        .waitFor({ timeout: 45_000 })
        .then(() => "rate_limited" as const),
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /adresse e-mail|acceptée|échoué/i })
        .first()
        .waitFor({ timeout: 45_000 })
        .then(() => "error" as const),
      page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 45_000 }).then(() => "session" as const),
    ]).catch(() => "none" as const)

    await page.screenshot({ path: `${SHOT}-01-signup.png`, fullPage: true })

    if (outcome === "rate_limited") {
      blockedReason = "AUTH_EMAIL_RATE_LIMIT"
      test.skip(true, "BLOCKED: Auth email rate limit on signup UI")
    }
    if (outcome === "session") {
      // Confirm email appears disabled — not the desired staging posture.
      test.info().annotations.push({
        type: "warn",
        description: "Immediate session after signup — Confirm email may be OFF on staging",
      })
    }
    if (outcome !== "message" && outcome !== "session") {
      throw new Error(`Signup UI unexpected outcome=${outcome}`)
    }

    const admin = e2eAdminClient()
    ownerId = await findAuthUserId(admin, ownerEmail)
    expect(ownerId).toBeTruthy()

    // Retrieve the same verification link Auth would email — do NOT set email_confirm: true.
    const link = await admin.auth.admin.generateLink({
      type: "signup",
      email: ownerEmail,
      password: ownerPassword,
      options: { redirectTo: "http://localhost:3000/auth/callback?next=%2Fonboarding" },
    })
    expect(link.error, link.error?.message).toBeFalsy()
    const actionLink = link.data.properties?.action_link
    expect(actionLink).toBeTruthy()

    const before = await admin.auth.admin.getUserById(ownerId!)
    expect(before.data.user?.email_confirmed_at).toBeFalsy()

    await page.goto(actionLink!)
    await page.waitForURL(/localhost:3000\/(onboarding|dashboard|auth\/callback|login)/, { timeout: 60_000 })
    // Follow client redirect if still on callback
    if (page.url().includes("/auth/callback")) {
      await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 })
    }
    await page.screenshot({ path: `${SHOT}-01-confirmed.png`, fullPage: true })

    const after = await admin.auth.admin.getUserById(ownerId!)
    expect(after.data.user?.email_confirmed_at).toBeTruthy()
    await admin.from("profiles").upsert(
      { id: ownerId!, email: ownerEmail, full_name: "Camille Auth" },
      { onConflict: "id" },
    )
  })

  test("02 create organization after confirmed signup", async ({ page }) => {
    test.skip(Boolean(blockedReason), `BLOCKED: ${blockedReason}`)
    await login(page, ownerEmail, ownerPassword)
    if (!page.url().includes("/onboarding")) await page.goto("/onboarding")
    await expect(page.getByRole("heading", { name: /Créer votre organisation/i })).toBeVisible()
    await page.locator("#name").fill(orgName)
    await page.locator("#slug").fill(orgSlug)
    await page.locator("#useCase").fill("Cosmétiques")
    await page.locator("#country").fill("France")
    await page.getByRole("button", { name: "Continuer" }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 45_000 })

    const admin = e2eAdminClient()
    const org = await admin.from("organizations").select("id").eq("slug", orgSlug).maybeSingle()
    expect(org.data?.id).toBeTruthy()
    organizationId = org.data!.id
    await page.screenshot({ path: `${SHOT}-02-org.png`, fullPage: true })
  })

  test("03 invite collaborator + accept with confirmed account", async ({ page, browser }) => {
    test.skip(Boolean(blockedReason), `BLOCKED: ${blockedReason}`)
    const admin = e2eAdminClient()
    await login(page, ownerEmail, ownerPassword)
    await page.goto("/dashboard/settings/team")
    const inviteForm = page.locator("form").filter({ has: page.getByRole("button", { name: /^Inviter$/ }) })
    await inviteForm.locator('input[name="email"]').fill(collabEmail)
    await inviteForm.locator('select[name="role"]').selectOption("editor")
    await inviteForm.getByRole("button", { name: /^Inviter$/ }).click()
    await expect(page.getByText(/Invitation envoyée/i)).toBeVisible({ timeout: 30_000 })
    await page.screenshot({ path: `${SHOT}-03-invite.png`, fullPage: true })

    let inviteUrl: string | null = null
    for (let i = 0; i < 20; i++) {
      const { data } = await admin
        .from("email_jobs")
        .select("payload")
        .eq("organization_id", organizationId!)
        .eq("template", "organization_invitation")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      const payload = data?.payload as { url?: string } | null
      if (payload?.url?.includes("/invite/")) {
        inviteUrl = payload.url
        break
      }
      await page.waitForTimeout(500)
    }
    expect(inviteUrl).toBeTruthy()
    const token = inviteUrl!.split("/invite/")[1]?.split(/[?#]/)[0]
    expect(token).toBeTruthy()

    // Collaborator: real signup + confirmation (no email_confirm:true)
    const collabCtx = await browser.newContext()
    const collabPage = await collabCtx.newPage()
    try {
      await collabPage.goto(`/signup?next=${encodeURIComponent(`/invite/${token}`)}`)
      await collabPage.locator("#fullName").fill("Nora Collab")
      await collabPage.locator("form").filter({ has: collabPage.locator("#password") }).locator("#email").fill(collabEmail)
      await collabPage.locator("#password").fill(collabPassword)
      await collabPage.getByRole("button", { name: /Créer le compte/i }).click()
      await expect(
        collabPage.getByText(/Compte créé\. Ouvrez le lien reçu/i).or(collabPage.locator("[data-sonner-toast]")),
      ).toBeVisible({ timeout: 45_000 })

      if (await collabPage.locator("[data-sonner-toast]").filter({ hasText: /Trop d'e-mails|rate/i }).count()) {
        blockedReason = "AUTH_EMAIL_RATE_LIMIT_COLLAB"
        test.skip(true, "BLOCKED: Auth rate limit on collaborator signup")
      }

      collabId = await findAuthUserId(admin, collabEmail)
      expect(collabId).toBeTruthy()
      const link = await admin.auth.admin.generateLink({
        type: "signup",
        email: collabEmail,
        password: collabPassword,
        options: { redirectTo: `http://localhost:3000/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}` },
      })
      expect(link.error).toBeFalsy()
      const before = await admin.auth.admin.getUserById(collabId!)
      expect(before.data.user?.email_confirmed_at).toBeFalsy()

      await collabPage.goto(link.data.properties!.action_link!)
      await collabPage.waitForURL(/localhost:3000/, { timeout: 60_000 })
      if (collabPage.url().includes("/auth/callback")) {
        await collabPage.waitForURL(/\/(invite|dashboard|onboarding)/, { timeout: 30_000 })
      }
      const after = await admin.auth.admin.getUserById(collabId!)
      expect(after.data.user?.email_confirmed_at).toBeTruthy()
      await admin.from("profiles").upsert(
        { id: collabId!, email: collabEmail, full_name: "Nora Collab" },
        { onConflict: "id" },
      )

      if (!collabPage.url().includes(`/invite/${token}`)) {
        await collabPage.goto(`/invite/${token}`)
      }
      await expect(collabPage.getByRole("heading", { name: /Rejoindre/i })).toBeVisible({ timeout: 20_000 })
      const accept = collabPage.getByRole("button", { name: /Accepter|Rejoindre/i })
      if (await accept.count()) await accept.click()
      await collabPage.waitForURL(/\/dashboard/, { timeout: 45_000 })
      await collabPage.screenshot({ path: `${SHOT}-03-collab-joined.png`, fullPage: true })

      const membership = await admin
        .from("organization_members")
        .select("role, access_role, organization_id")
        .eq("user_id", collabId!)
        .maybeSingle()
      expect(membership.data?.organization_id).toBe(organizationId)
      expect(membership.data?.access_role).toBe("editor")
    } finally {
      await collabCtx.close()
    }
  })
})

async function findAuthUserId(admin: ReturnType<typeof e2eAdminClient>, email: string) {
  const target = email.toLowerCase()
  for (let pageNo = 1; pageNo <= 10; pageNo++) {
    const listed = await admin.auth.admin.listUsers({ page: pageNo, perPage: 200 })
    const hit = listed.data.users.find((u) => u.email?.toLowerCase() === target)
    if (hit?.id) return hit.id
    if ((listed.data.users?.length ?? 0) < 200) break
  }
  return null
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 })
}
