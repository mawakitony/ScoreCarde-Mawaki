/**
 * Lot 8J — public theme-preview must load in a same-origin iframe (no auth, no Supabase writes).
 * Uses /e2e/theme-preview-host.html so Next.js does not reclaim a setContent document.
 */
import { expect, test } from "@playwright/test"

const THEME = "digital-experience"
const PATH = `/theme-preview/${THEME}`
const HOST = `/e2e/theme-preview-host.html`

test.describe("Lot 8J theme-preview iframe", () => {
  test("public route returns 200 without login redirect", async ({ request, page }) => {
    const res = await request.get(PATH)
    expect(res.status()).toBe(200)
    const headers = res.headers()
    expect(headers["x-frame-options"]?.toLowerCase()).toBe("sameorigin")
    expect(headers["content-security-policy"] ?? "").toMatch(/frame-ancestors 'self'/)
    expect(headers["content-security-policy"] ?? "").not.toMatch(/frame-ancestors 'none'/)

    await page.goto(PATH, { waitUntil: "networkidle" })
    expect(page.url()).not.toMatch(/\/login/)
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("[data-dx-visual]").first()).toBeVisible()
  })

  test("same-origin iframe loads desktop two-column layout", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto(`${HOST}?theme=${THEME}&device=desktop`, { waitUntil: "networkidle" })
    const frame = page.frameLocator("#preview")
    await expect(frame.locator("h1")).toBeVisible({ timeout: 20_000 })
    await expect(frame.locator("[data-dx-visual]")).toBeVisible()
    // Mockup is @[48rem]:block — assert attached + layout columns rather than CSS visibility alone.
    await expect(frame.locator("[data-dx-mockup]")).toBeAttached()
    const layout = await frame.locator("[data-dx-hero]").evaluate((el) => {
      const copy = el.querySelector("[data-dx-copy]")
      const visual = el.querySelector("[data-dx-visual]")
      if (!copy || !visual) return { ok: false, display: getComputedStyle(el).display }
      const cr = copy.getBoundingClientRect()
      const vr = visual.getBoundingClientRect()
      return {
        ok: getComputedStyle(el).display === "grid" && vr.x > cr.x + 40,
        display: getComputedStyle(el).display,
        copyX: cr.x,
        visualX: vr.x,
      }
    })
    expect(layout.ok, JSON.stringify(layout)).toBe(true)
  })

  test("same-origin iframe loads mobile one-column at 390", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto(`${HOST}?theme=${THEME}&device=mobile`, { waitUntil: "networkidle" })
    const frame = page.frameLocator("#preview")
    await expect(frame.locator("h1")).toBeVisible({ timeout: 20_000 })
    const layout = await frame.locator("[data-dx-hero]").evaluate((el) => {
      const copy = el.querySelector("[data-dx-copy]")
      const visual = el.querySelector("[data-dx-visual]")
      if (!copy || !visual) return { ok: false, display: getComputedStyle(el).display }
      const cr = copy.getBoundingClientRect()
      const vr = visual.getBoundingClientRect()
      const overflow = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      const stacked = vr.y >= cr.y + cr.height - 8
      return {
        ok: (getComputedStyle(el).display === "flex" || stacked) && overflow,
        display: getComputedStyle(el).display,
        stacked,
        overflow,
      }
    })
    expect(layout.ok, JSON.stringify(layout)).toBe(true)
  })
})
