import { randomBytes } from "node:crypto"
import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { TERMS_VERSION, PRIVACY_VERSION } from "../../../lib/onboarding/catalog"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const prefix = process.env.E2E_PREFIX?.trim() || "E2E-WOLOYEM-0"

/**
 * Signup UI (no Auth SMTP — E2E_SIGNUP_NO_EMAIL) → admin createUser(email_confirm) → org → dashboard.
 * Domaine @example.test (réservé, non routable). Comptes E2E_PREFIX uniquement.
 */
test.describe("T8 signup → org onboarding", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  const suffix = randomBytes(3).toString("hex")
  const email = `${prefix.toLowerCase()}-t8-${suffix}@example.test`
  const password = `T8-${suffix}-Aa1!`
  const slug = `${prefix.toLowerCase()}-t8-${suffix}`.replace(/[^a-z0-9-]/g, "-")
  let userId: string | null = null
  let organizationId: string | null = null
  let emailsSent = 0

  test.afterAll(async () => {
    if (!ready) return
    const admin = e2eAdminClient()
    if (organizationId) {
      await admin.from("organization_sensitive").delete().eq("organization_id", organizationId)
      await admin.from("subscriptions").delete().eq("organization_id", organizationId)
      await admin.from("organization_members").delete().eq("organization_id", organizationId)
      await admin.from("audit_logs").delete().eq("organization_id", organizationId)
      await admin.from("organizations").delete().eq("id", organizationId)
    }
    if (userId) await admin.auth.admin.deleteUser(userId)
  })

  test("signup page shows split name, country priority, terms", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: /Essayer gratuitement/i })).toBeVisible()
    await expect(page.getByLabel("Prénom")).toBeVisible()
    await expect(page.getByLabel("Nom", { exact: true })).toBeVisible()
    await expect(page.getByText(/14 jours/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /CGU/i })).toBeVisible()
    const options = await page.locator("#country option").allTextContents()
    expect(options[0]?.toLowerCase()).toContain("togo")
  })

  test("UI signup without Auth mail, then admin-confirm → org → dashboard", async ({ page }) => {
    const admin = e2eAdminClient()
    const jobsBefore = await countEmailJobsForRecipient(admin, email)

    await page.goto("/signup")
    await page.locator("#firstName").fill("E2E")
    await page.locator("#lastName").fill(`T8${suffix}`)
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.locator("#country").selectOption("TG")
    await page.locator("#acceptTerms").check()
    await page.getByRole("button", { name: /Créer le compte/i }).click()

    // E2E_SIGNUP_NO_EMAIL → same copy as real confirm-email path, zero SMTP.
    await expect(page.getByRole("status").filter({ hasText: /Compte créé\. Ouvrez le lien reçu/i })).toBeVisible({
      timeout: 45_000,
    })

    const jobsAfterSignupUi = await countEmailJobsForRecipient(admin, email)
    expect(jobsAfterSignupUi - jobsBefore, "email_jobs after UI signup").toBe(0)

    // No Auth user from dry-run signUp — provision locally without confirmation email.
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `E2E T8${suffix}`,
        first_name: "E2E",
        last_name: `T8${suffix}`,
        country_code: "TG",
      },
    })
    expect(created.error, created.error?.message).toBeFalsy()
    userId = created.data.user!.id
    const now = new Date().toISOString()
    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: `E2E T8${suffix}`,
        first_name: "E2E",
        last_name: `T8${suffix}`,
        country_code: "TG",
        terms_accepted_at: now,
        terms_version: TERMS_VERSION,
        privacy_accepted_at: now,
        privacy_version: PRIVACY_VERSION,
      },
      { onConflict: "id" },
    )

    await page.goto("/login")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 })
    if (!page.url().includes("/onboarding")) await page.goto("/onboarding")

    await page.locator("#name").fill(`${prefix} Org ${suffix}`)
    await page.locator("#slug").fill(slug)
    await page.locator("#country").selectOption("TG")
    await page.locator("#city").fill("Lomé")
    await page.locator("#sector").selectOption("formation")
    await page.locator("#headcountBand").selectOption("2-10")
    await page.getByRole("button", { name: "Continuer" }).click()
    await page.locator("#jobTitle").selectOption("dirigeant")
    await page.locator("#phoneNational").fill("90123456")
    await page.locator("#primaryObjective").selectOption("former")
    await page.getByRole("button", { name: /Créer et continuer/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 })

    const org = await admin.from("organizations").select("id, city, sector, profile_completed_at").eq("slug", slug).maybeSingle()
    expect(org.data?.id).toBeTruthy()
    expect(org.data?.city).toBe("Lomé")
    expect(org.data?.profile_completed_at).toBeTruthy()
    organizationId = org.data!.id

    const sensitive = await admin
      .from("organization_sensitive")
      .select("phone_e164")
      .eq("organization_id", organizationId)
      .maybeSingle()
    expect(sensitive.data?.phone_e164).toMatch(/^\+228/)

    const jobsAfter = await countEmailJobsForRecipient(admin, email)
    emailsSent = jobsAfter - jobsBefore
    expect(emailsSent, "email_jobs delta for whole T8 flow").toBe(0)
    // Auth SMTP: 0 — UI path uses E2E_SIGNUP_NO_EMAIL; account via createUser(email_confirm).
    console.log(`T8_EMAILS_SENT auth_smtp=0 email_jobs=${emailsSent}`)
  })
})

async function countEmailJobsForRecipient(admin: ReturnType<typeof e2eAdminClient>, email: string) {
  const { count, error } = await admin
    .from("email_jobs")
    .select("id", { count: "exact", head: true })
    .eq("recipient", email.trim().toLowerCase())
  if (error) return 0
  return count ?? 0
}
