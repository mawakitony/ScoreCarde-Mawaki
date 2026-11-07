/**
 * LOT 19S — Independent offline verification of A1 PMI + C4 Plan fixes (versions evolve with 19T).
 * ZERO network / Groq / remote LLM. Synthetic C4 fixtures are explicitly labeled.
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"
import {
  findMisleadingPmiCertificationClaim,
  isAmbiguousPmiAffiliationPhrase,
  shouldRequireArbitration,
} from "@/lib/ai/fabric-prototype/business-guards"
import { scoreDeterministic } from "@/lib/ai/fabric-prototype/eval/deterministic-scorer"
import { LOT19M_CAMPAIGN, versionsMatchRequired } from "@/lib/ai/fabric-prototype/eval/lot19m-campaign"
import { LOT19M_DATASET } from "@/lib/ai/fabric-prototype/eval/lot19m-dataset"
import { validateLot19mScenario } from "@/lib/ai/fabric-prototype/eval/lot19m-validators"
import { createMockLlmAdapter } from "@/lib/ai/fabric-prototype/llm-adapter"
import {
  clipString,
  coerceBooleanToken,
  normalizeHorizonToken,
  normalizePriorityToken,
} from "@/lib/ai/fabric-prototype/normalize"
import { getFabricPattern } from "@/lib/ai/fabric-prototype/registry"
import { runFabricPattern } from "@/lib/ai/fabric-prototype/runner"
import { extractJsonObject } from "@/lib/ai/fabric-prototype/security"
import { generateActionPlanOutputSchema } from "@/lib/ai/fabric-prototype/schemas"
import { sanitizeForPersistence } from "@/lib/ai/fabric-prototype/eval/persistence"
import type { FabricRunResult } from "@/lib/ai/fabric-prototype/types"

const LIVE19N_TRACES = resolve(
  "tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-traces.json",
)

const DOCUMENTED_PLAN_TRANSFORMS = [
  "horizon: '30 jours'|'30jours' → '30_jours' (and 90/6 mois equivalents)",
  "horizon: immediat/immediate → immédiat",
  "priority: high|medium|low → haute|moyenne|basse",
  "requiresArbitration: 'true'|'false'|'1'|'0'|'oui'|'non' → boolean",
  "critical Plan strings: trimBusinessString only (over-length → Zod.max fail; no silent clip)",
] as const

function okResult(
  patternId: FabricRunResult["patternId"],
  data: unknown,
  version: string,
): FabricRunResult {
  return {
    ok: true,
    patternId,
    version,
    data,
    metrics: {
      ok: true,
      patternId,
      patternVersion: version,
      adapterId: "mock",
      adapterMode: "mock",
      latencyMs: 1,
      inputChars: 10,
      outputChars: JSON.stringify(data).length,
    },
  }
}

function basePlan(overrides: Record<string, unknown> = {}) {
  return {
    situationSynthesis: "Synthèse suffisamment longue pour le schéma Plan.",
    topPriorities: ["Priorité un texte", "Priorité deux texte", "Priorité trois texte"],
    actions: [
      {
        title: "Action immédiate",
        description: "Description concrète liée aux écarts fournis.",
        priority: "haute",
        horizon: "immédiat",
        expectedOutcome: "Livrable court",
        successIndicator: "Indicateur observable",
      },
      {
        title: "Action 30 jours",
        description: "Deuxième action concrète sans inventer de prix.",
        priority: "moyenne",
        horizon: "30_jours",
        expectedOutcome: "Avancement documenté",
        successIndicator: "Revue à J+30",
      },
      {
        title: "Action 90 jours",
        description: "Troisième action respectant le délai fourni.",
        priority: "basse",
        horizon: "90_jours",
        expectedOutcome: "Suivi stabilisé",
        successIndicator: "Indicateur à J+90",
      },
    ],
    facts: ["Faits issus du diagnostic synthétique."],
    hypotheses: ["Hypothèse explicite non présentée comme un fait."],
    recommendations: ["Valider le plan avec un responsable métier."],
    disclaimers: ["Aucun résultat n'est garanti."],
    missingInformation: [],
    requiresArbitration: false,
    ...overrides,
  }
}

// ——— PHASE versions ———

test("LOT 19S versions: draft 1.3.1 / analyze 1.3.0 / plan 1.3.3+", () => {
  assert.equal(getFabricPattern("generate_scorecard_draft")?.version, "1.3.1")
  assert.equal(getFabricPattern("analyze_scorecard_results")?.version, "1.3.0")
  assert.equal(getFabricPattern("generate_action_plan")?.version, "1.3.3")
  assert.equal(versionsMatchRequired().all, true)
  assert.equal(LOT19M_CAMPAIGN.versionsRequired.generate_action_plan, "1.3.3")
})

test("LOT 19S documented Plan transforms are explicit (not silent invention)", () => {
  assert.ok(DOCUMENTED_PLAN_TRANSFORMS.length >= 5)
  assert.equal(normalizeHorizonToken("next_week"), "next_week")
  assert.equal(normalizePriorityToken("urgent"), "urgent")
  assert.equal(coerceBooleanToken("maybe"), "maybe")
})

// ——— PHASE 2 A1 historical replay ———

test("A1 historical LIVE 19N replay through current PMI validator (no mutation)", () => {
  assert.equal(existsSync(LIVE19N_TRACES), true, "19N traces artifact must exist")
  const traces = JSON.parse(readFileSync(LIVE19N_TRACES, "utf8")) as {
    traces: Array<{ scenarioId: string; validatedOutput?: unknown; runOk?: boolean }>
  }
  const a1 = traces.traces.find((t) => t.scenarioId === "d19m_draft_pmp")
  assert.ok(a1, "A1 trace present")
  assert.ok(a1.validatedOutput, "A1 validatedOutput persisted — historical replay possible")

  // Replay unchanged object
  const snapshot = structuredClone(a1.validatedOutput)
  assert.equal(findMisleadingPmiCertificationClaim(snapshot), null)

  const scenario = LOT19M_DATASET.find((s) => s.id === "d19m_draft_pmp")!
  const result = okResult("generate_scorecard_draft", snapshot, "1.3.1")
  const det = scoreDeterministic(scenario, result)
  const forbidden = det.checks.find((c) => c.id === "no_forbidden_substrings")
  assert.equal(forbidden?.pass, true, forbidden?.detail)
  assert.equal(det.checks.find((c) => c.id === "draft_status")?.pass, true)
  // Quality bias remains human — not auto-approved
  const v = validateLot19mScenario(scenario, result, det)
  assert.equal(v.checks.find((c) => c.id === "semantic_business_quality")?.verdict, "HUMAN_REVIEW_REQUIRED")
})

test("A1: C4 raw body absent — declare NOT VERIFIED for historical C4 Zod replay", () => {
  const traces = JSON.parse(readFileSync(LIVE19N_TRACES, "utf8")) as {
    traces: Array<{ scenarioId: string; validatedOutput?: unknown; errorCode?: string }>
  }
  const c4 = traces.traces.find((t) => t.scenarioId === "d19m_plan_competing")
  assert.ok(c4)
  assert.equal(c4.validatedOutput, undefined)
  assert.equal(c4.errorCode, "output_invalid")
})

// ——— PHASE 2 A1 synthetic PMI ———

test("A1 PMI: legitimate negations accepted", () => {
  const cases = [
    "Ne constitue pas une certification officielle PMI.",
    "Ne constitue pas une certification PMI ni une validation officielle d’organisme.",
    "Sans prétendre être une certification officielle PMI.",
    "Sans prétendre à une certification officielle PMI.",
    "sans prétention de certification officielle PMI",
    "NE CONSTITUE PAS UNE CERTIFICATION OFFICIELLE PMI.",
    "Ne  constitue   pas une certification officielle PMI.",
  ]
  for (const c of cases) {
    assert.equal(findMisleadingPmiCertificationClaim(c), null, c)
  }
})

test("A1 PMI: informative references accepted", () => {
  const cases = [
    "Scorecard inspirée du référentiel PMP / pratiques PMI.",
    "Cartographier les pratiques alignées sur des thèmes PMP.",
    "Mention informative: PMI publie un référentiel de bonnes pratiques.",
  ]
  for (const c of cases) {
    assert.equal(findMisleadingPmiCertificationClaim(c), null, c)
  }
})

test("A1 PMI: misleading claims rejected", () => {
  const cases = [
    "Cet outil est officiellement certifié par PMI.",
    "PMI approuve officiellement ce scorecard.",
    "Cette évaluation est une certification officielle PMI.",
    "Scorecard délivrant une certification PMI officielle.",
    "Officiellement certifié par le PMI.",
  ]
  for (const c of cases) {
    assert.ok(findMisleadingPmiCertificationClaim(c), `expected reject: ${c}`)
  }
})

test("A1 PMI: punctuation/case/space variants of claims still rejected", () => {
  assert.ok(findMisleadingPmiCertificationClaim("Certification   Officielle   PMI !!!"))
  assert.ok(findMisleadingPmiCertificationClaim("certification-pmi-officielle".replace(/-/g, " ")))
})

test("A1 PMI: ambiguous phrasing flagged for human review (not auto-PASS)", () => {
  const ambiguous = [
    "Évaluation alignée sur les standards PMI.",
    "Outil reconnu PMI pour les équipes projet.",
    "Processus conforme PMI.",
  ]
  for (const c of ambiguous) {
    assert.equal(findMisleadingPmiCertificationClaim(c), null, `not hard-claim: ${c}`)
    assert.equal(isAmbiguousPmiAffiliationPhrase(c), true, c)
  }
})

test("A1 PMI: unrelated « sans » does not excuse a real claim", () => {
  assert.ok(
    findMisleadingPmiCertificationClaim(
      "Cette offre est sans égale : certification officielle PMI délivrée automatiquement.",
    ),
  )
})

// ——— PHASE 3 C4 synthetic fixtures (explicitly synthetic) ———

test("C4 SYNTHETIC: canonical horizon + priority accepted", () => {
  const parsed = generateActionPlanOutputSchema.safeParse(basePlan())
  assert.equal(parsed.success, true)
})

test("C4 SYNTHETIC: horizon aliases supported; unknown not remapped", () => {
  assert.equal(normalizeHorizonToken("30 jours"), "30_jours")
  assert.equal(normalizeHorizonToken("90 jours"), "90_jours")
  assert.equal(normalizeHorizonToken("6 mois"), "6_mois")
  assert.equal(normalizeHorizonToken("immédiat"), "immédiat")
  assert.equal(normalizeHorizonToken("next_sprint"), "next_sprint")
  const bad = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: [
        {
          title: "Bad horizon",
          description: "Description concrète liée aux écarts fournis.",
          priority: "haute",
          horizon: "next_sprint",
          expectedOutcome: "Livrable",
          successIndicator: "Indicateur",
        },
        ...(basePlan().actions as unknown[]).slice(1),
      ],
    }),
  )
  assert.equal(bad.success, false)
})

test("C4 SYNTHETIC: priority aliases + unknown rejected", () => {
  assert.equal(normalizePriorityToken("high"), "haute")
  assert.equal(normalizePriorityToken("medium"), "moyenne")
  assert.equal(normalizePriorityToken("low"), "basse")
  const aliased = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, priority: "high", horizon: "30 jours" } : a,
      ),
    }),
  )
  assert.equal(aliased.success, true)
  if (aliased.success) {
    assert.equal(aliased.data.actions[0]?.priority, "haute")
    assert.equal(aliased.data.actions[0]?.horizon, "30_jours")
  }
  const unknown = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, priority: "critique" } : a,
      ),
    }),
  )
  assert.equal(unknown.success, false)
})

test("C4 SYNTHETIC: boolean typed + string coercion; 'false' is not true", () => {
  assert.equal(coerceBooleanToken(true), true)
  assert.equal(coerceBooleanToken(false), false)
  assert.equal(coerceBooleanToken("true"), true)
  assert.equal(coerceBooleanToken("false"), false)
  assert.equal(coerceBooleanToken("FALSE"), false)
  assert.equal(coerceBooleanToken("0"), false)
  assert.notEqual(coerceBooleanToken("false"), true)
  const asFalse = generateActionPlanOutputSchema.safeParse(basePlan({ requiresArbitration: "false" }))
  assert.equal(asFalse.success, true)
  if (asFalse.success) assert.equal(asFalse.data.requiresArbitration, false)
  const asTrue = generateActionPlanOutputSchema.safeParse(
    basePlan({
      requiresArbitration: "true",
      arbitrationQuestion: "Quel chantier unique financez-vous en premier ?",
    }),
  )
  assert.equal(asTrue.success, true)
  if (asTrue.success) assert.equal(asTrue.data.requiresArbitration, true)
})

test("C4 SYNTHETIC: lengths at max OK; over max fails Zod (no silent clip)", () => {
  const atMax = "x".repeat(400)
  const over = "y".repeat(450)
  assert.equal((clipString(atMax, 400) as string).length, 400)
  assert.equal((clipString(over, 400) as string).length, 450)
  assert.equal((clipString(over, 400, { allowSilentClip: true }) as string).length, 400)
  const okAtMax = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, description: atMax } : a,
      ),
    }),
  )
  assert.equal(okAtMax.success, true)
  const overParsed = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, description: over } : a,
      ),
    }),
  )
  assert.equal(overParsed.success, false)
})

test("C4 SYNTHETIC: missing required field / empty actions fail Zod with usable errors", () => {
  const missing = generateActionPlanOutputSchema.safeParse({
    topPriorities: ["a", "b", "c"],
    actions: [],
    facts: ["f1"],
    hypotheses: ["h1"],
    recommendations: ["r1"],
    disclaimers: ["d1"],
  })
  assert.equal(missing.success, false)
  if (!missing.success) {
    const flat = missing.error.flatten()
    assert.ok(
      Object.keys(flat.fieldErrors).length > 0 || flat.formErrors.length > 0,
      "Zod flatten must expose fields",
    )
  }
})

test("C4 SYNTHETIC: malformed JSON extract fails safely", () => {
  const extracted = extractJsonObject("not json at all {{{")
  assert.equal(typeof extracted, "string")
  assert.throws(() => JSON.parse(extracted))
  const parsed = generateActionPlanOutputSchema.safeParse({})
  assert.equal(parsed.success, false)
})

test("C4 SYNTHETIC: contradictory arbitration vs exclusive constraint still schema-valid if flags set", () => {
  // Schema does not invent arbitration; business guard decides exclusivity separately.
  const exclusive = shouldRequireArbitration({
    gaps: ["A", "B"],
    constraints: ["Budget unique pour un seul chantier majeur"],
  })
  assert.equal(exclusive, true)
  const limited = shouldRequireArbitration({
    gaps: ["A", "B", "C"],
    constraints: ["Budget formation limité", "Disponibilité 3h/semaine"],
  })
  assert.equal(limited, false)
})

test("C4 SYNTHETIC: exclusive arbitration fixture + mock runner", async () => {
  const c4 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_competing")!
  const result = await runFabricPattern(c4.patternId, c4.input, {
    allowInTests: true,
    adapter: createMockLlmAdapter(),
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal((result.data as { requiresArbitration: boolean }).requiresArbitration, true)
    assert.ok((result.data as { arbitrationQuestion?: string }).arbitrationQuestion)
  }
  assert.equal(scoreDeterministic(c4, result).allRequiredPassed, true)
})

test("C4 SYNTHETIC: 90-day deadline horizon coherence + multi-action conditional plan", () => {
  const plan = basePlan({
    situationSynthesis: "Délai 90 jours ; plusieurs actions conditionnées à un arbitrage exclusif.",
    requiresArbitration: true,
    arbitrationQuestion: "Avec un budget pour un seul chantier, laquelle priorisez-vous ?",
    actions: [
      {
        title: "Comparer options",
        description: "Grille comparative avant choix exclusif.",
        priority: "haute",
        horizon: "immédiat",
        expectedOutcome: "Tableau partagé",
        successIndicator: "Critères documentés",
      },
      {
        title: "Arbitrage sponsor",
        description: "Obtenir la décision écrite du chantier unique.",
        priority: "haute",
        horizon: "30_jours",
        expectedOutcome: "Décision",
        successIndicator: "Choix validé",
      },
      {
        title: "Exécution conditionnelle",
        description: "Activer uniquement le chantier choisi dans le délai 90 jours.",
        priority: "moyenne",
        horizon: "90_jours",
        expectedOutcome: "Plan exécutable",
        successIndicator: "Jalons à J+90",
      },
    ],
  })
  const parsed = generateActionPlanOutputSchema.safeParse(plan)
  assert.equal(parsed.success, true)
  if (parsed.success) {
    assert.equal(parsed.data.requiresArbitration, true)
    assert.equal(parsed.data.actions[2]?.horizon, "90_jours")
  }
})

test("C1 NON-REGRESSION: limited budget does not force arbitration", async () => {
  const c1 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_skills")!
  const result = await runFabricPattern(c1.patternId, c1.input, { allowInTests: true })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal((result.data as { requiresArbitration: boolean }).requiresArbitration, false)
  }
})

test("A4 + B2 NON-REGRESSION offline", async () => {
  const a4 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_ambiguous")!
  const b2 = LOT19M_DATASET.find((s) => s.id === "d19m_analyze_high")!
  const rA = await runFabricPattern(a4.patternId, a4.input, { allowInTests: true })
  const rB = await runFabricPattern(b2.patternId, b2.input, { allowInTests: true })
  assert.equal(rA.ok, true)
  assert.equal(rB.ok, true)
  if (rA.ok) assert.equal((rA.data as { status: string }).status, "needs_clarification")
  if (rB.ok) {
    const echo = (
      rB.data as {
        officialScoresEcho: {
          globalScorePercent: number
          categoryScores: { scorePercent: number }[]
        }
      }
    ).officialScoresEcho
    assert.equal(echo.globalScorePercent, 88)
    assert.deepEqual(
      echo.categoryScores.map((c) => c.scorePercent),
      [92, 85, 87],
    )
  }
})

// ——— PHASE 4 security ———

test("SECURITY: mock adapter only; LIVE flags stay off; no invented secrets in sanitize", () => {
  const adapter = createMockLlmAdapter()
  assert.equal(adapter.mode, "mock")
  assert.notEqual(process.env.FABRIC_EVAL_CONFIRM_19M, "I_AUTHORIZE_LOT19M_LIVE")
  const dirty = {
    apiKey: "gsk_fake_should_redact_xxxxx",
    authorization: "Bearer fake.token.value",
    note: "contains gsk_abcdef1234567890abcd and Bearer abc.def",
    nested: { secret: "plain-but-key-name-redacts" },
  }
  const clean = sanitizeForPersistence(dirty) as Record<string, unknown>
  const blob = JSON.stringify(clean)
  assert.equal(clean.apiKey, "[redacted]")
  assert.equal(clean.authorization, "[redacted]")
  assert.equal((clean.nested as { secret: string }).secret, "[redacted]")
  assert.equal(/gsk_fake_should_redact/.test(blob), false)
  assert.equal(/Bearer fake\.token/.test(blob), false)
})

test("SECURITY: C4 invalid synthetic stays DETERMINISTIC_FAIL (no invented LIVE success)", () => {
  const c4 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_competing")!
  const fail: FabricRunResult = {
    ok: false,
    patternId: "generate_action_plan",
    version: "1.3.3",
    error: {
      code: "output_invalid",
      message: "Sortie invalide (Zod): topPriorities: Array must contain exactly 3 element(s)",
      details: { formErrors: [], fieldErrors: { topPriorities: ["Array must contain exactly 3 element(s)"] } },
    },
    metrics: {
      ok: false,
      patternId: "generate_action_plan",
      patternVersion: "1.3.3",
      adapterId: "mock",
      adapterMode: "mock",
      latencyMs: 1,
      inputChars: 10,
      outputChars: 50,
      errorCode: "output_invalid",
    },
  }
  const det = scoreDeterministic(c4, fail)
  const v = validateLot19mScenario(c4, fail, det)
  assert.equal(v.overall, "DETERMINISTIC_FAIL")
  assert.equal(v.deterministicOk, false)
})
