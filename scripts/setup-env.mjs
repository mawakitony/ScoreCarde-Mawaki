/**
 * Interactive staging env setup (local + optional Vercel).
 * Never logs secret values.
 *
 *   node scripts/setup-env.mjs
 *   node scripts/setup-env.mjs --vercel-only
 *   node scripts/setup-env.mjs --rotate CRON_SECRET
 *   node scripts/setup-env.mjs --self-test
 */
import { createInterface } from "node:readline"
import { randomBytes } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { spawn, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { ALLOWED_SUPABASE_URL } from "../lib/env/allowed-supabase-ref.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const PROJECT = "score-card-mawaki"
const SCOPE = "mawakitonys-projects"
const LOCAL_APP_URL = "http://localhost:3000"
const PROD_APP_URL = "https://score-card-mawaki.vercel.app"

/**
 * Canonical public app URL for a Vercel target.
 * Never read from .env.local — Production/Preview always use the Vercel domain.
 */
export function vercelAppUrlForEnvironment(environment) {
  const env = String(environment || "").toLowerCase()
  if (env === "production" || env === "preview") return PROD_APP_URL
  throw new Error(`vercelAppUrlForEnvironment: unsupported environment "${environment}"`)
}

/** Guard: refuse to push localhost (or empty) as NEXT_PUBLIC_APP_URL to Vercel. */
export function assertVercelAppUrl(value, environment) {
  const expected = vercelAppUrlForEnvironment(environment)
  const raw = String(value ?? "").trim().replace(/\/$/, "")
  if (!raw || /localhost|127\.0\.0\.1/i.test(raw)) {
    throw new Error(
      `Refusing NEXT_PUBLIC_APP_URL=${raw || "(empty)"} for ${environment} — must be ${expected}`,
    )
  }
  if (raw !== expected.replace(/\/$/, "")) {
    throw new Error(
      `Refusing NEXT_PUBLIC_APP_URL host mismatch for ${environment}: got ${raw}, expected ${expected}`,
    )
  }
  return expected
}

/** Only these may be Vercel Secret. NEXT_PUBLIC_* must always be plain/config. */
const VERCEL_SENSITIVE_NAMES = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "INTEGRATIONS_SECRET",
  "SMTP_PASSWORD",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
])

const NON_SECRET_LOCAL = {
  NEXT_PUBLIC_SUPABASE_URL: ALLOWED_SUPABASE_URL,
  NEXT_PUBLIC_APP_URL: LOCAL_APP_URL,
  EMAIL_PROVIDER: "smtp",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "assikimawaki@gmail.com",
  EMAIL_FROM: "assikimawaki@gmail.com",
  EMAIL_FROM_NAME: "WOLOYEM Score",
  EMAIL_DAILY_LIMIT: "400",
  EMAIL_RATE_PER_MINUTE: "5",
}

