/**
 * Start Next.js bound to staging only (.env.e2e.local).
 * Whitelist: ALLOWED_SUPABASE_REF / hzn… only. Does not kill an existing :3000 process.
 *
 * Usage (PowerShell): stop the current next dev yourself if needed, then:
 *   node scripts/dev-e2e.mjs
 */
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:net"
import { ALLOWED_SUPABASE_HOST } from "../lib/env/allowed-supabase.ts"

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
console.log(`PROTECT_HOST=${protectHost || "unset"}`)
console.log(`ALLOWED_HOST=${ALLOWED_SUPABASE_HOST}`)

if (e2eHost !== ALLOWED_SUPABASE_HOST || appHost !== ALLOWED_SUPABASE_HOST) {
  console.error(`REFUSED: app/E2E URL must be ${ALLOWED_SUPABASE_HOST} only`)
  process.exit(2)
}
if (protectHost && protectHost !== ALLOWED_SUPABASE_HOST) {
  console.error(`REFUSED: E2E_PROTECT_SUPABASE_URL must be ${ALLOWED_SUPABASE_HOST} or unset`)
  process.exit(2)
}
if (!env.E2E_SUPABASE_ANON_KEY || !env.E2E_SUPABASE_SERVICE_ROLE_KEY) {
  console.error("REFUSED: E2E keys missing")
  process.exit(2)
}

if (!(await portFree(PORT))) {
  console.error(`PORT_BUSY=${PORT}`)
  console.error("Stop the existing Next.js process manually, then re-run: node scripts/dev-e2e.mjs")
  process.exit(2)
}

console.log(`Starting next dev on :${PORT} (staging whitelist)`)
const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  env,
  stdio: "inherit",
  shell: true,
})
child.on("exit", (code) => process.exit(code ?? 0))
