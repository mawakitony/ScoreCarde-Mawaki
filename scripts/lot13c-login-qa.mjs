/**
 * Lot 13C — public /login ultra-premium visual QA (no auth session).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot13c-shots")

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "430x932", width: 430, height: 932 },
  { name: "390x844", width: 390, height: 844 },
  { name: "375x812", width: 375, height: 812 },
  { name: "320x700", width: 320, height: 700 },
]

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    localStorage.setItem("woloyem-theme", value)
    document.documentElement.classList.toggle("dark", value === "dark")
    document.documentElement.style.colorScheme = value
  }, theme)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(500)
}

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const stage = document.querySelector("[data-auth-stage='fullscreen']")
    const motion = document.querySelector("[data-auth-motion-panel]")
    const form = document.querySelector("[data-auth-form-panel]")
    const vw = doc.clientWidth
    const vh = window.innerHeight
    const desktop = vw >= 1024

    function rect(el) {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        top: Math.round(r.top),
        left: Math.round(r.left),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        height: Math.round(r.height),
      }
    }

    const motionRect = rect(motion)
    const formRect = rect(form)
    const text = document.body.innerText

    return {
      overflowOk: doc.scrollWidth <= doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      viewport: { width: vw, height: vh },
      desktop,
      hasFullscreenStage: Boolean(stage),
      motionVisible: motion ? getComputedStyle(motion).display !== "none" : false,
      motionRect,
      formRect,
      motionTouchesLeft: desktop ? Boolean(motionRect && motionRect.left <= 1) : null,
      formTouchesRight: Boolean(formRect && Math.abs(formRect.right - vw) <= 3),
      hasWelcome: /Heureux de vous retrouver/i.test(text),
      hasLoginForm: Boolean(document.querySelector("#email")),
      hasPause: Boolean(document.querySelector('[aria-label*="pause" i], [aria-label*="Reprendre" i]')),
      hasDemoLabel: /démonstration|démo/i.test(text),
      sceneId: document.querySelector("[data-auth-scene]")?.getAttribute("data-auth-scene") ?? null,
      hasProductWindow: /woloyem\.app/i.test(text) || Boolean(document.querySelector(".auth-window, [class*='auth-window']")),
    }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const report = {
    status: "RUNNING",
    base: BASE,
    comparedTo: "Lot 13B full-screen preserved; visual redesign Lot 13C",
    screenshots: [],
    breakpoints: {},
    failures: [],
    animations: {},
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.on("pageerror", (err) => report.failures.push(`pageerror: ${err.message}`))

  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60_000 })
  } catch (error) {
    report.status = "BLOCKED"
    report.failures.push(`Cannot open ${BASE}/login (${error.message})`)
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
    await browser.close()
    process.exit(1)
  }

  for (const theme of ["light", "dark"]) {
    await setTheme(page, theme)
    report.breakpoints[theme] = {}

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.waitForTimeout(400)
      const metrics = await measure(page)
      const file = `${theme}-${vp.name}.png`
      await page.screenshot({ path: path.join(OUT, file), fullPage: false })
      report.screenshots.push(file)
      report.breakpoints[theme][vp.name] = metrics

      if (!metrics.overflowOk) report.failures.push(`${theme}/${vp.name}: horizontal overflow`)
      if (!metrics.hasFullscreenStage) report.failures.push(`${theme}/${vp.name}: missing fullscreen stage`)
      if (!metrics.hasWelcome) report.failures.push(`${theme}/${vp.name}: missing premium welcome title`)
      if (!metrics.hasLoginForm) report.failures.push(`${theme}/${vp.name}: missing login form`)
      if (metrics.desktop && !metrics.motionVisible) report.failures.push(`${theme}/${vp.name}: motion hidden`)
      if (metrics.desktop && metrics.motionTouchesLeft === false) {
        report.failures.push(`${theme}/${vp.name}: motion not edge-left`)
      }
      if (metrics.formTouchesRight === false) report.failures.push(`${theme}/${vp.name}: form not edge-right`)
    }

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(200)
    const before = await page.locator("[data-auth-scene]").first().getAttribute("data-auth-scene")
    await page.waitForTimeout(7800)
    const after = await page.locator("[data-auth-scene]").first().getAttribute("data-auth-scene")
    report.animations[theme] = { before, after, changed: before !== after && Boolean(before) && Boolean(after) }
    if (!report.animations[theme].changed) {
      report.failures.push(`${theme}: scene did not auto-advance within ~7.8s`)
    }
  }

  report.status = report.failures.length === 0 ? "PASS" : "FAIL"
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        STATUS: report.status,
        failures: report.failures,
        screenshots: report.screenshots.length,
        animations: report.animations,
        out: OUT,
      },
      null,
      2,
    ),
  )
  await browser.close()
  process.exit(report.failures.length === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
