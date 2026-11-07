import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const widths = [1440, 1024, 768, 390, 375] as const

test.describe("Lot 7 isolated authenticated responsive", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(180_000)

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test("dashboard routes keep horizontal overflow under control", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    const routes = [
      "/dashboard",
      "/dashboard/leads",
      `/dashboard/scorecards/${fixtures.scorecardId}/builder?step=questions`,
      "/dashboard/assistant",
      "/dashboard/settings/billing",
    ]
    for (const route of routes) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(route)
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement
          return doc.scrollWidth - doc.clientWidth
        })
        expect(overflow, `${route}@${width}`).toBeLessThanOrEqual(2)
      }
    }
  })
})
