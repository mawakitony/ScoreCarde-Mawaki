/**
 * Lot 16K — authenticated visual QA (isolated fixtures only).
 * Skips when e2eIsolatedAllowed() is false — never marks PASS when skipped.
 * Forbidden: Stripe checkout, invites, publish, delete, paid AI calls.
 */
import { expect, test, type Page } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
  { name: "320", width: 320, height: 568 },
] as const

const SHOT_DIR = path.join("test-results", "lot16k")

async function overflowX(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    return Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth
  })
}

test.describe("Lot 16K authenticated visual QA", () => {
  test.skip(!ready, `NOT TESTED: ${e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(240_000)

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fs.mkdirSync(SHOT_DIR, { recursive: true })
    fixtures = await seedIsolatedFixtures()
  })

  test("workspace routes: overflow + screenshots (light)", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    const routes: { id: string; path: string }[] = [
      { id: "dashboard", path: "/dashboard" },
      { id: "analytics", path: "/dashboard/analytics" },
      { id: "scorecards", path: "/dashboard/scorecards" },
      { id: "builder", path: `/dashboard/scorecards/${fixtures.scorecardId}/builder?step=questions` },
      { id: "leads", path: "/dashboard/leads" },
      { id: "templates", path: "/dashboard/templates" },
      { id: "assistant", path: "/dashboard/assistant" },
      { id: "guide", path: "/dashboard/guide" },
      { id: "settings", path: "/dashboard/settings" },
      { id: "billing", path: "/dashboard/settings/billing" },
    ]

    const failures: string[] = []
    for (const route of routes) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        const response = await page.goto(route.path, { waitUntil: "domcontentloaded" })
        expect(response?.status(), `${route.id}@${vp.name}`).toBeLessThan(500)
        await page.waitForTimeout(150)
        const delta = await overflowX(page)
        if (delta > 2) failures.push(`${route.id}@${vp.name}: overflow +${delta}px`)
        if (["1440", "390"].includes(vp.name)) {
          await page.screenshot({
            path: path.join(SHOT_DIR, `${route.id}_${vp.name}_light.png`),
            fullPage: true,
          })
        }
      }
    }
    expect(failures, failures.join("\n")).toEqual([])
  })

  test("dashboard dark theme overflow sample", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // Prefer real theme toggle when present; fallback to class for layout-only check.
    const toggle = page.getByRole("button", { name: /thème sombre|activer le thème sombre/i })
    if (await toggle.count()) {
      await toggle.first().click()
      await page.waitForTimeout(200)
    } else {
      await page.evaluate(() => document.documentElement.classList.add("dark"))
    }
    const delta = await overflowX(page)
    expect(delta).toBeLessThanOrEqual(2)
    await page.screenshot({ path: path.join(SHOT_DIR, "dashboard_1440_dark.png"), fullPage: true })
  })

  test("keyboard focus reaches main nav or search", async ({ page }) => {
    await loginAs(page, fixtures, "owner")
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    for (let i = 0; i < 8; i += 1) await page.keyboard.press("Tab")
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      return {
        tag: el?.tagName.toLowerCase() ?? null,
        role: el?.getAttribute("role"),
        aria: el?.getAttribute("aria-label"),
      }
    })
    fs.writeFileSync(path.join(SHOT_DIR, "dashboard_focus.json"), JSON.stringify(focused, null, 2))
    expect(focused.tag).toBeTruthy()
    expect(["a", "button", "input"].includes(focused.tag ?? "")).toBe(true)
  })

  test("reduced motion on dashboard", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await loginAs(page, fixtures, "owner")
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    const state = await page.evaluate(() => {
      const sample = document.querySelector(".ws-enter, .dash-enter, .dash-ambient-halo")
      if (!sample) return { found: false }
      const styles = getComputedStyle(sample)
      return { found: true, name: styles.animationName, duration: styles.animationDuration }
    })
    fs.writeFileSync(path.join(SHOT_DIR, "dashboard_reduced_motion.json"), JSON.stringify(state, null, 2))
    if (state.found && "name" in state) {
      expect(state.name === "none" || Number.parseFloat(String(state.duration)) <= 0.02).toBe(true)
    }
  })
})
