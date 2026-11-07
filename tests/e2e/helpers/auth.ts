import type { Page } from "@playwright/test"
import type { E2eFixtureBundle, E2eRole } from "./fixtures"

export async function loginAs(page: Page, fixtures: E2eFixtureBundle, role: E2eRole) {
  const user = fixtures.users[role]
  await page.goto("/login")
  await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
}
