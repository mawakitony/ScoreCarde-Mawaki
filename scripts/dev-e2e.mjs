/**
 * Start Next.js bound to woloyem-score-staging (.env.e2e.local) only.
 * Refuses ScorApp-XP / protect host. Does not kill an existing :3000 process.
 *
 * Usage (PowerShell): stop the current next dev yourself if needed, then:
 *   node scripts/dev-e2e.mjs
 */
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:net"

const STAGING_HOST = "hznmtadobqfhumezdgbh.supabase.co"
const PROTECT_HOST = "zkyjaslogpdujyeysjzw.supabase.co"
const PORT = Number(process.env.PORT || 3000)

function loadE2eLocal() {
  const file = ".env.e2e.local"
  if (!existsSync(file)) {
    console.error("MISSING .env.e2e.local")
    process.exit(2)
  }
  const env = { ...process.env }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=")
    if (index <= 0 || line.startsWith("#")) continue
    const key = line.slice(0, index).trim()
    if (!key) continue
    // Force E2E file over inherited shell / .env.local defaults for Supabase keys.
    env[key] = line.slice(index + 1).trim()
  }
  return env
}

function hostOf(value) {
  try {
    return new URL(value).host
  } catch {
    return ""
  }
}

function portFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => server.close(() => resolve(true)))
    server.listen(port, "127.0.0.1")
  })
}

const env = loadE2eLocal()
env.E2E_BASE_URL = `http://localhost:${PORT}`
env.NEXT_PUBLIC_APP_URL = `http://localhost:${PORT}`

const e2eHost = hostOf(env.E2E_SUPABASE_URL)
const appHost = hostOf(env.NEXT_PUBLIC_SUPABASE_URL)
const protectHost = hostOf(env.E2E_PROTECT_SUPABASE_URL)

console.log(`E2E_HOST=${e2eHost || "MISSING"}`)
console.log(`APP_HOST=${appHost || "MISSING"}`)
console.log(`PROTECT_HOST=${protectHost || "MISSING"}`)

if (e2eHost !== STAGING_HOST || appHost !== STAGING_HOST) {
  console.error("REFUSED: app/E2E URL must be woloyem-score-staging only")
  process.exit(2)
}
if (e2eHost === PROTECT_HOST || appHost === PROTECT_HOST || protectHost === STAGING_HOST) {
  console.error("REFUSED: ScorApp-XP / protect project conflict")
  process.exit(2)
}
if (!env.E2E_SUPABASE_ANON_KEY || !env.E2E_SUPABASE_SERVICE_ROLE_KEY) {
  console.error("REFUSED: E2E keys missing")
  process.exit(2)
}

if (!(await portFree(PORT))) {
  console.error(`PORT_BUSY=${PORT}`)
  console.error("Stop the existing Next.js process manually, then re-run: node scripts/dev-e2e.mjs")
  console.error("Do not point a casual npm run dev at staging while .env.local still targets protect.")
  process.exit(2)
}

console.log(`STARTING next dev on :${PORT} with staging env (no secrets printed)`)
const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  env,
  stdio: "inherit",
  shell: true,
})
child.on("exit", (code) => process.exit(code ?? 0))
