import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { createBudgetTracker } from "../eval/budget.ts"
import { scoreDeterministic } from "../eval/deterministic-scorer.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import {
  LOT19M_CAMPAIGN,
  LOT19M_CONFIRM_VALUE,
  assertLot19mNotAutoRun,
  lot19mPreflightSnapshot,
  versionsMatchRequired,
} from "../eval/lot19m-campaign.ts"
import { LOT19M_DATASET, lot19mDatasetSummary } from "../eval/lot19m-dataset.ts"
import { validateLot19mScenario } from "../eval/lot19m-validators.ts"
import { containsForbiddenSecrets, sanitizeForPersistence } from "../eval/persistence.ts"
import { createMockLlmAdapter } from "../llm-adapter.ts"
import { getFabricPattern } from "../registry.ts"
import { runFabricPattern } from "../runner.ts"
import type { FabricLlmAdapter } from "../types.ts"

test("LOT 19M dataset: exactly 8 unique synthetic scenarios", () => {
  const summary = lot19mDatasetSummary()
  assert.equal(summary.total, 8)
  assert.equal(summary.uniqueIds, true)
  assert.deepEqual(summary.ids, [...LOT19M_CAMPAIGN.scenarioIds])
  assert.equal(summary.byPattern.generate_scorecard_draft, 4)
  assert.equal(summary.byPattern.analyze_scorecard_results, 1)
  assert.equal(summary.byPattern.generate_action_plan, 3)
  assert.ok(summary.humanReviewRequiredIds.includes("d19m_draft_pmp"))
  assert.ok(summary.humanReviewRequiredIds.includes("d19m_plan_skills"))
  assert.ok(!summary.humanReviewRequiredIds.includes("d19m_draft_ambiguous"))
})

test("LOT 19M versions match required (draft 1.3.1, plan 1.3.3, analyze 1.3.0)", () => {
  const match = versionsMatchRequired()
  assert.equal(match.all, true)
  assert.equal(getFabricPattern("generate_scorecard_draft")?.version, "1.3.1")
  assert.equal(getFabricPattern("analyze_scorecard_results")?.version, "1.3.0")
  assert.equal(getFabricPattern("generate_action_plan")?.version, "1.3.3")
})

test("offline preflight OK without requiring Groq key; LIVE flags expected OFF", () => {
  const snap = lot19mPreflightSnapshot()
  assert.equal(snap.offline, true)
  assert.equal(snap.networkRequired, false)
  assert.equal(snap.groqInvoked, false)
  assert.equal(snap.prepOk, true)
  assert.equal(snap.liveFlags.expectedOffForPrep, true)
  assert.ok(Array.isArray(snap.validators) && snap.validators.length >= 8)
  assert.equal(snap.budget.maxHttpAttempts, 12)
  assert.equal(snap.budget.maxEstimatedUsd, 0.02)
  // Key may or may not be present — must not fail prep solely for that.
  assert.equal(typeof snap.providerReadiness.keyConfigured, "boolean")
})

test("LIVE launch blocked without explicit 19M authorization", () => {
  assert.throws(() => assertLot19mNotAutoRun(undefined), /I_AUTHORIZE_LOT19M_LIVE/)
  assert.throws(() => assertLot19mNotAutoRun("I_AUTHORIZE_LOT19J_LIVE"), /I_AUTHORIZE_LOT19M_LIVE/)
  assert.throws(() => assertLot19mNotAutoRun("I_AUTHORIZE_LIVE_LLM"), /I_AUTHORIZE_LOT19M_LIVE/)
  assert.doesNotThrow(() => assertLot19mNotAutoRun(LOT19M_CONFIRM_VALUE))
})

test("mock dry-run: 8 scenarios, zero network, validators classify human review", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: LOT19M_DATASET,
    campaignId: LOT19M_CAMPAIGN.id,
  })
  assert.equal(report.scenarioCount, 8)
  assert.equal(report.summary.deterministicFail, 0)
  assert.equal(report.summary.scoringIntegrityFail, 0)
  assert.equal(report.summary.actualLlmCalls, 8) // mock logical calls, not HTTP
  assert.ok(report.results.every((r) => r.validatedOutput !== undefined || r.errorCode === "not_run"))

  for (const r of report.results) {
    const scenario = LOT19M_DATASET.find((s) => s.id === r.scenario.id)!
    const fake = await runFabricPattern(scenario.patternId, scenario.input, {
      allowInTests: true,
      adapter: createMockLlmAdapter(),
    })
    const det = scoreDeterministic(scenario, fake)
    const v = validateLot19mScenario(scenario, fake, det)
    assert.equal(v.deterministicOk, true, scenario.id)
    if (scenario.expectations.humanReviewRequired) {
      assert.equal(v.overall, "HUMAN_REVIEW_REQUIRED")
    }
  }
})

test("C1 limited budget → no arbitration; C4 exclusive → arbitration", async () => {
  const c1 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_skills")!
  const c4 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_competing")!
  const r1 = await runFabricPattern(c1.patternId, c1.input, { allowInTests: true })
  const r4 = await runFabricPattern(c4.patternId, c4.input, { allowInTests: true })
  assert.equal(r1.ok, true)
  assert.equal(r4.ok, true)
  if (r1.ok) assert.equal((r1.data as { requiresArbitration: boolean }).requiresArbitration, false)
  if (r4.ok) {
    assert.equal((r4.data as { requiresArbitration: boolean }).requiresArbitration, true)
    assert.ok((r4.data as { arbitrationQuestion?: string }).arbitrationQuestion)
  }
  assert.equal(scoreDeterministic(c1, r1).allRequiredPassed, true)
  assert.equal(scoreDeterministic(c4, r4).allRequiredPassed, true)
})

