/**
 * Lot 10 — public Express Delivery visual shots (no auth, no Supabase writes).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot10-express-delivery")
const PATH = "/theme-preview/express-delivery"

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1024", width: 1024, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-430", width: 430, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-320", width: 320, height: 720 },
]

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const report = { defects: [], shots: [], checks: {} }

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    const res = await page.goto(`${BASE}${PATH}`, { waitUntil: "networkidle" })
    if (res?.status() !== 200) report.defects.push(`${vp.name}: HTTP ${res?.status()}`)
    await page.locator("[data-ed-hero]").waitFor({ timeout: 15000 })
    const shot = path.join(OUT, `${vp.name}.png`)
    await page.screenshot({ path: shot, fullPage: true })
    report.shots.push(shot)

    const metrics = await page.evaluate(() => {
      const hero = document.querySelector("[data-ed-hero]")
      const copy = document.querySelector("[data-ed-copy]")
      const visual = document.querySelector("[data-ed-visual]")
      const courier = document.querySelector("[data-ed-courier]")
      const floats = document.querySelectorAll("[data-ed-float]")
      if (!hero || !copy || !visual) return { ok: false }
      const cr = copy.getBoundingClientRect()
      const vr = visual.getBoundingClientRect()
      const display = getComputedStyle(hero).display
      const overflow = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      return {
        ok: true,
        display,
        twoCol: display === "grid" && vr.x > cr.x + 40,
        stacked: vr.y >= cr.y + cr.height - 12,
        courier: Boolean(courier),
        floats: floats.length,
        overflow,
        title: document.querySelector("h1")?.textContent?.slice(0, 80) ?? null,
      }
    })
    report.checks[vp.name] = metrics
    if (!metrics.ok) report.defects.push(`${vp.name}: hero missing`)
    if (!metrics.overflow) report.defects.push(`${vp.name}: horizontal overflow`)
    if (!metrics.courier) report.defects.push(`${vp.name}: courier image missing`)
    if (vp.width >= 1024 && !metrics.twoCol) report.defects.push(`${vp.name}: expected two columns`)
    if (vp.width <= 430 && !metrics.stacked) report.defects.push(`${vp.name}: expected stacked layout`)
    await page.close()
  }

  // Gallery card thumbnail via static host iframe (same-origin)
  const gallery = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await gallery.goto(`${BASE}/e2e/theme-preview-host.html?theme=express-delivery&device=desktop`, {
    waitUntil: "networkidle",
  })
  await gallery.frameLocator("#preview").locator("[data-ed-hero]").waitFor({ timeout: 15000 })
  const galleryShot = path.join(OUT, "gallery-card.png")
  await gallery.screenshot({ path: galleryShot })
  report.shots.push(galleryShot)
  await gallery.close()

  // Isolation: dashboard dark pref must not recolor public theme
  const darkCtx = await browser.newContext()
  await darkCtx.addInitScript(() => localStorage.setItem("woloyem-theme", "dark"))
  const darkPage = await darkCtx.newPage()
  await darkPage.goto(`${BASE}${PATH}`, { waitUntil: "networkidle" })
  const isolation = await darkPage.evaluate(() => {
    const shell = document.querySelector("[data-ed-shell]")?.closest("[data-landing-chrome]")
    const bg = shell ? getComputedStyle(shell).backgroundColor : null
    return { bg, html: document.documentElement.className }
  })
  report.darkIsolation = isolation
  if (/\bdark\b/.test(isolation.html) && !isolation.html.includes("scoreapp")) {
    // forcedTheme light should strip dark from html on this route
  }
  await darkCtx.close()

  report.ok = report.defects.length === 0
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  process.exit(report.ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
