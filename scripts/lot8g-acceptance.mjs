/**
 * Lot 8G — acceptance checks for Digital Experience (no Supabase writes).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile, copyFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot8g-shots")
const SRC = path.resolve("tmp/lot8f-shots")

async function main() {
  await mkdir(OUT, { recursive: true })
  for (const name of [
    "desktop-1440.png",
    "desktop-1280.png",
    "tablet-768.png",
    "mobile-390.png",
    "mobile-320.png",
    "gallery-miniature.png",
  ]) {
    try {
      await copyFile(path.join(SRC, name), path.join(OUT, name))
    } catch {
      /* optional */
    }
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const report = {
    visual: {},
    interactions: {},
    gallery: {},
    builder: {},
    defects: [],
  }

  // —— Theme preview interactions ——
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("[data-dx-hero]")

  const layout = await page.evaluate(() => {
    const hero = document.querySelector("[data-dx-hero]")
    const copy = document.querySelector("[data-dx-copy]")
    const visual = document.querySelector("[data-dx-visual]")
    const hs = getComputedStyle(hero)
    const cr = copy.getBoundingClientRect()
    const vr = visual.getBoundingClientRect()
    return {
      display: hs.display,
      twoCol: hs.display === "grid" && vr.x > cr.x + 40,
      overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    }
  })
  report.visual.desktop1440 = layout
  if (!layout.twoCol) report.defects.push("Desktop 1440: hero not two columns")
  if (!layout.overflow) report.defects.push("Desktop 1440: horizontal overflow")

  // Primary CTA
  const primary = page.locator("a, button").filter({ hasText: /^Commencer/ }).first()
  const primaryInfo = await primary.evaluate((el) => ({
    tag: el.tagName,
    href: el.getAttribute("href"),
    disabled: el.disabled === true,
  }))
  report.interactions.primary = primaryInfo

  // Secondary — must not be a dead button
  const secondaryButtons = await page.locator("button").filter({ hasText: /Voir la démo/ }).count()
  const secondaryLink = await page.locator("a").filter({ hasText: /Voir la démo/ }).count()
  const secondarySpan = await page.locator("span").filter({ hasText: /Voir la démo/ }).count()
  report.interactions.secondary = { buttons: secondaryButtons, links: secondaryLink, spans: secondarySpan }
  if (secondaryButtons > 0) report.defects.push("Secondary CTA still a <button> without guaranteed action")

  // Floating cards pointer-events
  const pe = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-dx-mockup] [aria-hidden]")]
    return cards.map((el) => getComputedStyle(el).pointerEvents)
  })
  report.interactions.floatingPointerEvents = pe
  if (pe.some((v) => v !== "none")) report.defects.push("Some decorative mockup layers still receive pointer events")

  // Keyboard: Tab reaches primary CTA
  await page.locator("body").click({ position: { x: 5, y: 5 } })
  let reachedPrimary = false
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab")
    const text = await page.evaluate(() => (document.activeElement?.textContent || "").trim())
    if (/Commencer/i.test(text)) {
      reachedPrimary = true
      break
    }
  }
  report.interactions.keyboardReachesPrimary = reachedPrimary
  if (!reachedPrimary) report.defects.push("Keyboard Tab does not reach primary CTA")

  // Reduced motion classes present
  const motionSafe = await primary.evaluate((el) => el.className.includes("motion-safe") || el.className.includes("motion-reduce"))
  report.interactions.motionSafeClasses = motionSafe

  // Mobile stack + overflow
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  const mobile = await page.evaluate(() => {
    const hero = document.querySelector("[data-dx-hero]")
    const copy = document.querySelector("[data-dx-copy]")
    const visual = document.querySelector("[data-dx-visual]")
    const cr = copy.getBoundingClientRect()
    const vr = visual.getBoundingClientRect()
    // Look for overlapping letter-only circles over Satisfaction card
    const satLabel = [...document.querySelectorAll("p")].find((p) => p.textContent?.trim() === "Satisfaction")
    const card = satLabel?.closest("div")
    let overlapN = false
    if (card) {
      const sr = card.getBoundingClientRect()
      for (const el of document.querySelectorAll("span,div")) {
        const t = (el.textContent || "").trim()
        if (t !== "N") continue
        const r = el.getBoundingClientRect()
        if (r.width > 40 || r.height > 40) continue
        const hit = !(r.right < sr.left || r.left > sr.right || r.bottom < sr.top || r.top > sr.bottom)
        if (hit && !card.contains(el)) overlapN = true
      }
    }
    return {
      oneCol: getComputedStyle(hero).display === "flex" || vr.y >= cr.y + cr.height - 8,
      overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      overlapN,
    }
  })
  report.visual.mobile390 = mobile
  if (!mobile.oneCol) report.defects.push("Mobile 390: not single column")
  if (!mobile.overflow) report.defects.push("Mobile 390: horizontal overflow")
  if (mobile.overlapN) report.defects.push("Mobile 390: partner 'N' overlaps Satisfaction card")

  await page.screenshot({ path: path.join(OUT, "acceptance-mobile-390.png"), fullPage: true })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.screenshot({ path: path.join(OUT, "acceptance-desktop-1440.png"), fullPage: true })

  // Gallery / theme-preview accessibility (public)
  const galleryPath = await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "networkidle", timeout: 20000 }).then(
    (r) => r?.status(),
    () => null,
  )
  report.gallery.dashboardTemplatesStatus = galleryPath
  report.builder.liveUi =
    galleryPath === 200
      ? "Dashboard templates reachable — further auth-bound builder checks needed"
      : "Dashboard templates not reachable without auth (redirect/login). Builder persistence verified by code + unit tests only."

  // Catalog isolation unit check via page content of other themes
  await page.goto(`${BASE}/theme-preview/express-delivery`, { waitUntil: "networkidle" })
  const otherTheme = await page.evaluate(() => ({
    hasDxHero: Boolean(document.querySelector("[data-dx-hero]")),
    title: document.querySelector("h1")?.textContent?.trim().slice(0, 80) || "",
  }))
  report.gallery.otherThemeIsolated = !otherTheme.hasDxHero
  if (otherTheme.hasDxHero) report.defects.push("express-delivery incorrectly renders Digital Experience hero markers")

  report.verdict = report.defects.length === 0 ? "APPROVED" : "CHANGES REQUIRED"
  // Builder live customization not executed without authenticated session
  if (report.builder.liveUi.includes("not reachable")) {
    report.defects.push("Builder live customization (save/reload/publish) not executed — no authenticated E2E session")
    report.verdict = "CHANGES REQUIRED"
  }

  await writeFile(path.join(OUT, "acceptance-report.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  process.exit(report.verdict === "APPROVED" ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
