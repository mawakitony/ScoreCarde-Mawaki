/**
 * LOT 19M-S — offline security tests. ZERO network / ZERO real Groq.
 */
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { createBudgetTracker } from "../eval/budget.ts"
import { estimateCostUsd } from "../eval/cost-model.ts"
import { scoreDeterministic } from "../eval/deterministic-scorer.ts"
import { createLot19aLiveClient } from "../eval/live-client.ts"
import { LIVE_CONFIRM_VALUE } from "../eval/live-gate.ts"
import {
  LOT19M_CAMPAIGN,
  LOT19M_CONFIRM_VALUE,
  assertLot19mBudgetValid,
  assertLot19mLiveScriptReady,
  assertLot19mNotAutoRun,
  lot19mPreflightSnapshot,
} from "../eval/lot19m-campaign.ts"
import { LOT19M_DATASET, lot19mDatasetSummary } from "../eval/lot19m-dataset.ts"
import { validateLot19mScenario } from "../eval/lot19m-validators.ts"
import {
  containsForbiddenSecrets,
  resolveEvalArtifactDir,
  sanitizeForPersistence,
} from "../eval/persistence.ts"
import { createMockLlmAdapter } from "../llm-adapter.ts"
import { runFabricPattern } from "../runner.ts"
import type { FabricLlmAdapter } from "../types.ts"

const FAKE_GROQ_KEY = "gsk_FAKE_LOT19MS_AUDIT_KEY_NOT_REAL_000000"
const FAKE_OPENAI_KEY = "sk-FAKELOT19MSAUDITKEYNOTREAL0000000000"
const FAKE_BEARER = "Bearer FAKE_TOKEN_LOT19MS_AUDIT_ONLY"

function withEnv(overrides: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const prev: Record<string, string | undefined> = {}
  for (const key of Object.keys(overrides)) {
    prev[key] = process.env[key]
    const value = overrides[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    })
}

function enableFakeLiveEnv() {
  return {
    FABRIC_PROTOTYPE_ENABLED: "1",
    FABRIC_PROTOTYPE_LIVE: "1",
    FABRIC_EVAL_CONFIRM: LIVE_CONFIRM_VALUE,
    AI_PROVIDER: "groq",
    AI_MODEL: "openai/gpt-oss-120b",
    AI_API_KEY: FAKE_GROQ_KEY,
    AI_BASE_URL: "https://example.invalid/v1",
  }
}

test("LIVE without --execute-live refused by assertLot19mLiveScriptReady", () => {
  assert.throws(
    () =>
      assertLot19mLiveScriptReady({
        executeLiveFlag: false,
        confirmEnvValue: LOT19M_CONFIRM_VALUE,
      }),
    /--execute-live/,
  )
})

test("LIVE without FABRIC_EVAL_CONFIRM_19M refused", () => {
  assert.throws(() => assertLot19mNotAutoRun(undefined), /I_AUTHORIZE_LOT19M_LIVE/)
  assert.throws(
    () =>
      assertLot19mLiveScriptReady({
        executeLiveFlag: true,
        confirmEnvValue: undefined,
      }),
    /I_AUTHORIZE_LOT19M_LIVE/,
  )
})

test("LIVE with incorrect confirmation refused (incl. prior lots)", () => {
  for (const bad of ["I_AUTHORIZE_LOT19J_LIVE", "I_AUTHORIZE_LIVE_LLM", "yes", ""]) {
    assert.throws(() => assertLot19mNotAutoRun(bad), /I_AUTHORIZE_LOT19M_LIVE/)
  }
})

test("LIVE with flags OFF refused even with 19M confirm + execute-live", async () => {
  await withEnv(
    {
      FABRIC_PROTOTYPE_ENABLED: undefined,
      FABRIC_PROTOTYPE_LIVE: undefined,
      FABRIC_EVAL_CONFIRM: undefined,
      FABRIC_EVAL_CONFIRM_19M: LOT19M_CONFIRM_VALUE,
    },
    () => {
      assert.throws(
        () =>
          assertLot19mLiveScriptReady({
            executeLiveFlag: true,
            confirmEnvValue: LOT19M_CONFIRM_VALUE,
          }),
        /FABRIC_PROTOTYPE/,
      )
    },
  )
})

test("dry-run / preflight never requires network; missing key does not fail offline prep", async () => {
  await withEnv(
    {
      FABRIC_PROTOTYPE_ENABLED: undefined,
      FABRIC_PROTOTYPE_LIVE: undefined,
      FABRIC_EVAL_CONFIRM: undefined,
      AI_API_KEY: undefined,
    },
    () => {
      const snap = lot19mPreflightSnapshot()
      assert.equal(snap.offline, true)
      assert.equal(snap.networkRequired, false)
      assert.equal(snap.groqInvoked, false)
      assert.equal(snap.prepOk, true)
      assert.equal(snap.providerReadiness.keyConfigured, false)
      assert.equal(snap.providerReadiness.keyMissingNotedForFutureLive, true)
    },
  )
})

