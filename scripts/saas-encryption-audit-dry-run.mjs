/**
 * Dry-run encryption inventory on staging only.
 * Counts which seal material opens ciphertext — never prints secrets or plaintext.
 *
 * Usage:
 *   node --experimental-strip-types --import ./test/register.mjs scripts/saas-encryption-audit-dry-run.mjs
 */
import { existsSync, readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

import { ALLOWED_SUPABASE_HOST } from "../lib/env/allowed-supabase.ts"

const STAGING = ALLOWED_SUPABASE_HOST

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

function hostOf(v) {
  try {
    return new URL(v ?? "").host
  } catch {
    return ""
  }
}

function openEnc(sealed, secret) {
  if (!sealed?.startsWith("enc:") || !secret) return false
  const [iv, tag, data] = sealed.slice(4).split(".")
  if (!iv || !tag || !data) return false
  try {
    const key = createHash("sha256").update(secret).digest()
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"))
    decipher.setAuthTag(Buffer.from(tag, "base64url"))
    decipher.update(Buffer.from(data, "base64url"))
    decipher.final()
    return true
  } catch {
    return false
  }
}

function openPacked(packed, secret) {
  if (!packed || !secret || packed.startsWith("enc:")) return false
  const [ivRaw, tagRaw, dataRaw] = packed.split(".")
  if (!ivRaw || !tagRaw || !dataRaw) return false
  try {
    const key = createHash("sha256").update(secret).digest()
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64url"))
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"))
    decipher.update(Buffer.from(dataRaw, "base64url"))
    decipher.final()
    return true
  } catch {
    return false
  }
}

const url = process.env.E2E_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const integrationsSecret = process.env.INTEGRATIONS_SECRET?.trim() || ""
const host = hostOf(url)

console.log("--- TARGET ---")
console.log(`HOST=${host || "MISSING"}`)
console.log(`INTEGRATIONS_SECRET_PRESENT=${integrationsSecret ? "yes" : "no"}`)
console.log(`SERVICE_ROLE_PRESENT=${service ? "yes" : "no"}`)
console.log("MODE=dry-run")

if (host !== STAGING) {
  console.error(`REFUSED: audit must target ${STAGING} only`)
  process.exit(2)
}
if (!service) {
  console.error("REFUSED: elevated key missing")
  process.exit(2)
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- integrations.encrypted_credentials (INTEGRATIONS_SECRET format, no enc: prefix)
const { data: integrations, error: intErr } = await admin
  .from("integrations")
  .select("id, provider, encrypted_credentials")
  .not("encrypted_credentials", "is", null)

if (intErr) {
  console.log(`INTEGRATIONS_QUERY=FAIL code=${intErr.code ?? "none"}`)
} else {
  const rows = integrations ?? []
  let opensWithIntegrations = 0
  let opensWithServiceRole = 0
  let opensWithBoth = 0
  let opensWithNeither = 0
  let looksEncPrefix = 0
  for (const row of rows) {
    const cipher = typeof row.encrypted_credentials === "string" ? row.encrypted_credentials : ""
    if (cipher.startsWith("enc:")) looksEncPrefix += 1
    const a = openPacked(cipher, integrationsSecret)
    const b = openPacked(cipher, service) || openEnc(cipher, service)
    if (a && b) opensWithBoth += 1
    else if (a) opensWithIntegrations += 1
    else if (b) opensWithServiceRole += 1
    else opensWithNeither += 1
  }
  console.log("--- integrations.encrypted_credentials ---")
  console.log(`ROWS_WITH_CIPHERTEXT=${rows.length}`)
  console.log(`FORMAT_enc_PREFIX=${looksEncPrefix}`)
  console.log(`OPENS_WITH_INTEGRATIONS_SECRET_ONLY=${opensWithIntegrations}`)
  console.log(`OPENS_WITH_SERVICE_ROLE_ONLY=${opensWithServiceRole}`)
  console.log(`OPENS_WITH_BOTH=${opensWithBoth}`)
  console.log(`OPENS_WITH_NEITHER=${opensWithNeither}`)
  console.log(
    `NOTE=${integrationsSecret ? "INTEGRATIONS_SECRET available for probe" : "INTEGRATIONS_SECRET missing — cannot attribute rows to that key"}`,
  )
}

// --- email_jobs.payload accessCode (enc: + SERVICE_ROLE historically)
const { data: jobs, error: jobErr } = await admin
  .from("email_jobs")
  .select("id, template, status, payload")
  .eq("template", "first_access")
  .limit(2000)

if (jobErr) {
  console.log(`EMAIL_JOBS_QUERY=FAIL code=${jobErr.code ?? "none"}`)
} else {
  const rows = jobs ?? []
  let withEncAccessCode = 0
  let opensWithIntegrations = 0
  let opensWithServiceRole = 0
  let opensWithBoth = 0
  let opensWithNeither = 0
  const byStatus = {}
  for (const row of rows) {
    const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload) ? row.payload : {}
    const accessCode = typeof payload.accessCode === "string" ? payload.accessCode : ""
    if (!accessCode.startsWith("enc:")) continue
    withEncAccessCode += 1
    byStatus[row.status ?? "unknown"] = (byStatus[row.status ?? "unknown"] ?? 0) + 1
    const a = openEnc(accessCode, integrationsSecret)
    const b = openEnc(accessCode, service)
    if (a && b) opensWithBoth += 1
    else if (a) opensWithIntegrations += 1
    else if (b) opensWithServiceRole += 1
    else opensWithNeither += 1
  }
  console.log("--- email_jobs.payload.accessCode (template=first_access) ---")
  console.log(`JOBS_SCANNED=${rows.length}`)
  console.log(`ROWS_WITH_enc_ACCESS_CODE=${withEncAccessCode}`)
  console.log(`BY_STATUS=${JSON.stringify(byStatus)}`)
  console.log(`OPENS_WITH_INTEGRATIONS_SECRET_ONLY=${opensWithIntegrations}`)
  console.log(`OPENS_WITH_SERVICE_ROLE_ONLY=${opensWithServiceRole}`)
  console.log(`OPENS_WITH_BOTH=${opensWithBoth}`)
  console.log(`OPENS_WITH_NEITHER=${opensWithNeither}`)
  if (rows.length >= 2000) console.log("NOTE=scan capped at 2000 first_access jobs")
}

// Sanity: packing format self-check without using real secrets
{
  const sample = "probe"
  const secret = "dry-run-format-check-only"
  const key = createHash("sha256").update(secret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(sample, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  const packed = `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
  const enc = `enc:${packed}`
  console.log("--- FORMAT_SELF_CHECK ---")
  console.log(`PACKED_OPENS=${openPacked(packed, secret)}`)
  console.log(`ENC_OPENS=${openEnc(enc, secret)}`)
  console.log(
    "ATTRIBUTION_LIMIT=Ciphertext does not embed key id; attribution is by successful open only. Ambiguous if both secrets identical (should not happen).",
  )
}

console.log("PROBE=PASS")
process.exit(0)
