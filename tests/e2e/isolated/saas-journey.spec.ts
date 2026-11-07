import { randomBytes } from "node:crypto"
import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"

/**
 * Signup UI + onboarding org (14-day trial) + dashboard banner.
 * Email confirmation is performed via Auth admin (no inbox / no mock payment).
 */
test.describe("SaaS journey without Stripe", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  const suffix = randomBytes(4).toString("hex")
  const email = `e2e-journey-${suffix}@example.com`
  const password = `Journey-${suffix}-Aa1!`
  const slug = `e2e-journey-${suffix}`
  let userId: string | null = null
  let organizationId: string | null = null

  test.afterAll(async () => {
    if (!ready) return
    const admin = e2eAdminClient()
    if (organizationId) {
      await admin.from("subscriptions").delete().eq("organization_id", organizationId)
      await admin.from("organization_members").delete().eq("organization_id", organizationId)
      await admin.from("audit_logs").delete().eq("organization_id", organizationId)
      await admin.from("organizations").delete().eq("id", organizationId)
    }
    if (userId) await admin.auth.admin.deleteUser(userId)
  })

  test("signup page presents multi-entreprise trial copy", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: /Essayer gratuitement|Créer un accès/i })).toBeVisible()
    await expect(page.getByText(/14 jours/i)).toBeVisible()
  })

  test("confirmed account can create org, reach dashboard trial banner, then lock", async ({ page }) => {
    const admin = e2eAdminClient()
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Journey" },
    })
    expect(created.error).toBeFalsy()
    userId = created.data.user!.id
    await admin.from("profiles").upsert({ id: userId, email, full_name: "E2E Journey" }, { onConflict: "id" })

    await page.goto("/login")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 })

    if (!page.url().includes("/onboarding")) {
      await page.goto("/onboarding")
    }
    await expect(page.getByRole("heading", { name: /Créer votre organisation/i })).toBeVisible()
    await page.locator("#name").fill(`Journey ${suffix}`)
    await page.locator("#slug").fill(slug)
    await page.locator("#useCase").fill("e2e-journey")
    await page.locator("#country").fill("France")
    await page.getByRole("button", { name: "Continuer" }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 45_000 })

    const org = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle()
    expect(org.data?.id).toBeTruthy()
    organizationId = org.data!.id

    const member = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle()
    expect(member.data?.role).toBe("owner")

    const sub = await admin
      .from("subscriptions")
      .select("status,trial_end")
      .eq("organization_id", organizationId)
      .maybeSingle()
    expect(sub.data?.status).toBe("trialing")
    expect(sub.data?.trial_end).toBeTruthy()

    await expect(page.getByTestId("trial-status-banner")).toBeVisible()
    await expect(page.getByText(/jours d'essai restants|jour d'essai restant/i)).toBeVisible()

    await admin.from("subscriptions").upsert(
      {
        organization_id: organizationId,
        provider: "manual",
        plan: "starter",
        billing_interval: "monthly",
        status: "trialing",
        trial_end: new Date(Date.now() - 60_000).toISOString(),
      },
      { onConflict: "organization_id" },
    )

    await page.goto("/dashboard/scorecards")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Activer mon abonnement" })).toBeVisible()

    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText("Abonnement actuel")).toBeVisible()
  })
})
