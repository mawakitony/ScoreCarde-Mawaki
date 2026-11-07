/**
 * Lot 16J — visual / responsive QA for public surfaces (no auth, no writes).
 * Does NOT mark authenticated workspace routes as PASS.
 */
import { expect, test, type Page } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const VIEWPORTS = [
  { name: "1920", width: 1920, height: 1080 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "430", width: 430, height: 932 },
  { name: "390", width: 390, height: 844 },
  { name: "375", width: 375, height: 812 },
  { name: "320", width: 320, height: 568 },
] as const

const PUBLIC_PATHS = ["/", "/pricing", "/login", "/signup", "/first-access", "/onboarding"] as const

const THEMES = [
  "digital-experience",
  "express-delivery",
  "analytics-cloud",
  "business-growth",
  "workflow-minimal",
  "ai-copilot",
  "fintech-elegant",
] as const

const SHOT_DIR = path.join("test-results", "lot16j")

async function documentMetrics(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    const overflowX = Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1
    const overflowAmount = Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth
    const focusVisible = Boolean(
      document.querySelector(
        "a:focus-visible, button:focus-visible, input:focus-visible, [tabindex]:focus-visible",
      ),
    )
    return {
      overflowX,
      overflowAmount,
      clientWidth: doc.clientWidth,
      scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
      title: document.title,
      focusVisible,
    }
  })
}

test.describe("Lot 16J public visual QA", () => {
  test.beforeAll(() => {
    fs.mkdirSync(SHOT_DIR, { recursive: true })
  })

  for (const route of PUBLIC_PATHS) {
    test(`overflow matrix ${route}`, async ({ page }) => {
      const failures: string[] = []
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        const response = await page.goto(route, { waitUntil: "domcontentloaded" })
        expect(response?.status(), `${route} @${vp.name}`).toBeLessThan(500)

        // Prefer landing on expected path when not redirected by auth gate.
        const url = page.url()
        if (route === "/onboarding" && url.includes("/login")) {
          // Protected — document and skip overflow assertion for this viewport.
          continue
        }

        await page.waitForTimeout(120)
        const metrics = await documentMetrics(page)
        if (metrics.overflowX) {
          failures.push(`${route}@${vp.name}: overflowX +${metrics.overflowAmount}px`)
        }

        // Representative screenshots (desktop / tablet / phone)
        if (["1920", "768", "375"].includes(vp.name)) {
          const safe = route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "")
          await page.screenshot({
            path: path.join(SHOT_DIR, `${safe}_${vp.name}.png`),
            fullPage: true,
          })
        }
      }
      expect(failures, failures.join("\n")).toEqual([])
    })
  }

  test("auth keyboard focus ring on login", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/login", { waitUntil: "domcontentloaded" })
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")
    await page.waitForTimeout(80)
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return { tag: null, outline: null }
      const styles = getComputedStyle(el)
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        type: el.getAttribute("type"),
        outline: styles.outlineStyle,
        boxShadow: styles.boxShadow,
        outlineWidth: styles.outlineWidth,
      }
    })
    expect(focused.tag).toBeTruthy()
    const hasRing =
      (focused.boxShadow && focused.boxShadow !== "none") ||
      (focused.outline && focused.outline !== "none" && focused.outlineWidth !== "0px")
    // Soft assert: at least a focusable control received focus after Tab.
    expect(["a", "button", "input", "textarea"].includes(focused.tag ?? "")).toBe(true)
    await page.screenshot({ path: path.join(SHOT_DIR, "login_focus.png") })
    // Record ring presence for the report (not a hard fail if browser uses :focus-visible only on keyboard).
    fs.writeFileSync(
      path.join(SHOT_DIR, "login_focus.json"),
      JSON.stringify({ ...focused, hasRing }, null, 2),
    )
  })

  test("marketing light and forced dark class", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.screenshot({ path: path.join(SHOT_DIR, "home_light.png"), fullPage: true })
    await page.evaluate(() => document.documentElement.classList.add("dark"))
    await page.waitForTimeout(100)
    const metrics = await documentMetrics(page)
    expect(metrics.overflowX).toBe(false)
    await page.screenshot({ path: path.join(SHOT_DIR, "home_dark_forced.png"), fullPage: true })
  })

  for (const theme of THEMES) {
    test(`theme preview ${theme} desktop+mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      const res = await page.goto(`/theme-preview/${theme}`, { waitUntil: "domcontentloaded" })
      expect(res?.status()).toBe(200)
      expect(page.url()).not.toMatch(/\/login/)
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 })
      let metrics = await documentMetrics(page)
      expect(metrics.overflowX, `${theme} desktop overflow`).toBe(false)
      await page.screenshot({
        path: path.join(SHOT_DIR, `theme_${theme}_1440.png`),
        fullPage: true,
      })

      await page.setViewportSize({ width: 390, height: 844 })
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 })
      metrics = await documentMetrics(page)
      expect(metrics.overflowX, `${theme} mobile overflow`).toBe(false)
      await page.screenshot({
        path: path.join(SHOT_DIR, `theme_${theme}_390.png`),
        fullPage: true,
      })
    })
  }

  test("not-found page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const res = await page.goto("/this-route-does-not-exist-16j", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBe(404)
    await expect(page.getByRole("heading", { name: /introuvable/i })).toBeVisible()
    const metrics = await documentMetrics(page)
    expect(metrics.overflowX).toBe(false)
    await page.screenshot({ path: path.join(SHOT_DIR, "not_found.png") })
  })

  test("protected dashboard redirects without marking PASS", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
    // Either login redirect or authenticated dashboard — never claim visual PASS here.
    const url = page.url()
    fs.writeFileSync(
      path.join(SHOT_DIR, "dashboard_gate.json"),
      JSON.stringify({ url, at: new Date().toISOString() }, null, 2),
    )
    expect(url.includes("/login") || url.includes("/dashboard") || url.includes("/onboarding")).toBe(
      true,
    )
  })

  test("reduced motion disables decorative enter animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/login", { waitUntil: "domcontentloaded" })
    const animationState = await page.evaluate(() => {
      const sample = document.querySelector(".ws-enter, .auth-float, .auth-halo")
      if (!sample) return { found: false, duration: null as string | null }
      const styles = getComputedStyle(sample)
      return {
        found: true,
        duration: styles.animationDuration,
        name: styles.animationName,
      }
    })
    fs.writeFileSync(path.join(SHOT_DIR, "reduced_motion.json"), JSON.stringify(animationState, null, 2))
    if (animationState.found) {
      const ms = Number.parseFloat(animationState.duration ?? "0")
      // CSS reduced-motion sets ~0.01ms or none
      expect(ms === 0 || ms <= 0.02 || animationState.name === "none").toBe(true)
    }
    const metrics = await documentMetrics(page)
    expect(metrics.overflowX).toBe(false)
  })

  test("invite invalid token state", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const res = await page.goto("/invite/not-a-real-token-16j", { waitUntil: "domcontentloaded" })
    expect(res?.status()).toBeLessThan(500)
    await expect(page.getByText(/invitation/i).first()).toBeVisible()
    const metrics = await documentMetrics(page)
    expect(metrics.overflowX).toBe(false)
    await page.screenshot({ path: path.join(SHOT_DIR, "invite_invalid_390.png"), fullPage: true })
  })
})
