/**
 * Seeds synthetic Lot 7 fixtures into the isolated E2E project only.
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
  console.error(`Refusing seed: ${e2eIsolatedBlockReason()}`)
  process.exit(2)
}

const { seedIsolatedFixtures } = await import("../tests/e2e/helpers/fixtures.ts")
const bundle = await seedIsolatedFixtures()
console.log("SEED_OK")
console.log(`prefix=${bundle.prefix}`)
console.log(`organizationId=${bundle.organizationId}`)
console.log(`scorecardId=${bundle.scorecardId}`)
console.log(`leadId=${bundle.leadId || "none"}`)
console.log("emails=owner/admin/viewer @example.com (values not printed)")
