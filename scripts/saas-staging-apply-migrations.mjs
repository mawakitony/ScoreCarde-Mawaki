/**
 * Apply supabase/migrations/*.sql IN ORDER to woloyem-score-staging only.
 * Uses `supabase db push --db-url` (multi-statement safe). No db reset.
 * Stops on first error. Never targets ScorApp-XP / protect host.
 */
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"

const STAGING_REF = "hznmtadobqfhumezdgbh"
const STAGING_HOST = `${STAGING_REF}.supabase.co`
const PROTECT_HOST = "zkyjaslogpdujyeysjzw.supabase.co"
const dryRun = process.argv.includes("--dry-run")

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

function hostOf(value) {
  try {
    return new URL(value).host
  } catch {
    return ""
  }
}

function assertTarget() {
  const e2e = hostOf(process.env.E2E_SUPABASE_URL ?? "")
  const app = hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  const protect = hostOf(process.env.E2E_PROTECT_SUPABASE_URL ?? "")
  console.log(`E2E_HOST=${e2e || "MISSING"}`)
  console.log(`APP_HOST=${app || "MISSING"}`)
  console.log(`PROTECT_HOST=${protect || "MISSING"}`)
  if (e2e !== STAGING_HOST) {
    console.error("REFUSED: E2E_SUPABASE_URL is not staging")
    process.exit(2)
  }
  if (app && app !== STAGING_HOST) {
    console.error("REFUSED: NEXT_PUBLIC_SUPABASE_URL is not staging")
    process.exit(2)
  }
  if (e2e === PROTECT_HOST || app === PROTECT_HOST) {
    console.error("REFUSED: protect / ScorApp-XP target")
    process.exit(2)
  }
}

function resolveDbUrl() {
  const explicit = process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim()
  if (explicit) {
    const host = hostOf(explicit.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"))
    console.log(`DATABASE_URL_HOST=${host || "UNPARSABLE"}`)
    if (host.includes(PROTECT_HOST) || host.includes("zkyjaslogpdujyeysjzw")) {
      console.error("REFUSED: DATABASE_URL points at protect project")
      process.exit(2)
    }
    if (
      !host.includes(STAGING_REF) &&
      !host.includes(STAGING_HOST) &&
      !/pooler\.supabase\.com$/i.test(host)
    ) {
      console.error("REFUSED: DATABASE_URL does not clearly target staging")
      process.exit(2)
    }
    if (/pooler\.supabase\.com$/i.test(host) && !explicit.includes(STAGING_REF)) {
      console.error("REFUSED: pooler URL must embed staging ref in the username")
      process.exit(2)
    }
    return explicit
  }
  const password = process.env.SUPABASE_DB_PASSWORD?.trim()
  if (!password) return null
  const region = process.env.SUPABASE_DB_REGION?.trim() || "eu-west-1"
  console.log(`DB_MODE=pooler_session region=${region}`)
  return `postgresql://postgres.${STAGING_REF}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`
}

assertTarget()

const migrations = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort()
console.log(`MIGRATION_COUNT=${migrations.length}`)
for (const f of migrations) console.log(`PLAN ${f}`)

const dbUrl = resolveDbUrl()
if (!dbUrl) {
  console.log("STATUS=BLOCKED")
  console.log("REASON=DATABASE_URL or SUPABASE_DB_PASSWORD missing for staging")
  process.exit(2)
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx"
const args = ["supabase", "db", "push", "--db-url", dbUrl, "--yes", "--include-all"]
if (dryRun) args.push("--dry-run")

console.log(dryRun ? "WRITE_SQL=DRY_RUN" : "WRITE_SQL=START")
const result = spawnSync(npx, args, {
  encoding: "utf8",
  shell: true,
  env: process.env,
  windowsHide: true,
})
const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://REDACTED")
console.log(out.slice(0, 8000))
console.log(`EXIT=${result.status}`)
if (result.status !== 0) {
  console.log("STATUS=STOPPED_ON_ERROR")
  console.log("NO_DESTRUCTIVE_FALLBACK")
  process.exit(1)
}
console.log(dryRun ? "STATUS=DRY_RUN_OK" : "STATUS=APPLIED")
console.log("NEXT=Run scripts/saas-staging-validate.mjs")
