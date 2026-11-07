/**
 * Lot 8E — visual captures + overflow checks (no auth, no Supabase writes).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot8e-shots")
const WIDTHS = [1440, 1024, 768, 430, 390, 375, 320]

async function check(page) {
  return page.evaluate(() => {
    const chrome = document.querySelector("[data-landing-chrome]")
    const hero = document.querySelector("[data-dx-hero]")
    const mockup = document.querySelector("[data-dx-mockup]")
    const copy = document.querySelector("[data-dx-copy]")
    const visual = document.querySelector("[data-dx-visual]")
    const pick = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        x: Math.round(r.x),
        y: Math.round(r.y),
        display: cs.display,
        transform: cs.transform,
        overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      }
    }
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowOk: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      chrome: pick(chrome),
      hero: pick(hero),
      mockup: pick(mockup),
      copy: pick(copy),
      visual: pick(visual),
    }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const report = { failures: [], measures: {} }

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: Math.max(900, Math.round(width * 1.35)) })
    await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
    await page.waitForSelector("[data-dx-hero]")
    await page.waitForTimeout(250)
    const m = await check(page)
    report.measures[`w${width}`] = m
    if (!m.overflowOk) report.failures.push(`overflow at ${width}: scroll=${m.scrollWidth} client=${m.clientWidth}`)
    if (width >= 1024) {
      const twoCol = m.hero?.display === "grid" && m.visual && m.copy && m.visual.x > m.copy.x + 40
      if (!twoCol) report.failures.push(`two-col failed at ${width}`)
    }
    if (width <= 430) {
      const oneCol = m.hero?.display === "flex" || (m.copy && m.visual && m.visual.y >= m.copy.y + m.copy.h - 8)
      if (!oneCol) report.failures.push(`one-col failed at ${width}`)
    }
    const name =
      width === 1440
        ? "desktop-1440"
        : width === 768
          ? "tablet-768"
          : width === 390
            ? "mobile-390"
            : width === 320
              ? "mobile-320"
              : `full-${width}`
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
  }

  // Gallery miniature
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("h1")
  await page.evaluate(() => {
    document.body.style.transformOrigin = "top left"
    document.body.style.transform = "scale(0.328)"
    document.body.style.width = "1280px"
  })
  await page.setViewportSize({ width: 460, height: 320 })
  await page.screenshot({ path: path.join(OUT, "gallery-miniature.png") })

  report.ok = report.failures.length === 0
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  if (!report.ok) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
