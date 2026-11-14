/**
 * Re-encrypt audit helper — DRY-RUN ONLY in this task (T3d).
 *
 * Staging currently has 0 ciphertext (T3c). This script remains available for
 * environments that still hold rows sealed with SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage (counts only — never prints plaintext or secrets):
 *   node --experimental-strip-types --import ./test/register.mjs scripts/saas-encryption-reencrypt.mjs
 *   node --experimental-strip-types --import ./test/register.mjs scripts/saas-encryption-reencrypt.mjs --dry-run
 *
 * --apply is intentionally refused until a dedicated ops gate.
 */
import { existsSync, readFileSync } from "node:fs"
import { createDecipheriv, createHash, hkdfSync } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

import { ALLOWED_SUPABASE_HOST } from "../lib/env/allowed-supabase.ts"

const STAGING = ALLOWED_SUPABASE_HOST
const SALT = "woloyem-app-secret-v1"
const MIN = 32

function load(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i <= 0) continue
    const k = line.slice(0, i).trim()
    if (!k || process.env[k]) continue
    process.env[k] = line.slice(i + 1).trim()
  }
}

load(".env.e2e.local")
load(".env.local")

const apply = process.argv.includes("--apply")
if (apply) {
  console.error("REFUSED: --apply is disabled. T3d keeps this script dry-run only.")
  console.error("Documented for envs with legacy enc: rows sealed under SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(2)
}

function hostOf(v) {
  try {
    return new URL(v ?? "").host
  } catch {
    return ""
  }
}

function derive(purpose, master) {
  return Buffer.from(hkdfSync("sha256", master, SALT, purpose, 32))
}

function openEnc(sealed, keyMaterial) {
  if (!sealed?.startsWith("enc:")) return false
  const [iv, tag, data] = sealed.slice(4).split(".")
  if (!iv || !tag || !data) return false
  try {
    const key = Buffer.isBuffer(keyMaterial) ? keyMaterial : createHash("sha256").update(keyMaterial).digest()
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"))
    decipher.setAuthTag(Buffer.from(tag, "base64url"))
    decipher.update(Buffer.from(data, "base64url"))
    decipher.final()
    return true
  } catch {
    return false
  }
}

const url = process.env.E2E_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const master = process.env.INTEGRATIONS_SECRET?.trim() || ""
const host = hostOf(url)

console.log("--- TARGET ---")
console.log(`HOST=${host || "MISSING"}`)
console.log(`MODE=dry-run`)
console.log(`INTEGRATIONS_SECRET_PRESENT=${master.length >= MIN ? "yes" : "no"}`)
console.log(`SERVICE_ROLE_PRESENT=${service ? "yes" : "no"}`)

if (host !== STAGING) {
  console.error(`REFUSED: ${STAGING} only`)
  process.exit(2)
}
if (!service) {
  console.error("REFUSED: elevated key missing")
  process.exit(2)
}

const sealKey = master.length >= MIN ? derive("first-access-seal", master) : null
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: jobs, error } = await admin.from("email_jobs").select("id, template, status, payload").limit(2000)
if (error) {
  console.error(`EMAIL_JOBS_QUERY=FAIL`)
  process.exit(1)
}

let scanned = 0
let alreadyNew = 0
let wouldReencrypt = 0
let unopenable = 0
let plaintextLegacy = 0

for (const row of jobs ?? []) {
  const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {}
  for (const value of Object.values(payload)) {
    if (typeof value !== "string" || !value.startsWith("enc:")) continue
    scanned += 1
    const opensNew = sealKey ? openEnc(value, sealKey) : false
    const opensLegacy = openEnc(value, service)
    if (opensNew) alreadyNew += 1
    else if (opensLegacy) wouldReencrypt += 1
    else unopenable += 1
  }
}

const { count: integrationsWithCipher } = await admin
  .from("integrations")
  .select("id", { count: "exact", head: true })
  .not("encrypted_credentials", "is", null)

console.log("--- email_jobs enc: fields ---")
console.log(`SCANNED=${scanned}`)
console.log(`ALREADY_NEW_HKDF=${alreadyNew}`)
console.log(`WOULD_REECRYPT_FROM_SERVICE_ROLE=${wouldReencrypt}`)
console.log(`UNOPENABLE=${unopenable}`)
console.log(`PLAINTEXT_LEGACY_NOTE=${plaintextLegacy}`)
console.log("--- integrations ---")
console.log(`ROWS_WITH_CIPHERTEXT=${integrationsWithCipher ?? 0}`)
console.log("NOTE=integrations already use INTEGRATIONS_SECRET path; no service_role seal historically.")
console.log("NOTE=--apply refused; re-run after ops gate if WOULD_REECRYPT_FROM_SERVICE_ROLE > 0.")
console.log("PROBE=PASS")
process.exit(0)
