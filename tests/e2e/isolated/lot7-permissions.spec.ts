import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

test.describe("Lot 7 isolated permissions", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(120_000)

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test("owner reaches billing manage CTA; viewer is refused billing", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText(/Abonnement actuel|Plan/i).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Gérer la facturation" }).first()).toBeVisible()

    await page.context().clearCookies()
    await loginAs(page, fixtures, "viewer")
    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText(/Permission refusée|Consultation seule/i).first()).toBeVisible()
  })
})
