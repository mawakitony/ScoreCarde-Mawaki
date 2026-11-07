import assert from "node:assert/strict"
import { test } from "node:test"
import { getFabricPattern } from "../registry.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import { LOT19F_DATASET, lot19fDatasetSummary } from "../eval/lot19f-dataset.ts"
import {
  LOT19F_CAMPAIGN,
  LOT19F_CONFIRM_VALUE,
  assertLot19fNotAutoRun,
  lot19fPreflightSnapshot,
} from "../eval/lot19f-campaign.ts"

test("LOT 19F dataset: 4 synthetic action-plan scenarios", () => {
  const summary = lot19fDatasetSummary()
  assert.equal(summary.total, 4)
  assert.equal(summary.allActionPlan, true)
  assert.deepEqual(summary.ids, [
    "d19f_plan_skills",
    "d19f_plan_pmo",
    "d19f_plan_digital",
    "d19f_plan_competing",
  ])
})

test("LOT 19F campaign gates remain; runtime pattern is 1.3.x", () => {
  assert.equal(LOT19F_CAMPAIGN.status, "PREPARED_NOT_RUN")
  assert.equal(LOT19F_CAMPAIGN.maxHttpAttempts, 6)
  assert.equal(LOT19F_CAMPAIGN.minSpacingMs, 4_000)
  assert.equal(LOT19F_CAMPAIGN.tpmLimit, 8_000)
  assert.equal(LOT19F_CAMPAIGN.patternVersionRequired, "1.2.1")
  const pattern = getFabricPattern("generate_action_plan")
  assert.match(pattern?.version ?? "", /^1\.3\.\d+$/)
  const snap = lot19fPreflightSnapshot()
  // Historical LIVE campaign pinned 1.2.1; code moved to 1.3.x — do not relabel.
  assert.equal(snap.patternAtRequiredVersion, false)
  assert.throws(() => assertLot19fNotAutoRun(undefined), /I_AUTHORIZE_LOT19F_LIVE/)
  assert.throws(() => assertLot19fNotAutoRun("I_AUTHORIZE_LOT19E_PLAN_LIVE"), /I_AUTHORIZE_LOT19F_LIVE/)
  assert.doesNotThrow(() => assertLot19fNotAutoRun(LOT19F_CONFIRM_VALUE))
})

test("mock LOT 19F scenarios pass without paid calls", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: LOT19F_DATASET,
    campaignId: LOT19F_CAMPAIGN.id,
  })
  assert.equal(report.scenarioCount, 4)
  assert.equal(report.summary.deterministicFail, 0)
  assert.ok(report.results.every((r) => r.validatedOutput !== undefined))
  assert.ok(report.results.every((r) => /^1\.3\.\d+$/.test(r.patternVersion ?? "")))
})