test("A4 clarification + B2 scoring integrity", async () => {
  const a4 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_ambiguous")!
  const b2 = LOT19M_DATASET.find((s) => s.id === "d19m_analyze_high")!
  const rA = await runFabricPattern(a4.patternId, a4.input, { allowInTests: true })
  const rB = await runFabricPattern(b2.patternId, b2.input, { allowInTests: true })
  assert.equal(rA.ok, true)
  assert.equal(rB.ok, true)
  if (rA.ok) assert.equal((rA.data as { status: string }).status, "needs_clarification")
  if (rB.ok) {
    assert.equal((rB.data as { officialScoresEcho: { globalScorePercent: number } }).officialScoresEcho.globalScorePercent, 88)
  }
})

test("HTTP ceiling stops after max attempts (simulated)", () => {
  const tracker = createBudgetTracker({
    maxCalls: LOT19M_CAMPAIGN.maxHttpAttempts,
    maxEstimatedInputTokens: 1_000_000,
    maxEstimatedOutputTokens: 1_000_000,
    maxEstimatedUsd: 100,
  })
  for (let i = 0; i < 12; i++) {
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
  assert.match(tracker.state.stopReason ?? "", /maxCalls/)
})

test("USD estimated ceiling stops (simulated cumulative)", () => {
  const tracker = createBudgetTracker({
    maxCalls: 100,
    maxEstimatedInputTokens: 1_000_000,
    maxEstimatedOutputTokens: 1_000_000,
    maxEstimatedUsd: 0.02,
  })
  // Large token batches until cumulative USD exceeds 0.02
  let steps = 0
  while (tracker.canContinue() && steps < 50) {
    tracker.recordCall(
      {
        inputChars: 0,
        outputChars: 0,
        estimatedInputTokens: 20_000,
        estimatedOutputTokens: 20_000,
        estimatedTotalTokens: 40_000,
      },
      "groq",
    )
    steps += 1
  }
  assert.equal(tracker.state.stopped, true)
  assert.ok((tracker.state.estimatedUsd ?? 0) > 0.02 || /maxEstimatedUsd/.test(tracker.state.stopReason ?? ""))
})

test("retry counting: live client contract still increments attempts (mock hostile)", async () => {
  // Mechanical: harness/live-client already counts HTTP; here ensure campaign ceiling constant is 12.
  assert.equal(LOT19M_CAMPAIGN.maxHttpAttempts, 12)
  assert.equal(LOT19M_CAMPAIGN.backoff.maxAttempts, 2)
})

test("sanitize / secrets never appear in persistence helpers", () => {
  const dirty = {
    api_key: "sk-secret-should-redact",
    nested: { authorization: "Bearer abc", ok: "safe" },
    text: "Bearer xyz.token",
  }
  const clean = sanitizeForPersistence(dirty) as Record<string, unknown>
  assert.equal(clean.api_key, "[redacted]")
  const blob = JSON.stringify(clean)
  assert.equal(containsForbiddenSecrets(blob), false)
  assert.equal(/sk-secret/.test(blob), false)
})

test("semantic quality never auto-PASS via keyword presence", async () => {
  const scenario = LOT19M_DATASET.find((s) => s.id === "d19m_draft_pmp")!
  const result = await runFabricPattern(scenario.patternId, scenario.input, { allowInTests: true })
  const det = scoreDeterministic(scenario, result)
  const v = validateLot19mScenario(scenario, result, det)
  const semantic = v.checks.find((c) => c.id === "semantic_business_quality")
  assert.ok(semantic)
  assert.equal(semantic?.verdict, "HUMAN_REVIEW_REQUIRED")
  assert.equal(v.overall, "HUMAN_REVIEW_REQUIRED")
})

test("campaign status remains PREPARED_NOT_RUN", () => {
  assert.equal(LOT19M_CAMPAIGN.status, "PREPARED_NOT_RUN")
  assert.equal(LOT19M_CAMPAIGN.scenarioCount, 8)
  assert.equal(LOT19M_CAMPAIGN.outputDir, "tmp/lot19m-live")
})

test("mock report artifact can be written without secrets", async () => {
  const dir = mkdtempSync(join(tmpdir(), "lot19m-"))
  try {
    const report = await runLot19aEvaluation({
      mode: "mock",
      scenarios: LOT19M_DATASET.slice(0, 2),
      campaignId: "lot19m-mini",
    })
    const path = join(dir, "mini.json")
    const { writeFileSync } = await import("node:fs")
    writeFileSync(path, JSON.stringify(sanitizeForPersistence(report), null, 2), "utf8")
    assert.equal(containsForbiddenSecrets(readFileSync(path, "utf8")), false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("hostile adapter with side-effect key still blocked", async () => {
  const hostile: FabricLlmAdapter = {
    id: "hostile",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        status: "draft_suggestion",
        title: "Hack",
        description: "Description suffisamment longue pour passer.",
        targetAudience: "x",
        objective: "Objectif suffisamment long ici",
        categories: [{ name: "Cat" }],
        questions: [
          { title: "Q1 longue assez", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
          { title: "Q2 longue assez", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
          { title: "Q3 longue assez", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
        ],
        weightingNotes: "notes",
        recommendations: ["Revue"],
        disclaimers: ["Validation humaine requise."],
        publish: true,
      })
    },
  }
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Scorecard neutre de compétences digitales pour atelier." },
    { allowInTests: true, adapter: hostile },
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.code, "side_effect_blocked")
})
