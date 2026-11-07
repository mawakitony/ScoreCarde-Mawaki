/**
 * Probe E2E Supabase connectivity without printing secrets or row data.
 */
import { readFileSync, existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../lib/env.ts"

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

console.log(`e2eIsolatedAllowed=${e2eIsolatedAllowed()}`)
console.log(`e2eIsolatedBlockReason=${e2eIsolatedBlockReason() ?? "none"}`)

if (!e2eIsolatedAllowed()) {
  console.log("PROBE=SKIPPED_GUARD")
  process.exit(2)
}

const url = process.env.E2E_SUPABASE_URL
const anon = process.env.E2E_SUPABASE_ANON_KEY
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY

try {
  console.log(`E2E_HOST=${new URL(url).host}`)
} catch {
  console.log("E2E_HOST=INVALID")
  process.exit(2)
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const health = await admin.from("organizations").select("id", { count: "exact", head: true })
if (health.error) {
  const msg = health.error.message ?? "unknown"
  const code = health.error.code ?? "none"
  console.log(`ADMIN_ORGANIZATIONS=FAIL code=${code}`)
  if (/schema cache|does not exist|Could not find/i.test(msg)) {
    console.log("HINT=Migrations may be missing on the E2E project")
  } else if (/JWT|Invalid API key|invalid_api_key|401|403/i.test(msg)) {
    console.log("HINT=Service role key may be wrong format — use legacy service_role JWT from Project Settings → API if sb_secret_ is rejected")
  } else {
    console.log("HINT=Admin query failed (message redacted)")
  }
  process.exit(1)
}

console.log(`ADMIN_ORGANIZATIONS=OK count=${health.count ?? 0}`)

const member = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const anonProbe = await member.from("organizations").select("id", { count: "exact", head: true })
if (anonProbe.error && !/permission|RLS|policy/i.test(anonProbe.error.message ?? "")) {
  console.log(`ANON_ORGANIZATIONS=FAIL code=${anonProbe.error.code ?? "none"}`)
  process.exit(1)
}
console.log("ANON_CLIENT=OK")
console.log("PROBE=PASS")
process.exit(0)
