/**
 * Reports E2E isolation readiness without printing secret values.
 */
import { readFileSync } from "node:fs"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason, e2eDatabaseAllowed, e2eCurrentDatabaseAllowed } from "../lib/env.ts"

function load(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const index = line.indexOf("=")
      if (index <= 0 || line.startsWith("#")) continue
      const key = line.slice(0, index).trim()
      if (!key || process.env[key]) continue
      process.env[key] = line.slice(index + 1).trim()
    }
  } catch {
    // optional
  }
}

load(".env.e2e.local")
load(".env.local")

function host(value) {
  if (!value) return "MISSING"
  try {
    return new URL(value).host
  } catch {
    return "SET_UNPARSABLE"
  }
}

const keys = [
  "E2E_BASE_URL",
  "E2E_SUPABASE_URL",
  "E2E_PROTECT_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "E2E_PREFIX",
]
for (const key of keys) {
  const value = process.env[key]?.trim()
  if (!value) console.log(`${key}=MISSING`)
  else if (key.includes("URL")) console.log(`${key}=SET host=${host(value)}`)
  else if (key === "E2E_PREFIX") console.log(`${key}=SET`)
  else console.log(`${key}=SET`)
}

console.log(`E2E_SUPABASE_ANON_KEY=${process.env.E2E_SUPABASE_ANON_KEY ? "SET" : "MISSING"}`)
console.log(`E2E_SUPABASE_SERVICE_ROLE_KEY=${process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING"}`)
console.log(`STRIPE_LIVE_BLOCK=${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "YES" : "NO"}`)
console.log(`e2eIsolatedAllowed=${e2eIsolatedAllowed()}`)
console.log(`e2eIsolatedBlockReason=${e2eIsolatedBlockReason() ?? "none"}`)
console.log(`e2eDatabaseAllowed(legacy)=${e2eDatabaseAllowed()}`)
console.log(`e2eCurrentDatabaseAllowed=${e2eCurrentDatabaseAllowed()}`)

const e2eHost = host(process.env.E2E_SUPABASE_URL)
if (/your_e2e_project|YOUR_E2E|example\.com/i.test(process.env.E2E_SUPABASE_URL ?? "") || e2eHost === "your_e2e_project.supabase.co") {
  console.log("E2E_SUPABASE_URL_PLACEHOLDER=YES")
} else {
  console.log("E2E_SUPABASE_URL_PLACEHOLDER=NO")
}

if (!e2eIsolatedAllowed()) {
  console.log("STATUS=NOT_CONFIGURED")
  console.log("NEXT=Fill .env.e2e.local from .env.e2e.example using a dedicated Supabase project, then re-run this script.")
  console.log("DOCS=docs/lot16k-authenticated-qa.md")
  process.exit(2)
}
console.log("STATUS=READY")
