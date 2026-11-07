/**
 * Lot 9 — theme isolation + CSS tokens (no auth, no Supabase writes).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot9")

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const report = { defects: [] }

  const darkCtx = await browser.newContext()
  await darkCtx.addInitScript(() => {
    localStorage.setItem("woloyem-theme", "dark")
  })
  const darkPage = await darkCtx.newPage({ viewport: { width: 1440, height: 900 } })

  await darkPage.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  const preview = await darkPage.evaluate(() => ({
    htmlClass: document.documentElement.className,
    bg: getComputedStyle(document.body).backgroundColor,
    hasDx: Boolean(document.querySelector("[data-dx-hero], h1")),
  }))
  report.publicPreview = preview
  if (/\bdark\b/.test(preview.htmlClass) && !/\blight\b/.test(preview.htmlClass)) {
    report.defects.push("theme-preview html still dark despite forced light")
  }
  if (!preview.hasDx) report.defects.push("theme-preview content missing")
  await darkPage.screenshot({ path: path.join(OUT, "theme-preview-with-dark-pref.png"), fullPage: false })

  await darkPage.goto(`${BASE}/login`, { waitUntil: "networkidle" })
  const login = await darkPage.evaluate(() => ({
    htmlClass: document.documentElement.className,
    bg: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(),
    fg: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim(),
  }))
  report.loginWithDarkPref = login
  if (!/\bdark\b/.test(login.htmlClass)) report.defects.push("login did not apply stored dark theme")
  if (login.bg.toLowerCase() !== "#0b1220") report.defects.push(`login --background expected #0b1220 got ${login.bg}`)
  await darkPage.screenshot({ path: path.join(OUT, "login-dark.png") })
  await darkCtx.close()

  const lightCtx = await browser.newContext()
  await lightCtx.addInitScript(() => {
    localStorage.setItem("woloyem-theme", "light")
  })
  const lightPage = await lightCtx.newPage({ viewport: { width: 1440, height: 900 } })
  await lightPage.goto(`${BASE}/login`, { waitUntil: "networkidle" })
  const light = await lightPage.evaluate(() => ({
    htmlClass: document.documentElement.className,
    bg: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(),
  }))
  report.loginWithLightPref = light
  if (/\bdark\b/.test(light.htmlClass)) report.defects.push("light preference not applied")
  await lightPage.screenshot({ path: path.join(OUT, "login-light.png") })
  await lightCtx.close()

  report.ok = report.defects.length === 0
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
