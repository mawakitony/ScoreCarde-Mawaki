import { chromium } from "playwright"
import { mkdirSync } from "node:fs"

mkdirSync("docs/saas", { recursive: true })
const email = process.env.PLATFORM_E2E_ADMIN_EMAIL
const password = process.env.PLATFORM_E2E_ADMIN_PASSWORD
if (!email || !password) {
  console.error("MISSING_ADMIN_CREDS")
  process.exit(2)
}

const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" })
await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
await page.locator("#password").fill(password)
await page.getByRole("button", { name: "Se connecter" }).click()
await page.waitForURL(/\/(dashboard|onboarding|platform)/, { timeout: 45_000 })
await page.goto("http://localhost:3000/platform?range=30", { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1800)
await page.screenshot({ path: "docs/saas/platform-compact-after-viewport.png" })
await page.screenshot({ path: "docs/saas/platform-compact-after-full.png", fullPage: true })

await page.setViewportSize({ width: 390, height: 844 })
await page.goto("http://localhost:3000/platform?range=30", { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1000)
await page.screenshot({ path: "docs/saas/platform-compact-after-mobile.png", fullPage: true })

const hasMix = await page.getByText(/Répartition des abonnements|Sécurité plateforme/i).count()
console.log(`SHOTS_OK hasVisible=${hasMix}`)
await browser.close()
