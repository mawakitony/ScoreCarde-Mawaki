import assert from "node:assert/strict"
import { test } from "node:test"
import { LOT19A_DATASET, datasetSummary } from "../eval/dataset.ts"
import { runLot19aEvaluation, preflightDiagnostic } from "../eval/harness.ts"
import { getLiveGateStatus, LIVE_CONFIRM_VALUE } from "../eval/live-gate.ts"
import { createBudgetTracker } from "../eval/budget.ts"
import { estimateTokensFromChars } from "../eval/cost-model.ts"
import { QUALITY_CRITERIA } from "../eval/quality-rubric.ts"
import { ASSISTANT_BENCHMARK_STATUS } from "../eval/assistant-baseline.ts"

test("dataset has 10 scenarios per pattern", () => {
  const summary = datasetSummary()
  assert.equal(summary.total, 30)
  assert.equal(summary.byPattern.generate_scorecard_draft, 10)
  assert.equal(summary.byPattern.analyze_scorecard_results, 10)
  assert.equal(summary.byPattern.generate_action_plan, 10)
  assert.ok(summary.security >= 3)
})

test("preflight shows live blocked by default", () => {
  const preflight = preflightDiagnostic()
  assert.equal(preflight.fabricEngineIsolated, true)
  assert.equal(preflight.noPublicRoute, true)
  assert.equal(preflight.liveGate.canRunLive, false)
  assert.ok(preflight.liveGate.blockers.length >= 1)
  assert.equal(preflight.authorizationRequired, true)
})

test("live gate requires confirm string", () => {
  const status = getLiveGateStatus()
  assert.equal(status.confirmOk, false)
  assert.equal(LIVE_CONFIRM_VALUE, "I_AUTHORIZE_LIVE_LLM")
})

test("mock evaluation runs all scenarios without paid calls", async () => {
  const report = await runLot19aEvaluation({ mode: "mock" })
  assert.equal(report.mode, "mock")
  assert.equal(report.scenarioCount, 30)
  assert.equal(report.assistantBenchmark.status, "NOT RUN")
  assert.equal(report.integrationDecision.generate_scorecard_draft, "NOT EVALUATED")
  assert.ok(report.summary.deterministicPass >= 25)
  assert.equal(report.results.every((item) => item.qualitative.status === "pending_human"), true)

  const integrity = report.results.filter((item) =>
    item.deterministic.checks.some((check) => check.id === "scoring_integrity"),
  )
  assert.ok(integrity.length >= 1)
  assert.equal(integrity.every((item) => item.deterministic.checks.find((c) => c.id === "scoring_integrity")?.pass), true)
})

test("security scenarios reject injection drafts/plans", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarioIds: ["draft_injection", "plan_injection", "draft_incomplete"],
  })
  assert.equal(report.scenarioCount, 3)
  for (const item of report.results) {
    assert.equal(item.deterministic.allRequiredPassed, true, item.scenario.id)
    assert.equal(item.deterministic.runOk, false)
  }
})

test("budget tracker stops after max calls", () => {
  const tracker = createBudgetTracker({
    maxCalls: 2,
    maxEstimatedInputTokens: 1_000_000,
    maxEstimatedOutputTokens: 1_000_000,
    maxEstimatedUsd: 100,
  })
  const tokens = estimateTokensFromChars(100, 100)
  tracker.recordCall(tokens, "groq")
  assert.equal(tracker.canContinue(), true)
  tracker.recordCall(tokens, "groq")
  assert.equal(tracker.canContinue(), true)
  tracker.recordCall(tokens, "groq")
  assert.equal(tracker.state.stopped, true)
})

test("quality rubric has 10 criteria and assistant benchmark is documented", () => {
  assert.equal(QUALITY_CRITERIA.length, 10)
  assert.equal(ASSISTANT_BENCHMARK_STATUS.liveRequiredForScores, true)
  assert.ok(LOT19A_DATASET.every((item) => item.id && item.patternId))
})

test("live mode throws without authorization", async () => {
  // Guard against leftover shell LIVE flags from prior authorized campaigns.
  const prev = {
    confirm: process.env.FABRIC_EVAL_CONFIRM,
    live: process.env.FABRIC_PROTOTYPE_LIVE,
    enabled: process.env.FABRIC_PROTOTYPE_ENABLED,
  }
  delete process.env.FABRIC_EVAL_CONFIRM
  delete process.env.FABRIC_PROTOTYPE_LIVE
  delete process.env.FABRIC_PROTOTYPE_ENABLED
  try {
    await assert.rejects(() => runLot19aEvaluation({ mode: "live" }), /Cannot run LIVE|blocked/i)
  } finally {
    if (prev.confirm !== undefined) process.env.FABRIC_EVAL_CONFIRM = prev.confirm
    else delete process.env.FABRIC_EVAL_CONFIRM
    if (prev.live !== undefined) process.env.FABRIC_PROTOTYPE_LIVE = prev.live
    else delete process.env.FABRIC_PROTOTYPE_LIVE
    if (prev.enabled !== undefined) process.env.FABRIC_PROTOTYPE_ENABLED = prev.enabled
    else delete process.env.FABRIC_PROTOTYPE_ENABLED
  }
})
