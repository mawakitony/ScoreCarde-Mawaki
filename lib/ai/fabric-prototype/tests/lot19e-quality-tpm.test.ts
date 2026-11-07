import assert from "node:assert/strict"
import { test } from "node:test"
import { listFabricPatterns, getFabricPattern } from "../registry.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import { LOT19D_DATASET } from "../eval/lot19d-dataset.ts"
import {
  LOT19E_PLAN_RETEST,
  LOT19E_PLAN_CONFIRM_VALUE,
  assertLot19ePlanNotAutoRun,
  resolveLot19ePlanScenarios,
} from "../eval/lot19e-plan-retest.ts"
import {
  classifyProviderError,
  computeBackoffMs,
  computeTpmSpacingMs,
  MAX_RETRY_AFTER_MS,
} from "../eval/retry.ts"
import { createBudgetTracker } from "../eval/budget.ts"

test("Patterns on 1.3.x with TPM-oriented limits retained", () => {
  const listed = listFabricPatterns()
  assert.ok(listed.every((p) => /^1\.3\.\d+$/.test(p.version)))
  const draft = getFabricPattern("generate_scorecard_draft")
  assert.ok((draft?.limits.maxOutputChars ?? 0) <= 10_000)
  assert.ok(draft?.systemInstructions.includes("needs_clarification"))
  assert.ok(draft?.systemInstructions.includes("email / phone") || draft?.systemInstructions.includes("email/phone"))
  const analyze = getFabricPattern("analyze_scorecard_results")
  assert.ok(analyze?.systemInstructions.includes("5 points"))
  const plan = getFabricPattern("generate_action_plan")
  assert.ok((plan?.limits.maxOutputChars ?? 0) <= 8_000)
})

test("429 Retry-After is honored above maxDelayMs (TPM recovery)", () => {
  const classified = classifyProviderError(
    new Error(
      'Groq HTTP 429: Rate limit TPM. Please try again in 5.46s. retry-after=6',
    ),
  )
  assert.equal(classified.kind, "http_429")
  assert.equal(classified.retryAfterMs, 6000)
  const delay = computeBackoffMs(1, { maxAttempts: 3, baseDelayMs: 700, maxDelayMs: 3_000 }, 12_000)
  assert.equal(delay, 12_000)
  assert.ok(delay <= MAX_RETRY_AFTER_MS)
})

test("TPM spacing scales with last call tokens", () => {
  const wait = computeTpmSpacingMs(3100, 8_000, 1_500)
  // 3100/8000 * 60000 + 1500 ≈ 24750
  assert.ok(wait >= 20_000)
  assert.ok(wait <= 30_000)
  assert.equal(computeTpmSpacingMs(0, 8_000), 0)
})

test("LOT 19E plan retest is gated and plan-only", () => {
  assert.equal(LOT19E_PLAN_RETEST.status, "PREPARED_NOT_RUN")
  assert.equal(LOT19E_PLAN_RETEST.maxHttpAttempts, 6)
  assert.equal(LOT19E_PLAN_RETEST.scenarioIds.length, 4)
  assert.equal(resolveLot19ePlanScenarios().length, 4)
  assert.ok(resolveLot19ePlanScenarios().every((s) => s.patternId === "generate_action_plan"))
  assert.throws(() => assertLot19ePlanNotAutoRun(undefined), /I_AUTHORIZE_LOT19E_PLAN_LIVE/)
  assert.throws(() => assertLot19ePlanNotAutoRun("I_AUTHORIZE_LOT19D_LIVE"), /I_AUTHORIZE_LOT19E_PLAN_LIVE/)
  assert.doesNotThrow(() => assertLot19ePlanNotAutoRun(LOT19E_PLAN_CONFIRM_VALUE))
})

test("mock plan scenarios still pass after 1.3.x", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: resolveLot19ePlanScenarios(),
    campaignId: "lot19e-mock",
  })
  assert.equal(report.scenarioCount, 4)
  assert.equal(report.summary.deterministicFail, 0)
  assert.ok(report.results.every((r) => /^1\.3\.\d+$/.test(r.patternVersion ?? "")))
  assert.ok(report.results.every((r) => r.validatedOutput !== undefined))
})

test("HTTP ceiling still stops at max attempts", () => {
  const tracker = createBudgetTracker({
    maxCalls: 6,
    maxEstimatedInputTokens: 1_000_000,
    maxEstimatedOutputTokens: 1_000_000,
    maxEstimatedUsd: 100,
  })
  for (let i = 0; i < 6; i++) {
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

test("full LOT19D mock dataset still green on 1.3.x", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: LOT19D_DATASET,
    campaignId: "lot19e-regression",
  })
  assert.equal(report.scenarioCount, 12)
  assert.ok(report.summary.deterministicPass >= 11)
  assert.equal(report.summary.scoringIntegrityFail, 0)
})
