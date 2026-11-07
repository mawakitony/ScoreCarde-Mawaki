/**
 * Lot 5 non-auth browser smoke against a running local server.
 * Does not touch Stripe, publish, or authenticated dashboard routes.
 */
import { chromium } from "@playwright/test"

const base = process.env.E2E_BASE_URL || "http://localhost:3000"
const widths = [1440, 1024, 768, 390, 375]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const failures = []

for (const path of ["/", "/login", "/pricing"]) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  const status = response?.status() ?? 0
  if (status >= 500) failures.push(`${path} status ${status}`)
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth }
    })
    if (overflow.scrollWidth > overflow.clientWidth + 2) {
      failures.push(`${path}@${width} horizontal overflow ${overflow.scrollWidth}>${overflow.clientWidth}`)
    }
  }
}

await browser.close()

if (failures.length) {
  console.error("LOT5_PUBLIC_SMOKE_FAIL")
  for (const item of failures) console.error(item)
  process.exit(1)
}

console.log("LOT5_PUBLIC_SMOKE_PASS")
console.log(`base=${base}`)
console.log(`viewports=${widths.join(",")}`)
console.log("routes=/,/login,/pricing")
