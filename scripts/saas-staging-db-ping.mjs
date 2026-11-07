/**
 * Ping staging Postgres via session pooler (IPv4). Never prints password/URL.
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const STAGING_REF = "hznmtadobqfhumezdgbh"
const STAGING_HOST = `${STAGING_REF}.supabase.co`
const PROTECT = "zkyjaslogpdujyeysjzw"

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

function tryQuery(dbUrl, label) {
  mkdirSync("tmp", { recursive: true })
  const sqlPath = join("tmp", "staging-ping.sql")
  writeFileSync(sqlPath, "select current_database() as db, current_user as usr;\n")
  const npx = process.platform === "win32" ? "npx.cmd" : "npx"
  const result = spawnSync(npx, ["supabase", "db", "query", "--db-url", dbUrl, "--file", sqlPath], {
    encoding: "utf8",
    shell: true,
    env: process.env,
    windowsHide: true,
  })
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://REDACTED")
  console.log(`TRY=${label} EXIT=${result.status}`)
  console.log(out.slice(0, 1200))
  return result.status === 0
}

load(".env.e2e.local")

const apiHost = new URL(process.env.E2E_SUPABASE_URL).host
console.log(`E2E_HOST=${apiHost}`)
if (apiHost !== STAGING_HOST) {
  console.error("REFUSED: not staging")
  process.exit(2)
}
const password = process.env.SUPABASE_DB_PASSWORD?.trim()
if (!password) {
  console.error("MISSING SUPABASE_DB_PASSWORD")
  process.exit(2)
}
if (password.includes(PROTECT) || apiHost.includes(PROTECT)) {
  console.error("REFUSED: protect")
  process.exit(2)
}

const regions = [
  process.env.SUPABASE_DB_REGION?.trim(),
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "us-east-1",
].filter(Boolean)

const seen = new Set()
for (const region of regions) {
  if (seen.has(region)) continue
  seen.add(region)
  const url = `postgresql://postgres.${STAGING_REF}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`
  if (tryQuery(url, `pooler:${region}`)) {
    console.log(`STATUS=OK region=${region}`)
    writeFileSync(join("tmp", "staging-db-region.txt"), region)
    process.exit(0)
  }
}

console.log("STATUS=FAIL")
process.exit(1)
