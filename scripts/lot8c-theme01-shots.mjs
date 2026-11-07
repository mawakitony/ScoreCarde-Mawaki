/**
 * Lot 8C — visual captures for Template 01 only.
 * No Supabase writes. Reads /theme-preview/digital-experience at fixed viewports.
 */
import { chromium } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot8c-shots")
const WIDTHS = [1440, 1024, 768, 430, 390, 375, 320]

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: Math.max(900, Math.round(width * 1.4)) })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(OUT, `${name}-${width}.png`),
    fullPage: true,
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  for (const width of WIDTHS) {
    await shot(page, "fullpage", width)
    console.log(`fullpage ${width} ok`)
  }

  // A · Gallery miniature simulation: load design viewport then CSS-scale into card box
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  await page.waitForSelector("h1", { timeout: 15000 })
  await page.evaluate(() => {
    const root = document.documentElement
    root.style.background = "#f3f4f6"
    document.body.style.margin = "0"
    document.body.style.transformOrigin = "top left"
    document.body.style.transform = "scale(0.328)" // 420/1280
    document.body.style.width = "1280px"
  })
  await page.setViewportSize({ width: 460, height: 320 })
  await page.screenshot({ path: path.join(OUT, "gallery-miniature-card.png") })
  console.log("gallery miniature ok")

  await browser.close()
  console.log(`Wrote shots to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
