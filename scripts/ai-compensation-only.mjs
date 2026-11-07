import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (!m) continue
  process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "")
}

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000"
const PASSWORD = "E2E-AI-Test-Password-2026!"
const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage()
const { data: users } = await admin().auth.admin.listUsers({ perPage: 200 })
const owner = (users?.users || []).find((u) => String(u.email || "").includes("e2e-ai") && String(u.email || "").includes("owner"))
  || (users?.users || []).find((u) => /e2e-ai-.*owner/i.test(String(u.email || "")))
if (!owner?.email) {
  // fallback: latest setup email pattern from validation
  console.log("No owner found in list; using env E2E_OWNER_EMAIL if set")
}
const email = process.env.E2E_OWNER_EMAIL || owner?.email
if (!email) {
  console.error("OWNER_EMAIL_MISSING")
  process.exit(1)
}
await page.goto(`${BASE}/login`)
await page.locator("form").filter({ has: page.locator("#password") }).locator("#email").fill(email)
await page.locator("#password").fill(PASSWORD)
await page.getByRole("button", { name: "Se connecter" }).click()
await page.waitForURL(/\/dashboard/, { timeout: 90_000 })
const res = await page.request.post(`${BASE}/api/e2e/ai-compensation`, {
  headers: { "x-e2e-secret": process.env.E2E_AI_SECRET || "local-e2e-compensation" },
})
const json = await res.json()
console.log(JSON.stringify({ status: res.status(), ...json }, null, 2))
await browser.close()
process.exit(json.compensated ? 0 : 1)
