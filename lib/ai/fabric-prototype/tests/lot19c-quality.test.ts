import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { listFabricPatterns, getFabricPattern } from "../registry.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import {
  QUALITY_CRITERIA,
  CRITERION_MODE,
  averageScores,
  notAvailableReview,
  criteriaByMode,
} from "../eval/quality-rubric.ts"
import { PROPOSED_ACCEPTANCE, buildDefaultChecklists } from "../eval/acceptance-criteria.ts"
import { runFabricPattern } from "../runner.ts"
import { createMockLlmAdapter } from "../llm-adapter.ts"

const fabricRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

test("LOT 19C rubric: 10 criteria with mode classification; average ignores unevaluable", () => {
  assert.equal(QUALITY_CRITERIA.length, 10)
  assert.ok(criteriaByMode("deterministic").includes("respect_donnees"))
  assert.ok(criteriaByMode("human_judgment").includes("pertinence"))
  assert.equal(
    averageScores([
      { criterion: "pertinence", score: 4, unevaluable: true },
      { criterion: "precision", score: 5 },
    ]),
    5,
  )
  assert.equal(averageScores([{ criterion: "pertinence", score: 0, unevaluable: true }]), null)

  const na = notAvailableReview("draft_pmp", "generate_scorecard_draft", "payload absent")
  assert.equal(na.status, "not_available")
  assert.equal(na.overallAverage, null)
})

test("Patterns are versioned 1.3.x with quality constraints retained", () => {
  const listed = listFabricPatterns()
  assert.equal(listed.length, 3)
  for (const item of listed) {
    assert.match(item.version, /^1\.3\.\d+$/, item.id)
    assert.ok(item.businessConstraints.length >= 5)
  }
  const draft = getFabricPattern("generate_scorecard_draft")
  assert.ok(draft?.systemInstructions.includes("VERSION=1.3."))
  assert.ok(draft?.systemInstructions.includes("PMI"))
  assert.ok(draft?.systemInstructions.includes("needs_clarification"))
  assert.ok(draft?.systemInstructions.includes("ANTI-BIAIS") || draft?.version === "1.3.1")
  const analyze = getFabricPattern("analyze_scorecard_results")
  assert.ok(analyze?.systemInstructions.includes("Ne recalcule"))
  assert.ok(analyze?.systemInstructions.includes("facts"))
  const plan = getFabricPattern("generate_action_plan")
  assert.ok(plan?.systemInstructions.includes("Améliorez vos compétences"))
  assert.ok(plan?.systemInstructions.includes("requiresArbitration"))
})

test("acceptance criteria are proposed gates, not READY claims", () => {
  assert.equal(PROPOSED_ACCEPTANCE.zodConformityPercent, 95)
  assert.equal(PROPOSED_ACCEPTANCE.qualitativeAverageMin, 4)
  assert.equal(PROPOSED_ACCEPTANCE.officialScoreIntegrityPercent, 100)
  const checklists = buildDefaultChecklists()
  assert.equal(checklists.length, 3)
  assert.ok(checklists.every((item) => item.status === "NEEDS_IMPROVEMENT"))
})

test("mock non-regression: 30 scénarios + validatedOutput persisted on OK", async () => {
  const report = await runLot19aEvaluation({ mode: "mock" })
  assert.equal(report.scenarioCount, 30)
  assert.ok(report.summary.deterministicPass >= 25)
  assert.equal(report.summary.scoringIntegrityFail, 0)

  const okWithData = report.results.filter((item) => item.deterministic.runOk)
  assert.ok(okWithData.length >= 20)
  assert.ok(okWithData.every((item) => item.validatedOutput !== undefined))

  const integrity = report.results.filter((item) =>
    item.deterministic.checks.some((check) => check.id === "scoring_integrity"),
  )
  assert.ok(integrity.length >= 1)
  assert.equal(
    integrity.every((item) => item.deterministic.checks.find((c) => c.id === "scoring_integrity")?.pass),
    true,
  )
})

test("injection / incomplete still reject without LLM side effects", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarioIds: ["draft_injection", "plan_injection", "analyze_mutate_scores"],
  })
  assert.equal(report.scenarioCount, 3)
  for (const item of report.results) {
    assert.equal(item.deterministic.allRequiredPassed, true, item.scenario.id)
  }
  const mutate = report.results.find((item) => item.scenario.id === "analyze_mutate_scores")
  assert.ok(mutate)
  assert.equal(mutate!.deterministic.runOk, true)
  const echo = mutate!.validatedOutput as { officialScoresEcho?: { globalScorePercent?: number } }
  assert.equal(echo.officialScoresEcho?.globalScorePercent, 33)
})

test("criterion modes distinguish deterministic vs human vs payload-dependent", () => {
  assert.equal(CRITERION_MODE.qualite_structure, "deterministic")
  assert.equal(CRITERION_MODE.pertinence, "human_judgment")
  // Human criteria become requires_live_payload when text missing — documented via notAvailableReview.
  assert.equal(CRITERION_MODE.exploitabilite_woloyem, "human_judgment")
})

test("no fabric pattern imports production assistant or scoring writes", () => {
  const runner = readFileSync(join(fabricRoot, "runner.ts"), "utf8")
  assert.equal(/from ["']@\/lib\/ai\/agent/.test(runner), false)
  assert.equal(/serverAction|stripe\.|createClient/.test(runner), false)
})

test("mock adapter still completes draft without live flags", async () => {
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description: "Scorecard de qualification commerciale pour prospects B2B mid-market.",
      locale: "fr",
      maxQuestions: 10,
      maxCategories: 3,
    },
    { allowInTests: true, adapter: createMockLlmAdapter() },
  )
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal((result.data as { status: string }).status, "draft_suggestion")
  }
})
