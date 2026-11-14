/**
 * Whitelist: NEXT_PUBLIC_SUPABASE_URL must be ALLOWED_SUPABASE_REF only.
 * Require INTEGRATIONS_SECRET (length/format only — never print the value).
 * Loads .env.local for local runs; on Vercel uses process.env only.
 * Plain Node 22 — no TypeScript strip / register import.
 * Never prints secret values — hosts/refs only.
 */
import { existsSync, readFileSync } from "node:fs"
import {
  ALLOWED_SUPABASE_REF,
  assertAllowedSupabaseEnv,
  isDisallowedSupabaseError,
  supabaseRefFromUrl,
} from "../lib/env/allowed-supabase-ref.mjs"

const INTEGRATIONS_SECRET_MIN_LENGTH = 32

function loadDotEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i <= 0) continue
    const key = line.slice(0, i).trim()
    if (!key || process.env[key] !== undefined) continue
    let value = line.slice(i + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

/** Classify key format only — never print the value. */
function keyFormat(value) {
  const key = String(value ?? "").trim()
  if (!key) return "missing"
  if (key.startsWith("sb_publishable_")) return "sb_publishable"
  if (key.startsWith("sb_secret_")) return "sb_secret"
  if (key.startsWith("sb_temp_")) return "sb_temp"
  if (key.startsWith("sb_")) return "sb_other"
  const parts = key.split(".")
  if (parts.length === 3 && parts.every((p) => p.length > 0)) return "legacy_jwt"
  return "unknown"
}

function integrationsSecretMeta(value) {
  const key = String(value ?? "").trim()
  if (!key) return { status: "missing", format: "missing", length: 0 }
  let format = "opaque"
  if (/^[0-9a-f]+$/i.test(key) && key.length === 64) format = "hex64"
  else if (/^[0-9a-f]+$/i.test(key) && key.length >= INTEGRATIONS_SECRET_MIN_LENGTH) format = "hex"
  else if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(key) && key.length >= 43) format = "base64ish"
  if (key.length < INTEGRATIONS_SECRET_MIN_LENGTH) {
    return { status: "too_short", format, length: key.length }
  }
  return { status: "ok", format, length: key.length }
}

