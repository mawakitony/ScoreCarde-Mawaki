/**
 * Lot 12C — create a local Playwright storageState via interactive login.
 *
 * Usage:
 *   node scripts/lot12c-save-session.mjs
 *
 * A headed Chromium window opens on /login. Sign in with an authorized test account.
 * When the URL reaches /dashboard, the session is saved locally.
 *
 * - Password is typed only in the browser (never read by this script).
 * - storageState is written under tmp/playwright-auth/ (gitignored).
 * - Tokens are not printed to the console.
 */
import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const AUTH_DIR = path.resolve("tmp/playwright-auth")
const STATE_PATH = path.join(AUTH_DIR, "dashboard-storage.json")
const META_PATH = path.join(AUTH_DIR, "session-meta.json")
const TIMEOUT_MS = Number(process.env.LOT12C_LOGIN_TIMEOUT_MS || 5 * 60 * 1000)

async function main() {
  await mkdir(AUTH_DIR, { recursive: true })
  console.log("LOT12C save-session")
  console.log(`Open ${BASE}/login in the headed browser.`)
  console.log("Sign in with an authorized test account.")
  console.log(`Waiting up to ${Math.round(TIMEOUT_MS / 1000)}s for /dashboard …`)

  const browser = await chromium.launch({
    headless: false,
    channel: process.env.LOT12C_CHANNEL || undefined,
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 })
    await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), { timeout: TIMEOUT_MS })

    // Confirm the shell is present (authenticated layout).
    await page.waitForSelector("aside, main", { timeout: 30_000 })

    await context.storageState({ path: STATE_PATH })
    await writeFile(
      META_PATH,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          baseUrl: BASE,
          path: "tmp/playwright-auth/dashboard-storage.json",
          note: "Local Playwright storageState only. Do not commit. Do not share.",
        },
        null,
        2,
      ),
    )

    console.log("STATUS=SESSION_SAVED")
    console.log("storageState=tmp/playwright-auth/dashboard-storage.json")
    console.log("Next: node scripts/lot12c-dashboard-qa.mjs")
    await browser.close()
    process.exit(0)
  } catch (error) {
    const message = String(error?.message || error)
    // Never dump page content / cookies / tokens.
    console.log("STATUS=BLOCKED")
    console.log("reason=Interactive login did not reach /dashboard in time (or browser could not open).")
    console.log(`detail=${message.split("\n")[0]}`)
    console.log("Create the session manually:")
    console.log("  1. Ensure npm run dev is running.")
    console.log("  2. node scripts/lot12c-save-session.mjs")
    console.log("  3. Complete login in the Chromium window.")
    console.log("  4. node scripts/lot12c-dashboard-qa.mjs")
    try {
      await browser.close()
    } catch {
      /* ignore */
    }
    process.exit(2)
  }
}

main()
