import assert from "node:assert/strict"
import test from "node:test"
import { isMaintenanceDryRun } from "./maintenance-auth.ts"

test("maintenance dry_run is HEAD or ?dry_run=1", () => {
  assert.equal(isMaintenanceDryRun({ method: "HEAD", url: "https://x/api/cron/maintenance" }), true)
  assert.equal(isMaintenanceDryRun({ method: "GET", url: "https://x/api/cron/maintenance?dry_run=1" }), true)
  assert.equal(isMaintenanceDryRun({ method: "GET", url: "https://x/api/cron/maintenance" }), false)
  assert.equal(isMaintenanceDryRun({ method: "GET", url: "https://x/api/cron/maintenance?dry_run=0" }), false)
  assert.equal(isMaintenanceDryRun({ method: "POST", url: "https://x/api/cron/maintenance" }), false)
})
