/**
 * Guard: refuse ScorApp-XP (zky…) unless ALLOW_XP=1.
 * Require INTEGRATIONS_SECRET (length/format only — never print the value).
 * Loads .env.local for local runs; on Vercel uses process.env only.
 * Never prints secret values — hosts/refs only.
 */
import { existsSync, readFileSync } from "node:fs"

const XP_REF = "zkyjaslogpdujyeysjzw"
const STAGING_REF = "hznmtadobqfhumezdgbh"
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

function hostOf(value) {
  try {
    return new URL(String(value ?? "")).host
  } catch {
    return ""
  }
}

function refOf(value) {
  const host = hostOf(value)
  const m = host.match(/^([a-z0-9-]+)\.supabase\.co$/i)
  return m ? m[1] : host || ""
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const ref = refOf(url)
const allowXp = process.env.ALLOW_XP === "1"
const label =
  ref === STAGING_REF ? "STAGING" : ref === XP_REF ? "XP" : ref ? `OTHER(${ref})` : "MISSING"
const anonFmt = keyFormat(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const serviceFmt = keyFormat(process.env.SUPABASE_SERVICE_ROLE_KEY)
const integrations = integrationsSecretMeta(process.env.INTEGRATIONS_SECRET)

console.log(`check-env: database=${label}`)
console.log(`check-env: NEXT_PUBLIC_SUPABASE_ANON_KEY_FORMAT=${anonFmt}`)
console.log(`check-env: SUPABASE_SERVICE_ROLE_KEY_FORMAT=${serviceFmt}`)
console.log(
  `check-env: INTEGRATIONS_SECRET_STATUS=${integrations.status} FORMAT=${integrations.format} LENGTH=${integrations.length}`,
)

if (!url) {
  console.error("check-env FAIL: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is missing.")
  process.exit(1)
}

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

if (ref === XP_REF && !allowXp) {
  console.error("")
  console.error("check-env FAIL: this workspace is pointing at ScorApp-XP (zkyjaslogpdujyeysjzw).")
  console.error("WOLOYEM Score default is staging (hznmtadobqfhumezdgbh).")
  console.error("")
  console.error("Fix:")
  console.error("  • Put staging keys in .env.local  (see .env.e2e.local / docs)")
  console.error("  • Or run XP explicitly:  npm run dev:xp  (sets ALLOW_XP=1 + .env.xp.local)")
  console.error("")
  process.exit(1)
}

if (ref === XP_REF && allowXp) {
  console.log("check-env OK: XP allowed via ALLOW_XP=1")
  process.exit(0)
}

if (ref === STAGING_REF) {
  console.log("check-env OK: staging")
  process.exit(0)
}

console.log(`check-env OK: non-XP host (${label})`)
process.exit(0)
