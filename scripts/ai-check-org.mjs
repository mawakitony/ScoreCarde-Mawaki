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

const orgId = process.argv[2]
if (!orgId) {
  console.log("usage: node scripts/ai-check-org.mjs <orgId>")
  process.exit(1)
}
const cards = await admin.from("scorecards").select("id,name,status").eq("organization_id", orgId)
console.log("cards", cards.data)
for (const card of cards.data || []) {
  const q = await admin.from("questions").select("id", { count: "exact", head: true }).eq("scorecard_id", card.id)
  const c = await admin.from("question_categories").select("id", { count: "exact", head: true }).eq("scorecard_id", card.id)
  const r = await admin.from("result_ranges").select("id", { count: "exact", head: true }).eq("scorecard_id", card.id)
  console.log(card.id, card.status, "q", q.count, "cats", c.count, "ranges", r.count)
}
const audits = await admin.from("audit_logs").select("action,metadata,created_at").eq("organization_id", orgId).eq("action", "ai.action_executed")
console.log("ai_audits", audits.data)
const leads = await admin.from("leads").select("id").eq("organization_id", orgId)
const leadIds = (leads.data || []).map((l) => l.id)
if (leadIds.length) {
  const tags = await admin.from("lead_tag_assignments").select("lead_id,tag_id").in("lead_id", leadIds)
  console.log("tag_assignments", tags.data)
}
