/**
 * Staging-only dump of fiabilized Platform Admin financial metrics.
 * Loads .env.e2e.local; refuses protect host. Prints no secrets. Read-only Stripe.
 */
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { existsSync, readFileSync } from "node:fs"

const STAGING = "hznmtadobqfhumezdgbh.supabase.co"
const PROTECT = "zkyjaslogpdujyeysjzw.supabase.co"
const PAID = new Set(["starter", "pro", "business", "enterprise"])

function loadEnv() {
  const file = ".env.e2e.local"
  if (!existsSync(file)) throw new Error("MISSING .env.e2e.local")
  const env = { ...process.env }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=")
    if (i <= 0 || line.startsWith("#")) continue
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

function host(url) {
  try {
    return new URL(url).host
  } catch {
    return ""
  }
}

const env = loadEnv()
const url = env.E2E_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const key = env.E2E_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
const h = host(url)
console.log(`E2E_HOST=${h}`)
if (h !== STAGING || h === PROTECT) {
  console.error("REFUSED: not staging-only")
  process.exit(2)
}

const CATALOGUE = { free: 0, starter: 10, pro: null, business: null, enterprise: null, internal: null }
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const windowDays = 30
const now = Date.now()
const since = new Date(now - windowDays * 864e5).toISOString()

const { data: rows, error } = await admin
  .from("subscriptions")
  .select("organization_id,plan,status,billing_interval,provider,provider_subscription_id,trial_end,created_at")
if (error) {
  console.error("SUBS_ERROR", error.message)
  process.exit(1)
}
const list = rows ?? []

// Stripe price verification (read-only)
const stripeVerified = []
const sk = env.STRIPE_SECRET_KEY || ""
if (sk.startsWith("sk_test")) {
  const stripe = new Stripe(sk, { apiVersion: "2025-02-24.acacia" })
  const priceId = env.STRIPE_PRICE_STARTER_MONTHLY
  if (priceId) {
    const p = await stripe.prices.retrieve(priceId)
    stripeVerified.push({
      plan: "starter",
      interval: "monthly",
      amountCents: p.unit_amount,
      currency: (p.currency || "usd").toUpperCase(),
      priceId,
    })
  }
  const stripeSubs = await stripe.subscriptions.list({ limit: 20, status: "all" })
  console.log(
    "STRIPE_SUBS_SUMMARY=" +
      JSON.stringify(
        stripeSubs.data.map((s) => ({
          id: s.id,
          status: s.status,
          unit_amount: s.items.data[0]?.price?.unit_amount,
          currency: s.items.data[0]?.price?.currency,
          mutated: false,
        })),
      ),
  )
} else {
  console.log("STRIPE_LOOKUP=SKIPPED")
}

let included = 0
const undetermined = []
let mrrCents = 0
for (const row of list) {
  if (row.status !== "active" || !PAID.has(row.plan)) continue
  const amount = CATALOGUE[row.plan]
  if (amount === null || amount === undefined) {
    undetermined.push({ plan: row.plan, provider: row.provider, reason: "prix inconnu — exclu du MRR" })
    continue
  }
  included += 1
  mrrCents += Math.round(amount * 100)
}

// Cohort conversion
const closed = list.filter((row) => {
  if (!row.trial_end) return false
  const end = Date.parse(row.trial_end)
  return end >= Date.parse(since) && end <= now
})
const converted = closed.filter((row) => row.status === "active" && PAID.has(row.plan)).length

// Period churn
const { data: cancels } = await admin
  .from("audit_logs")
  .select("organization_id,created_at,metadata")
  .eq("action", "subscription.canceled")
  .gte("created_at", since)
  .limit(5000)
const canceledOrgs = new Set()
for (const ev of cancels ?? []) {
  const plan = ev.metadata?.plan
  if (!plan || !PAID.has(plan)) continue
  canceledOrgs.add(ev.organization_id)
}
const startOrgs = new Set(canceledOrgs)
for (const row of list) {
  if (row.status === "active" && PAID.has(row.plan) && row.created_at && row.created_at < since) {
    startOrgs.add(row.organization_id)
  }
}

// Legacy hybrid (audit)
const { count: paidEv } = await admin
  .from("audit_logs")
  .select("id", { count: "exact", head: true })
  .in("action", ["subscription.created", "subscription.upgraded"])
  .gte("created_at", since)
const { count: cancelEv } = await admin
  .from("audit_logs")
  .select("id", { count: "exact", head: true })
  .eq("action", "subscription.canceled")
  .gte("created_at", since)
const trialing = list.filter((r) => r.status === "trialing").length
const activePaid = list.filter((r) => r.status === "active" && PAID.has(r.plan)).length

console.log(
  JSON.stringify(
    {
      windowDays,
      stripePricesVerified: stripeVerified,
      mrr: {
        calculableUsd: included > 0 ? (mrrCents / 100).toFixed(2) : undetermined.length ? "Données insuffisantes" : "—",
        includedActivePaid: included,
        undeterminedActivePaid: undetermined.length,
        undetermined,
        note: "Undetermined never counted as $0",
      },
      cohortConversion: {
        availability: closed.length > 0 ? "ok" : "insufficient",
        numerator: converted,
        denominator: closed.length,
        display: closed.length > 0 ? `${((converted / closed.length) * 100).toFixed(1)} %` : "Données insuffisantes",
      },
      periodChurn: {
        availability: startOrgs.size > 0 ? "ok" : "insufficient",
        numerator: canceledOrgs.size,
        denominator: startOrgs.size,
        display:
          startOrgs.size > 0 ? `${((canceledOrgs.size / startOrgs.size) * 100).toFixed(1)} %` : "Données insuffisantes",
      },
      legacyHybridAuditOnly: {
        conversion: {
          rate: `${(((paidEv ?? 0) / (trialing + (paidEv ?? 0) || 1)) * 100).toFixed(1)} %`,
          note: "DEPRECATED — not a commercial KPI",
        },
        churn: {
          rate: `${(((cancelEv ?? 0) / (activePaid + (cancelEv ?? 0) || 1)) * 100).toFixed(1)} %`,
          note: "DEPRECATED — not a commercial KPI",
        },
      },
      stocks: { trialing, activePaid },
    },
    null,
    2,
  ),
)
