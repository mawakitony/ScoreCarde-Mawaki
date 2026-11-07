import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

test.describe("Lot 7 isolated leads", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(120_000)

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test("search, open filter portal, open lead sheet", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/leads")
    await page.getByLabel("Rechercher un lead").fill("E2E")
    await page.getByRole("button", { name: /Statut|\+ Statut/ }).click()
    await expect(page.getByRole("dialog", { name: "Statut" })).toBeVisible()
    await page.getByRole("button", { name: "Fermer" }).click()
    if (fixtures.leadId) {
      await page.goto(`/dashboard/leads/${fixtures.leadId}`)
      await expect(page.getByText(/E2E|Lead|lead/i).first()).toBeVisible({ timeout: 20_000 })
    }
  })
})