export function stampNow(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** Replace one key=value; remove duplicate keys; leave unrelated lines untouched. */
export function upsertEnvVar(text, key, value) {
  const lines = String(text ?? "").split(/\r?\n/)
  const next = []
  let written = false
  const assign = `${key}=${value}`
  for (const line of lines) {
    if (!line && next.length === 0 && lines.length === 1) continue
    const eq = line.indexOf("=")
    const name = eq > 0 && !line.trimStart().startsWith("#") ? line.slice(0, eq).trim() : null
    if (name === key) {
      if (!written) {
        next.push(assign)
        written = true
      }
      continue
    }
    next.push(line)
  }
  if (!written) {
    if (next.length && next[next.length - 1] !== "") next.push("")
    next.push(assign)
  }
  let out = next.join("\n")
  if (out.length && !out.endsWith("\n")) out += "\n"
  return out
}

export function removeEnvVar(text, key) {
  const lines = String(text ?? "").split(/\r?\n/)
  const next = lines.filter((line) => {
    const eq = line.indexOf("=")
    if (eq <= 0 || line.trimStart().startsWith("#")) return true
    return line.slice(0, eq).trim() !== key
  })
  let out = next.join("\n")
  if (out.length && !out.endsWith("\n")) out += "\n"
  return out
}

export function backupPath(filePath, stamp = stampNow()) {
  return `${filePath}.bak-${stamp}`
}

export function backupFile(filePath, stamp = stampNow()) {
  if (!existsSync(filePath)) return null
  const dest = backupPath(filePath, stamp)
  copyFileSync(filePath, dest)
  return dest
}

export function normalizeGmailAppPassword(raw) {
  return String(raw ?? "").replace(/\s+/g, "")
}

export function isPublishableKey(value) {
  return String(value ?? "").trim().startsWith("sb_publishable_")
}

export function isSecretKey(value) {
  return String(value ?? "").trim().startsWith("sb_secret_")
}

export function isIntegrationsSecret(value) {
  return /^[0-9a-f]{64}$/i.test(String(value ?? "").trim())
}

export function isGmailAppPassword(value) {
  return /^[a-z]{16}$/i.test(normalizeGmailAppPassword(value))
}

export function generateIntegrationsSecret() {
  return randomBytes(32).toString("hex")
}

/** 32 bytes → 64 hex chars. Never log the value. */
export function generateCronSecret() {
  return randomBytes(32).toString("hex")
}

export function isCronSecret(value) {
  return /^[0-9a-f]{64}$/i.test(String(value ?? "").trim())
}

export function applyLocalEnvFile(input, { extras = {}, remove = [] } = {}) {
  let text = String(input ?? "")
  for (const key of remove) text = removeEnvVar(text, key)
  for (const [key, value] of Object.entries({ ...NON_SECRET_LOCAL, ...extras })) {
    text = upsertEnvVar(text, key, value)
  }
  return text
}

/** Vercel: NEXT_PUBLIC_* never Secret; only allowlisted names are sensitive. */
export function isVercelSensitive(name) {
  if (String(name).startsWith("NEXT_PUBLIC_")) return false
  return VERCEL_SENSITIVE_NAMES.has(name)
}

export function readEnvFileValue(filePath, key) {
  if (!existsSync(filePath)) return null
  const text = readFileSync(filePath, "utf8")
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i <= 0) continue
    if (line.slice(0, i).trim() !== key) continue
    let value = line.slice(i + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    return value
  }
  return null
}

export function buildVercelVarSets(secrets) {
  // APP_URL is forced per environment below — never taken from .env.local / secrets.
  const prodVars = {
    NEXT_PUBLIC_SUPABASE_URL: ALLOWED_SUPABASE_URL,
    NEXT_PUBLIC_APP_URL: vercelAppUrlForEnvironment("production"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: secrets.publishable,
    SUPABASE_SERVICE_ROLE_KEY: secrets.serviceProduction,
    INTEGRATIONS_SECRET: secrets.integrations,
    EMAIL_PROVIDER: "smtp",
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_USER: "assikimawaki@gmail.com",
    EMAIL_FROM: "assikimawaki@gmail.com",
    EMAIL_FROM_NAME: "WOLOYEM Score",
    EMAIL_DAILY_LIMIT: "400",
    EMAIL_RATE_PER_MINUTE: "5",
    SMTP_PASSWORD: secrets.smtpPassword,
  }

  const previewVars = {
    ...prodVars,
    NEXT_PUBLIC_APP_URL: vercelAppUrlForEnvironment("preview"),
    SUPABASE_SERVICE_ROLE_KEY: secrets.serviceLocal,
    E2E_SUPABASE_ANON_KEY: secrets.publishable,
    E2E_SUPABASE_SERVICE_ROLE_KEY: secrets.serviceLocal,
  }

  assertVercelAppUrl(prodVars.NEXT_PUBLIC_APP_URL, "production")
  assertVercelAppUrl(previewVars.NEXT_PUBLIC_APP_URL, "preview")

  return { prodVars, previewVars }
}

function say(msg) {
  process.stdout.write(`${msg}\n`)
}

function askLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(String(answer ?? "").trim())
    })
  })
}

/** Masked prompt: nothing echoed, nothing logged. */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("TTY required for masked input (run in an interactive terminal)."))
      return
    }
    stdout.write(question)
    stdin.resume()
    stdin.setRawMode(true)
    let value = ""
    const onData = (buf) => {
      const s = buf.toString("utf8")
      if (s === "\u0003") {
        cleanup()
        stdout.write("\n")
        process.exit(130)
      }
      if (s === "\r" || s === "\n" || s === "\u0004") {
        cleanup()
        stdout.write("\n")
        resolve(value)
        return
      }
      if (s === "\u007f" || s === "\b") {
        value = value.slice(0, -1)
        return
      }
      if (s === "\u0015") {
        value = ""
        return
      }
      if (s >= " " || s.length > 1) value += s
    }
    function cleanup() {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener("data", onData)
    }
    stdin.on("data", onData)
  })
}

