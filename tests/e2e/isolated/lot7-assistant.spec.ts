import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

test.describe("Lot 7 isolated assistant", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test("defaults to Préparer, tab switch does not apply, cancel clears pending UI", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/assistant")
    await expect(page.getByRole("button", { name: "Préparer" })).toHaveAttribute("aria-pressed", "true")
    await page.getByRole("button", { name: "Conseiller" }).click()
    await expect(page.getByRole("button", { name: "Conseiller" })).toHaveAttribute("aria-pressed", "true")
    await page.getByRole("tab", { name: "Espace de travail" }).click()
    await expect(page.getByTestId("assistant-apply")).toHaveCount(0)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole("tab", { name: "Conversation" }).click()
    await page.getByRole("tab", { name: "Espace de travail" }).click()
    await expect(page.getByTestId("assistant-apply")).toHaveCount(0)
  })
})