// Local Next loads .env.local; mirror that for predev/prebuild on the workstation.
if (!process.env.VERCEL) {
  loadDotEnv(".env.local")
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.SUPABASE_URL || ""
const ref = supabaseRefFromUrl(url)
const label = ref === ALLOWED_SUPABASE_REF ? "STAGING" : ref ? `OTHER(${ref})` : "MISSING"
const anonFmt = keyFormat(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const serviceFmt = keyFormat(process.env.SUPABASE_SERVICE_ROLE_KEY)
const integrations = integrationsSecretMeta(process.env.INTEGRATIONS_SECRET)

console.log(`check-env: database=${label}`)
console.log(`check-env: ALLOWED_SUPABASE_REF=${ALLOWED_SUPABASE_REF}`)
console.log(`check-env: NEXT_PUBLIC_SUPABASE_ANON_KEY_FORMAT=${anonFmt}`)
console.log(`check-env: SUPABASE_SERVICE_ROLE_KEY_FORMAT=${serviceFmt}`)
console.log(
  `check-env: INTEGRATIONS_SECRET_STATUS=${integrations.status} FORMAT=${integrations.format} LENGTH=${integrations.length}`,
)

if (integrations.status === "missing") {
  console.error("")
  console.error("check-env FAIL: INTEGRATIONS_SECRET is missing.")
  console.error(`  Required: min ${INTEGRATIONS_SECRET_MIN_LENGTH} characters (prefer 64 hex from openssl rand -hex 32).`)
  console.error("  Set in .env.local, .env.e2e.local, and Vercel Production + Preview (Secret).")
  console.error("")
  process.exit(1)
}

if (integrations.status === "too_short") {
  console.error("")
  console.error(
    `check-env FAIL: INTEGRATIONS_SECRET is too short (LENGTH=${integrations.length}, min ${INTEGRATIONS_SECRET_MIN_LENGTH}).`,
  )
  console.error("  Prefer: openssl rand -hex 32  → 64 hex characters.")
  console.error("")
  process.exit(1)
}

try {
  assertAllowedSupabaseEnv(process.env)
} catch (error) {
  console.error("")
  if (isDisallowedSupabaseError(error)) {
    console.error(`check-env FAIL: ${error.message}`)
  } else {
    console.error(`check-env FAIL: ${error instanceof Error ? error.message : "supabase URL check failed"}`)
  }
  console.error(`  This repo may only use https://${ALLOWED_SUPABASE_REF}.supabase.co`)
  console.error("")
  process.exit(1)
}

// --- Email provider (circuit B): presence/format only — never print values ---
const emailProviderRaw = String(process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase()
const emailProvider = emailProviderRaw === "brevo" ? "brevo" : "smtp"

function emailShaped(value) {
  const v = String(value ?? "").trim()
  if (!v) return "missing"
  return v.includes("@") && v.indexOf("@") > 0 && v.indexOf("@") < v.length - 1 ? "email_shaped" : "invalid"
}

function hostShaped(value) {
  const v = String(value ?? "").trim()
  if (!v) return "missing"
  return /^[A-Za-z0-9.-]+$/.test(v) ? "hostname" : "invalid"
}

function portShaped(value) {
  const v = String(value ?? "").trim()
  if (!v) return "missing"
  const n = Number(v)
  return Number.isInteger(n) && n > 0 && n <= 65535 ? "port" : "invalid"
}

function presentOpaque(value) {
  const v = String(value ?? "").trim()
  if (!v) return { status: "missing", format: "missing", length: 0 }
  return { status: "ok", format: "opaque", length: v.length }
}

function numericOrEmpty(value, label) {
  const v = String(value ?? "").trim()
  if (!v) return { status: "default", format: "empty" }
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return { status: "invalid", format: "not_positive_number" }
  return { status: "ok", format: "positive_number" }
}

const smtpHost = hostShaped(process.env.SMTP_HOST)
const smtpPort = portShaped(process.env.SMTP_PORT)
const smtpUser = presentOpaque(process.env.SMTP_USER)
const smtpPassword = presentOpaque(process.env.SMTP_PASSWORD)
const emailFrom = emailShaped(process.env.EMAIL_FROM)
const emailFromName = presentOpaque(process.env.EMAIL_FROM_NAME)
const dailyLimit = numericOrEmpty(process.env.EMAIL_DAILY_LIMIT, "EMAIL_DAILY_LIMIT")
const ratePerMinute = numericOrEmpty(process.env.EMAIL_RATE_PER_MINUTE, "EMAIL_RATE_PER_MINUTE")

console.log(`check-env: EMAIL_PROVIDER=${emailProvider}`)
console.log(`check-env: SMTP_HOST_FORMAT=${smtpHost}`)
console.log(`check-env: SMTP_PORT_FORMAT=${smtpPort}`)
console.log(`check-env: SMTP_USER_STATUS=${smtpUser.status} LENGTH=${smtpUser.length}`)
console.log(`check-env: SMTP_PASSWORD_STATUS=${smtpPassword.status} LENGTH=${smtpPassword.length}`)
console.log(`check-env: EMAIL_FROM_FORMAT=${emailFrom}`)
console.log(`check-env: EMAIL_FROM_NAME_STATUS=${emailFromName.status}`)
console.log(`check-env: EMAIL_DAILY_LIMIT_STATUS=${dailyLimit.status} FORMAT=${dailyLimit.format}`)
console.log(`check-env: EMAIL_RATE_PER_MINUTE_STATUS=${ratePerMinute.status} FORMAT=${ratePerMinute.format}`)

if (emailProvider === "smtp") {
  const smtpProblems = []
  if (smtpHost === "missing" || smtpHost === "invalid") smtpProblems.push(`SMTP_HOST(${smtpHost})`)
  if (smtpPort === "missing" || smtpPort === "invalid") smtpProblems.push(`SMTP_PORT(${smtpPort})`)
  if (smtpUser.status !== "ok") smtpProblems.push("SMTP_USER(missing)")
  if (smtpPassword.status !== "ok") smtpProblems.push("SMTP_PASSWORD(missing)")
  if (emailFrom === "missing" || emailFrom === "invalid") smtpProblems.push(`EMAIL_FROM(${emailFrom})`)
  if (dailyLimit.status === "invalid") smtpProblems.push("EMAIL_DAILY_LIMIT(invalid)")
  if (ratePerMinute.status === "invalid") smtpProblems.push("EMAIL_RATE_PER_MINUTE(invalid)")
  if (smtpProblems.length) {
    console.error("")
    console.error("check-env FAIL: EMAIL_PROVIDER=smtp requires valid SMTP settings (values never printed).")
    console.error(`  Issues: ${smtpProblems.join(", ")}`)
    console.error("  Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM in .env.local / Vercel.")
    console.error("  Or set EMAIL_PROVIDER=brevo to use the legacy Brevo API path.")
    console.error("")
    process.exit(1)
  }
}

console.log("check-env OK: staging whitelist")
process.exit(0)
