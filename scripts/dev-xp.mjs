/**
 * Start Next.js against ScorApp-XP (.env.xp.local) with ALLOW_XP=1.
 * Refuses to run if .env.xp.local is missing or not XP.
 */
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

const XP_HOST = "zkyjaslogpdujyeysjzw.supabase.co"
const FILE = ".env.xp.local"

function loadXpLocal() {
  if (!existsSync(FILE)) {
    console.error(`MISSING ${FILE}`)
    console.error("Create it by copying your previous XP .env.local, or restore from backup.")
    process.exit(2)
  }
  const env = { ...process.env }
  for (const line of readFileSync(FILE, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=")
    if (i <= 0 || line.startsWith("#")) continue
    const key = line.slice(0, i).trim()
    if (!key) continue
    env[key] = line.slice(i + 1).trim()
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

const env = loadXpLocal()
env.ALLOW_XP = "1"
env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const appHost = hostOf(env.NEXT_PUBLIC_SUPABASE_URL)
console.log(`XP_APP_HOST=${appHost || "MISSING"}`)
if (appHost !== XP_HOST) {
  console.error(`REFUSED: ${FILE} must point at ScorApp-XP (${XP_HOST})`)
  process.exit(2)
}

console.log("Starting next dev with ALLOW_XP=1 (ScorApp-XP)")
const child = spawn("npx", ["next", "dev"], {
  env,
  stdio: "inherit",
  shell: true,
})
child.on("exit", (code) => process.exit(code ?? 0))
