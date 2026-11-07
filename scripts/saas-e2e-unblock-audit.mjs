/**
 * Lists missing E2E / Stripe variable NAMES only. Never prints secret values.
 */
import { readFileSync, existsSync } from "node:fs"
import {
  e2eIsolatedAllowed,
  e2eIsolatedBlockReason,
} from "../lib/env.ts"

function load(file) {
  if (!existsSync(file)) return { loaded: false, keys: [] }
  const keys = []
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=")
    if (index <= 0 || line.startsWith("#")) continue
    const key = line.slice(0, index).trim()
    if (!key || process.env[key]) continue
    process.env[key] = line.slice(index + 1).trim()
    keys.push(key)
  }
  return { loaded: true, keys }
}

const f1 = load(".env.e2e.local")
const f2 = load(".env.local")
console.log(`FILE .env.e2e.local=${f1.loaded ? "present" : "absent"}`)
console.log(`FILE .env.local=${f2.loaded ? "present" : "absent"}`)

function isPlaceholderUrl(value) {
  if (!value?.trim()) return true
  return /your_e2e_project|YOUR_E2E|YOUR_DEV|example\.com|localhost\.invalid/i.test(value)
}

function hostOnly(value) {
  if (!value?.trim()) return null
  try {
    return new URL(value).host
  } catch {
    return "UNPARSABLE"
  }
}

function present(key) {
  return Boolean(process.env[key]?.trim())
}

const requiredIsolated = [
  "E2E_BASE_URL",
  "E2E_SUPABASE_URL",
  "E2E_PROTECT_SUPABASE_URL",
  "E2E_SUPABASE_ANON_KEY",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "E2E_PREFIX",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const requiredStripeTest = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_STARTER_MONTHLY",
]

const optionalStripePrices = ["STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_BUSINESS_MONTHLY"]

const missingIsolated = requiredIsolated.filter((k) => !present(k))
const missingStripe = requiredStripeTest.filter((k) => !present(k))
const missingOptionalPrices = optionalStripePrices.filter((k) => !present(k))

console.log("--- REQUIRED_ISOLATED_MISSING ---")
if (missingIsolated.length === 0) console.log("(none)")
else for (const k of missingIsolated) console.log(k)

console.log("--- REQUIRED_STRIPE_TEST_MISSING ---")
if (missingStripe.length === 0) console.log("(none)")
else for (const k of missingStripe) console.log(k)

console.log("--- OPTIONAL_STRIPE_PRICE_MISSING ---")
if (missingOptionalPrices.length === 0) console.log("(none)")
else for (const k of missingOptionalPrices) console.log(k)

const e2eUrl = process.env.E2E_SUPABASE_URL?.trim()
const protect = process.env.E2E_PROTECT_SUPABASE_URL?.trim()
const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const base = process.env.E2E_BASE_URL?.trim()

console.log("--- URL_SANITY (hosts only) ---")
console.log(`E2E_BASE_URL_HOST=${hostOnly(base) ?? "MISSING"}`)
console.log(`E2E_SUPABASE_HOST=${hostOnly(e2eUrl) ?? "MISSING"}`)
console.log(`E2E_PROTECT_HOST=${hostOnly(protect) ?? "MISSING"}`)
console.log(`NEXT_PUBLIC_SUPABASE_HOST=${hostOnly(appUrl) ?? "MISSING"}`)
console.log(`E2E_SUPABASE_PLACEHOLDER=${isPlaceholderUrl(e2eUrl) ? "YES" : "NO"}`)
console.log(`APP_EQUALS_E2E=${appUrl && e2eUrl && appUrl === e2eUrl ? "YES" : "NO"}`)
console.log(`E2E_EQUALS_PROTECT=${e2eUrl && protect && e2eUrl === protect ? "YES" : "NO"}`)
console.log(`APP_EQUALS_PROTECT=${appUrl && protect && appUrl === protect ? "YES" : "NO"}`)

