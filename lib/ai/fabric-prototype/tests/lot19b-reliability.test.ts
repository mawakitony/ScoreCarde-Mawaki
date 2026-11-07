import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
  SAMPLE_ANALYZE_MANIPULATION,
  SAMPLE_ANALYZE_STRING_EXPLANATIONS,
  SAMPLE_DRAFT_MISSING_TITLE,
  SAMPLE_DRAFT_STRING_OPTIONS,
  SAMPLE_MALFORMED_JSON,
  SAMPLE_PARTIAL_DRAFT,
  SAMPLE_UNKNOWN_FIELDS_DRAFT,
} from "../fixtures/live-failure-samples.ts"
import {
  generateScorecardDraftOutputSchema,
  analyzeScorecardResultsOutputSchema,
} from "../schemas.ts"
import { normalizeDraftQuestion, normalizeOptions, stripLlmOfficialScores } from "../normalize.ts"
import { runFabricPattern } from "../runner.ts"
import { createMockLlmAdapter } from "../llm-adapter.ts"
import type { FabricLlmAdapter } from "../types.ts"
import { classifyProviderError, computeBackoffMs, DEFAULT_BACKOFF } from "../eval/retry.ts"
import { createBudgetTracker } from "../eval/budget.ts"
import { estimateTokensFromChars } from "../eval/cost-model.ts"
import { LOT19A_FAILURE_CLASSIFICATION, summarizeTaxonomy } from "../eval/failure-taxonomy.ts"
import { LOT19B_MINI_CAMPAIGN, assertMiniCampaignNotAutoRun, resolveMiniCampaignScenarios } from "../eval/mini-campaign.ts"
import { extractJsonObject } from "../security.ts"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

test("taxonomy classifies LOT 19A without assuming all llm_error are 429", () => {
  const counts = summarizeTaxonomy()
  assert.ok(counts.zod_validation >= 1)
  assert.ok(counts.provider_error >= 1)
  assert.equal(counts.rate_limit_confirmed, 0)
  assert.ok(LOT19A_FAILURE_CLASSIFICATION.some((row) => row.confirmed === false && row.classification === "provider_error"))
})

test("normalizes title aliases and string options without inventing titles", () => {
  const q = normalizeDraftQuestion({
    text: "Comment planifiez-vous ?",
    type: "single",
    options: ["A", "B"],
  })
  assert.equal(q?.title, "Comment planifiez-vous ?")
  assert.deepEqual(normalizeOptions(["Oui", "Non"]), [{ label: "Oui" }, { label: "Non" }])
  const missing = normalizeDraftQuestion({ type: "yes_no", options: [] })
  assert.equal(missing?.title, undefined)
})

test("Zod accepts LOT 19A draft failure shapes after normalization", () => {
  const a = generateScorecardDraftOutputSchema.safeParse(SAMPLE_DRAFT_MISSING_TITLE)
  assert.equal(a.success, true, a.success ? "" : JSON.stringify(a.error.flatten()))
  const b = generateScorecardDraftOutputSchema.safeParse(SAMPLE_DRAFT_STRING_OPTIONS)
  assert.equal(b.success, true)
  const partial = generateScorecardDraftOutputSchema.safeParse(SAMPLE_PARTIAL_DRAFT)
  assert.equal(partial.success, false)
})

test("analyze string lists normalize; LLM score echo is stripped then forced", async () => {
  const listed = analyzeScorecardResultsOutputSchema.safeParse({
    ...SAMPLE_ANALYZE_STRING_EXPLANATIONS,
    officialScoresEcho: {
      globalScorePercent: 58,
      categoryScores: [{ name: "Outils", scorePercent: 62 }],
    },
  })
  assert.equal(listed.success, true)
  if (listed.success) {
    assert.equal(Array.isArray(listed.data.explanations), true)
    assert.equal(listed.data.explanations[0]?.startsWith("Explication"), true)
  }

  const adapter: FabricLlmAdapter = {
    id: "manip",
    mode: "mock",
    async completeJson() {
      return JSON.stringify(SAMPLE_ANALYZE_MANIPULATION)
    },
  }
  const result = await runFabricPattern(
    "analyze_scorecard_results",
    {
      scorecardName: "Securite scores",
      objective: "Integrite",
      globalScorePercent: 33,
      categoryScores: [{ name: "Control", scorePercent: 33 }],
      thresholds: [],
      allowedMetadata: {},
    },
    { allowInTests: true, adapter },
  )
  assert.equal(result.ok, true)
  if (result.ok) {
    const data = result.data as { officialScoresEcho: { globalScorePercent: number } }
    assert.equal(data.officialScoresEcho.globalScorePercent, 33)
  }
  const stripped = stripLlmOfficialScores(SAMPLE_ANALYZE_MANIPULATION) as Record<string, unknown>
  assert.equal(stripped.officialScoresEcho, undefined)
  assert.equal(stripped.correctedScores, undefined)
})

