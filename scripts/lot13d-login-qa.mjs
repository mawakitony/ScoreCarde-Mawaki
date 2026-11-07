/**
 * Lot 13D — public /login visual finishing QA.
 * Captures all three scenes in Light/Dark (desktop + mobile).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot13d-shots")
const SCENES = ["scorecards", "leads", "analytics"]

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080, desktop: true },
  { name: "1440x900", width: 1440, height: 900, desktop: true },
  { name: "1280x800", width: 1280, height: 800, desktop: true },
  { name: "1024x768", width: 1024, height: 768, desktop: true },
  { name: "768x1024", width: 768, height: 1024, desktop: false },
  { name: "430x932", width: 430, height: 932, desktop: false },
  { name: "390x844", width: 390, height: 844, desktop: false },
  { name: "375x812", width: 375, height: 812, desktop: false },
  { name: "320x700", width: 320, height: 700, desktop: false },
]

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    localStorage.setItem("woloyem-theme", value)
    document.documentElement.classList.toggle("dark", value === "dark")
    document.documentElement.style.colorScheme = value
  }, theme)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(450)
}

async function selectScene(page, sceneId) {
  // Prefer the visible showcase (desktop panel or mobile compact band).
  const tab = page.locator(`[data-scene-tab="${sceneId}"]:visible`).first()
  if ((await tab.count()) === 0) {
    await page.evaluate((id) => {
      const buttons = [...document.querySelectorAll(`[data-scene-tab="${id}"]`)]
      const visible = buttons.find((el) => {
        const style = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0
      })
      visible?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    }, sceneId)
  } else {
    await tab.click()
  }
  await page.waitForTimeout(900)
  const active = await page.locator("[data-auth-scene]:visible").first().getAttribute("data-auth-scene")
  return active === sceneId
}

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const form = document.querySelector("[data-auth-form-panel]")
    const motion = document.querySelector("[data-auth-motion-panel]")
    const vw = doc.clientWidth
    const desktop = vw >= 1024
    const formRect = form?.getBoundingClientRect()
    const floats = [...document.querySelectorAll(".auth-float-card")].map((el) => {
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }
    })
    const windowEl = document.querySelector(".auth-window")
    const windowRect = windowEl?.getBoundingClientRect()
    const questions = [...document.querySelectorAll(".auth-q")].map((el) => el.getBoundingClientRect())

    const contentRows = [...document.querySelectorAll(".auth-q, .auth-lead, .auth-kpi")]
    const contentRects = contentRows.map((el) => el.getBoundingClientRect())

    let floatCoversContent = false
    if (floats.length && contentRects.length) {
      for (const f of floats) {
        for (const c of contentRects) {
          const overlap =
            f.left < c.right - 4 &&
            f.left + f.width > c.left + 4 &&
            f.top < c.bottom - 4 &&
            f.top + f.height > c.top + 4
          if (overlap) floatCoversContent = true
        }
      }
    }

    return {
      overflowOk: doc.scrollWidth <= doc.clientWidth + 1,
      hasWelcome: /Heureux de vous retrouver/i.test(document.body.innerText),
      hasForm: Boolean(document.querySelector("#email")),
      sceneId: document.querySelector("[data-auth-scene]")?.getAttribute("data-auth-scene"),
      desktop,
      formTouchesRight: formRect ? Math.abs(formRect.right - vw) <= 3 : false,
      motionVisible: motion ? getComputedStyle(motion).display !== "none" : false,
      floatCoversContent,
      floatCount: floats.length,
      hasWindow: Boolean(windowRect),
    }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const report = {
    status: "RUNNING",
    base: BASE,
    screenshots: [],
    scenes: {},
    failures: [],
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
    report.scenes[theme] = {}

    for (const scene of SCENES) {
      // Desktop scene shot
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.waitForTimeout(250)
      const okDesktop = await selectScene(page, scene)
      if (!okDesktop) report.failures.push(`${theme}/desktop: failed to select ${scene}`)
      await page.waitForTimeout(1200)
      const metricsDesktop = await measure(page)
      const deskFile = `${theme}-1440-${scene}.png`
      await page.screenshot({ path: path.join(OUT, deskFile), fullPage: false })
      report.screenshots.push(deskFile)
      report.scenes[theme][`${scene}-desktop`] = metricsDesktop
      if (metricsDesktop.floatCoversContent) {
        report.failures.push(`${theme}/1440/${scene}: float card overlaps product content`)
      }
      if (!metricsDesktop.overflowOk) report.failures.push(`${theme}/1440/${scene}: horizontal overflow`)

      // Mobile scene shot
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForTimeout(250)
      const okMobile = await selectScene(page, scene)
      if (!okMobile) report.failures.push(`${theme}/mobile: failed to select ${scene}`)
      await page.waitForTimeout(900)
      const metricsMobile = await measure(page)
      const mobFile = `${theme}-390-${scene}.png`
      await page.screenshot({ path: path.join(OUT, mobFile), fullPage: false })
      report.screenshots.push(mobFile)
      report.scenes[theme][`${scene}-mobile`] = metricsMobile
      if (!metricsMobile.overflowOk) report.failures.push(`${theme}/390/${scene}: horizontal overflow`)
    }

    // Responsive sweep (current scene = analytics after loop)
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.waitForTimeout(300)
      const metrics = await measure(page)
      const file = `${theme}-${vp.name}.png`
      await page.screenshot({ path: path.join(OUT, file), fullPage: false })
      report.screenshots.push(file)
      if (!metrics.overflowOk) report.failures.push(`${theme}/${vp.name}: horizontal overflow`)
      if (!metrics.hasWelcome) report.failures.push(`${theme}/${vp.name}: missing welcome`)
      if (!metrics.hasForm) report.failures.push(`${theme}/${vp.name}: missing form`)
      if (vp.desktop && !metrics.motionVisible) report.failures.push(`${theme}/${vp.name}: motion hidden`)
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