async function askUntil(question, validate, hint) {
  for (;;) {
    const value = await askHidden(question)
    if (validate(value)) return value
    say(hint)
  }
}

function runCheckEnv() {
  say("")
  say("--- check-env ---")
  const result = spawnSync(process.execPath, [join(ROOT, "scripts/check-env.mjs")], {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
  })
  const out = `${result.stdout || ""}${result.stderr || ""}`
  for (const line of out.split(/\r?\n/)) {
    if (!line) continue
    if (/=[^\s]{20,}/.test(line) && !/FORMAT|STATUS|LENGTH|PROVIDER|HOST|PORT|database|ALLOWED_/.test(line)) {
      continue
    }
    say(line)
  }
  say(`check-env exit=${result.status ?? 1}`)
  return result.status ?? 1
}

function vercelCmd(args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("vercel", args, {
      cwd: ROOT,
      stdio: input === undefined ? ["ignore", "pipe", "pipe"] : ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
      env: process.env,
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (c) => {
      stdout += c.toString("utf8")
    })
    child.stderr.on("data", (c) => {
      stderr += c.toString("utf8")
    })
    if (input !== undefined) {
      child.stdin.write(String(input))
      child.stdin.end()
    }
    child.on("error", reject)
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }))
  })
}

async function vercelRm(name, environment) {
  const result = await vercelCmd([
    "--scope",
    SCOPE,
    "env",
    "rm",
    name,
    environment,
    "--yes",
    "--project",
    PROJECT,
  ])
  // Missing variable is fine (idempotent re-run).
  return result.code === 0 ? "removed" : "absent_or_skipped"
}

/**
 * Idempotent add: rm (ignored if missing) then add with --force.
 * Never throws — returns { ok, kind, detail }.
 */
export async function upsertVercelEnv(name, environment, value, { vercelAddFn, vercelRmFn } = {}) {
  const sensitive = isVercelSensitive(name)
  const rm = vercelRmFn || vercelRm
  const add = vercelAddFn || vercelAdd
  await rm(name, environment)
  const added = await add(name, environment, value, { sensitive })
  return {
    name,
    environment,
    sensitive,
    kind: sensitive ? "secret" : "config",
    ok: added.ok,
    detail: added.detail || null,
  }
}

async function vercelAdd(name, environment, value, { sensitive = true } = {}) {
  const args = [
    "--scope",
    SCOPE,
    "env",
    "add",
    name,
    "--environment",
    environment,
    "--yes",
    "--force",
    "--project",
    PROJECT,
  ]
  if (sensitive) args.push("--sensitive")
  else args.push("--no-sensitive")
  try {
    const result = await vercelCmd(args, { input: value })
    if (result.code !== 0) {
      const detail = `${result.stderr || result.stdout || ""}`.slice(0, 200).replace(/\s+/g, " ").trim()
      return { ok: false, detail: detail || `exit_${result.code}` }
    }
    return { ok: true, detail: null }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message.slice(0, 160) : "spawn_failed" }
  }
}

function printVercelSummary(rows) {
  say("")
  say("--- Récapitulatif Vercel (OK/FAIL) ---")
  let fails = 0
  for (const row of rows) {
    const mark = row.ok ? "OK" : "FAIL"
    if (!row.ok) fails += 1
    const extra = row.ok ? row.kind : `${row.kind}; ${row.detail || "error"}`
    say(`  ${mark}  ${row.environment}  ${row.name}  (${extra})`)
  }
  say(fails ? `Résultat: ${fails} échec(s) — relance possible (idempotent).` : "Résultat: toutes les variables OK.")
  return fails
}

