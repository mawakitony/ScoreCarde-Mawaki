/**
 * T8b: read-only dump of organizations + profiles (schema snapshot + rows) from staging hzn…
 * Writes OUTSIDE the git repo. Never prints secrets or row contents.
 */
import { createClient } from "@supabase/supabase-js"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const STAGING_HOST = "hznmtadobqfhumezdgbh.supabase.co"
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

function host(u) {
  try {
    return new URL(u).host
  } catch {
    return "INVALID"
  }
}

async function fetchAll(admin, table) {
  const pageSize = 1000
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await admin.from(table).select("*").range(from, to)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return rows
}

async function fetchOpenApiColumns(url, serviceKey, table) {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/openapi+json",
    },
  })
  if (!res.ok) return { source: "openapi_failed", status: res.status, columns: [] }
  const spec = await res.json()
  const def = spec?.definitions?.[table] ?? spec?.components?.schemas?.[table]
  const props = def?.properties ?? {}
  return {
    source: "openapi",
    columns: Object.entries(props).map(([name, meta]) => ({
      name,
      type: meta?.format ?? meta?.type ?? "unknown",
      description: meta?.description ?? null,
    })),
  }
}

load(".env.e2e.local")
load(".env.local")

const url = (process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
const key = (process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()
const h = host(url)

if (h !== STAGING_HOST || h.includes(PROTECT) || !key) {
  console.error("ABORT=wrong_target_or_missing_key")
  process.exit(2)
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
const outDir = join(homedir(), "Downloads", "ScorApp-Woloyem-backups-OUTSIDE-GIT")
mkdirSync(outDir, { recursive: true })
const fileName = `staging-hzn-orgs-profiles-backup-${stamp}.json`
const outPath = join(outDir, fileName)

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const [orgSchema, profileSchema, organizations, profiles] = await Promise.all([
  fetchOpenApiColumns(url, key, "organizations"),
  fetchOpenApiColumns(url, key, "profiles"),
  fetchAll(admin, "organizations"),
  fetchAll(admin, "profiles"),
])

const payload = {
  meta: {
    created_at: new Date().toISOString(),
    target_host: STAGING_HOST,
    purpose: "pre-migration T8b backup (organizations + profiles)",
    note: "Additive migration only; restore manually if needed.",
  },
  schema: {
    organizations: orgSchema,
    profiles: profileSchema,
  },
  data: {
    organizations,
    profiles,
  },
  counts: {
    organizations: organizations.length,
    profiles: profiles.length,
  },
}

writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8")

console.log(`BACKUP_OK file=${fileName}`)
console.log(`BACKUP_DIR=${outDir}`)
console.log(`COUNTS organizations=${organizations.length} profiles=${profiles.length}`)
console.log(`SCHEMA_ORG_COLS=${orgSchema.columns?.length ?? 0} SCHEMA_PROFILE_COLS=${profileSchema.columns?.length ?? 0}`)
