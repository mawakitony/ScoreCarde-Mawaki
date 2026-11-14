/**
 * Interactive staging env setup (local + optional Vercel).
 * Never logs secret values. Run: node scripts/setup-env.mjs
 * Self-test only: node scripts/setup-env.mjs --self-test
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

export function applyLocalEnvFile(input, { extras = {}, remove = [] } = {}) {
  let text = String(input ?? "")
  for (const key of remove) text = removeEnvVar(text, key)
  for (const [key, value] of Object.entries({ ...NON_SECRET_LOCAL, ...extras })) {
    text = upsertEnvVar(text, key, value)
  }
  return text
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
    // Formats / status only — skip anything that could look like a value dump.
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
  // Ignore missing variable.
  say(`  rm ${name} ${environment} → ${result.code === 0 ? "ok" : "absent_or_skipped"}`)
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
  const result = await vercelCmd(args, { input: value })
  if (result.code !== 0) {
    const detail = `${result.stderr || result.stdout || ""}`.slice(0, 200).replace(/\s+/g, " ")
    throw new Error(`vercel env add failed for ${name} (${environment}): ${detail}`)
  }
  say(`  add ${name} ${environment} → ok (${sensitive ? "secret" : "config"})`)
}

async function syncVercel(secrets) {
  const prodService = await askUntil(
    "Secret key Production (sb_secret_, saisie masquée) : ",
    isSecretKey,
    "Format invalide — doit commencer par sb_secret_. Réessaie.",
  )

  const prodVars = {
    NEXT_PUBLIC_SUPABASE_URL: ALLOWED_SUPABASE_URL,
    NEXT_PUBLIC_APP_URL: PROD_APP_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: secrets.publishable,
    SUPABASE_SERVICE_ROLE_KEY: prodService,
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
    // Preview uses local service role for app + e2e extras.
    SUPABASE_SERVICE_ROLE_KEY: secrets.serviceLocal,
    E2E_SUPABASE_ANON_KEY: secrets.publishable,
    E2E_SUPABASE_SERVICE_ROLE_KEY: secrets.serviceLocal,
  }

  const sensitiveNames = new Set([
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "INTEGRATIONS_SECRET",
    "SMTP_PASSWORD",
    "SMTP_USER",
    "E2E_SUPABASE_ANON_KEY",
    "E2E_SUPABASE_SERVICE_ROLE_KEY",
  ])

  say("")
  say("--- Vercel Production ---")
  for (const [name, value] of Object.entries(prodVars)) {
    await vercelRm(name, "production")
    await vercelAdd(name, "production", value, { sensitive: sensitiveNames.has(name) })
  }

  say("")
  say("--- Vercel Preview ---")
  for (const [name, value] of Object.entries(previewVars)) {
    await vercelRm(name, "preview")
    await vercelAdd(name, "preview", value, { sensitive: sensitiveNames.has(name) })
  }

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
      // Print name column only when recognizable; otherwise skip value-looking tokens.
      const nameMatch = trimmed.match(/^([A-Z][A-Z0-9_]*)\b/)
      if (nameMatch) say(`  ${nameMatch[1]}`)
      else if (/Environment|Name|Value|production|preview|Development/i.test(trimmed) && trimmed.length < 80) {
        say(`  ${trimmed}`)
      }
    }
  }
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

  let integrations
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

  const smtpPassword = normalizeGmailAppPassword(
    await askUntil(
      "Mot de passe d'application Gmail (16 lettres, saisie masquée) : ",
      isGmailAppPassword,
      "Format invalide — 16 lettres (espaces retirés auto). Réessaie.",
    ),
  )

  const secrets = { publishable, serviceLocal, integrations, smtpPassword }

  const localExtras = {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishable,
    SUPABASE_SERVICE_ROLE_KEY: serviceLocal,
    INTEGRATIONS_SECRET: integrations,
    SMTP_PASSWORD: smtpPassword,
  }

  const e2eExtras = {
    ...localExtras,
    E2E_SUPABASE_URL: ALLOWED_SUPABASE_URL,
    E2E_SUPABASE_ANON_KEY: publishable,
    E2E_SUPABASE_SERVICE_ROLE_KEY: serviceLocal,
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
    await syncVercel(secrets)
  } else {
    say("Vercel: ignoré.")
  }

  archiveXpLocal()
  say("")
  say("Terminé.")
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
}

const entry = process.argv[1] ? resolve(process.argv[1]) : ""
const self = resolve(fileURLToPath(import.meta.url))
if (entry && entry === self) {
  if (process.argv.includes("--self-test")) selfTest()
  else {
    runInteractive().catch((error) => {
      say(`ERROR: ${error instanceof Error ? error.message : "failed"}`)
      process.exit(1)
    })
  }
}
