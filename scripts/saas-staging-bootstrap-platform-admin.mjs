/**
 * One-shot staging bootstrap: Auth user + profile + platform_admins.super_admin
 * Refuses ScorApp-XP / protect host. Never prints service-role secrets.
 *
 * Usage:
 *   node --experimental-strip-types --import ./test/register.mjs scripts/saas-staging-bootstrap-platform-admin.mjs tonyassiki05@gmail.com
 */
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

const STAGING = "hznmtadobqfhumezdgbh.supabase.co"
const PROTECT = "zkyjaslogpdujyeysjzw.supabase.co"

function load(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=")
    if (i <= 0 || line.startsWith("#")) continue
    const key = line.slice(0, i).trim()
    if (!key || process.env[key]) continue
    process.env[key] = line.slice(i + 1).trim()
  }
}

load(".env.e2e.local")

const email = (process.argv[2] || "").trim().toLowerCase()
if (!email || !email.includes("@")) {
  console.error("USAGE: …bootstrap-platform-admin.mjs <email>")
  process.exit(1)
}

const url = process.env.E2E_SUPABASE_URL
const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const host = new URL(url ?? "").host
const protectHost = (() => {
  try {
    return new URL(process.env.E2E_PROTECT_SUPABASE_URL ?? "").host
  } catch {
    return ""
  }
})()

console.log(`TARGET_HOST=${host}`)
console.log(`PROTECT_HOST=${protectHost || "missing"}`)
if (host !== STAGING) {
  console.error("REFUSED: not staging")
  process.exit(2)
}
if (host === PROTECT || protectHost === STAGING) {
  console.error("REFUSED: protect / XP conflict")
  process.exit(2)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

let userId = null
for (let page = 1; page <= 5; page++) {
  const listed = await admin.auth.admin.listUsers({ page, perPage: 200 })
  const hit = (listed.data?.users ?? []).find((u) => (u.email || "").toLowerCase() === email)
  if (hit) {
    userId = hit.id
    break
  }
  if ((listed.data?.users?.length ?? 0) < 200) break
}

const tempPassword = `Wa-${randomBytes(18).toString("base64url")}-Aa1!`

if (!userId) {
  const createdUser = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: "Tony Assiki" },
  })
  if (createdUser.error || !createdUser.data.user) {
    console.error(`CREATE_USER_FAIL=${createdUser.error?.message || "unknown"}`)
    process.exit(3)
  }
  userId = createdUser.data.user.id
  console.log("USER_CREATED=yes")
} else {
  const upd = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
    email_confirm: true,
  })
  if (upd.error) {
    console.error(`UPDATE_USER_FAIL=${upd.error.message}`)
    process.exit(3)
  }
  console.log("USER_CREATED=no")
  console.log("PASSWORD_ROTATED=yes")
}

const profile = await admin
  .from("profiles")
  .upsert({ id: userId, email, full_name: "Tony Assiki" }, { onConflict: "id" })
  .select("id, email")
  .maybeSingle()
if (profile.error) {
  console.error(`PROFILE_FAIL=${profile.error.message}`)
  process.exit(3)
}
console.log("PROFILE_OK=yes")

const grant = await admin.from("platform_admins").upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id" })
if (grant.error) {
  console.error(`GRANT_FAIL=${grant.error.message}`)
  process.exit(3)
}

const verify = await admin.from("platform_admins").select("user_id, role, created_at").eq("user_id", userId).maybeSingle()
if (verify.data?.role !== "super_admin") {
  console.error("GRANT_VERIFY_FAIL")
  process.exit(3)
}

console.log(`USER_ID=${userId}`)
console.log(`EMAIL=${email}`)
console.log(`ROLE=${verify.data.role}`)
console.log(`TEMP_PASSWORD=${tempPassword}`)
console.log("NOTE=Change this password after first login + MFA enroll. MFA was not disabled.")
console.log("DONE")
