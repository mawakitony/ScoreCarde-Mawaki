/**
 * Lot 13B — public /login full-screen visual QA (no auth session required).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot13b-shots")

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "768x1024", width: 768, height: 1024 },
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
    const bodyBg = getComputedStyle(document.body).backgroundColor

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
    const vw = window.innerWidth
    const vh = window.innerHeight
    const desktop = vw >= 1024

    const outerBlueAround =
      /rgb\(232,\s*240,\s*248\)|#e8f0f8/i.test(bodyBg) === false
        ? false
        : !stage || Math.abs((stage?.getBoundingClientRect().width ?? 0) - vw) > 2

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
      motionTouchesTop: desktop ? Boolean(motionRect && motionRect.top <= 1) : null,
      formTouchesRight: Boolean(formRect && Math.abs(formRect.right - vw) <= 2),
      formTouchesTop: Boolean(formRect && formRect.top <= 1),
      noRoundedOuterCard: !document.querySelector("[data-auth-stage] .rounded-\\[28px\\], [data-auth-stage].rounded-\\[28px\\]"),
      hasWelcome: /Bienvenue sur WOLOYEM Score/i.test(document.body.innerText),
      hasLoginForm: Boolean(document.querySelector('input[name="email"], #email')),
      hasThemeToggle: Boolean(document.querySelector('[aria-label="Thème d\'affichage"]')),
      sceneId: document.querySelector("[data-auth-scene]")?.getAttribute("data-auth-scene") ?? null,
      bodyBg,
      outerBlueSuspect: outerBlueAround,
    }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const report = {
    status: "RUNNING",
    base: BASE,
    screenshots: [],
    breakpoints: {},
    failures: [],
    animations: {},
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on("pageerror", (err) => report.failures.push(`pageerror: ${err.message}`))
  page.on("console", (msg) => {
    if (msg.type() === "error") report.failures.push(`console: ${msg.text()}`)
  })

  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60_000 })
  } catch (error) {
    report.status = "BLOCKED"
    report.failures.push(`Cannot open ${BASE}/login — is next dev running? (${error.message})`)
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
      await page.waitForTimeout(350)
      const metrics = await measure(page)
      const file = `${theme}-${vp.name}.png`
      const filePath = path.join(OUT, file)
      await page.screenshot({ path: filePath, fullPage: false })
      report.screenshots.push(file)
      report.breakpoints[theme][vp.name] = metrics

      if (!metrics.overflowOk) report.failures.push(`${theme}/${vp.name}: horizontal overflow`)
      if (!metrics.hasFullscreenStage) report.failures.push(`${theme}/${vp.name}: missing fullscreen stage`)
      if (!metrics.hasWelcome) report.failures.push(`${theme}/${vp.name}: missing welcome title`)
      if (!metrics.hasLoginForm) report.failures.push(`${theme}/${vp.name}: missing login form`)
      if (metrics.desktop && !metrics.motionVisible) {
        report.failures.push(`${theme}/${vp.name}: motion panel hidden on desktop`)
      }
      if (metrics.desktop && metrics.motionTouchesLeft === false) {
        report.failures.push(`${theme}/${vp.name}: motion panel not edge-left`)
      }
      if (metrics.formTouchesRight === false) {
        report.failures.push(`${theme}/${vp.name}: form panel not edge-right`)
      }
    }

    // Animation visibility: wait for scene change on desktop light/dark once
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(200)
    const before = await page.locator("[data-auth-scene]").first().getAttribute("data-auth-scene")
    await page.waitForTimeout(6800)
    const after = await page.locator("[data-auth-scene]").first().getAttribute("data-auth-scene")
    report.animations[theme] = { before, after, changed: before !== after && Boolean(before) && Boolean(after) }
    if (!report.animations[theme].changed) {
      report.failures.push(`${theme}: scene did not auto-advance within ~6.8s`)
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

main().catch(async (error) => {
  console.error(error)
  process.exit(1)
})
