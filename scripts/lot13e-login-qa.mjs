/**
 * Lot 13E — Poppins loading + premium login form visual QA (public /login).
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot13e-shots")

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

async function inspectFonts(page) {
  return page.evaluate(async () => {
    function stack(el) {
      return el ? getComputedStyle(el).fontFamily : null
    }
    const hasPoppins = (value) => /\bpoppins\b/i.test(value || "")
    const hasLegacy = (value) => /\b(manrope|fraunces)\b/i.test(value || "")

    const body = document.body
    const h1 = document.querySelector("h1")
    const input = document.querySelector("#email, input[type='email']")
    const button = document.querySelector('button[type="submit"]')

    let poppinsLoaded = false
    try {
      if (document.fonts?.check) {
        poppinsLoaded =
          document.fonts.check("16px Poppins") ||
          document.fonts.check("500 16px Poppins") ||
          document.fonts.check("600 16px Poppins")
      }
      if (document.fonts?.ready) await document.fonts.ready
      if (!poppinsLoaded && document.fonts?.check) {
        poppinsLoaded =
          document.fonts.check("16px Poppins") ||
          document.fonts.check("500 16px Poppins") ||
          document.fonts.check("600 16px Poppins")
      }
    } catch {
      poppinsLoaded = false
    }

    const fontFaces = [...(document.fonts || [])].map((face) => ({
      family: face.family,
      status: face.status,
      weight: face.weight,
    }))
    const loadedPoppinsFaces = fontFaces.filter(
      (face) => /\bpoppins\b/i.test(face.family) && face.status === "loaded",
    )

    return {
      body: stack(body),
      h1: stack(h1),
      input: stack(input),
      button: stack(button),
      bodyHasPoppins: hasPoppins(stack(body)),
      h1HasPoppins: hasPoppins(stack(h1)),
      inputHasPoppins: hasPoppins(stack(input)),
      buttonHasPoppins: hasPoppins(stack(button)),
      bodyHasLegacy: hasLegacy(stack(body)),
      h1HasLegacy: hasLegacy(stack(h1)),
      poppinsLoaded,
      loadedPoppinsFaces: loadedPoppinsFaces.length,
      hasWelcome: /Heureux de vous retrouver/i.test(document.body.innerText),
      hasMailIcon: Boolean(document.querySelector("#email")),
      overflowOk: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    }
  })
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const report = {
    status: "RUNNING",
    base: BASE,
    screenshots: [],
    fonts: {},
    failures: [],
    authenticatedPages: "NOT TESTED — no session",
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
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(400)
    const fonts = await inspectFonts(page)
    report.fonts[theme] = fonts

    if (!fonts.bodyHasPoppins) report.failures.push(`${theme}: body font stack missing Poppins`)
    if (!fonts.h1HasPoppins) report.failures.push(`${theme}: h1 font stack missing Poppins`)
    if (!fonts.inputHasPoppins) report.failures.push(`${theme}: input font stack missing Poppins`)
    if (!fonts.buttonHasPoppins) report.failures.push(`${theme}: button font stack missing Poppins`)
    if (fonts.bodyHasLegacy || fonts.h1HasLegacy) report.failures.push(`${theme}: legacy Manrope/Fraunces still active`)
    if (!fonts.poppinsLoaded && fonts.loadedPoppinsFaces === 0) {
      report.failures.push(`${theme}: Poppins font files not loaded (fallback likely)`)
    }
    if (!fonts.hasWelcome) report.failures.push(`${theme}: missing welcome title`)

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.waitForTimeout(280)
      const metrics = await inspectFonts(page)
      const file = `${theme}-${vp.name}.png`
      await page.screenshot({ path: path.join(OUT, file), fullPage: false })
      report.screenshots.push(file)
      if (!metrics.overflowOk) report.failures.push(`${theme}/${vp.name}: horizontal overflow`)
      if (!metrics.bodyHasPoppins) report.failures.push(`${theme}/${vp.name}: body missing Poppins`)
    }
  }

  report.status = report.failures.length === 0 ? "PASS" : "FAIL"
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      {
        STATUS: report.status,
        failures: report.failures,
        fonts: {
          light: report.fonts.light,
          dark: report.fonts.dark,
        },
        screenshots: report.screenshots.length,
        authenticatedPages: report.authenticatedPages,
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
