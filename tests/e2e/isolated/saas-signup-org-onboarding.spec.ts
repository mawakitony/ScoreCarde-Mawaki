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
 * Full path: signup UI → generateLink confirm → onboarding org → dashboard.
 * Only E2E_PREFIX accounts.
 */
test.describe("T8 signup → org onboarding", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  const suffix = randomBytes(3).toString("hex")
  const email = `${prefix.toLowerCase()}-t8-${suffix}@example.com`
  const password = `T8-${suffix}-Aa1!`
  const slug = `${prefix.toLowerCase()}-t8-${suffix}`.replace(/[^a-z0-9-]/g, "-")
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

  test("confirm via generateLink then complete org onboarding", async ({ page }) => {
    const admin = e2eAdminClient()
    await page.goto("/signup")
    await page.locator("#firstName").fill("E2E")
    await page.locator("#lastName").fill(`T8${suffix}`)
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.locator("#country").selectOption("TG")
    await page.locator("#acceptTerms").check()
    await page.getByRole("button", { name: /Créer le compte/i }).click()

    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const found = listed.data.users.find((u) => u.email?.toLowerCase() === email)
    expect(found?.id).toBeTruthy()
    userId = found!.id

    const link = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=%2Fonboarding` },
    })
    const actionLink = link.data.properties?.action_link
    expect(actionLink).toBeTruthy()
    await page.goto(actionLink!)
    await page.waitForURL(/\/(onboarding|dashboard|auth\/callback)/, { timeout: 60_000 })
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
  })
})
