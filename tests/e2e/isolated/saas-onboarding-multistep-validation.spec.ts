import { randomBytes } from "node:crypto"
import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const prefix = process.env.E2E_PREFIX?.trim() || "E2E-WOLOYEM-0"

/**
 * Reproduces production bug: invalid/missing fields in hidden block 1 while on block 2.
 * Expectation after fix: return to block 1, visible error, focus on the field.
 * Before fix this would fail (silent no-op on submit / Continuer skipping validation).
 */
test.describe("Onboarding multi-step validation (Togo / +228)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  const suffix = randomBytes(3).toString("hex")
  const email = `${prefix.toLowerCase()}-onb-val-${suffix}@example.test`
  const password = `OnbVal-${suffix}-Aa1!`
  let userId: string | null = null
  let organizationId: string | null = null

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

  test.beforeAll(async () => {
    if (!ready) return
    const admin = e2eAdminClient()
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E Onb Val", country_code: "TG" },
    })
    expect(created.error).toBeFalsy()
    userId = created.data.user!.id
    await admin.from("profiles").upsert(
      { id: userId, email, full_name: "E2E Onb Val", country_code: "TG" },
      { onConflict: "id" },
    )
  })

  async function login(page: import("@playwright/test").Page) {
    await page.goto("/login")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 })
    if (!page.url().includes("/onboarding")) await page.goto("/onboarding")
    await expect(page.getByRole("heading", { name: /Créer votre organisation/i })).toBeVisible()
  }

  test("Continuer without city stays on block 1 with visible error", async ({ page }) => {
    await login(page)
    await page.locator("#name").fill(`Val Org ${suffix}`)
    await page.locator("#slug").fill(`${prefix.toLowerCase()}-val-${suffix}`.replace(/[^a-z0-9-]/g, "-"))
    await page.locator("#country").selectOption("TG")
    // city intentionally empty
    await page.getByRole("button", { name: "Continuer" }).click()
    await expect(page.getByRole("heading", { name: "Votre entreprise" })).toBeVisible()
    await expect(page.getByText(/Veuillez corriger les champs/i)).toBeVisible()
    await expect(page.locator("#city")).toBeFocused()
  })

  test("Submit on block 2 with cleared city returns to block 1", async ({ page }) => {
    await login(page)
    const slug = `${prefix.toLowerCase()}-val2-${suffix}`.replace(/[^a-z0-9-]/g, "-")
    await page.locator("#name").fill(`Val Org 2 ${suffix}`)
    await page.locator("#slug").fill(slug)
    await page.locator("#country").selectOption("TG")
    await page.locator("#city").fill("Lomé")
    await page.locator("#sector").selectOption("formation")
    await page.locator("#headcountBand").selectOption("2-10")
    await page.getByRole("button", { name: "Continuer" }).click()
    await expect(page.getByRole("heading", { name: "Vous" })).toBeVisible()

    // Simulate invalid hidden block-1 field (production silent-failure case).
    await page.locator("#city").evaluate((el) => {
      ;(el as HTMLInputElement).value = ""
    })

    await page.locator("#jobTitle").selectOption("dirigeant")
    await page.locator("#phoneNational").fill("90123456")
    await page.locator("#primaryObjective").selectOption("evaluer_competences")
    await page.getByRole("button", { name: /Créer et continuer/i }).click()

    await expect(page.getByRole("heading", { name: "Votre entreprise" })).toBeVisible()
    await expect(page.getByText(/Veuillez corriger les champs/i)).toBeVisible()
    await expect(page.locator("#city")).toBeFocused()
  })

  test("Happy path Togo +228 creates org", async ({ page }) => {
    await login(page)
    const admin = e2eAdminClient()
    const slug = `${prefix.toLowerCase()}-valok-${suffix}`.replace(/[^a-z0-9-]/g, "-")
    await page.locator("#name").fill(`Val OK ${suffix}`)
    await page.locator("#slug").fill(slug)
    await page.locator("#country").selectOption("TG")
    await page.locator("#city").fill("Lomé")
    await page.locator("#sector").selectOption("formation")
    await page.locator("#headcountBand").selectOption("2-10")
    await page.getByRole("button", { name: "Continuer" }).click()
    await page.locator("#jobTitle").selectOption("dirigeant")
    await page.locator("#phoneNational").fill("90123456")
    await page.locator("#primaryObjective").selectOption("evaluer_competences")
    await page.getByRole("button", { name: /Créer et continuer/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 })

    const org = await admin.from("organizations").select("id, city, profile_completed_at").eq("slug", slug).maybeSingle()
    expect(org.data?.id).toBeTruthy()
    expect(org.data?.city).toBe("Lomé")
    expect(org.data?.profile_completed_at).toBeTruthy()
    organizationId = org.data!.id
    const sensitive = await admin
      .from("organization_sensitive")
      .select("phone_e164")
      .eq("organization_id", organizationId)
      .maybeSingle()
    expect(sensitive.data?.phone_e164).toBe("+22890123456")
  })
})
