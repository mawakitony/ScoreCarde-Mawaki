/**
 * Post-migration validation on staging only. Creates then deletes a probe user/org.
 * Never targets ScorApp-XP. Prints no secrets.
 */
import { readFileSync, existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "node:crypto"

const STAGING_HOST = "hznmtadobqfhumezdgbh.supabase.co"
const PROTECT_HOST = "zkyjaslogpdujyeysjzw.supabase.co"
const DAY_MS = 24 * 60 * 60 * 1000

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

function host(value) {
  try {
    return new URL(value).host
  } catch {
    return ""
  }
}

const url = process.env.E2E_SUPABASE_URL?.trim() ?? ""
const anon = process.env.E2E_SUPABASE_ANON_KEY?.trim() ?? ""
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""
if (host(url) !== STAGING_HOST) {
  console.error("REFUSED: not staging")
  process.exit(2)
}
if (host(url) === PROTECT_HOST) {
  console.error("REFUSED: protect")
  process.exit(2)
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const results = {}

async function mark(name, ok, detail = "") {
  results[name] = ok ? "PASS" : "FAIL"
  console.log(`${name}=${ok ? "PASS" : "FAIL"}${detail ? ` ${detail}` : ""}`)
}

// Tables
for (const t of ["organizations", "profiles", "organization_members", "subscriptions"]) {
  const r = await admin.from(t).select("id").limit(1)
  await mark(`table_${t}`, !r.error, r.error ? r.error.code : "")
}

// RPCs existence
{
  const r = await admin.rpc("is_org_member", { org_id: "00000000-0000-0000-0000-000000000001" })
  const missing = /Could not find the function|schema cache/i.test(r.error?.message ?? "")
  await mark("rpc_is_org_member", !missing, missing ? "MISSING" : r.error ? "PRESENT" : "OK")
}
{
  const r = await admin.rpc("create_organization", {
    p_name: "x",
    p_slug: "x",
    p_use_case: "x",
    p_trial_days: 14,
  })
  const missing = /Could not find the function|schema cache/i.test(r.error?.message ?? "")
  await mark("rpc_create_organization", !missing, missing ? "MISSING" : "PRESENT")
}

// Auth + org + trial
const suffix = randomBytes(4).toString("hex")
const email = `e2e-validate-${suffix}@example.com`
const password = `Val-${suffix}-Aa1!`
const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "E2E Validate" },
})
await mark("auth_createUser", !created.error && Boolean(created.data.user), created.error ? "ERR" : "")

let userId = created.data.user?.id ?? null
let orgId = null
try {
  if (userId) {
    const profile = await admin.from("profiles").select("id").eq("id", userId).maybeSingle()
    await mark("auth_profile_trigger", Boolean(profile.data?.id), profile.error ? profile.error.code : "")

    const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
    const signed = await userClient.auth.signInWithPassword({ email, password })
    await mark("auth_signIn", !signed.error)

    if (!signed.error) {
      const org = await userClient.rpc("create_organization", {
        p_name: `Validate ${suffix}`,
        p_slug: `validate-${suffix}`,
        p_use_case: "staging-validate",
        p_trial_days: 14,
      })
      await mark("org_create", !org.error && Boolean(org.data), org.error ? "ERR" : "")
      orgId = typeof org.data === "string" ? org.data : null

      if (orgId) {
        const member = await admin
          .from("organization_members")
          .select("role,access_role")
          .eq("organization_id", orgId)
          .eq("user_id", userId)
          .maybeSingle()
        const isOwner = member.data?.role === "owner"
        await mark("org_owner_role", isOwner)

        const sub = await admin
          .from("subscriptions")
          .select("status,trial_end,plan")
          .eq("organization_id", orgId)
          .maybeSingle()
        const trialOk =
          sub.data?.status === "trialing" &&
          sub.data?.trial_end &&
          Date.parse(sub.data.trial_end) - Date.now() > 13 * DAY_MS &&
          Date.parse(sub.data.trial_end) - Date.now() < 15 * DAY_MS
        await mark("trial_14_days", Boolean(trialOk), sub.data ? `${sub.data.status}` : "NO_SUB")

        // RLS: another fresh user must not see org rows
        const otherEmail = `e2e-other-${suffix}@example.com`
        const other = await admin.auth.admin.createUser({
          email: otherEmail,
          password,
          email_confirm: true,
        })
        if (!other.error && other.data.user) {
          const otherClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
          await otherClient.auth.signInWithPassword({ email: otherEmail, password })
          const leak = await otherClient.from("organizations").select("id").eq("id", orgId)
          await mark("rls_org_isolation", !leak.error && (leak.data?.length ?? 0) === 0)
          await admin.auth.admin.deleteUser(other.data.user.id)
        } else {
          await mark("rls_org_isolation", false, "OTHER_USER_CREATE_FAIL")
        }
      }
    }
  }
} finally {
  if (orgId) {
    await admin.from("subscriptions").delete().eq("organization_id", orgId)
    await admin.from("organization_members").delete().eq("organization_id", orgId)
    await admin.from("audit_logs").delete().eq("organization_id", orgId)
    await admin.from("organizations").delete().eq("id", orgId)
  }
  if (userId) await admin.auth.admin.deleteUser(userId)
  console.log("CLEANUP=DONE")
}

const failed = Object.values(results).filter((v) => v === "FAIL").length
console.log(`SUMMARY_FAILS=${failed}`)
process.exit(failed ? 1 : 0)