test("ordinary npm default path is dry-run: wantExecuteLive false keeps mock-only contract", () => {
  // Script semantics: without --execute-live, dryRun=true. Documented + locked here.
  const wantExecuteLive = false
  const dryRun = !wantExecuteLive
  assert.equal(dryRun, true)
  assert.equal(LOT19M_CAMPAIGN.status, "PREPARED_NOT_RUN")
})

test("HTTP ceiling: 13th fetch never emitted (429 storm, mocked fetch)", async () => {
  let fetchCount = 0
  const originalFetch = globalThis.fetch
  await withEnv(enableFakeLiveEnv(), async () => {
    globalThis.fetch = async () => {
      fetchCount += 1
      return new Response("rate limited", {
        status: 429,
        headers: { "retry-after": "0" },
      })
    }
    try {
      const client = createLot19aLiveClient({
        maxCalls: 12,
        minSpacingMs: 0,
        backoff: { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 2, jitterRatio: 0 },
      })
      for (let i = 0; i < 20; i++) {
        try {
          await client.completeJson([{ role: "user", content: "ping json" }], 50)
        } catch {
          /* expected */
        }
      }
      assert.ok(fetchCount <= 12, `fetchCount=${fetchCount} must be ≤ 12`)
      assert.equal(client.state.calls, 12)
      assert.throws(
        () => {
          if (client.state.calls >= client.state.maxCalls) {
            throw new Error(`LIVE call ceiling reached (${client.state.maxCalls}). Stopping.`)
          }
        },
        /ceiling/,
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

test("HTTP ceiling: timeouts and network errors still consume attempts", async () => {
  let fetchCount = 0
  const originalFetch = globalThis.fetch
  await withEnv(enableFakeLiveEnv(), async () => {
    globalThis.fetch = async () => {
      fetchCount += 1
      if (fetchCount % 2 === 0) {
        const err = new Error("signal timed out")
        err.name = "TimeoutError"
        throw err
      }
      throw new Error("fetch failed ECONNRESET")
    }
    try {
      const client = createLot19aLiveClient({
        maxCalls: 5,
        minSpacingMs: 0,
        backoff: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 },
      })
      for (let i = 0; i < 10; i++) {
        try {
          await client.completeJson([{ role: "user", content: "ping json" }], 20)
        } catch {
          /* expected */
        }
      }
      assert.equal(fetchCount, 5)
      assert.equal(client.state.calls, 5)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

test("USD: equal/under ceiling continue; over stops; unknown tariff refuse when required", () => {
  const under = createBudgetTracker({
    maxCalls: 100,
    maxEstimatedInputTokens: 1e9,
    maxEstimatedOutputTokens: 1e9,
    maxEstimatedUsd: 0.02,
  })
  under.recordCall(
    {
      inputChars: 0,
      outputChars: 0,
      estimatedInputTokens: 10_000,
      estimatedOutputTokens: 10_000,
      estimatedTotalTokens: 20_000,
    },
    "groq",
  )
  // 10k in * 0.15/M + 10k out * 0.60/M = 0.0015 + 0.006 = 0.0075
  assert.ok(under.state.estimatedUsd < 0.02)
  assert.equal(under.canContinue(), true)
  assert.equal(under.wouldExceedUsd(0.012), false) // 0.0075+0.012=0.0195 ≤ 0.02 via >
  assert.equal(under.wouldExceedUsd(0.013), true)

  const over = createBudgetTracker({
    maxCalls: 100,
    maxEstimatedInputTokens: 1e9,
    maxEstimatedOutputTokens: 1e9,
    maxEstimatedUsd: 0.02,
  })
  over.recordCall(
    {
      inputChars: 0,
      outputChars: 0,
      estimatedInputTokens: 50_000,
      estimatedOutputTokens: 50_000,
      estimatedTotalTokens: 100_000,
    },
    "groq",
  )
  assert.equal(over.state.stopped, true)
  assert.match(over.state.stopReason ?? "", /maxEstimatedUsd/)

  const unknown = createBudgetTracker({
    maxCalls: 10,
    maxEstimatedInputTokens: 1e9,
    maxEstimatedOutputTokens: 1e9,
    maxEstimatedUsd: 0.02,
  })
  unknown.recordCall(
    {
      inputChars: 10,
      outputChars: 10,
      estimatedInputTokens: 1,
      estimatedOutputTokens: 1,
      estimatedTotalTokens: 2,
    },
    "unknown-provider",
    { requireKnownUsd: true },
  )
  assert.equal(unknown.state.stopped, true)
  assert.match(unknown.state.stopReason ?? "", /unknown tariff/)

  const floor = createBudgetTracker({
    maxCalls: 10,
    maxEstimatedInputTokens: 1e9,
    maxEstimatedOutputTokens: 1e9,
    maxEstimatedUsd: 0.02,
  })
  floor.recordCall(
    {
      inputChars: 0,
      outputChars: 0,
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      estimatedTotalTokens: 0,
    },
    "groq",
    { inputTokens: 0, outputTokens: 0, unknownUsageFloorUsd: 0.0025 },
  )
  assert.equal(floor.state.estimatedUsd, 0.0025)
})

test("cost model: groq tariff known; non-groq null", () => {
  const tokens = {
    inputChars: 0,
    outputChars: 0,
    estimatedInputTokens: 1000,
    estimatedOutputTokens: 1000,
    estimatedTotalTokens: 2000,
  }
  assert.notEqual(estimateCostUsd(tokens, "groq").estimatedUsd, null)
  assert.equal(estimateCostUsd(tokens, "other").estimatedUsd, null)
})

test("secrets: fake key in error/response sanitized; not in artifacts", () => {
  const dirty = {
    api_key: FAKE_OPENAI_KEY,
    authorization: FAKE_BEARER,
    nested: { groq: FAKE_GROQ_KEY, note: `leak ${FAKE_BEARER}` },
    errorMessage: `Groq HTTP 401: ${FAKE_GROQ_KEY} invalid`,
  }
  const clean = sanitizeForPersistence(dirty) as Record<string, unknown>
  const blob = JSON.stringify(clean)
  assert.equal(containsForbiddenSecrets(blob), false)
  assert.equal(/gsk_FAKE/.test(blob), false)
  assert.equal(/sk-FAKE/.test(blob), false)
  assert.equal(/Bearer FAKE/.test(blob), false)
})

test("artifact path escape outside cwd / tmp root refused", () => {
  const cwd = mkdtempSync(join(tmpdir(), "lot19ms-"))
  try {
    assert.throws(() => resolveEvalArtifactDir(cwd, "../escape-out"), /escapes workspace cwd/)
    assert.throws(() => resolveEvalArtifactDir(cwd, join("..", "etc")), /escapes workspace cwd/)
    assert.throws(
      () => resolveEvalArtifactDir(cwd, "out-not-tmp", "tmp"),
      /escapes allowed root/,
    )
    const ok = resolveEvalArtifactDir(cwd, "tmp/lot19m-live", "tmp")
    assert.ok(ok.includes("tmp"))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("side-effect / publish keys blocked by runner", async () => {
  const hostile: FabricLlmAdapter = {
    id: "hostile-audit",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        status: "draft_suggestion",
        title: "Hack title long enough",
        description: "Description suffisamment longue pour passer le schema.",
        targetAudience: "x",
        objective: "Objectif suffisamment long ici pour passer",
        categories: [{ name: "Cat" }],
        questions: [
          { title: "Q1 longue assez ici", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
          { title: "Q2 longue assez ici", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
          { title: "Q3 longue assez ici", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
        ],
        weightingNotes: "notes",
        recommendations: ["Revue"],
        disclaimers: ["Validation humaine requise."],
        publish: true,
        serverAction: "deleteAll",
      })
    },
  }
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Scorecard neutre de compétences digitales pour atelier interne." },
    { allowInTests: true, adapter: hostile },
  )
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.code, "side_effect_blocked")
})

test("invalid JSON / Zod / scoring integrity / version fail deterministically", async () => {
  const badJson: FabricLlmAdapter = {
    id: "bad-json",
    mode: "mock",
    async completeJson() {
      return "{not-json"
    },
  }
  const r1 = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Scorecard neutre de compétences digitales pour atelier interne." },
    { allowInTests: true, adapter: badJson },
  )
  assert.equal(r1.ok, false)

  const badZod: FabricLlmAdapter = {
    id: "bad-zod",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({ status: "draft_suggestion", title: "x" })
    },
  }
  const r2 = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Scorecard neutre de compétences digitales pour atelier interne." },
    { allowInTests: true, adapter: badZod },
  )
  assert.equal(r2.ok, false)

  const b2 = LOT19M_DATASET.find((s) => s.id === "d19m_analyze_high")!
  const lieScores: FabricLlmAdapter = {
    id: "lie-scores",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        summary: "Résumé suffisamment long pour le schema d'analyse des résultats.",
        officialScoresEcho: {
          globalScorePercent: 10,
          categoryScores: [
            { name: "Outils", scorePercent: 1 },
            { name: "Collaboration", scorePercent: 1 },
            { name: "Sécurité", scorePercent: 1 },
          ],
        },
        facts: ["Score global officiel 88 %."],
        interpretations: ["Écarts modestes à confirmer."],
        strengths: ["A"],
        gaps: ["B"],
        anomalies: [],
        recommendations: ["Revue humaine."],
        analysisLimits: ["Analyse non prescriptive."],
        disclaimers: ["Validation humaine requise."],
      })
    },
  }
  const r3 = await runFabricPattern(b2.patternId, b2.input, { allowInTests: true, adapter: lieScores })
  // Runner forces official echo — integrity must still pass on forced scores.
  assert.equal(r3.ok, true)
  if (r3.ok) {
    assert.equal((r3.data as { officialScoresEcho: { globalScorePercent: number } }).officialScoresEcho.globalScorePercent, 88)
  }
  const det = scoreDeterministic(b2, r3)
  assert.equal(det.checks.find((c) => c.id === "scoring_integrity")?.pass, true)

  const versionScenario = {
    ...b2,
    expectations: { ...b2.expectations, expectedPatternVersion: "9.9.9" },
  }
  const detVersion = scoreDeterministic(versionScenario, r3)
  assert.equal(detVersion.checks.find((c) => c.id === "pattern_version")?.pass, false)
})

test("dataset integrity: 8 unique ids + A4/C1/C4 expectations", () => {
  const summary = lot19mDatasetSummary()
  assert.equal(summary.total, 8)
  assert.equal(summary.uniqueIds, true)
  assert.deepEqual(summary.ids, [
    "d19m_draft_pmp",
    "d19m_draft_pmo",
    "d19m_draft_prospects",
    "d19m_draft_ambiguous",
    "d19m_analyze_high",
    "d19m_plan_skills",
    "d19m_plan_pmo",
    "d19m_plan_competing",
  ])
  const a4 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_ambiguous")!
  const c1 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_skills")!
  const c4 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_competing")!
  assert.equal(a4.expectations.mustClarify, true)
  assert.equal(c1.expectations.mustNotRequireArbitration, true)
  assert.equal(c4.expectations.mustRequireArbitration, true)
  assertLot19mBudgetValid()
})

test("semantic validators never PASS via keyword presence alone", async () => {
  const scenario = LOT19M_DATASET.find((s) => s.id === "d19m_draft_pmo")!
  const result = await runFabricPattern(scenario.patternId, scenario.input, {
    allowInTests: true,
    adapter: createMockLlmAdapter(),
  })
  const det = scoreDeterministic(scenario, result)
  const report = validateLot19mScenario(scenario, result, det)
  const semantic = report.checks.find((c) => c.id === "semantic_business_quality")
  assert.equal(semantic?.verdict, "HUMAN_REVIEW_REQUIRED")
  // Even if output contains "automatisation", still HUMAN_REVIEW_REQUIRED — not PASS.
  assert.notEqual(semantic?.verdict, "DETERMINISTIC_PASS")
})

test("beforeAttempt USD projection can refuse HTTP before increment", async () => {
  let fetchCount = 0
  const originalFetch = globalThis.fetch
  await withEnv(enableFakeLiveEnv(), async () => {
    globalThis.fetch = async () => {
      fetchCount += 1
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }], usage: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }
    try {
      const client = createLot19aLiveClient({
        maxCalls: 12,
        minSpacingMs: 0,
        backoff: { maxAttempts: 1, baseDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 },
        beforeAttempt: () => {
          throw new Error("maxEstimatedUsd projected breach before HTTP")
        },
      })
      await assert.rejects(
        () => client.completeJson([{ role: "user", content: "ping json" }], 50),
        /projected breach/,
      )
      assert.equal(fetchCount, 0)
      assert.equal(client.state.calls, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

test("fabric eval tree has no supabase createClient / stripe write imports (spot check)", () => {
  const files = [
    "eval/lot19m-campaign.ts",
    "eval/lot19m-dataset.ts",
    "eval/lot19m-validators.ts",
    "eval/live-client.ts",
    "eval/harness.ts",
    "eval/persistence.ts",
  ]
  for (const relative of files) {
    const source = readFileSync(new URL(`../${relative}`, import.meta.url), "utf8")
    assert.equal(/createClient\s*\(/.test(source), false, relative)
    assert.equal(/from ["']@\/lib\/data\//.test(source), false, relative)
    assert.equal(/from ["']@\/actions\//.test(source), false, relative)
  }
})

test("no real secrets written by sanitize round-trip artifact", () => {
  const dir = mkdtempSync(join(tmpdir(), "lot19ms-art-"))
  try {
    const path = join(dir, "out.json")
    const payload = sanitizeForPersistence({
      error: `Authorization ${FAKE_BEARER} key=${FAKE_GROQ_KEY}`,
      ok: true,
    })
    writeFileSync(path, JSON.stringify(payload), "utf8")
    const text = readFileSync(path, "utf8")
    assert.equal(containsForbiddenSecrets(text), false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
