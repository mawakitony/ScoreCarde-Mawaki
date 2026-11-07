/**
 * Removes synthetic Lot 7 fixtures from the isolated E2E project only.
 */
import { readFileSync } from "node:fs"

function load(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const index = line.indexOf("=")
      if (index <= 0 || line.startsWith("#")) continue
      const key = line.slice(0, index).trim()
      if (!key || process.env[key]) continue
      process.env[key] = line.slice(index + 1).trim()
    }
  } catch {
    // optional
  }
}

load(".env.e2e.local")
load(".env.local")

const { e2eIsolatedAllowed, e2eIsolatedBlockReason } = await import("../lib/env.ts")
if (!e2eIsolatedAllowed()) {
  console.error(`Refusing cleanup: ${e2eIsolatedBlockReason()}`)
  process.exit(2)
}

const { cleanupIsolatedFixtures } = await import("../tests/e2e/helpers/fixtures.ts")
await cleanupIsolatedFixtures()
console.log("CLEANUP_OK")
