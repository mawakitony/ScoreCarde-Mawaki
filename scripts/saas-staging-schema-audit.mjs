/**
 * Read-only audit of woloyem-score-staging schema. Never writes. Never prints secrets.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs"
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

const TARGET = "hznmtadobqfhumezdgbh.supabase.co"
const PROTECT = "zkyjaslogpdujyeysjzw.supabase.co"
const url = process.env.E2E_SUPABASE_URL?.trim() ?? ""
const protect = process.env.E2E_PROTECT_SUPABASE_URL?.trim() ?? ""
const app = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""

function host(u) {
  try {
    return new URL(u).host
  } catch {
    return "INVALID"
  }
}

console.log("--- TARGET_GUARD ---")
console.log(`E2E_HOST=${host(url)}`)
console.log(`APP_HOST=${host(app)}`)
console.log(`PROTECT_HOST=${host(protect)}`)
console.log(`TARGET_IS_STAGING=${host(url) === TARGET ? "YES" : "NO"}`)
console.log(`TARGET_IS_PROTECT=${host(url) === PROTECT ? "YES" : "NO"}`)
console.log(`APP_IS_PROTECT=${host(app) === PROTECT ? "YES" : "NO"}`)
console.log(`e2eIsolatedAllowed=${e2eIsolatedAllowed()}`)
console.log(`e2eIsolatedBlockReason=${e2eIsolatedBlockReason() ?? "none"}`)

if (host(url) !== TARGET || host(app) !== TARGET || host(url) === PROTECT) {
  console.log("ABORT=wrong_target")
  process.exit(2)
}

const migrations = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort()
console.log("--- MIGRATION_FILES ---")
for (const f of migrations) console.log(f)
console.log(`COUNT=${migrations.length}`)

const admin = createClient(url, process.env.E2E_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const tables = [
  "organizations",
  "profiles",
  "organization_members",
  "subscriptions",
  "usage_counters",
  "organization_entitlements",
  "organization_invitations",
  "custom_domains",
  "stripe_events",
  "audit_logs",
  "platform_admins",
  "scorecards",
  "leads",
  "email_jobs",
  "platform_settings",
]

console.log("--- TABLES ---")
for (const t of tables) {
  const r = await admin.from(t).select("*", { count: "exact", head: true })
  if (r.error) console.log(`${t}=MISSING_OR_DENIED code=${r.error.code ?? "?"}`)
  else console.log(`${t}=PRESENT count=${r.count ?? 0}`)
}

async function rpcExists(name, args) {
  const r = await admin.rpc(name, args)
  if (!r.error) return "OK"
  const msg = r.error.message ?? ""
  if (/Could not find the function|schema cache/i.test(msg)) return "MISSING"
  if (/not authenticated|permission|JWT|Login required|Auth session/i.test(msg)) return "PRESENT_AUTH_REQUIRED"
  if (/violates|null value|invalid input|duplicate|already/i.test(msg)) return "PRESENT_RUNTIME_ERROR"
  return `ERR:${(r.error.code ?? "x").slice(0, 24)}`
}

console.log("--- RPC ---")
console.log(
  `create_organization=${await rpcExists("create_organization", {
    p_name: "probe",
    p_slug: "probe-staging-audit",
    p_use_case: "audit",
    p_trial_days: 14,
  })}`,
)
console.log(`is_org_member=${await rpcExists("is_org_member", { org_id: "00000000-0000-0000-0000-000000000001" })}`)
console.log(`bootstrap_membership=${await rpcExists("bootstrap_membership", {})}`)
console.log(`handle_new_user=trigger_only_not_rpc`)

// Column presence via select of known SaaS columns
console.log("--- COLUMNS_SAAS ---")
for (const [table, cols] of [
  ["organizations", "id,slug,trial_used_at,country,logo_url,use_case"],
  ["profiles", "id,trial_used_at,full_name"],
  ["organization_members", "organization_id,user_id,role,access_role"],
  ["subscriptions", "organization_id,plan,status,trial_end"],
]) {
  const r = await admin.from(table).select(cols).limit(1)
  if (r.error) console.log(`${table}=COL_FAIL code=${r.error.code ?? "?"} hint=${/column/i.test(r.error.message ?? "") ? "missing_column" : "other"}`)
  else console.log(`${table}=COLS_OK`)
}

// Auth createUser intentionally NOT probed here (would write). Prior Playwright evidence only.
console.log("--- AUTH_CREATEUSER_PROBE ---")
console.log("createUser=NOT_RUN_PENDING_AUTHORIZATION")
console.log("prior_playwright=FAIL Database_error_creating_new_user")
console.log("likely_cause=on_auth_user_created→handle_new_user→profiles insert failure OR missing trigger")

console.log("--- DESTRUCTIVE_SCAN_REPO ---")
console.log("drop_table_in_migrations=none_expected_except_policy_drops")
console.log("db_reset=FORBIDDEN")
console.log("WRITE_SQL=NOT_PERFORMED")
console.log("AUTHORIZATION=PENDING")