const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
const pub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? ""
console.log("--- STRIPE_MODE ---")
console.log(`STRIPE_SECRET_MODE=${secret.startsWith("sk_live_") ? "LIVE_BLOCK" : secret.startsWith("sk_test_") ? "TEST" : secret ? "UNKNOWN_PREFIX" : "MISSING"}`)
console.log(`STRIPE_PUBLISHABLE_MODE=${pub.startsWith("pk_live_") ? "LIVE_BLOCK" : pub.startsWith("pk_test_") ? "TEST" : pub ? "UNKNOWN_PREFIX" : "MISSING"}`)
console.log(`STRIPE_WEBHOOK_SECRET=${present("STRIPE_WEBHOOK_SECRET") ? "SET" : "MISSING"}`)
console.log(`STRIPE_PRICE_STARTER_MONTHLY=${present("STRIPE_PRICE_STARTER_MONTHLY") ? "SET" : "MISSING"}`)

console.log("--- GUARDS ---")
console.log(`NODE_ENV=${process.env.NODE_ENV ?? "undefined"}`)
console.log(`e2eIsolatedAllowed=${e2eIsolatedAllowed()}`)
console.log(`e2eIsolatedBlockReason=${e2eIsolatedBlockReason() ?? "none"}`)
console.log(`E2E_PREFIX_OK=${/^E2E-WOLOYEM-\d+$/.test(process.env.E2E_PREFIX?.trim() ?? "") ? "YES" : "NO"}`)

const blockers = []
if (missingIsolated.length) blockers.push(...missingIsolated.map((k) => `missing:${k}`))
if (isPlaceholderUrl(e2eUrl)) blockers.push("placeholder:E2E_SUPABASE_URL")
if (isPlaceholderUrl(appUrl)) blockers.push("placeholder:NEXT_PUBLIC_SUPABASE_URL")
if (secret.startsWith("sk_live_")) blockers.push("live:STRIPE_SECRET_KEY")
if (pub.startsWith("pk_live_")) blockers.push("live:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
if (!e2eIsolatedAllowed()) blockers.push(`guard:${e2eIsolatedBlockReason() ?? "e2eIsolatedAllowed=false"}`)
if (missingStripe.length) blockers.push(...missingStripe.map((k) => `stripe_missing:${k}`))

console.log("--- EXECUTION_DECISION ---")
if (e2eIsolatedAllowed() && !isPlaceholderUrl(e2eUrl) && !secret.startsWith("sk_live_")) {
  if (missingStripe.length === 0 && pub.startsWith("pk_test_")) {
    console.log("DECISION=RUN_FULL_SAAS_E2E_INCLUDING_STRIPE")
  } else {
    console.log("DECISION=RUN_ISOLATED_SAAS_E2E_WITHOUT_STRIPE_CHECKOUT")
  }
  process.exit(0)
}

console.log("DECISION=STOP_BLOCKED")
console.log("--- MANUAL_ACTIONS ---")
if (missingIsolated.length || isPlaceholderUrl(e2eUrl)) {
  console.log("1. Create a dedicated Supabase project for E2E (never production).")
  console.log("2. Copy .env.e2e.example → .env.e2e.local and fill all required isolated vars.")
  console.log("3. Set E2E_PROTECT_SUPABASE_URL to your real/dev project URL (must differ).")
  console.log("4. Align NEXT_PUBLIC_SUPABASE_URL and keys with the E2E project for the app under test.")
  console.log("5. Set E2E_PREFIX=E2E-WOLOYEM-<digits> and E2E_BASE_URL to the local/staging app.")
}
if (missingStripe.length || !pub.startsWith("pk_test_")) {
  console.log("6. Add Stripe TEST keys only (sk_test_ / pk_test_ / whsec_) and STRIPE_PRICE_STARTER_MONTHLY.")
  console.log("7. Point Stripe CLI or staging webhook to /api/webhooks/stripe — never live mode.")
}
console.log("8. Re-run: node --experimental-strip-types --import ./test/register.mjs scripts/saas-e2e-unblock-audit.mjs")
console.log("9. When DECISION=RUN_*: start app on E2E_BASE_URL then npm run test:e2e:isolated")

process.exit(2)