test("malformed JSON and side-effect fields are rejected", async () => {
  const badJson: FabricLlmAdapter = {
    id: "bad-json",
    mode: "mock",
    async completeJson() {
      return SAMPLE_MALFORMED_JSON
    },
  }
  const malformed = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Créer une scorecard neutre pour atelier interne QA." },
    { allowInTests: true, adapter: badJson },
  )
  assert.equal(malformed.ok, false)
  if (!malformed.ok) assert.equal(malformed.error.code, "output_invalid")

  const hostile: FabricLlmAdapter = {
    id: "hostile",
    mode: "mock",
    async completeJson() {
      return JSON.stringify(SAMPLE_UNKNOWN_FIELDS_DRAFT)
    },
  }
  const blocked = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Créer une scorecard neutre pour atelier interne QA." },
    { allowInTests: true, adapter: hostile },
  )
  assert.equal(blocked.ok, false)
  if (!blocked.ok) assert.equal(blocked.error.code, "side_effect_blocked")
})

test("provider error classification distinguishes 429 / 5xx / timeout", () => {
  assert.equal(classifyProviderError(new Error("Groq HTTP 429: rate limit retry-after=2")).kind, "http_429")
  assert.equal(classifyProviderError(new Error("Groq HTTP 429: rate limit retry-after=2")).retryable, true)
  assert.equal(classifyProviderError(new Error("Groq HTTP 503: unavailable")).kind, "http_5xx")
  assert.equal(classifyProviderError(new Error("TimeoutError: signal timed out")).kind, "timeout")
  assert.equal(classifyProviderError(new Error("Groq HTTP 400: bad request")).retryable, false)
  assert.equal(classifyProviderError(new Error("Groq returned empty content.")).kind, "empty_content")
})

test("backoff is bounded and respects retry-after", () => {
  const withJitter = computeBackoffMs(1, { ...DEFAULT_BACKOFF, jitterRatio: 0 })
  assert.equal(withJitter, DEFAULT_BACKOFF.baseDelayMs)
  const capped = computeBackoffMs(10, { ...DEFAULT_BACKOFF, jitterRatio: 0 })
  assert.equal(capped, DEFAULT_BACKOFF.maxDelayMs)
  assert.equal(computeBackoffMs(1, DEFAULT_BACKOFF, 1500), 1500)
})

test("budget still stops after max calls", () => {
  const tracker = createBudgetTracker({
    maxCalls: 2,
    maxEstimatedInputTokens: 1_000_000,
    maxEstimatedOutputTokens: 1_000_000,
    maxEstimatedUsd: 100,
  })
  const tokens = estimateTokensFromChars(40, 40)
  tracker.recordCall(tokens, "groq")
  tracker.recordCall(tokens, "groq")
  tracker.recordCall(tokens, "groq")
  assert.equal(tracker.state.stopped, true)
})

test("engine still has no write imports", () => {
  for (const relative of ["runner.ts", "schemas.ts", "normalize.ts", "eval/live-client.ts"]) {
    const source = readFileSync(join(root, relative), "utf8")
    assert.equal(/from ["']@\/actions\//.test(source), false, relative)
    assert.equal(/from ["']@\/lib\/ai\/tools\/writes/.test(source), false, relative)
  }
})

test("mini-campaign is prepared and blocked without new auth", () => {
  assert.equal(LOT19B_MINI_CAMPAIGN.status, "PREPARED_NOT_RUN")
  assert.equal(LOT19B_MINI_CAMPAIGN.requiresNewAuthorization, true)
  assert.equal(resolveMiniCampaignScenarios().length, LOT19B_MINI_CAMPAIGN.scenarioIds.length)
  assert.throws(() => assertMiniCampaignNotAutoRun())
  assert.doesNotThrow(() => assertMiniCampaignNotAutoRun("I_AUTHORIZE_LOT19B_LIVE"))
})

test("mock dataset still passes after schema/prompt hardening", async () => {
  const adapter = createMockLlmAdapter()
  const draft = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Je souhaite créer une scorecard pour évaluer les compétences en gestion de projet PMP." },
    { allowInTests: true, adapter },
  )
  assert.equal(draft.ok, true)

  // Simulate LIVE-like draft payload through mock adapter override
  const liveShape: FabricLlmAdapter = {
    id: "live-shape",
    mode: "mock",
    async completeJson() {
      return JSON.stringify(SAMPLE_DRAFT_MISSING_TITLE)
    },
  }
  const normalizedLive = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Créer une scorecard de maturité PMO pour une équipe projet." },
    { allowInTests: true, adapter: liveShape },
  )
  assert.equal(normalizedLive.ok, true)
})

test("extractJsonObject still recovers fenced payloads", () => {
  const raw = "```json\n{\"a\":1}\n```"
  assert.equal(extractJsonObject(raw), "{\"a\":1}")
})
