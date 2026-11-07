import { randomBytes } from "node:crypto"
import { expect, test, type Browser, type Page } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const SHOT = "docs/saas/cosmetics-journey"

/**
 * Parcours entreprise fictive cosmétiques — staging only.
 * Email confirm via Auth admin (pas d’inbox). Pas de paiement réel.
 */
test.describe("SaaS cosmetics customer journey (staging)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(300_000)

  const suffix = randomBytes(3).toString("hex")
  const ownerEmail = `e2e-cosmo-owner-${suffix}@example.com`
  const ownerPassword = `Cosmo-${suffix}-Aa1!`
  const collabEmail = `e2e-cosmo-collab-${suffix}@example.com`
  const collabPassword = `Collab-${suffix}-Aa1!`
  const orgSlug = `atelier-lumiere-${suffix}`
  const orgName = `Atelier Lumière ${suffix}`
  const cardSlug = `diag-peau-${suffix}`
  const cardName = "Diagnostic besoins peaux sensibles"
  const leadEmail = `cliente-peau-${suffix}@example.com`
  const questionTitle = "Quel est votre principal besoin beauté ?"

  let ownerId: string | null = null
  let collabId: string | null = null
  let organizationId: string | null = null
  let scorecardId: string | null = null
  let inviteToken: string | null = null
  let publicSlug = cardSlug

  test.afterAll(async () => {
    if (!ready) return
    const admin = e2eAdminClient()
    if (organizationId) {
      await admin.from("leads").delete().eq("organization_id", organizationId)
      await admin.from("scorecards").delete().eq("organization_id", organizationId)
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

  test("01 landing publique desktop + mobile CTAs", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const res = await page.goto("/")
    expect(res?.ok()).toBeTruthy()
    await expect(page.getByRole("heading", { level: 1, name: /Transformez vos questionnaires/i })).toBeVisible()
    const trialCta = page.getByRole("link", { name: /Essayer gratuitement pendant 14 jours/i }).first()
    await expect(trialCta).toBeVisible()
    await expect(page.getByRole("link", { name: /Se connecter/i }).first()).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("01-landing-desktop.png"), fullPage: true })
    await page.screenshot({ path: `${SHOT}-01-landing-desktop.png`, fullPage: true })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1, name: /Transformez vos questionnaires/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Essayer gratuitement/i }).first()).toBeVisible()
    await page.getByRole("link", { name: /Essayer gratuitement/i }).first().click()
    await expect(page).toHaveURL(/\/signup/)
    await page.screenshot({ path: testInfo.outputPath("01-landing-mobile-cta.png"), fullPage: true })
    await page.screenshot({ path: `${SHOT}-01-landing-mobile.png`, fullPage: true })
  })

  test("02 inscription dirigeant (UI + confirm staging)", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: /Essayer gratuitement|Rejoindre/i })).toBeVisible()
    await page.locator("#fullName").fill("Camille Durand")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(ownerEmail)
    await page.locator("#password").fill(ownerPassword)
    await page.getByRole("button", { name: /Créer le compte/i }).click()

    // Staging Auth often rate-limits confirmation emails → UI signup may toast an error.
    const outcome = await Promise.race([
      page
        .getByText(/Compte créé\. Ouvrez le lien reçu/i)
        .waitFor({ timeout: 20_000 })
        .then(() => "message" as const),
      page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 20_000 }).then(() => "redirect" as const),
      page
        .locator("[data-sonner-toast], [data-sonner-toaster]")
        .filter({ hasText: /rate|limite|incorrect|impossible|erreur|email/i })
        .first()
        .waitFor({ timeout: 20_000 })
        .then(() => "rate_limited" as const),
    ]).catch(() => "none" as const)
    await page.screenshot({ path: `${SHOT}-02-signup.png`, fullPage: true })

    const admin = e2eAdminClient()
    ownerId = await findAuthUserId(admin, ownerEmail)
    if (!ownerId) {
      // Bypass inbox / Auth email rate limit — same pattern as saas-journey.spec.ts
      const created = await admin.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: "Camille Durand" },
      })
      expect(created.error, created.error?.message).toBeFalsy()
      ownerId = created.data.user!.id
      test.info().annotations.push({
        type: "note",
        description: `Signup UI outcome=${outcome}; account provisioned via Auth admin (email_confirm) due to staging email rate limits.`,
      })
    } else {
      await admin.auth.admin.updateUserById(ownerId, { email_confirm: true, password: ownerPassword })
    }
    await admin.from("profiles").upsert(
      { id: ownerId!, email: ownerEmail, full_name: "Camille Durand" },
      { onConflict: "id" },
    )
    expect(ownerId).toBeTruthy()
  })

  test("03 création organisation cosmétiques + essai 14 jours", async ({ page }, testInfo) => {
    const admin = e2eAdminClient()
    await page.goto("/login")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(ownerEmail)
    await page.locator("#password").fill(ownerPassword)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 })
    if (!page.url().includes("/onboarding")) await page.goto("/onboarding")

    await expect(page.getByRole("heading", { name: /Créer votre organisation/i })).toBeVisible()
    await page.locator("#name").fill(orgName)
    await page.locator("#slug").fill(orgSlug)
    await page.locator("#useCase").fill("Cosmétiques et beauté")
    await page.locator("#country").fill("France")
    await page.getByRole("button", { name: "Continuer" }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 45_000 })
    await page.screenshot({ path: `${SHOT}-03-dashboard-trial.png`, fullPage: true })

    const org = await admin.from("organizations").select("id").eq("slug", orgSlug).maybeSingle()
    expect(org.data?.id).toBeTruthy()
    organizationId = org.data!.id

    const member = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", ownerId!)
      .maybeSingle()
    expect(member.data?.role).toBe("owner")

    const sub = await admin
      .from("subscriptions")
      .select("status, trial_end, plan")
      .eq("organization_id", organizationId)
      .maybeSingle()
    expect(sub.data?.status).toBe("trialing")
    expect(sub.data?.trial_end).toBeTruthy()
    const trialEnd = new Date(sub.data!.trial_end!).getTime()
    const days = (trialEnd - Date.now()) / (24 * 3600 * 1000)
    expect(days).toBeGreaterThan(12)
    expect(days).toBeLessThanOrEqual(15)

    await expect(page.getByTestId("trial-status-banner")).toBeVisible()
  })

  test("04 accès dashboard entreprise", async ({ page }, testInfo) => {
    await login(page, ownerEmail, ownerPassword)
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: /Bonjour|Bienvenue/i })).toBeVisible()
    await page.goto("/dashboard/scorecards")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toHaveCount(0)
    await page.goto("/dashboard/leads")
    await expect(page).toHaveURL(/\/dashboard\/leads/)
    await page.screenshot({ path: `${SHOT}-04-dashboard.png`, fullPage: true })
  })

  test("05 création + publication scorecard cosmétiques", async ({ page }, testInfo) => {
    const admin = e2eAdminClient()
    await login(page, ownerEmail, ownerPassword)
    scorecardId = await createBlankScorecard(page, cardSlug, cardName)
    expect(scorecardId.length).toBeGreaterThan(10)

    // Compléter le contenu publishable (landing, question notée, plages, lead) côté staging.
    await seedPublishableCosmeticsCard(admin, scorecardId, cardName, cardSlug, questionTitle)

    await page.goto(`/dashboard/scorecards/${scorecardId}/builder?step=preview`)
    await page.getByRole("button", { name: /^Publier$/ }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText("Vérification…")).toHaveCount(0, { timeout: 25_000 })
    const blocked = await dialog.getByRole("heading", { name: /Publication impossible/i }).count()
    if (blocked) {
      await page.screenshot({ path: `${SHOT}-05-publish-blocked.png`, fullPage: true })
      throw new Error(await dialog.innerText())
    }
    await dialog.getByRole("button", { name: /^Publier$/ }).click()
    await expect(
      page.getByText(/Publié|published|en ligne|questionnaire public|utilise maintenant/i).first(),
    ).toBeVisible({ timeout: 45_000 })

    const { data: card } = await admin.from("scorecards").select("slug, status").eq("id", scorecardId).single()
    publicSlug = card?.slug || cardSlug
    expect(card?.status).toBe("published")
    await page.screenshot({ path: `${SHOT}-05-published.png`, fullPage: true })
  })

  test("06 réponse cliente fictive + lead CRM", async ({ page, browser }, testInfo) => {
    test.setTimeout(180_000)
    await login(page, ownerEmail, ownerPassword)
    const publicSession = await openPublic(browser, publicSlug)
    try {
      const pub = publicSession.page
      await beginAssessment(pub)
      // timing=before → lead first
      if (await pub.getByRole("heading", { name: /coordonnées/i }).isVisible().catch(() => false)) {
        await fillLead(pub, "Léa", leadEmail)
      }
      await expect(pub.getByText(/besoin beauté|Hydratation|Anti-âge|Peaux sensibles/i).first()).toBeVisible({
        timeout: 30_000,
      })
      const choice = pub.getByRole("button", { name: /Peaux sensibles|Hydratation|Anti-âge/i }).first()
      if (await choice.count()) {
        await choice.click()
      } else if (await pub.getByRole("radio").count()) {
        await pub.getByRole("radio").first().check()
      } else {
        await pub.locator("label, button, [role='option']").filter({ hasText: /Peaux|Hydrat|Anti/i }).first().click()
      }
      const finish = pub.getByRole("button", { name: /Continuer|Terminer/i })
      await expect(finish.first()).toBeVisible({ timeout: 15_000 })
      await finish.first().click()
      if (await pub.getByRole("heading", { name: /coordonnées/i }).isVisible().catch(() => false)) {
        await fillLead(pub, "Léa", leadEmail)
      }
      await pub.screenshot({ path: `${SHOT}-06-public-response.png`, fullPage: true })
    } finally {
      await publicSession.close().catch(() => {})
    }

    const admin = e2eAdminClient()
    let leadFound = false
    for (let i = 0; i < 25; i++) {
      const { data } = await admin
        .from("leads")
        .select("id, email")
        .eq("organization_id", organizationId!)
        .or(`email.ilike.%${leadEmail}%,email.ilike.%${leadEmail.split("@")[0]}%`)
        .limit(1)
        .maybeSingle()
      if (data?.id) {
        leadFound = true
        break
      }
      // Also match via respondents
      const { data: respondents } = await admin
        .from("respondents")
        .select("id")
        .eq("organization_id", organizationId!)
        .ilike("email", leadEmail)
        .limit(1)
      if (respondents?.[0]?.id) {
        const { data: linked } = await admin
          .from("leads")
          .select("id")
          .eq("organization_id", organizationId!)
          .eq("respondent_id", respondents[0].id)
          .maybeSingle()
        if (linked?.id) {
          leadFound = true
          break
        }
      }
      await page.waitForTimeout(1000)
    }
    expect(leadFound).toBeTruthy()

    await page.goto("/dashboard/leads")
    await expect(page.getByText(/Léa|cliente-peau|example.com/i).first()).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${SHOT}-06-crm-lead.png`, fullPage: true })
  })

  test("07 invitation collaborateur + permissions", async ({ page, browser }, testInfo) => {
    const admin = e2eAdminClient()
    await login(page, ownerEmail, ownerPassword)
    await page.goto("/dashboard/settings/team")
    await expect(page.getByRole("heading", { name: /Invitation classique|Équipe|Collabor/i }).first()).toBeVisible({
      timeout: 20_000,
    })
    const inviteForm = page.locator("form").filter({ has: page.getByRole("button", { name: /^Inviter$/ }) })
    await inviteForm.locator('input[name="email"]').fill(collabEmail)
    await inviteForm.locator('select[name="role"]').selectOption("editor")
    await inviteForm.getByRole("button", { name: /^Inviter$/ }).click()
    await expect(page.getByText(/Invitation envoyée/i)).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${SHOT}-07-invite.png`, fullPage: true })

    // Retrieve invite URL from email_jobs (staging queue — no real email)
    let url: string | null = null
    for (let i = 0; i < 15; i++) {
      const { data } = await admin
        .from("email_jobs")
        .select("payload, created_at")
        .eq("organization_id", organizationId!)
        .eq("template", "organization_invitation")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      const payload = data?.payload as { url?: string } | null
      if (payload?.url?.includes("/invite/")) {
        url = payload.url
        break
      }
      await page.waitForTimeout(800)
    }
    expect(url).toBeTruthy()
    inviteToken = url!.split("/invite/")[1]?.split(/[?#]/)[0] ?? null
    expect(inviteToken).toBeTruthy()

    const created = await admin.auth.admin.createUser({
      email: collabEmail,
      password: collabPassword,
      email_confirm: true,
      user_metadata: { full_name: "Nora Martin" },
    })
    expect(created.error).toBeFalsy()
    collabId = created.data.user!.id
    await admin.from("profiles").upsert(
      { id: collabId, email: collabEmail, full_name: "Nora Martin" },
      { onConflict: "id" },
    )

    const collabCtx = await browser.newContext()
    const collabPage = await collabCtx.newPage()
    try {
      await collabPage.goto(`/invite/${inviteToken}`)
      await expect(collabPage.getByRole("heading", { name: /Rejoindre/i })).toBeVisible()
      // Must sign in first if not authenticated
      if (collabPage.url().includes("/invite/")) {
        const loginLink = collabPage.getByRole("link", { name: /Se connecter|Créer/i }).first()
        if (await loginLink.count()) {
          await loginLink.click()
        }
      }
      if (!collabPage.url().includes("/login") && !collabPage.url().includes("/signup")) {
        // already on invite — go login with next
        await collabPage.goto(`/login?next=${encodeURIComponent(`/invite/${inviteToken}`)}`)
      }
      if (collabPage.url().includes("/signup")) {
        await collabPage.goto(`/login?next=${encodeURIComponent(`/invite/${inviteToken}`)}`)
      }
      await collabPage.locator("form").filter({ has: collabPage.locator("#password") }).locator("#email").fill(collabEmail)
      await collabPage.locator("#password").fill(collabPassword)
      await collabPage.getByRole("button", { name: "Se connecter" }).click()
      await collabPage.waitForURL(new RegExp(`/invite/${inviteToken}|/dashboard`), { timeout: 30_000 })
      if (collabPage.url().includes("/invite/")) {
        await collabPage.getByRole("button", { name: /Accepter|Rejoindre/i }).click()
        await collabPage.waitForURL(/\/dashboard/, { timeout: 45_000 })
      }
      await expect(collabPage).toHaveURL(/\/dashboard/)
      await collabPage.screenshot({ path: `${SHOT}-07-collab-dashboard.png`, fullPage: true })

      const membership = await admin
        .from("organization_members")
        .select("role, access_role, organization_id")
        .eq("user_id", collabId!)
        .maybeSingle()
      expect(membership.data?.organization_id).toBe(organizationId)
      // org_role enum stays member/admin/owner; invite capability is access_role
      expect(membership.data?.role).toBe("member")
      expect(membership.data?.access_role).toBe("editor")

      // Permissions: editor can open scorecards of the org
      await collabPage.goto("/dashboard/scorecards")
      await expect(collabPage.getByRole("heading", { name: "Essai terminé" })).toHaveCount(0)
      await collabPage.goto(`/dashboard/scorecards/${scorecardId}`)
      await expect(collabPage).toHaveURL(new RegExp(scorecardId!))
      // Billing manage is owner/admin — editor should not see plan checkout actions
      await collabPage.goto("/dashboard/settings/billing")
      const choosePlan = await collabPage.getByRole("button", { name: /^Choisir/i }).count()
      expect(choosePlan).toBe(0)
    } finally {
      await collabCtx.close()
    }
  })
})

