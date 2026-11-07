/**
 * Lot 8J — prove theme-preview headers + same-origin iframe load (no secrets).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot8j")

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const report = { defects: [] }

  const res = await page.goto(`${BASE}/theme-preview/digital-experience`, { waitUntil: "networkidle" })
  const headers = res?.headers() ?? {}
  report.direct = {
    status: res?.status() ?? null,
    url: page.url(),
    xfo: headers["x-frame-options"] ?? null,
    cspFrameAncestors: (headers["content-security-policy"] ?? "").match(/frame-ancestors[^;]*/)?.[0] ?? null,
    loginRedirect: page.url().includes("/login"),
  }
  if (report.direct.status !== 200) report.defects.push("theme-preview not 200")
  if (report.direct.loginRedirect) report.defects.push("theme-preview redirected to login")
  if ((report.direct.xfo || "").toUpperCase() === "DENY") report.defects.push("X-Frame-Options still DENY")
  if ((report.direct.cspFrameAncestors || "").includes("'none'")) report.defects.push("CSP still frame-ancestors none")

  await page.goto(`${BASE}/e2e/theme-preview-host.html?theme=digital-experience&device=desktop`, {
    waitUntil: "networkidle",
  })
  try {
    await page.frameLocator("#preview").locator("h1").first().waitFor({ timeout: 15000 })
    report.iframeDesktop = { ok: true }
    await page.screenshot({ path: path.join(OUT, "iframe-desktop.png") })
  } catch (error) {
    report.iframeDesktop = { ok: false, error: String(error).slice(0, 240) }
    report.defects.push("iframe desktop failed to load h1")
  }

  await page.goto(`${BASE}/e2e/theme-preview-host.html?theme=express-delivery&device=mobile`, {
    waitUntil: "networkidle",
  })
  try {
    await page.frameLocator("#preview").locator("h1").first().waitFor({ timeout: 15000 })
    report.iframeOtherTheme = { ok: true, theme: "express-delivery" }
  } catch (error) {
    report.iframeOtherTheme = { ok: false, error: String(error).slice(0, 240) }
    report.defects.push("iframe other theme failed")
  }

  const parent = await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  const parentHeaders = parent?.headers() ?? {}
  report.parentStillLocked = {
    xfo: parentHeaders["x-frame-options"] ?? null,
    cspFrameAncestors: (parentHeaders["content-security-policy"] ?? "").match(/frame-ancestors[^;]*/)?.[0] ?? null,
  }
  if ((report.parentStillLocked.xfo || "").toUpperCase() !== "DENY") {
    report.defects.push("non-preview routes lost X-Frame-Options DENY")
  }
  if (!(report.parentStillLocked.cspFrameAncestors || "").includes("'none'")) {
    report.defects.push("non-preview routes lost frame-ancestors none")
  }

  report.ok = report.defects.length === 0
  await writeFile(path.join(OUT, "diag.json"), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  await browser.close()
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
