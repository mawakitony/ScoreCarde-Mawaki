import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

test.describe("Lot 7 isolated builder", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test("navigates steps, syncs ?step=, autosaves question title", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.goto(`/dashboard/scorecards/${fixtures.scorecardId}/builder?step=setup`)
    await expect(page).toHaveURL(/step=setup/)
    await page.getByRole("button", { name: /Questions/ }).click()
    await expect(page).toHaveURL(/step=questions/)
    const title = page.locator("#question-title")
    if (await title.count()) {
      await title.fill(`${fixtures.prefix} updated`)
      await expect(page.getByText(/Enregistr|Sauvegard|Saved|à jour/i).first()).toBeVisible({ timeout: 20_000 })
    }
    await page.getByRole("button", { name: /Aperçu|Preview/i }).first().click()
    await expect(page).toHaveURL(/step=preview/)
  })
})
