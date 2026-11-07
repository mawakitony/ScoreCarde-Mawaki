import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { e2eAdminClient } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const SHOT = "docs/saas/platform-access"

test.describe("Platform Admin access control (staging)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.setTimeout(180_000)

  test("visitor is redirected away from /platform", async ({ page }) => {
    await page.goto("/platform")
    await expect(page).not.toHaveURL(/\/platform$/)
    await page.screenshot({ path: `${SHOT}-01-visitor.png`, fullPage: true })
  })

  test("org owner without platform_admins cannot open /platform", async ({ page }) => {
    const admin = e2eAdminClient()
    const email = `woloyem.platform.deny.${Date.now()}@inbox.testmail.app`
    const password = "Deny-Platform1!"
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Deny Platform" },
    })
    const userId = created.data.user?.id
    expect(userId).toBeTruthy()
    await admin.from("profiles").upsert({ id: userId!, email, full_name: "Deny Platform" }, { onConflict: "id" })

    // Ensure not a platform admin
    await admin.from("platform_admins").delete().eq("user_id", userId!)

    try {
      await page.goto("/login")
      await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
      await page.locator("#password").fill(password)
      await page.getByRole("button", { name: "Se connecter" }).click()
      await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 45_000 })
      await page.goto("/platform")
      await expect(page).not.toHaveURL(/\/platform(\/|$)/)
      await page.screenshot({ path: `${SHOT}-02-owner-denied.png`, fullPage: true })
    } finally {
      await admin.auth.admin.deleteUser(userId!)
    }
  })

  test("super_admin reaches MFA gate on /platform", async ({ page }) => {
    const email = process.env.PLATFORM_E2E_ADMIN_EMAIL
    const password = process.env.PLATFORM_E2E_ADMIN_PASSWORD
    test.skip(!email || !password, "BLOCKED: PLATFORM_E2E_ADMIN_EMAIL/PASSWORD not set for this run")

    await page.goto("/login")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email!)
    await page.locator("#password").fill(password!)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(dashboard|onboarding|platform)/, { timeout: 45_000 })
    await page.goto("/platform")
    // Either MFA enroll page or overview if already AAL2
    await expect(page).toHaveURL(/\/platform/)
    await page.screenshot({ path: `${SHOT}-03-super-admin.png`, fullPage: true })
    const onMfa = /\/platform\/security\/mfa/.test(page.url()) || (await page.getByText(/MFA|authentification/i).count()) > 0
    const onOverview = (await page.getByRole("heading", { name: /Vue d'ensemble|Overview/i }).count()) > 0
    expect(onMfa || onOverview).toBeTruthy()
  })
})
