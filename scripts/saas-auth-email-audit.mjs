/**
 * One-shot Auth email readiness audit for staging.
 * Never loops signups. Never prints secrets. Refuses ScorApp-XP.
 *
 * Usage:
 *   node --experimental-strip-types --import ./test/register.mjs scripts/saas-auth-email-audit.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

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
load(".env.local")

function hostOf(value) {
  try {
    return new URL(value ?? "").host
  } catch {
    return ""
  }
}

const e2eHost = hostOf(process.env.E2E_SUPABASE_URL)
const appHost = hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL)
const protectHost = hostOf(process.env.E2E_PROTECT_SUPABASE_URL)

console.log("--- TARGET ---")
console.log(`E2E_HOST=${e2eHost || "MISSING"}`)
console.log(`APP_HOST=${appHost || "MISSING"}`)
console.log(`PROTECT_HOST=${protectHost || "MISSING"}`)

if (e2eHost !== STAGING || appHost !== STAGING) {
  console.error("REFUSED: audit must target woloyem-score-staging only")
  process.exit(2)
}
if (e2eHost === PROTECT || protectHost === STAGING) {
  console.error("REFUSED: ScorApp-XP / protect conflict")
  process.exit(2)
}

console.log("--- APP_TRANSACTIONAL_EMAIL ---")
for (const key of ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME"]) {
  console.log(`${key}=${process.env[key]?.trim() ? "SET" : "MISSING"}`)
}
console.log("NOTE=Brevo API key powers email_jobs (invites, billing). Auth confirmation needs Dashboard SMTP (smtp-relay.brevo.com + SMTP key, not API key). See docs/saas/brevo-staging-setup.md")

console.log("--- AUTH_SIGNUP_PROBE (single attempt) ---")
const anon = createClient(process.env.E2E_SUPABASE_URL, process.env.E2E_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const email = `woloyem.audit.${Date.now()}@inbox.testmail.app`
const password = "Audit-Auth1!"
const { data, error } = await anon.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: "Auth Audit" },
    emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fonboarding",
  },
})

const err = error?.message ?? ""
const rateLimited = /rate limit/i.test(err)
const invalidEmail = /email address.*invalid/i.test(err)
const smtpSendFailed = /error sending confirmation email|error sending.*email|smtp/i.test(err)
console.log(`PROBE_ERROR=${err || "none"}`)
console.log(`RATE_LIMITED=${rateLimited ? "yes" : "no"}`)
console.log(`INVALID_EMAIL_DOMAIN=${invalidEmail ? "yes" : "no"}`)
console.log(`SMTP_SEND_FAILED=${smtpSendFailed ? "yes" : "no"}`)
console.log(`USER_CREATED=${data?.user ? "yes" : "no"}`)
console.log(`SESSION_IMMEDIATE=${data?.session ? "yes" : "no"}`)
console.log(`EMAIL_CONFIRMED=${data?.user?.email_confirmed_at ? "yes" : "no"}`)

console.log("--- INTERPRETATION ---")
if (rateLimited) {
  console.log("DECISION=BLOCKED_AUTH_EMAIL_RATE_LIMIT")
  console.log("CAUSE=Supabase built-in Auth mailer quota (free/default) exhausted.")
  console.log("FIX=Dashboard → Project Settings → Authentication → SMTP Settings → enable custom SMTP (Brevo recommended).")
  console.log("DO_NOT=Disable Confirm email. Do not loop signUp.")
  process.exit(3)
}
if (smtpSendFailed) {
  console.log("DECISION=BLOCKED_AUTH_SMTP_SEND")
  console.log("CAUSE=Custom SMTP path is engaged (no built-in rate-limit), but confirmation email send failed.")
  console.log("FIX=Staging SMTP Settings: host smtp-relay.brevo.com, port 587, SMTP login + SMTP key (not API key), verified sender email matching Brevo.")
  console.log("CHECK=Brevo → Transactional → Logs / SMTP errors; Confirm email stays ON.")
  console.log("DO_NOT=Disable Confirm email. Do not loop signUp.")
  process.exit(3)
}
if (invalidEmail) {
  console.log("DECISION=BLOCKED_EMAIL_VALIDATION")
  console.log("CAUSE=Auth rejects this mailbox domain (e.g. example.com).")
  console.log("FIX=Use a real-looking domain for tests; keep Confirm email ON.")
  process.exit(3)
}
if (!data?.user) {
  console.log("DECISION=BLOCKED_SIGNUP_FAILED")
  process.exit(3)
}
if (data.session) {
  console.log("DECISION=WARN_CONFIRM_EMAIL_MAY_BE_OFF")
  console.log("NOTE=Immediate session usually means Confirm email is disabled — not desired for production-like staging.")
} else {
  console.log("DECISION=AUTH_SIGNUP_ACCEPTS_MAIL")
  console.log("NOTE=Confirm email appears ON. Delivery still depends on Auth SMTP (built-in or custom).")
}

console.log("--- DURABLE_SMTP_CHECKLIST ---")
console.log("1. Brevo (or Resend): create SMTP user + sender domain with SPF/DKIM.")
console.log("2. Supabase staging → Authentication → SMTP: host/port/user/pass/sender.")
console.log("3. Keep Confirm email ENABLED.")
console.log("4. Keep rate limits ENABLED; raise only via custom SMTP capacity.")
console.log("5. App invites stay on email_jobs + BREVO_API_KEY (separate from Auth).")
console.log("6. UX: surface Auth rate-limit errors clearly (see actions/auth.ts).")
process.exit(0)