async function syncVercel(secrets) {
  const { prodVars, previewVars } = buildVercelVarSets(secrets)
  // Last-line defence: force APP_URL after any future edits to the sets.
  prodVars.NEXT_PUBLIC_APP_URL = assertVercelAppUrl(
    vercelAppUrlForEnvironment("production"),
    "production",
  )
  previewVars.NEXT_PUBLIC_APP_URL = assertVercelAppUrl(
    vercelAppUrlForEnvironment("preview"),
    "preview",
  )
  const results = []

  say("")
  say("--- Vercel Production ---")
  say(`  NEXT_PUBLIC_APP_URL forcé → ${prodVars.NEXT_PUBLIC_APP_URL} (jamais .env.local)`)
  for (const [name, value] of Object.entries(prodVars)) {
    if (name === "NEXT_PUBLIC_APP_URL") assertVercelAppUrl(value, "production")
    const row = await upsertVercelEnv(name, "production", value)
    results.push(row)
    say(`  ${row.ok ? "OK" : "FAIL"} ${name} (${row.kind})${row.ok ? "" : ` — ${row.detail}`}`)
  }

  say("")
  say("--- Vercel Preview ---")
  say(`  NEXT_PUBLIC_APP_URL forcé → ${previewVars.NEXT_PUBLIC_APP_URL} (jamais .env.local)`)
  for (const [name, value] of Object.entries(previewVars)) {
    if (name === "NEXT_PUBLIC_APP_URL") assertVercelAppUrl(value, "preview")
    const row = await upsertVercelEnv(name, "preview", value)
    results.push(row)
    say(`  ${row.ok ? "OK" : "FAIL"} ${name} (${row.kind})${row.ok ? "" : ` — ${row.detail}`}`)
  }

  printVercelSummary(results)

  say("")
  say("--- vercel env ls (names only) ---")
  for (const environment of ["production", "preview"]) {
    const listed = await vercelCmd([
      "--scope",
      SCOPE,
      "env",
      "ls",
      environment,
      "--project",
      PROJECT,
    ])
    say(`# ${environment}`)
    for (const line of `${listed.stdout || ""}${listed.stderr || ""}`.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const nameMatch = trimmed.match(/^([A-Z][A-Z0-9_]*)\b/)
      if (nameMatch) say(`  ${nameMatch[1]}`)
      else if (/Environment|Name|Value|production|preview|Development/i.test(trimmed) && trimmed.length < 80) {
        say(`  ${trimmed}`)
      }
    }
  }

  return results
}

function archiveXpLocal() {
  const src = join(ROOT, ".env.xp.local")
  if (!existsSync(src)) {
    say("Archive: .env.xp.local absent — rien à déplacer.")
    return
  }
  const destDir = join(homedir(), "Documents", "woloyem-archive")
  mkdirSync(destDir, { recursive: true })
  const dest = join(destDir, ".env.xp.local")
  if (existsSync(dest)) {
    const stamped = join(destDir, `.env.xp.local.bak-${stampNow()}`)
    renameSync(dest, stamped)
  }
  renameSync(src, dest)
  say(`Archive: .env.xp.local → ${destDir} (contenu non lu)`)
}

async function collectSecretsInteractive({ reuseLocalCrypto }) {
  const publishable = (
    await askUntil(
      "Publishable key (sb_publishable_, saisie masquée) : ",
      isPublishableKey,
      "Format invalide — doit commencer par sb_publishable_. Réessaie.",
    )
  ).trim()

  const serviceLocal = (
    await askUntil(
      "Secret key locale (sb_secret_, saisie masquée) : ",
      isSecretKey,
      "Format invalide — doit commencer par sb_secret_. Réessaie.",
    )
  ).trim()

  let integrations = null
  let smtpPassword = null

  if (reuseLocalCrypto) {
    const envLocalPath = join(ROOT, ".env.local")
    integrations = readEnvFileValue(envLocalPath, "INTEGRATIONS_SECRET")
    smtpPassword = readEnvFileValue(envLocalPath, "SMTP_PASSWORD")
    if (integrations && isIntegrationsSecret(integrations)) {
      say("INTEGRATIONS_SECRET: réutilisé depuis .env.local (non affiché).")
    } else {
      say("INTEGRATIONS_SECRET absent/invalide dans .env.local — saisie requise.")
      integrations = null
    }
    if (smtpPassword && isGmailAppPassword(smtpPassword)) {
      smtpPassword = normalizeGmailAppPassword(smtpPassword)
      say("SMTP_PASSWORD: réutilisé depuis .env.local (non affiché).")
    } else {
      say("SMTP_PASSWORD absent/invalide dans .env.local — saisie requise.")
      smtpPassword = null
    }
  }

  if (!integrations) {
    for (;;) {
      const integrationsRaw = String(
        await askHidden("INTEGRATIONS_SECRET (64 hex, vide = génération automatique) : "),
      ).trim()
      if (!integrationsRaw) {
        integrations = generateIntegrationsSecret()
        say("INTEGRATIONS_SECRET: généré (64 hex) — non affiché.")
        break
      }
      if (isIntegrationsSecret(integrationsRaw)) {
        integrations = integrationsRaw
        break
      }
      say("Format invalide — 64 caractères hexadécimaux, ou laisse vide pour générer. Réessaie.")
    }
  }

  if (!smtpPassword) {
    smtpPassword = normalizeGmailAppPassword(
      await askUntil(
        "Mot de passe d'application Gmail (16 lettres, saisie masquée) : ",
        isGmailAppPassword,
        "Format invalide — 16 lettres (espaces retirés auto). Réessaie.",
      ),
    )
  }

  return { publishable, serviceLocal, integrations, smtpPassword }
}

