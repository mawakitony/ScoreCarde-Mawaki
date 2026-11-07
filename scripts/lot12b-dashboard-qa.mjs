/**
 * Lot 12B — real Playwright visual QA for the Dashboard.
 * Does not disable auth. Does not write to Supabase.
 *
 * Auth options (first match wins):
 * 1. LOT12B_STORAGE_STATE — Playwright storageState JSON path
 * 2. LOT12B_EMAIL + LOT12B_PASSWORD — login form
 * 3. Otherwise → STATUS=BLOCKED (no fake screenshots of the authenticated dashboard)
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile, access, readFile } from "node:fs/promises"
import path from "node:path"

async function loadEnvFile(file) {
  try {
    const text = await readFile(file, "utf8")
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env) || process.env[key] === "") process.env[key] = value
    }
  } catch {
    /* optional */
  }
}

await loadEnvFile(".env.local")
await loadEnvFile(".env.e2e.local")

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const OUT = path.resolve("tmp/lot12b-shots")
const WIDTHS = [1440, 1280, 1024, 768, 430, 390, 375, 320]
const email = process.env.LOT12B_EMAIL?.trim() || process.env.E2E_OWNER_EMAIL?.trim() || ""
const password = process.env.LOT12B_PASSWORD?.trim() || process.env.E2E_OWNER_PASSWORD?.trim() || ""
const storageState = process.env.LOT12B_STORAGE_STATE?.trim() || ""

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
    const main = document.querySelector("main")
    return {
      overflowOk: doc.scrollWidth <= doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      sidebarWidth: aside ? Math.round(aside.getBoundingClientRect().width) : null,
      collapsed: aside?.getAttribute("data-collapsed") ?? null,
      hasKpis: document.querySelectorAll("article").length >= 3,
      hasHotLeads: Boolean(document.body.innerText.includes("Leads chauds")),
      consoleErrors: window.__lot12bErrors ?? [],
    }
  })
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  const form = page.locator("form").filter({ has: page.locator("#password") })
  await form.locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 })
}

async function ensureDashboard(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60_000 })
  if (page.url().includes("/login")) {
    if (!email || !password) {
      return { ok: false, reason: "Redirected to /login and no LOT12B_EMAIL/LOT12B_PASSWORD (or E2E_OWNER_*) provided" }
    }
    await login(page)
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 60_000 })
  }
  if (page.url().includes("/login")) {
    return { ok: false, reason: "Still on /login after auth attempt — credentials rejected or MFA required" }
  }
  await page.waitForSelector("h1, [class*='dash-enter']", { timeout: 30_000 })
  return { ok: true }
}

