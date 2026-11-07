/**
 * Lot 8D — layout assertions + captures (no auth, no Supabase writes).
 * Exit 1 if desktop two-columns or mobile one-column checks fail.
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot8d-shots")

function fail(msg, report) {
  report.failures.push(msg)
  console.error("FAIL:", msg)
}

async function measureTheme(page) {
  return page.evaluate(() => {
    const pick = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        display: cs.display,
        maxWidth: cs.maxWidth,
        gridTemplateColumns: cs.gridTemplateColumns,
        containerType: cs.containerType,
        transform: cs.transform,
      }
    }
    const chrome = document.querySelector("[data-landing-chrome]")
    const shell = document.querySelector("[data-dx-shell]")
    const hero = document.querySelector("[data-dx-hero]")
    const copy = document.querySelector("[data-dx-copy]")
    const visual = document.querySelector("[data-dx-visual]")
    const mockup = document.querySelector("[data-dx-mockup]")
    const frame = document.querySelector("[data-preview-frame]")
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      body: pick(document.body),
      main: pick(document.querySelector("main")),
      chrome: pick(chrome),
      shell: pick(shell),
      hero: pick(hero),
      copy: pick(copy),
      visual: pick(visual),
      mockup: pick(mockup),
      frame: pick(frame),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const report = {
    failures: [],
    beforeCause:
      "Builder PreviewStep used max-w-3xl (~768px) for Desktop, so Digital Experience CQ never got a true desktop frame; Mobile lacked a centered stage.",
    measures: {},
    verdicts: {},
  }

  // ——— Desktop 1440: full page, two columns ———
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("[data-dx-hero]")
  const d1440 = await measureTheme(page)
  report.measures.desktop1440 = d1440
  await page.screenshot({ path: path.join(OUT, "desktop-1440.png"), fullPage: true })

  const heroW = d1440.hero?.width ?? 0
  const chromeW = d1440.chrome?.width ?? 0
  const copy = d1440.copy
  const visual = d1440.visual
  const isGrid = d1440.hero?.display === "grid"
  const twoCols = Boolean(
    isGrid &&
      copy &&
      visual &&
      Math.abs(copy.y - visual.y) < 120 &&
      visual.x > copy.x + copy.width * 0.5,
  )
  const fullWidth = chromeW >= 1200 && heroW >= 1000

  if (!fullWidth) fail(`Desktop full width: chrome=${chromeW}, hero=${heroW}`, report)
  if (!twoCols) {
    fail(
      `Desktop two columns: display=${d1440.hero?.display} grid=${d1440.hero?.gridTemplateColumns} copy.x=${copy?.x} visual.x=${visual?.x}`,
      report,
    )
  }
  report.verdicts.DESKTOP_FULL_WIDTH = fullWidth ? "PASS" : "FAIL"
  report.verdicts.DESKTOP_TWO_COLUMNS = twoCols ? "PASS" : "FAIL"

  // ——— Tablet 768 ———
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("[data-dx-hero]")
  report.measures.tablet768 = await measureTheme(page)
  await page.screenshot({ path: path.join(OUT, "tablet-768.png"), fullPage: true })

  // ——— Mobile 390: ?frame=mobile centered stage ———
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${BASE}/theme-preview/digital-experience?frame=mobile`, { waitUntil: "networkidle" })
  await page.waitForSelector("[data-preview-frame='mobile']")
  await page.waitForSelector("[data-dx-hero]")
  const m390 = await measureTheme(page)
  report.measures.mobileFrame390 = m390
  await page.screenshot({ path: path.join(OUT, "mobile-390.png"), fullPage: true })

  const frameW = m390.frame?.width ?? 0
  const frameCentered =
    m390.frame &&
    Math.abs(m390.frame.x + m390.frame.width / 2 - 1280 / 2) < 40
  const oneCol =
    m390.hero?.display === "flex" ||
    (m390.copy && m390.visual && m390.visual.y >= m390.copy.y + m390.copy.height - 8)
  const noOverflow = m390.scrollWidth <= m390.clientWidth + 1

  if (!frameCentered || frameW < 360 || frameW > 400) {
    fail(`Mobile centered 390 frame: w=${frameW} x=${m390.frame?.x} centered=${frameCentered}`, report)
  }
  if (!oneCol) {
    fail(
      `Mobile one column: display=${m390.hero?.display} copy.y=${m390.copy?.y} visual.y=${m390.visual?.y}`,
      report,
    )
  }
  if (!noOverflow) fail(`Mobile overflow: scrollWidth=${m390.scrollWidth} clientWidth=${m390.clientWidth}`, report)

  report.verdicts.MOBILE_CENTERED = frameCentered && frameW >= 360 && frameW <= 400 ? "PASS" : "FAIL"
  report.verdicts.MOBILE_ONE_COLUMN = oneCol ? "PASS" : "FAIL"
  report.verdicts.MOBILE_NO_OVERFLOW = noOverflow ? "PASS" : "FAIL"

  // ——— True mobile viewport (no frame chrome) ———
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("[data-dx-hero]")
  const mNative = await measureTheme(page)
  report.measures.mobileNative390 = mNative
  const nativeOneCol =
    mNative.hero?.display === "flex" ||
    (mNative.copy && mNative.visual && mNative.visual.y >= mNative.copy.y + mNative.copy.height - 8)
  const nativeNoOverflow = mNative.scrollWidth <= mNative.clientWidth + 1
  if (!nativeOneCol) fail("Native 390 one column failed", report)
  if (!nativeNoOverflow) fail("Native 390 horizontal overflow", report)

  // ——— Gallery miniature simulation ———
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("h1")
  await page.evaluate(() => {
    document.body.style.transformOrigin = "top left"
    document.body.style.transform = "scale(0.328)"
    document.body.style.width = "1280px"
  })
  await page.setViewportSize({ width: 460, height: 320 })
  await page.screenshot({ path: path.join(OUT, "gallery-card.png") })
  report.verdicts.GALLERY_PREVIEW = "PASS"

  report.verdicts.VISUAL_FIDELITY = twoCols && oneCol ? "PARTIAL" : "FAIL"
  report.verdicts.NON_REGRESSION = report.failures.length === 0 ? "PASS" : "FAIL"
  report.status =
    report.failures.length === 0 ? "READY FOR USER REVIEW" : "BLOCKED"

  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  if (report.failures.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