async function runInteractive() {
  say("WOLOYEM Score — setup-env (staging hzn… only)")
  say("Les secrets sont saisis masqués (non affichés, non logués).")
  say("")

  const stamp = stampNow()
  const envLocalPath = join(ROOT, ".env.local")
  const envE2ePath = join(ROOT, ".env.e2e.local")

  const bakLocal = backupFile(envLocalPath, stamp)
  const bakE2e = backupFile(envE2ePath, stamp)
  if (bakLocal) say(`Backup: ${bakLocal}`)
  else say("Backup: .env.local absent — création.")
  if (bakE2e) say(`Backup: ${bakE2e}`)
  else say("Backup: .env.e2e.local absent — création.")

  const base = await collectSecretsInteractive({ reuseLocalCrypto: false })
  const secrets = { ...base }

  const localExtras = {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: secrets.publishable,
    SUPABASE_SERVICE_ROLE_KEY: secrets.serviceLocal,
    INTEGRATIONS_SECRET: secrets.integrations,
    SMTP_PASSWORD: secrets.smtpPassword,
  }

  const e2eExtras = {
    ...localExtras,
    E2E_SUPABASE_URL: ALLOWED_SUPABASE_URL,
    E2E_SUPABASE_ANON_KEY: secrets.publishable,
    E2E_SUPABASE_SERVICE_ROLE_KEY: secrets.serviceLocal,
  }

  const beforeLocal = existsSync(envLocalPath) ? readFileSync(envLocalPath, "utf8") : ""
  const beforeE2e = existsSync(envE2ePath) ? readFileSync(envE2ePath, "utf8") : ""
  writeFileSync(envLocalPath, applyLocalEnvFile(beforeLocal, { extras: localExtras }), "utf8")
  writeFileSync(
    envE2ePath,
    applyLocalEnvFile(beforeE2e, {
      extras: e2eExtras,
      remove: ["E2E_PROTECT_SUPABASE_URL"],
    }),
    "utf8",
  )
  say("Local: .env.local et .env.e2e.local mis à jour (secrets non affichés).")

  runCheckEnv()

  const vercelAnswer = (await askLine('Mettre à jour Vercel ? (répondre exactement "oui") : ')).toLowerCase()
  if (vercelAnswer === "oui") {
    const serviceProduction = (
      await askUntil(
        "Secret key Production (sb_secret_, saisie masquée) : ",
        isSecretKey,
        "Format invalide — doit commencer par sb_secret_. Réessaie.",
      )
    ).trim()
    await syncVercel({ ...secrets, serviceProduction })
  } else {
    say("Vercel: ignoré.")
  }

  archiveXpLocal()
  say("")
  say("Terminé.")
}

async function runVercelOnly() {
  say("WOLOYEM Score — setup-env --vercel-only (staging hzn…)")
  say("Partie locale ignorée. Secrets masqués ; INTEGRATIONS_SECRET / SMTP_PASSWORD réutilisés depuis .env.local si valides.")
  say(
    `NEXT_PUBLIC_APP_URL: forcé Production/Preview → ${PROD_APP_URL} (jamais lu depuis .env.local).`,
  )
  say("")

  const base = await collectSecretsInteractive({ reuseLocalCrypto: true })
  const serviceProduction = (
    await askUntil(
      "Secret key Production (sb_secret_, saisie masquée) : ",
      isSecretKey,
      "Format invalide — doit commencer par sb_secret_. Réessaie.",
    )
  ).trim()

  await syncVercel({ ...base, serviceProduction })
  say("")
  say("Terminé (--vercel-only).")
}

/**
 * Rotate CRON_SECRET: generate 32-byte hex, write local + Vercel Production/Preview
 * (same value everywhere). Never prints the secret.
 */
