/**
 * Lot 8H — authenticated Digital Experience acceptance.
 * Skips cleanly when E2E isolation is not configured (never invents PASS).
 * Creates a disposable scorecard from the theme catalog, customizes, publishes,
 * verifies the public page, then deletes synthetic rows.
 */
import { expect, test, type Page } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import {
  cleanupIsolatedFixtures,
  e2eAdminClient,
  seedIsolatedFixtures,
  type E2eFixtureBundle,
} from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const blockReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"

const CUSTOM_TITLE = "E2E DX titre personnalisé produisent des résultats"
const CUSTOM_HIGHLIGHT = "produisent des résultats"
const CUSTOM_SUBTITLE = "E2E sous-titre personnalisé"
const CUSTOM_CTA = "E2E Commencer"
const CUSTOM_SECONDARY = "E2E Démo"
const CUSTOM_ACCENT = "#7C3AED"
const CUSTOM_BG = "#F5F3FF"
const CUSTOM_HERO = "/window.svg"

test.describe("Lot 8H Digital Experience authenticated acceptance", () => {
  test.skip(!ready, `BLOCKED: ${blockReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(240_000)

  let fixtures: E2eFixtureBundle
  let createdScorecardId = ""
  let createdSlug = ""

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test.afterAll(async () => {
    if (!ready) return
    try {
      const admin = e2eAdminClient()
      if (createdScorecardId) {
        await admin.from("scorecards").delete().eq("id", createdScorecardId)
      }
      await cleanupIsolatedFixtures(fixtures.prefix)
    } catch {
      // Cleanup best-effort; isolation gate already enforced.
    }
  })

  test("01 login and open templates gallery", async ({ page }, testInfo) => {
    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/templates")
    await expect(page).toHaveURL(/\/dashboard\/templates/)
    await expect(page.getByRole("heading", { name: "Digital Experience" })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("01-templates.png"), fullPage: true })
  })

  test("02 apply Digital Experience to a new scorecard and open builder", async ({ page }, testInfo) => {
    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/templates")
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: "Digital Experience" }) })
    await card.getByRole("button", { name: /Utiliser ce modèle/i }).click()
    await page.waitForURL(/\/dashboard\/scorecards\/[^/]+\/builder/, { timeout: 45_000 })
    const match = page.url().match(/\/dashboard\/scorecards\/([^/]+)\/builder/)
    expect(match?.[1]).toBeTruthy()
    createdScorecardId = match![1]
    await expect(page).toHaveURL(/step=landing|builder/)
    // Ensure landing step
    if (!page.url().includes("step=landing")) {
      await page.goto(`/dashboard/scorecards/${createdScorecardId}/builder?step=landing`)
    }
    await expect(page.locator("#landing-title")).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: testInfo.outputPath("02-builder-landing.png"), fullPage: true })
  })

  test("03 customize landing fields, save, reload, persist", async ({ page }, testInfo) => {
    await loginAs(page, fixtures, "owner")
    await page.goto(`/dashboard/scorecards/${createdScorecardId}/builder?step=landing`)
    await expect(page.locator("#landing-title")).toBeVisible()

    await page.locator("#landing-title").fill(CUSTOM_TITLE)
    await page.locator("#landing-highlight").fill(CUSTOM_HIGHLIGHT)
    await page.locator("#landing-subtitle").fill(CUSTOM_SUBTITLE)
    await page.locator("#landing-cta").fill(CUSTOM_CTA)
    await page.locator("#landing-secondary-cta").fill(CUSTOM_SECONDARY)
    await page.locator("#landing-accent").fill(CUSTOM_ACCENT)
    await page.locator("#landing-bg").fill(CUSTOM_BG)
    await page.locator("#landing-hero").fill(CUSTOM_HERO)

    await expect(page.getByText(/Enregistr|Sauvegard|à jour|Saved/i).first()).toBeVisible({ timeout: 30_000 })
    await page.screenshot({ path: testInfo.outputPath("03-builder-customized.png"), fullPage: true })

    await page.reload({ waitUntil: "networkidle" })
    await page.goto(`/dashboard/scorecards/${createdScorecardId}/builder?step=landing`)
    await expect(page.locator("#landing-title")).toHaveValue(CUSTOM_TITLE)
    await expect(page.locator("#landing-subtitle")).toHaveValue(CUSTOM_SUBTITLE)
    await expect(page.locator("#landing-cta")).toHaveValue(CUSTOM_CTA)
    await expect(page.locator("#landing-secondary-cta")).toHaveValue(CUSTOM_SECONDARY)
    await expect(page.locator("#landing-accent")).toHaveValue(CUSTOM_ACCENT)
    await expect(page.locator("#landing-bg")).toHaveValue(CUSTOM_BG)
    await expect(page.locator("#landing-hero")).toHaveValue(CUSTOM_HERO)
  })

  test("04 preview desktop and mobile show custom title", async ({ page }, testInfo) => {
    await loginAs(page, fixtures, "owner")
    await page.goto(`/dashboard/scorecards/${createdScorecardId}/builder?step=preview`)
    await expect(page.getByRole("button", { name: "Desktop" })).toBeVisible()
    await page.getByRole("button", { name: "Desktop" }).click()
    await expect(page.getByRole("heading", { name: new RegExp(CUSTOM_TITLE.slice(0, 24), "i") })).toBeVisible({
      timeout: 20_000,
    })
    await page.screenshot({ path: testInfo.outputPath("04-preview-desktop.png"), fullPage: true })

    await page.getByRole("button", { name: "Mobile" }).click()
    await expect(page.locator("[data-preview-frame='mobile']")).toBeVisible()
    await expect(page.getByRole("heading", { name: new RegExp(CUSTOM_TITLE.slice(0, 24), "i") })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("04-preview-mobile.png"), fullPage: true })
  })

  test("05 publish and verify public landing in a fresh session", async ({ page, browser }, testInfo) => {
    await loginAs(page, fixtures, "owner")
    // Ensure at least one scored question so publish can succeed
    await page.goto(`/dashboard/scorecards/${createdScorecardId}/builder?step=questions`)
    const addQuestion = page.getByRole("button", { name: /Ajouter.*question|Nouvelle question/i })
    if (await addQuestion.count()) {
      await addQuestion.first().click()
      const title = page.locator("#question-title")
      if (await title.count()) {
        await title.fill(`${fixtures.prefix} DX publish question`)
        await expect(page.getByText(/Enregistr|Sauvegard|à jour|Saved/i).first()).toBeVisible({ timeout: 20_000 })
      }
    }

    await page.goto(`/dashboard/scorecards/${createdScorecardId}`)
    const publishBtn = page.getByRole("button", { name: /^Publier$/ })
    await expect(publishBtn).toBeVisible({ timeout: 20_000 })
    await publishBtn.click()
    const confirm = page.getByRole("button", { name: /^Publier$/ }).last()
    await confirm.click()
    await expect(page.getByText(/Publié|published|en ligne/i).first()).toBeVisible({ timeout: 45_000 })

    const admin = e2eAdminClient()
    const { data: card } = await admin.from("scorecards").select("slug").eq("id", createdScorecardId).single()
    createdSlug = card?.slug ?? ""
    expect(createdSlug.length).toBeGreaterThan(2)

    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    await publicPage.goto(`/s/${createdSlug}`, { waitUntil: "networkidle" })
    await expect(publicPage.getByRole("heading", { name: new RegExp(CUSTOM_TITLE.slice(0, 24), "i") })).toBeVisible({
      timeout: 20_000,
    })
    await expect(publicPage.getByRole("button", { name: CUSTOM_CTA }).or(publicPage.getByRole("link", { name: CUSTOM_CTA }))).toBeVisible()
    await publicPage.screenshot({ path: testInfo.outputPath("05-published.png"), fullPage: true })

    // Catalog isolation: templates still list other themes unchanged
    await page.goto("/dashboard/templates")
    await expect(page.getByRole("heading", { name: "Express Delivery" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Digital Experience" })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("06-catalog-intact.png"), fullPage: true })

    await visitor.close()
  })
})

/** Helper exported for docs; not used in skipped runs. */
export async function openPublishedLanding(page: Page, slug: string) {
  await page.goto(`/s/${slug}`)
}
