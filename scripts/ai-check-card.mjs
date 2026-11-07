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
const id = "d1d5ddc7-0238-4894-b4c2-fdd41bcb3a7e"
const q = await admin.from("questions").select("id,title", { count: "exact" }).eq("scorecard_id", id)
const c = await admin.from("question_categories").select("id,name", { count: "exact" }).eq("scorecard_id", id)
const r = await admin.from("result_ranges").select("id,label", { count: "exact" }).eq("scorecard_id", id)
const sc = await admin.from("scoring_categories").select("id,name", { count: "exact" }).eq("scorecard_id", id)
console.log({
  questions: q.count,
  categories: c.count,
  ranges: r.count,
  scoring: sc.count,
  qtitles: (q.data || []).map((x) => x.title).slice(0, 12),
  cats: (c.data || []).map((x) => x.name),
  rangesLabels: (r.data || []).map((x) => x.label),
})
