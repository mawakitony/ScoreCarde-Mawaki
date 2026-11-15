/**
 * Authz probe: user B must not finish onboarding on user A's organization.
 * Staging hzn only. Never prints secrets. Cleans up E2E_PREFIX users/orgs.
 */
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

function load(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=")
    if (i <= 0 || line.startsWith("#")) continue
    const k = line.slice(0, i).trim()
    if (!k || process.env[k]) continue
    process.env[k] = line.slice(i + 1).trim()
  }
}

function host(u) {
  try {
    return new URL(u).host
  } catch {
    return "INVALID"
  }
}

load(".env.e2e.local")
const STAGING = "hznmtadobqfhumezdgbh.supabase.co"
const url = (process.env.E2E_SUPABASE_URL || "").trim()
const service = (process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || "").trim()
const anon = (process.env.E2E_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
const prefix = (process.env.E2E_PREFIX || "").trim()
if (host(url) !== STAGING || !service || !anon || !/^E2E-WOLOYEM-\d+$/.test(prefix)) {
  console.error("ABORT=wrong_target_or_missing_env")
  process.exit(2)
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const suffix = randomBytes(3).toString("hex")
const emailA = `${prefix.toLowerCase()}-authz-a-${suffix}@example.test`
const emailB = `${prefix.toLowerCase()}-authz-b-${suffix}@example.test`
const password = `Authz-${suffix}-Aa1!`
const slug = `${prefix.toLowerCase()}-authz-${suffix}`.replace(/[^a-z0-9-]/g, "-")

let userA = null
let userB = null
let orgId = null

async function cleanup() {
  if (orgId) {
    await admin.from("organization_sensitive").delete().eq("organization_id", orgId)
    await admin.from("subscriptions").delete().eq("organization_id", orgId)
    await admin.from("organization_members").delete().eq("organization_id", orgId)
    await admin.from("audit_logs").delete().eq("organization_id", orgId)
    await admin.from("organizations").delete().eq("id", orgId)
  }
  if (userA) await admin.auth.admin.deleteUser(userA)
  if (userB) await admin.auth.admin.deleteUser(userB)
}

try {
  const a = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true })
  const b = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true })
  if (a.error || b.error) throw a.error || b.error
  userA = a.data.user.id
  userB = b.data.user.id
  await admin.from("profiles").upsert([
    { id: userA, email: emailA, full_name: "Authz A" },
    { id: userB, email: emailB, full_name: "Authz B" },
  ])

  const clientA = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const loginA = await clientA.auth.signInWithPassword({ email: emailA, password })
  if (loginA.error) throw loginA.error

  const created = await clientA.rpc("create_organization", {
    p_name: `Authz Org ${suffix}`,
    p_slug: slug,
    p_use_case: "formation",
    p_trial_days: 14,
  })
  if (created.error || !created.data) throw created.error || new Error("missing_org")
  orgId = created.data

  const clientB = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const loginB = await clientB.auth.signInWithPassword({ email: emailB, password })
  if (loginB.error) throw loginB.error

  const denied = await clientB.rpc("finish_organization_onboarding", {
    p_organization_id: orgId,
    p_country: "TG",
    p_city: "Lomé",
    p_sector: "formation",
    p_sector_other: "",
    p_headcount_band: "2-10",
    p_currency: "XOF",
    p_primary_objective: "evaluer_competences",
    p_referral_source: "",
    p_website: "",
    p_timezone: "Africa/Lome",
    p_language: "fr",
    p_use_case: "formation",
    p_job_title: "dirigeant",
    p_phone_e164: "+22890123456",
    p_legal_id: "",
    p_legal_id_type: "OTHER",
  })

  const msg = (denied.error?.message || "").toLowerCase()
  const ok = Boolean(denied.error) && (msg.includes("permission") || msg.includes("refus"))
  console.log(`AUTHZ_CROSS_ORG error=${denied.error ? "yes" : "no"}`)
  console.log(`AUTHZ_CROSS_ORG message_kind=${ok ? "permission_refused" : "unexpected"}`)
  console.log(ok ? "AUTHZ_TEST=PASS" : "AUTHZ_TEST=FAIL")
  if (!ok) process.exitCode = 1
} catch (e) {
  console.log("AUTHZ_TEST=FAIL")
  console.log(`ERR=${e?.message ?? String(e)}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
