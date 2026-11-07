import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { listFabricPatterns } from "../registry.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import { LOT19D_DATASET, lot19dDatasetSummary } from "../eval/lot19d-dataset.ts"
import {
  LOT19D_CAMPAIGN,
  LOT19D_CONFIRM_VALUE,
  assertLot19dNotAutoRun,
  estimateLot19dCostCeilingUsd,
} from "../eval/lot19d-campaign.ts"
import {
  buildTraceRecords,
  persistLot19dArtifacts,
  sanitizeForPersistence,
  containsForbiddenSecrets,
  buildHumanReviewWorksheet,
} from "../eval/persistence.ts"
import { createBudgetTracker } from "../eval/budget.ts"
import { QUALITY_CRITERIA } from "../eval/quality-rubric.ts"

test("LOT 19D dataset has 12 synthetic scenarios (4 per pattern)", () => {
  const summary = lot19dDatasetSummary()
  assert.equal(summary.total, 12)
  assert.equal(summary.byPattern.generate_scorecard_draft, 4)
  assert.equal(summary.byPattern.analyze_scorecard_results, 4)
  assert.equal(summary.byPattern.generate_action_plan, 4)
  assert.ok(LOT19D_DATASET.every((s) => s.id.startsWith("d19d_")))
})

test("LOT 19D campaign still pins historical 1.2.0; runtime is 1.3.x", () => {
  const listed = listFabricPatterns()
  assert.ok(listed.every((p) => /^1\.3\.\d+$/.test(p.version)))
  // Campaign constant still documents 1.2.0 LIVE baseline — do not relabel historical artefacts.
  assert.equal(LOT19D_CAMPAIGN.patternVersionRequired, "1.2.0")
})

test("LOT 19D campaign is gated and not auto-run", () => {
  assert.equal(LOT19D_CAMPAIGN.status, "PREPARED_NOT_RUN")
  assert.equal(LOT19D_CAMPAIGN.maxHttpAttempts, 16)
  assert.equal(LOT19D_CAMPAIGN.scenarioCount, 12)
  assert.throws(() => assertLot19dNotAutoRun(undefined), /I_AUTHORIZE_LOT19D_LIVE/)
  assert.throws(() => assertLot19dNotAutoRun("I_AUTHORIZE_LOT19B_LIVE"), /I_AUTHORIZE_LOT19D_LIVE/)
  assert.doesNotThrow(() => assertLot19dNotAutoRun(LOT19D_CONFIRM_VALUE))
})

test("mock run of LOT 19D dataset persists traces without secrets", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: LOT19D_DATASET,
    campaignId: LOT19D_CAMPAIGN.id,
  })
  assert.equal(report.scenarioCount, 12)
  assert.ok(report.summary.deterministicPass >= 10)
  assert.equal(report.summary.scoringIntegrityFail, 0)

  const withOutput = report.results.filter((r) => r.deterministic.runOk)
  assert.ok(withOutput.every((r) => r.validatedOutput !== undefined))
  assert.ok(withOutput.every((r) => /^1\.3\.\d+$/.test(String(r.patternVersion ?? ""))))
  assert.ok(withOutput.every((r) => r.syntheticInput !== undefined))

  const traces = buildTraceRecords(report.results, "mock")
  assert.equal(traces.length, 12)

  const worksheet = buildHumanReviewWorksheet(traces)
  assert.equal(worksheet.scenarios.length, 12)
  assert.equal(worksheet.criteria.length, QUALITY_CRITERIA.length)
  assert.ok(worksheet.scenarios.every((s) => s.scores.every((sc) => sc.score === null)))

  const dir = mkdtempSync(join(tmpdir(), "lot19d-"))
  try {
    const paths = persistLot19dArtifacts({
      cwd: dir,
      outputDir: "out",
      campaignId: "lot19d-test",
      report,
      traces,
    })
    const full = readFileSync(paths.fullPath, "utf8")
    const review = readFileSync(paths.reviewPath, "utf8")
    assert.equal(containsForbiddenSecrets(full), false)
    assert.equal(containsForbiddenSecrets(review), false)
    assert.ok(full.includes("validatedOutput") || full.includes("d19d_"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("sanitize strips secret-like keys", () => {
  const cleaned = sanitizeForPersistence({
    title: "ok",
    apiKey: "sk-should-not-leak",
    nested: { authorization: "Bearer abc", note: "fine" },
  }) as Record<string, unknown>
  assert.equal(cleaned.title, "ok")
  assert.equal(cleaned.apiKey, "[redacted]")
  assert.equal((cleaned.nested as Record<string, unknown>).authorization, "[redacted]")
  assert.equal((cleaned.nested as Record<string, unknown>).note, "fine")
})

test("budget ceiling stops at max HTTP attempts", () => {
  const tracker = createBudgetTracker({
    maxCalls: 16,
    maxEstimatedInputTokens: 1_000_000,
    maxEstimatedOutputTokens: 1_000_000,
    maxEstimatedUsd: 100,
  })
  for (let i = 0; i < 16; i++) {
    tracker.recordCall(
      {
        inputChars: 10,
        outputChars: 10,
        estimatedInputTokens: 1,
        estimatedOutputTokens: 1,
        estimatedTotalTokens: 2,
      },
      "groq",
    )
  }
  assert.equal(tracker.canContinue(), true)
  tracker.recordCall(
    {
      inputChars: 10,
      outputChars: 10,
      estimatedInputTokens: 1,
      estimatedOutputTokens: 1,
      estimatedTotalTokens: 2,
    },
    "groq",
  )
  assert.equal(tracker.state.stopped, true)
})

test("cost ceiling estimate is documented and bounded", () => {
  const cost = estimateLot19dCostCeilingUsd()
  assert.ok(cost.highUsd <= 0.05)
  assert.ok(cost.lowUsd > 0)
})