async function runRotateCronSecret() {
  say("WOLOYEM Score — setup-env --rotate CRON_SECRET")
  say("Génère 32 octets hex (64 chars) → .env.local, .env.e2e.local, Vercel Production + Preview.")
  say("Valeur jamais affichée. /api/cron/maintenance exige Authorization: Bearer <CRON_SECRET>.")
  say("Vérif auth sans effet: GET ?dry_run=1 ou HEAD (ne traite aucun job).")
  say("")

  const secret = generateCronSecret()
  if (!isCronSecret(secret)) {
    say("ERROR: génération CRON_SECRET invalide.")
    process.exit(1)
  }

  const stamp = stampNow()
  const envLocalPath = join(ROOT, ".env.local")
  const envE2ePath = join(ROOT, ".env.e2e.local")
  const bakLocal = backupFile(envLocalPath, stamp)
  const bakE2e = backupFile(envE2ePath, stamp)
  if (bakLocal) say(`Backup: ${bakLocal}`)
  if (bakE2e) say(`Backup: ${bakE2e}`)

  const beforeLocal = existsSync(envLocalPath) ? readFileSync(envLocalPath, "utf8") : ""
  const beforeE2e = existsSync(envE2ePath) ? readFileSync(envE2ePath, "utf8") : ""
  writeFileSync(envLocalPath, upsertEnvVar(beforeLocal, "CRON_SECRET", secret), "utf8")
  writeFileSync(envE2ePath, upsertEnvVar(beforeE2e, "CRON_SECRET", secret), "utf8")
  say("Local: CRON_SECRET mis à jour (.env.local + .env.e2e.local) — valeur non affichée.")

  const results = []
  for (const environment of ["production", "preview"]) {
    const row = await upsertVercelEnv("CRON_SECRET", environment, secret)
    results.push(row)
    say(`  ${row.ok ? "OK" : "FAIL"} Vercel ${environment} CRON_SECRET (${row.kind})${row.ok ? "" : ` — ${row.detail}`}`)
  }
  printVercelSummary(results)

  const fails = results.filter((r) => !r.ok).length
  say("")
  say(
    fails
      ? "Terminé avec échecs Vercel — corriger puis relancer --rotate CRON_SECRET."
      : "Terminé. Redeploy Production requis pour que le runtime charge le nouveau secret.",
  )
  if (fails) process.exit(1)
}

