import { chromium } from "playwright"

const email = process.env.PLATFORM_E2E_ADMIN_EMAIL
const password = process.env.PLATFORM_E2E_ADMIN_PASSWORD
if (!email || !password) {
  console.error("MISSING_ADMIN_CREDS")
  process.exit(2)
}

const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage()
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" })
await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
await page.locator("#password").fill(password)
await page.getByRole("button", { name: "Se connecter" }).click()
await page.waitForURL(/\/(dashboard|onboarding|platform)/, { timeout: 45_000 })
const res = await page.goto("http://localhost:3000/platform?range=30", { waitUntil: "domcontentloaded" })
await page.waitForTimeout(2500)
const text = await page.locator("main").innerText()
const out = {
  status: res?.status(),
  mfa: /Code à 6 chiffres/i.test(text),
  hasFinance: /Revenus récurrents/i.test(text),
  hasError: /Functions cannot|Application error|Export AllMetricsPanel/i.test(text),
  preview: text.slice(0, 140).replace(/\s+/g, " "),
}
console.log(JSON.stringify(out))
await browser.close()
process.exit(out.hasError || (out.status && out.status >= 500) ? 1 : 0)
