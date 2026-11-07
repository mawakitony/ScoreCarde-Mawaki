/**
 * Stripe test-mode readiness for SaaS E2E. Prints names/status only — never secrets.
 */
import { existsSync, readFileSync } from "node:fs"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../lib/env.ts"
import { stripeTestModeReady } from "../tests/e2e/helpers/stripe-ready.ts"

function load(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=")
    if (index <= 0 || line.startsWith("#")) continue
    const key = line.slice(0, index).trim()
    if (!key || process.env[key]) continue
    process.env[key] = line.slice(index + 1).trim()
  }
}

load(".env.e2e.local")
load(".env.local")

const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_STARTER_MONTHLY",
]

console.log("--- TARGET ---")
try {
  console.log(`E2E_HOST=${new URL(process.env.E2E_SUPABASE_URL ?? "").host}`)
  console.log(`PROTECT_HOST=${new URL(process.env.E2E_PROTECT_SUPABASE_URL ?? "").host}`)
} catch {
  console.log("URL_PARSE=FAIL")
}
console.log(`e2eIsolatedAllowed=${e2eIsolatedAllowed()}`)
console.log(`e2eIsolatedBlockReason=${e2eIsolatedBlockReason() ?? "none"}`)

console.log("--- STRIPE_VARS ---")
for (const key of required) {
  const value = process.env[key]?.trim() ?? ""
  let mode = "MISSING"
  if (key === "STRIPE_SECRET_KEY") {
    mode = value.startsWith("sk_live_") ? "LIVE_BLOCK" : value.startsWith("sk_test_") ? "TEST" : value ? "BAD_PREFIX" : "MISSING"
  } else if (key === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") {
    mode = value.startsWith("pk_live_") ? "LIVE_BLOCK" : value.startsWith("pk_test_") ? "TEST" : value ? "BAD_PREFIX" : "MISSING"
  } else if (key === "STRIPE_WEBHOOK_SECRET") {
    mode = value.startsWith("whsec_") ? "SET" : value ? "BAD_PREFIX" : "MISSING"
  } else if (key === "STRIPE_PRICE_STARTER_MONTHLY") {
    mode = value.startsWith("price_") ? "SET" : value ? "BAD_PREFIX" : "MISSING"
  }
  console.log(`${key}=${mode}`)
}

for (const key of ["STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_BUSINESS_MONTHLY"]) {
  const value = process.env[key]?.trim() ?? ""
  console.log(`${key}=${value.startsWith("price_") ? "SET" : "MISSING_OPTIONAL"}`)
}

const stripe = stripeTestModeReady()
console.log("--- READINESS ---")
console.log(`stripeTestModeReady=${stripe.ready}`)
console.log(`stripeBlockReason=${stripe.reason ?? "none"}`)

console.log("--- WEBHOOK_EVENTS_REQUIRED ---")
for (const event of [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]) {
  console.log(event)
}
console.log("WEBHOOK_PATH=/api/webhooks/stripe")

console.log("--- EXECUTION_DECISION ---")
if (stripe.ready && e2eIsolatedAllowed() && !process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
  console.log("DECISION=RUN_STRIPE_TEST_E2E")
  process.exit(0)
}
console.log("DECISION=STOP_BLOCKED")
console.log("--- MANUAL_ACTIONS ---")
console.log("1. Stripe Dashboard → mode TEST (toggle Test mode ON).")
console.log("2. Create Product « WOLOYEM Score Starter » + recurring Price monthly → copy Price ID.")
console.log("3. Developers → API keys: copy sk_test_ and pk_test_ (never sk_live_/pk_live_).")
console.log("4. Put into .env.e2e.local (and ensure Next E2E process loads them):")
console.log("   STRIPE_SECRET_KEY=sk_test_…")
console.log("   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…")
console.log("   STRIPE_PRICE_STARTER_MONTHLY=price_…")
console.log("5. Forward webhooks locally:")
console.log("   stripe listen --forward-to localhost:3000/api/webhooks/stripe")
console.log("6. Copy the CLI webhook signing secret into STRIPE_WEBHOOK_SECRET=whsec_…")
console.log("7. Re-run: node --experimental-strip-types --import ./test/register.mjs scripts/saas-stripe-prep-audit.mjs")
console.log("8. When DECISION=RUN_STRIPE_TEST_E2E, authorize Playwright Stripe E2E.")
process.exit(2)