function selfTest() {
  const failures = []
  const assert = (cond, msg) => {
    if (!cond) failures.push(msg)
  }

  let text = "FOO=1\nBAR=2\nFOO=dup\n"
  text = upsertEnvVar(text, "FOO", "x")
  text = upsertEnvVar(text, "SMTP_HOST", "smtp.gmail.com")
  assert((text.match(/^FOO=/gm) || []).length === 1, "FOO deduped")
  assert(text.includes("FOO=x"), "FOO replaced")
  assert(text.includes("BAR=2"), "BAR preserved")
  assert(text.includes("SMTP_HOST=smtp.gmail.com"), "SMTP_HOST added")

  text = removeEnvVar(text, "BAR")
  assert(!/^BAR=/m.test(text), "BAR removed")
  assert(/^FOO=/m.test(text), "FOO kept after remove")

  assert(isPublishableKey("sb_publishable_test_abc"), "publishable ok")
  assert(!isPublishableKey("eyJhbGciOi"), "publishable reject jwt")
  assert(isSecretKey("sb_secret_test_abc"), "secret ok")
  assert(!isSecretKey("sb_publishable_x"), "secret reject publishable")
  assert(isIntegrationsSecret("a".repeat(64)), "integrations hex64")
  assert(!isIntegrationsSecret("short"), "integrations reject short")
  assert(isGmailAppPassword("abcd efgh ijkl mnop"), "gmail strips spaces")
  assert(!isGmailAppPassword("short"), "gmail reject short")
  assert(normalizeGmailAppPassword("ab cd").length === 4, "normalize spaces")
  assert(generateIntegrationsSecret().length === 64, "generate length")
  assert(generateCronSecret().length === 64, "cron secret length")
  assert(isCronSecret("ab".repeat(32)), "cron secret hex64")
  assert(!isCronSecret("short"), "cron secret reject short")

  assert(isVercelSensitive("NEXT_PUBLIC_SUPABASE_ANON_KEY") === false, "NEXT_PUBLIC never sensitive")
  assert(isVercelSensitive("NEXT_PUBLIC_APP_URL") === false, "NEXT_PUBLIC_APP_URL plain")
  assert(isVercelSensitive("E2E_SUPABASE_ANON_KEY") === false, "E2E anon plain")
  assert(isVercelSensitive("SMTP_USER") === false, "SMTP_USER plain")
  assert(isVercelSensitive("SUPABASE_SERVICE_ROLE_KEY") === true, "service role sensitive")
  assert(isVercelSensitive("INTEGRATIONS_SECRET") === true, "integrations sensitive")
  assert(isVercelSensitive("SMTP_PASSWORD") === true, "smtp password sensitive")
  assert(isVercelSensitive("E2E_SUPABASE_SERVICE_ROLE_KEY") === true, "e2e service sensitive")
  assert(isVercelSensitive("CRON_SECRET") === true, "cron secret sensitive")

  const sets = buildVercelVarSets({
    publishable: "sb_publishable_fake",
    serviceLocal: "sb_secret_local",
    serviceProduction: "sb_secret_prod",
    integrations: "ab".repeat(32),
    smtpPassword: "abcdefghijklmnop",
  })
  assert(sets.prodVars.NEXT_PUBLIC_APP_URL === PROD_APP_URL, "prod app url")
  assert(sets.previewVars.NEXT_PUBLIC_APP_URL === PROD_APP_URL, "preview app url forced")
  assert(sets.previewVars.NEXT_PUBLIC_APP_URL !== LOCAL_APP_URL, "preview never localhost")
  assert(vercelAppUrlForEnvironment("production") === PROD_APP_URL, "helper prod")
  assert(vercelAppUrlForEnvironment("preview") === PROD_APP_URL, "helper preview")
  let rejectedLocal = false
  try {
    assertVercelAppUrl(LOCAL_APP_URL, "production")
  } catch {
    rejectedLocal = true
  }
  assert(rejectedLocal, "assert rejects localhost")
  assert(sets.previewVars.SUPABASE_SERVICE_ROLE_KEY === "sb_secret_local", "preview uses local service")
  assert(sets.prodVars.SUPABASE_SERVICE_ROLE_KEY === "sb_secret_prod", "prod uses prod service")

  // Fake upsert: one failure must not stop the loop; summary collects OK/FAIL.
  const fakeCalls = []
  const fakeRm = async (name, environment) => {
    fakeCalls.push(`rm:${environment}:${name}`)
    return "removed"
  }
  const fakeAdd = async (name, environment, _value, { sensitive }) => {
    fakeCalls.push(`add:${environment}:${name}:${sensitive ? "secret" : "config"}`)
    if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY" && environment === "production") {
      return { ok: false, detail: "NEXT_PUBLIC cannot be secret (simulated)" }
    }
    return { ok: true, detail: null }
  }

  const runFake = async () => {
    const rows = []
    for (const [name, value] of Object.entries(sets.prodVars)) {
      rows.push(
        await upsertVercelEnv(name, "production", value, {
          vercelRmFn: fakeRm,
          vercelAddFn: fakeAdd,
        }),
      )
    }
    return rows
  }

  return runFake().then((rows) => {
    assert(rows.length === Object.keys(sets.prodVars).length, "continued after failure")
    const anon = rows.find((r) => r.name === "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    assert(anon && anon.ok === false && anon.kind === "config", "anon fail as config not secret")
    assert(
      fakeCalls.includes("add:production:NEXT_PUBLIC_SUPABASE_ANON_KEY:config"),
      "anon added as config",
    )
    assert(
      fakeCalls.includes("add:production:SUPABASE_SERVICE_ROLE_KEY:secret"),
      "service role secret",
    )
    const okCount = rows.filter((r) => r.ok).length
    assert(okCount === rows.length - 1, "only one simulated failure")

    const tmpDir = join(ROOT, ".tmp-setup-env-test")
    mkdirSync(tmpDir, { recursive: true })
    const fakeLocal = join(tmpDir, ".env.local")
    const fakeE2e = join(tmpDir, ".env.e2e.local")
    writeFileSync(fakeLocal, "KEEP_ME=yes\nSMTP_HOST=old\nSMTP_HOST=dup\n", "utf8")
    writeFileSync(
      fakeE2e,
      "E2E_PROTECT_SUPABASE_URL=https://evil.example\nKEEP_E2E=1\n",
      "utf8",
    )
    const stamp = "20990101-0000"
    const bak = backupFile(fakeLocal, stamp)
    assert(bak === `${fakeLocal}.bak-${stamp}`, "backup path")
    assert(existsSync(bak), "backup exists")

    const fakeSecrets = {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_fake",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_fake",
      INTEGRATIONS_SECRET: "ab".repeat(32),
      SMTP_PASSWORD: "abcdefghijklmnop",
    }
    writeFileSync(
      fakeLocal,
      applyLocalEnvFile(readFileSync(fakeLocal, "utf8"), { extras: fakeSecrets }),
      "utf8",
    )
    writeFileSync(
      fakeE2e,
      applyLocalEnvFile(readFileSync(fakeE2e, "utf8"), {
        extras: {
          ...fakeSecrets,
          E2E_SUPABASE_URL: ALLOWED_SUPABASE_URL,
          E2E_SUPABASE_ANON_KEY: fakeSecrets.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          E2E_SUPABASE_SERVICE_ROLE_KEY: fakeSecrets.SUPABASE_SERVICE_ROLE_KEY,
        },
        remove: ["E2E_PROTECT_SUPABASE_URL"],
      }),
      "utf8",
    )

    const localOut = readFileSync(fakeLocal, "utf8")
    const e2eOut = readFileSync(fakeE2e, "utf8")
    assert(localOut.includes("KEEP_ME=yes"), "preserved unrelated")
    assert((localOut.match(/^SMTP_HOST=/gm) || []).length === 1, "smtp host single")
    assert(localOut.includes("SMTP_HOST=smtp.gmail.com"), "smtp host overwritten")
    assert(localOut.includes("EMAIL_PROVIDER=smtp"), "email provider")
    assert(localOut.includes(`NEXT_PUBLIC_SUPABASE_URL=${ALLOWED_SUPABASE_URL}`), "supabase url")
    assert(!e2eOut.includes("E2E_PROTECT_SUPABASE_URL"), "protect removed")
    assert(e2eOut.includes("E2E_SUPABASE_URL="), "e2e url set")
    assert(e2eOut.includes("KEEP_E2E=1"), "e2e keep")
    assert(backupPath(".env.local", "20260101-1530") === ".env.local.bak-20260101-1530", "stamp format")

    const reused = readEnvFileValue(fakeLocal, "INTEGRATIONS_SECRET")
    assert(reused === fakeSecrets.INTEGRATIONS_SECRET, "readEnvFileValue integrations")
    assert(readEnvFileValue(fakeLocal, "SMTP_PASSWORD") === fakeSecrets.SMTP_PASSWORD, "read smtp")

    // Idempotent second apply
    const again = applyLocalEnvFile(localOut, { extras: fakeSecrets })
    assert((again.match(/^EMAIL_PROVIDER=/gm) || []).length === 1, "idempotent upsert")

    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }

    if (failures.length) {
      say(`SELF-TEST FAIL (${failures.length})`)
      for (const f of failures) say(`  - ${f}`)
      process.exit(1)
    }
    say("SELF-TEST PASS")
    process.exit(0)
  })
}

const entry = process.argv[1] ? resolve(process.argv[1]) : ""
const self = resolve(fileURLToPath(import.meta.url))
if (entry && entry === self) {
  if (process.argv.includes("--self-test")) {
    Promise.resolve(selfTest()).catch((error) => {
      say(`SELF-TEST ERROR: ${error instanceof Error ? error.message : "failed"}`)
      process.exit(1)
    })
  } else if (process.argv.includes("--vercel-only")) {
    runVercelOnly().catch((error) => {
      say(`ERROR: ${error instanceof Error ? error.message : "failed"}`)
      process.exit(1)
    })
  } else if (process.argv.includes("--rotate")) {
    const target = process.argv[process.argv.indexOf("--rotate") + 1]
    if (target !== "CRON_SECRET") {
      say('Usage: node scripts/setup-env.mjs --rotate CRON_SECRET')
      process.exit(1)
    }
    runRotateCronSecret().catch((error) => {
      say(`ERROR: ${error instanceof Error ? error.message : "failed"}`)
      process.exit(1)
    })
  } else {
    runInteractive().catch((error) => {
      say(`ERROR: ${error instanceof Error ? error.message : "failed"}`)
      process.exit(1)
    })
  }
}