async function findAuthUserId(
  admin: ReturnType<typeof e2eAdminClient>,
  email: string,
): Promise<string | null> {
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
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
}

async function createBlankScorecard(page: Page, slug: string, name: string) {
  await page.goto("/dashboard/scorecards")
  await page.getByRole("button", { name: /Nouvelle scorecard/i }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  const inputs = dialog.locator("input.h-10")
  await inputs.nth(0).fill(name)
  await inputs.nth(1).fill(slug)
  await dialog.getByRole("button", { name: /Créer la scorecard/i }).click()
  await page.waitForURL(/\/dashboard\/scorecards\/[^/]+\/builder/, { timeout: 60_000 })
  const id = page.url().split("/scorecards/")[1]?.split("/")[0] ?? ""
  if (!id) throw new Error("scorecard id missing after create")
  return id
}

async function seedPublishableCosmeticsCard(
  admin: ReturnType<typeof e2eAdminClient>,
  scorecardId: string,
  name: string,
  slug: string,
  question: string,
) {
  await admin
    .from("scorecards")
    .update({ name, slug, description: "Diagnostic besoins peaux sensibles — E2E cosmétiques" })
    .eq("id", scorecardId)

  await admin.from("scorecard_pages").upsert(
    {
      scorecard_id: scorecardId,
      title: name,
      subtitle: "Atelier Lumière",
      description: "Identifiez vos besoins beauté en quelques questions.",
      cta_text: "Commencer mon diagnostic",
    },
    { onConflict: "scorecard_id" },
  )

  await admin.from("scorecard_lead_forms").upsert(
    {
      scorecard_id: scorecardId,
      timing: "before",
      consent_required: true,
      consent_label: "J'accepte d'être recontactée au sujet de ce diagnostic beauté.",
    },
    { onConflict: "scorecard_id" },
  )

  await admin.from("questions").delete().eq("scorecard_id", scorecardId)
  await admin.from("result_ranges").delete().eq("scorecard_id", scorecardId)
  await admin.from("scoring_categories").delete().eq("scorecard_id", scorecardId)

  const scoring = await admin
    .from("scoring_categories")
    .insert({
      scorecard_id: scorecardId,
      name: "Besoins peau",
      weight: 100,
      max_score: 100,
      position: 0,
    })
    .select("id")
    .single()
  if (scoring.error || !scoring.data) throw new Error(scoring.error?.message ?? "scoring category")

  const q = await admin
    .from("questions")
    .insert({
      scorecard_id: scorecardId,
      scoring_category_id: scoring.data.id,
      type: "single_choice",
      title: question,
      is_required: true,
      is_scored: true,
      position: 0,
    })
    .select("id")
    .single()
  if (q.error || !q.data) throw new Error(q.error?.message ?? "question")

  await admin.from("question_options").insert([
    { question_id: q.data.id, label: "Hydratation", value: "hydratation", score: 40, position: 0 },
    { question_id: q.data.id, label: "Anti-âge", value: "antiage", score: 70, position: 1 },
    { question_id: q.data.id, label: "Peaux sensibles", value: "sensible", score: 100, position: 2 },
  ])

  await admin.from("result_ranges").insert({
    scorecard_id: scorecardId,
    min_percent: 0,
    max_percent: 100,
    label: "Profil beauté",
    title: "Votre routine personnalisée",
    description: "Résultat fictif E2E — aucune donnée réelle.",
    position: 0,
  })
}

async function openPublic(browser: Browser, slug: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/s/${slug}`)
  await expect(async () => {
    if (await page.getByRole("heading", { name: "Page introuvable" }).count()) await page.reload()
    await expect(
      page.getByRole("button", { name: /Commencer/i }).or(page.getByRole("link", { name: /Commencer/i })),
    ).toBeVisible()
  }).toPass({ timeout: 30_000 })
  return { page, close: () => context.close() }
}

async function beginAssessment(page: Page) {
  await expect(async () => {
    const start = page.getByRole("button", { name: /Commencer/i }).or(page.getByRole("link", { name: /Commencer/i }))
    if (await start.count()) await start.first().click()
    await expect(
      page.getByRole("heading", { level: 2 }).or(page.getByRole("heading", { name: /coordonnées/i })),
    ).toBeVisible()
  }).toPass({ timeout: 45_000 })
}

async function fillLead(page: Page, firstName: string, email: string) {
  const lead = page.locator("form").filter({ has: page.getByRole("heading", { name: /coordonnées/i }) })
  await expect(lead).toBeVisible()
  if (await lead.locator('input[name="first_name"]').count()) {
    await lead.locator('input[name="first_name"]').fill(firstName)
  }
  await lead.locator('input[name="email"]').fill(email)
  const consent = lead.locator('input[type="checkbox"]')
  if (await consent.count()) await consent.first().check()
  await lead.getByRole("button", { name: /Continuer|Envoi/i }).click()
}
