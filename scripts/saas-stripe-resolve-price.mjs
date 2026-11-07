/**
 * If STRIPE_PRICE_STARTER_MONTHLY is a prod_ ID, resolve the monthly price_ ID via Stripe API.
 * Writes nothing to stdout except status tokens (never prints secrets or full IDs beyond prefix).
 * Updates .env.e2e.local in place when a unique monthly price is found.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import Stripe from "stripe"

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

const secret = process.env.STRIPE_SECRET_KEY?.trim()
const current = process.env.STRIPE_PRICE_STARTER_MONTHLY?.trim() ?? ""

if (!secret?.startsWith("sk_test_")) {
  console.log("STATUS=BLOCKED reason=no_sk_test")
  process.exit(2)
}
if (secret.startsWith("sk_live_")) {
  console.log("STATUS=BLOCKED reason=live_key")
  process.exit(2)
}

const stripe = new Stripe(secret)

if (current.startsWith("price_")) {
  const price = await stripe.prices.retrieve(current)
  console.log(`STATUS=OK already_price livemode=${price.livemode} interval=${price.recurring?.interval ?? "none"}`)
  if (price.livemode) {
    console.log("STATUS=BLOCKED reason=price_is_live")
    process.exit(2)
  }
  process.exit(0)
}

if (!current.startsWith("prod_")) {
  console.log("STATUS=BLOCKED reason=unknown_price_value")
  process.exit(2)
}

console.log("STATUS=RESOLVING product_to_price")
const prices = await stripe.prices.list({ product: current, active: true, limit: 20 })
const monthly = prices.data.filter((p) => !p.livemode && p.recurring?.interval === "month")
if (monthly.length === 0) {
  console.log("STATUS=BLOCKED reason=no_monthly_test_price_on_product")
  process.exit(2)
}
if (monthly.length > 1) {
  console.log(`STATUS=BLOCKED reason=multiple_monthly_prices count=${monthly.length}`)
  process.exit(2)
}

const priceId = monthly[0].id
if (!priceId.startsWith("price_")) {
  console.log("STATUS=BLOCKED reason=resolved_not_price")
  process.exit(2)
}

const envPath = ".env.e2e.local"
let text = readFileSync(envPath, "utf8")
if (!text.includes("STRIPE_PRICE_STARTER_MONTHLY=")) {
  text += `\nSTRIPE_PRICE_STARTER_MONTHLY=${priceId}\n`
} else {
  text = text.replace(/^STRIPE_PRICE_STARTER_MONTHLY=.*$/m, `STRIPE_PRICE_STARTER_MONTHLY=${priceId}`)
}
writeFileSync(envPath, text)
console.log(`STATUS=UPDATED prefix=${priceId.slice(0, 8)}… amount=${monthly[0].unit_amount} currency=${monthly[0].currency}`)
process.exit(0)
