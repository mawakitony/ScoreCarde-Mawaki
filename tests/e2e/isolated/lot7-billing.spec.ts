import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

test.describe("Lot 7 isolated billing (read-only)", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test("shows plan, quotas and Stripe actions without checkout", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText("Abonnement actuel")).toBeVisible()
    await expect(page.getByText("Utilisation et quotas")).toBeVisible()
    await expect(page.getByText("Plans disponibles")).toBeVisible()
    await expect(page.getByRole("button", { name: "Gérer la facturation" }).first()).toBeVisible()
    // Do not click portal or plan checkout — read-only assertion only.
  })
})
