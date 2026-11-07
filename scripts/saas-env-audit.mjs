import { existsSync, readFileSync } from "node:fs"

function mask(value) {
  if (!value) return "MISSING"
  const s = String(value).trim()
  if (!s) return "MISSING"
  if (s.startsWith("sk_test")) return "sk_test_PRESENT"
  if (s.startsWith("sk_live")) return "sk_live_PRESENT_BLOCK"
  if (s.startsWith("pk_test")) return "pk_test_PRESENT"
  if (s.startsWith("pk_live")) return "pk_live_PRESENT_BLOCK"
  if (s.startsWith("whsec_")) return "whsec_PRESENT"
  if (s.startsWith("price_")) return "price_PRESENT"
  if (s.startsWith("https://")) return "URL_SET"
  return "SET"
}

function load(file) {
  if (!existsSync(file)) return null
  const out = {}
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    out[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
  return out
}

const keys = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_BUSINESS_MONTHLY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "E2E_SUPABASE_URL",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "E2E_SUPABASE_ANON_KEY",
  "E2E_PREFIX",
  "E2E_BASE_URL",
]

for (const file of [".env.local", ".env.e2e.local", ".env"]) {
  const env = load(file)
  console.log(`FILE ${file}: ${env ? "loaded" : "absent"}`)
  if (!env) continue
  for (const key of keys) console.log(`  ${key}=${mask(env[key])}`)
}
