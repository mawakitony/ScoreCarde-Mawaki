import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.log("RESULT: FAIL missing_supabase")
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const orgs = await admin.from("organizations").select("id,name,slug,created_at").order("created_at", { ascending: false }).limit(30)
if (orgs.error) {
  console.log("orgs_error")
  process.exit(1)
}

for (const o of orgs.data || []) {
  console.log("ORG", o.id, "|", o.name, "|", o.slug)
}

// Prefer WOLOYEM / non-E2E org that looks primary; also show E2E orgs
const target = (orgs.data || []).find((o) => /woloyem/i.test(o.name || "") && !/^E2E/i.test(o.name || ""))
  || (orgs.data || [])[0]

if (!target) {
  console.log("RESULT: FAIL no_org")
  process.exit(1)
}

console.log("TARGET_ORG", target.id, "|", target.name)

const sub = await admin.from("organization_subscriptions").select("*").eq("organization_id", target.id).maybeSingle()
console.log("subscription_status:", sub.data?.status || "none")
console.log("subscription_plan:", sub.data?.plan_key || sub.data?.plan || "none")

const ents = await admin.from("organization_entitlements").select("feature,enabled,limit_override").eq("organization_id", target.id)
console.log("entitlements_count:", (ents.data || []).length)
for (const e of ents.data || []) {
  if (e.feature === "ai" || e.feature === "ai_generations") {
    console.log("ENT", e.feature, "enabled=", e.enabled, "limit=", e.limit_override)
  }
}

const aiEnt = (ents.data || []).find((e) => e.feature === "ai")
console.log("feature_ai:", aiEnt ? (aiEnt.enabled ? "enabled" : "disabled") : "default_from_plan")

const now = new Date()
const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
const usage = await admin.from("organization_usage").select("*").eq("organization_id", target.id).eq("period_start", start).maybeSingle()
const used = usage.data?.ai_generations ?? usage.data?.metrics?.ai_generations ?? null
console.log("usage_row:", usage.data ? "present" : "absent")
console.log("ai_generations_used_raw_keys:", usage.data ? Object.keys(usage.data).join(",") : "n/a")
if (usage.data) {
  for (const [k, v] of Object.entries(usage.data)) {
    if (/ai/i.test(k)) console.log("usage_field", k, "=", v)
  }
}

const members = await admin.from("organization_members").select("user_id,role").eq("organization_id", target.id)
console.log("members:", (members.data || []).map((m) => `${m.role}:${m.user_id}`).join(" | "))

for (const m of members.data || []) {
  const user = await admin.auth.admin.getUserById(m.user_id)
  const email = user.data.user?.email || "?"
  console.log("MEMBER", m.role, email.replace(/(.{2}).+(@.+)/, "$1***$2"))
}
