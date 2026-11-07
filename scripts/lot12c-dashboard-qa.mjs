/**
 * Lot 12C — authenticated Dashboard visual QA using local storageState only.
 * Does not accept email/password env vars (use lot12c-save-session.mjs instead).
 * Does not disable auth. Does not write to Supabase.
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile, access } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot12c-shots")
const DEFAULT_STATE = path.resolve("tmp/playwright-auth/dashboard-storage.json")
const STATE_PATH = process.env.LOT12C_STORAGE_STATE?.trim() || DEFAULT_STATE
const WIDTHS = [1440, 1280, 1024, 768, 430, 390, 375, 320]

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const aside = document.querySelector("aside[data-collapsed]")
    return {
      overflowOk: doc.scrollWidth <= doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      sidebarWidth: aside ? Math.round(aside.getBoundingClientRect().width) : null,
      collapsed: aside?.getAttribute("data-collapsed") ?? null,
      kpiCount: document.querySelectorAll("main article").length,
      hasHotLeads: /Leads chauds/i.test(document.body.innerText),
      hasPeriodFilter: Boolean(document.querySelector('[aria-label="Filtre de période"]')),
      hasWelcome: /Bonjour|Bienvenue/i.test(document.body.innerText),
    }
  })
}

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    localStorage.setItem("theme", value)
    document.documentElement.classList.toggle("dark", value === "dark")
    document.documentElement.style.colorScheme = value
  }, theme)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(450)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const report = {
    status: "BLOCKED",
    storageState: "tmp/playwright-auth/dashboard-storage.json",
    failures: [],
    breakpoints: {},
    screenshots: [],
    sidebar: {},
    console: [],
    filters: {},
  }

  if (!(await exists(STATE_PATH))) {
    report.failures.push("storageState missing — run: node scripts/lot12c-save-session.mjs")
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
    console.log(
      JSON.stringify(
        {
          STATUS: "BLOCKED",
          reason: "No local storageState. Create it with interactive login first.",
          command: "node scripts/lot12c-save-session.mjs",
          out: OUT,
        },
        null,
        2,
      ),
    )
    process.exit(2)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: STATE_PATH })
  const page = await context.newPage()

  page.on("pageerror", (err) => {
    report.console.push(String(err.message || err).slice(0, 240))
  })
  page.on("console", (msg) => {
    if (msg.type() === "error") report.console.push(msg.text().slice(0, 240))
  })

  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 60_000 })
    if (page.url().includes("/login")) {
      report.failures.push("storageState expired or invalid — redirected to /login. Re-run lot12c-save-session.mjs")
      await page.screenshot({ path: path.join(OUT, "blocked-login.png"), fullPage: true })
      report.screenshots.push("blocked-login.png")
      report.status = "BLOCKED"
      await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
      console.log(JSON.stringify({ STATUS: "BLOCKED", reason: "Session redirected to /login", out: OUT }, null, 2))
      await browser.close()
      process.exit(2)
    }

    await page.waitForSelector("main", { timeout: 30_000 })

    for (const theme of ["light", "dark"]) {
      await setTheme(page, theme)
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 60_000 })
      if (page.url().includes("/login")) {
        report.failures.push(`${theme}: redirected to login after theme switch`)
        continue
      }

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: Math.max(900, Math.round(width * 1.2)) })
        await page.waitForTimeout(400)
        const m = await measure(page)
        const key = `${theme}-w${width}`
        report.breakpoints[key] = m
        if (!m.overflowOk) report.failures.push(`overflow ${key}: ${m.scrollWidth}>${m.clientWidth}`)
        const file = `${theme}-${width}.png`
        await page.screenshot({ path: path.join(OUT, file), fullPage: true })
        report.screenshots.push(file)
      }

      // Sidebar at desktop
      await page.setViewportSize({ width: 1440, height: 960 })
      await page.waitForTimeout(300)

      const reduceBtn = page.getByRole("button", { name: "Réduire la barre latérale" })
      const expandBtn = page.getByRole("button", { name: "Ouvrir la barre latérale" })

      if ((await reduceBtn.count()) === 0 && (await expandBtn.count()) === 1) {
        await expandBtn.click()
        await page.waitForTimeout(280)
      }

      if (await reduceBtn.count()) {
        let m = await measure(page)
        report.sidebar[`${theme}-open`] = m
        if (m.sidebarWidth && Math.abs(m.sidebarWidth - 240) > 6) {
          report.failures.push(`${theme} open width ${m.sidebarWidth} (expected ~240)`)
        }
        await page.screenshot({ path: path.join(OUT, `${theme}-sidebar-open.png`) })
        report.screenshots.push(`${theme}-sidebar-open.png`)

        await reduceBtn.click()
        await page.waitForTimeout(280)
        m = await measure(page)
        report.sidebar[`${theme}-collapsed`] = m
        if (m.sidebarWidth && Math.abs(m.sidebarWidth - 76) > 6) {
          report.failures.push(`${theme} collapsed width ${m.sidebarWidth} (expected ~76)`)
        }
        await page.screenshot({ path: path.join(OUT, `${theme}-sidebar-collapsed.png`) })
        report.screenshots.push(`${theme}-sidebar-collapsed.png`)

        // Tooltip smoke: hover first nav icon
        const nav = page.locator("aside[data-collapsed='true'] nav a").first()
        if (await nav.count()) {
          await nav.hover()
          await page.waitForTimeout(200)
          await page.screenshot({ path: path.join(OUT, `${theme}-sidebar-tooltip.png`) })
          report.screenshots.push(`${theme}-sidebar-tooltip.png`)
        }

        await page.reload({ waitUntil: "networkidle" })
        await page.waitForTimeout(400)
        m = await measure(page)
        report.sidebar[`${theme}-persisted`] = m
        if (m.collapsed !== "true") report.failures.push(`${theme} sidebar persistence failed`)

        const openBtn = page.getByRole("button", { name: "Ouvrir la barre latérale" })
        if (await openBtn.count()) {
          await openBtn.click()
          await page.waitForTimeout(250)
        }
      } else {
        report.failures.push(`${theme}: sidebar collapse control not found at 1440`)
      }

      // Period filters
      await page.setViewportSize({ width: 1440, height: 960 })
      for (const [label, expect] of [
        ["Aujourd'hui", /range=today/],
        ["7 jours", /range=7d/],
        ["90 jours", /range=90d/],
        ["30 jours", /range=30d/],
      ]) {
        const btn = page.getByRole("button", { name: label, exact: true })
        if (!(await btn.count())) {
          report.failures.push(`${theme}: missing period button ${label}`)
          continue
        }
        await btn.click()
        await page.waitForTimeout(800)
        const urlOk = expect.test(page.url()) || (label === "30 jours" && !/range=/.test(page.url()))
        report.filters[`${theme}-${label}`] = { url: page.url().replace(BASE, ""), ok: urlOk }
        if (!urlOk && label !== "30 jours") report.failures.push(`${theme} filter ${label} URL mismatch`)
      }
      const reset = page.getByRole("button", { name: "Réinitialiser la période à 30 jours" })
      if (await reset.count()) {
        await reset.click()
        await page.waitForTimeout(600)
        report.filters[`${theme}-reset`] = { url: page.url().replace(BASE, "") }
      }
      await page.screenshot({ path: path.join(OUT, `${theme}-filters.png`), fullPage: true })
      report.screenshots.push(`${theme}-filters.png`)
    }

    const hydrationNoise = report.console.filter((line) =>
      /hydrat|Functions cannot be passed|Only plain objects can be passed/i.test(line),
    )
    if (hydrationNoise.length) {
      report.failures.push(`console/hydration: ${hydrationNoise.slice(0, 3).join(" | ")}`)
    }

    report.status = report.failures.length ? "PARTIAL" : "READY_FOR_VISUAL_REVIEW"
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
    console.log(
      JSON.stringify(
        {
          STATUS: report.status,
          failures: report.failures,
          screenshots: report.screenshots.length,
          consoleErrors: report.console.slice(0, 15),
          out: OUT,
        },
        null,
        2,
      ),
    )
    await browser.close()
    process.exit(report.failures.length ? 1 : 0)
  } catch (error) {
    report.failures.push(String(error?.message || error).split("\n")[0])
    report.status = "BLOCKED"
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2)).catch(() => {})
    console.log(JSON.stringify({ STATUS: "BLOCKED", error: report.failures[0], out: OUT }, null, 2))
    await browser.close()
    process.exit(2)
  }
}

main()
