import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

const text = readFileSync(".env.local", "utf8")
for (const line of text.split(/\r?\n/)) {
  const i = line.indexOf("=")
  if (i <= 0 || line.startsWith("#")) continue
  const k = line.slice(0, i)
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const orgId = "00000000-0000-4000-8000-000000000001"
const org = await admin.from("organizations").select("id,name,slug").eq("id", orgId).maybeSingle()
console.log("org", org.data)

const sub = await admin.from("subscriptions").select("plan,status").eq("organization_id", orgId).maybeSingle()
console.log("subscription", sub.data, sub.error?.message || "")

const ents = await admin.from("organization_entitlements").select("feature,enabled,limit_override").eq("organization_id", orgId)
console.log("ents", ents.data)

const periodStart = new Date()
const start = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1)).toISOString().slice(0, 10)
const usage = await admin.from("usage_counters").select("metric,value,period_start").eq("organization_id", orgId).eq("period_start", start)
console.log("usage", usage.data)

const members = await admin.from("organization_members").select("user_id,role").eq("organization_id", orgId)
for (const m of members.data || []) {
  const u = await admin.auth.admin.getUserById(m.user_id)
  const email = u.data.user?.email || "?"
  const masked = email.replace(/(.{2}).+(@.+)/, "$1***$2")
  console.log("member", m.role, masked, m.user_id)
}

// Recent AI Assist orgs
const aiOrgs = await admin.from("organizations").select("id,name,slug").ilike("name", "AI Assist%").order("created_at", { ascending: false }).limit(5)
for (const o of aiOrgs.data || []) {
  const s = await admin.from("subscriptions").select("plan,status").eq("organization_id", o.id).maybeSingle()
  const e = await admin.from("organization_entitlements").select("feature,enabled,limit_override").eq("organization_id", o.id)
  const mem = await admin.from("organization_members").select("user_id,role").eq("organization_id", o.id)
  console.log("AIORG", o.name, "sub", s.data, "ents", e.data?.length, "members", mem.data?.length)
}