async function setTheme(page, theme) {
  await page.evaluate((value) => {
    localStorage.setItem("theme", value)
    document.documentElement.classList.toggle("dark", value === "dark")
    document.documentElement.style.colorScheme = value
  }, theme)
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(400)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const report = {
    status: "BLOCKED",
    auth: storageState ? "storageState" : email ? "password" : "none",
    failures: [],
    breakpoints: {},
    screenshots: [],
    sidebar: {},
    console: [],
  }

  const browser = await chromium.launch({ headless: true })
  const contextOptions = {}
  if (storageState && (await exists(storageState))) {
    contextOptions.storageState = storageState
  }
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()

  page.on("pageerror", (err) => {
    report.console.push(String(err.message || err))
  })
  page.on("console", (msg) => {
    if (msg.type() === "error") report.console.push(msg.text())
  })

  try {
    const accessResult = await ensureDashboard(page)
    if (!accessResult.ok) {
      report.failures.push(accessResult.reason)
      await page.screenshot({ path: path.join(OUT, "blocked-login.png"), fullPage: true })
      report.screenshots.push("blocked-login.png")
      await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
      console.log(JSON.stringify({ STATUS: "BLOCKED", reason: accessResult.reason, out: OUT }, null, 2))
      await browser.close()
      process.exit(2)
    }

    // Inject error collector for RSC/hydration noise
    await page.addInitScript(() => {
      window.__lot12bErrors = []
      window.addEventListener("error", (e) => window.__lot12bErrors.push(String(e.message || e.error)))
    })

    for (const theme of ["light", "dark"]) {
      await setTheme(page, theme)
      const gate = await ensureDashboard(page)
      if (!gate.ok) {
        report.failures.push(`${theme}: ${gate.reason}`)
        continue
      }

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: Math.max(900, Math.round(width * 1.2)) })
        await page.waitForTimeout(350)
        const m = await measure(page)
        const key = `${theme}-w${width}`
        report.breakpoints[key] = m
        if (!m.overflowOk) report.failures.push(`overflow ${key}: ${m.scrollWidth}>${m.clientWidth}`)
        const file = `${theme}-${width}.png`
        await page.screenshot({ path: path.join(OUT, file), fullPage: true })
        report.screenshots.push(file)
      }

      // Sidebar open/collapsed at 1440
      await page.setViewportSize({ width: 1440, height: 960 })
      const collapseBtn = page.getByRole("button", { name: /Réduire la barre latérale|Ouvrir la barre latérale/ })
      if (await collapseBtn.count()) {
        // Ensure expanded first
        const expandedLabel = page.getByRole("button", { name: "Réduire la barre latérale" })
        if ((await expandedLabel.count()) === 0) {
          await page.getByRole("button", { name: "Ouvrir la barre latérale" }).click()
          await page.waitForTimeout(300)
        }
        let m = await measure(page)
        report.sidebar[`${theme}-open`] = m
        await page.screenshot({ path: path.join(OUT, `${theme}-sidebar-open.png`), fullPage: false })
        report.screenshots.push(`${theme}-sidebar-open.png`)

        await page.getByRole("button", { name: "Réduire la barre latérale" }).click()
        await page.waitForTimeout(300)
        m = await measure(page)
        report.sidebar[`${theme}-collapsed`] = m
        if (m.sidebarWidth && Math.abs(m.sidebarWidth - 76) > 4) {
          report.failures.push(`${theme} collapsed width ${m.sidebarWidth} (expected ~76)`)
        }
        await page.screenshot({ path: path.join(OUT, `${theme}-sidebar-collapsed.png`), fullPage: false })
        report.screenshots.push(`${theme}-sidebar-collapsed.png`)

        // Persistence
        await page.reload({ waitUntil: "networkidle" })
        await page.waitForTimeout(400)
        m = await measure(page)
        report.sidebar[`${theme}-persisted`] = m
        if (m.collapsed !== "true") report.failures.push(`${theme} sidebar persistence failed after reload`)

        // Restore open for next theme loop comfort
        const openBtn = page.getByRole("button", { name: "Ouvrir la barre latérale" })
        if (await openBtn.count()) {
          await openBtn.click()
          await page.waitForTimeout(250)
        }
      } else {
        report.failures.push(`${theme}: collapse button not found (viewport may be mobile-only)`)
      }

      // Period filter smoke (30d → 7d → reset)
      const seven = page.getByRole("button", { name: "7 jours" })
      if (await seven.count()) {
        await seven.click()
        await page.waitForURL(/range=7d/, { timeout: 15_000 })
        await page.getByRole("button", { name: "Réinitialiser la période à 30 jours" }).click()
        await page.waitForTimeout(500)
      }
    }

    report.status = report.failures.length ? "PARTIAL" : "READY_FOR_FINAL_DESIGN_REVIEW"
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))
    console.log(
      JSON.stringify(
        {
          STATUS: report.status,
          failures: report.failures,
          screenshots: report.screenshots.length,
          consoleErrors: report.console.slice(0, 12),
          out: OUT,
        },
        null,
        2,
      ),
    )
    await browser.close()
    process.exit(report.failures.length ? 1 : 0)
  } catch (error) {
    report.failures.push(String(error?.message || error))
    report.status = "BLOCKED"
    await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2)).catch(() => {})
    console.log(JSON.stringify({ STATUS: "BLOCKED", error: String(error?.message || error), out: OUT }, null, 2))
    await browser.close()
    process.exit(2)
  }
}

main()
