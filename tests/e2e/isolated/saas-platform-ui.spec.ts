import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loadE2eEnvFiles } from "../helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"
const SHOT = "docs/saas/platform-premium-after"

test.describe("Platform Admin premium UI (staging)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.setTimeout(180_000)

  test("navy shell + overview/MFA + org detail when unlocked", async ({ page }) => {
    const email = process.env.PLATFORM_E2E_ADMIN_EMAIL
    const password = process.env.PLATFORM_E2E_ADMIN_PASSWORD
    test.skip(!email || !password, "BLOCKED: admin credentials missing")

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/login")
    await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email!)
    await page.locator("#password").fill(password!)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await page.waitForURL(/\/(dashboard|onboarding|platform)/, { timeout: 45_000 })
    await page.goto("/platform")
    await expect(page.locator("main, [aria-label='Navigation plateforme']").first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/STAGING|LOCAL|PRODUCTION/i).first()).toBeVisible({ timeout: 10_000 })
    await page.screenshot({ path: `${SHOT}-desktop.png`, fullPage: true })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/platform")
    await expect(page.getByRole("button", { name: /Ouvrir le menu/i })).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${SHOT}-mobile.png`, fullPage: true })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/platform/organizations")
    await page.screenshot({ path: `${SHOT}-organizations.png`, fullPage: true })

    const open = page.getByRole("link", { name: /Ouvrir/i }).first()
    if (await open.count()) {
      await open.click()
      await expect(page.getByRole("navigation", { name: /Sections entreprise/i })).toBeVisible({ timeout: 20_000 })
      await page.screenshot({ path: `${SHOT}-org-overview.png`, fullPage: true })
      await page.getByRole("link", { name: "Permissions" }).click()
      await page.screenshot({ path: `${SHOT}-org-permissions.png`, fullPage: true })
    }
  })
})
