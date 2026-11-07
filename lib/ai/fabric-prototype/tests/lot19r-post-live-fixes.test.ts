/**
 * LOT 19R — MOCK regression from anonymized LOT 19N LIVE outputs.
 * ZERO LIVE / Groq calls.
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { findMisleadingPmiCertificationClaim } from "@/lib/ai/fabric-prototype/business-guards"
import { scoreDeterministic } from "@/lib/ai/fabric-prototype/eval/deterministic-scorer"
import { LOT19M_DATASET } from "@/lib/ai/fabric-prototype/eval/lot19m-dataset"
import { validateLot19mScenario } from "@/lib/ai/fabric-prototype/eval/lot19m-validators"
import {
  clipString,
  normalizeHorizonToken,
  normalizePriorityToken,
} from "@/lib/ai/fabric-prototype/normalize"
import { getFabricPattern } from "@/lib/ai/fabric-prototype/registry"
import { runFabricPattern } from "@/lib/ai/fabric-prototype/runner"
import { generateActionPlanOutputSchema } from "@/lib/ai/fabric-prototype/schemas"
import type { FabricRunResult } from "@/lib/ai/fabric-prototype/types"

const PMI_NEEDLES = ["certification officielle pmi", "certification pmi officielle"]

/** Anonymized A1 draft fields from LIVE 19N (negated PMI disclaimer — former false positive). */
const LIVE19N_A1_LEGITIMATE = {
  status: "draft_suggestion",
  title: "Auto-évaluation des pratiques de gestion de projet (inspiré du référentiel PMP)",
  description:
    "Brouillon destiné à cartographier les pratiques de planification, gestion des risques, suivi/reporting et gouvernance afin d’identifier forces et écarts, sans prétention de certification officielle PMI.",
  targetAudience: "Chefs de projet, PMO, coordinateurs",
  objective: "Identifier forces et axes d’amélioration des pratiques projet.",
  categories: [
    { name: "Planification", description: "Jalons et responsabilités", weightSuggestion: 30 },
    { name: "Risques", description: "Identification et mitigation", weightSuggestion: 25 },
    { name: "Suivi", description: "Indicateurs décisionnels", weightSuggestion: 25 },
    { name: "Gouvernance", description: "Adaptation et capitalisation", weightSuggestion: 20 },
  ],
  questions: [
    {
      title: "Dans quelle mesure le plan définit jalons, livrables et responsabilités ?",
      type: "single_choice",
      isRequired: true,
      isScored: true,
      categoryName: "Planification",
      options: [
        { label: "Faible", score: 25 },
        { label: "Moyen", score: 50 },
        { label: "Élevé", score: 75 },
      ],
    },
  ],
  facts: ["Demande d’auto-évaluation inspirée PMP fournie."],
  hypotheses: ["Le contexte organisationnel n’est pas détaillé."],
  recommendations: ["Prioriser les questions liées à l’efficacité des pratiques."],
  disclaimers: [
    "Suggestion IA non persistée.",
    "Ne constitue pas une certification PMI ni une validation officielle d’organisme.",
  ],
  missingInformation: [],
}

const LIVE19N_A1_FALSE_CLAIM = {
  ...LIVE19N_A1_LEGITIMATE,
  description:
    "Scorecard délivrant une certification officielle PMI pour valider le niveau des chefs de projet.",
  disclaimers: ["Cette évaluation est une certification officielle PMI reconnue."],
}

function okResult(patternId: FabricRunResult["patternId"], data: unknown, version: string): FabricRunResult {
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

function failZodResult(patternId: FabricRunResult["patternId"], version: string): FabricRunResult {
  return {
    ok: false,
    patternId,
    version,
    error: {
      code: "output_invalid",
      message: "Sortie invalide (Zod): topPriorities: Array must contain exactly 3 element(s)",
      details: { formErrors: [], fieldErrors: { topPriorities: ["Array must contain exactly 3 element(s)"] } },
    },
    metrics: {
      ok: false,
      patternId,
      patternVersion: version,
      adapterId: "mock",
      adapterMode: "mock",
      latencyMs: 1,
      inputChars: 10,
      outputChars: 100,
      errorCode: "output_invalid",
    },
  }
}

test("LOT 19R versions: draft 1.3.1, plan 1.3.3+, analyze 1.3.0", () => {
  assert.equal(getFabricPattern("generate_scorecard_draft")?.version, "1.3.1")
  assert.ok(/^1\.3\.[3-9]$|^1\.3\.\d{2,}$/.test(getFabricPattern("generate_action_plan")?.version ?? ""))
  assert.equal(getFabricPattern("analyze_scorecard_results")?.version, "1.3.0")
})

test("A1: legitimate negated PMI mention is not a misleading claim", () => {
  assert.equal(findMisleadingPmiCertificationClaim(LIVE19N_A1_LEGITIMATE), null)
  assert.equal(
    findMisleadingPmiCertificationClaim(
      "sans prétendre à une certification officielle PMI",
    ),
    null,
  )
  const a1 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_pmp")!
  const result = okResult("generate_scorecard_draft", LIVE19N_A1_LEGITIMATE, "1.3.1")
  const det = scoreDeterministic(a1, result)
  const forbidden = det.checks.find((c) => c.id === "no_forbidden_substrings")
  assert.equal(forbidden?.pass, true, forbidden?.detail)
  assert.equal(det.allRequiredPassed, true)
})

test("A1: false PMI affiliation still fails", () => {
  assert.match(
    findMisleadingPmiCertificationClaim(LIVE19N_A1_FALSE_CLAIM) ?? "",
    /certification/i,
  )
  const a1 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_pmp")!
  const result = okResult("generate_scorecard_draft", LIVE19N_A1_FALSE_CLAIM, "1.3.1")
  const det = scoreDeterministic(a1, result)
  const forbidden = det.checks.find((c) => c.id === "no_forbidden_substrings")
  assert.equal(forbidden?.pass, false)
  assert.ok(PMI_NEEDLES.some((n) => (forbidden?.detail ?? "").toLowerCase().includes("pmi")))
})

test("A1: unrelated nearby « sans » does not excuse a real claim", () => {
  const claim =
    "Cette offre est sans égale : certification officielle PMI délivrée automatiquement."
  assert.ok(findMisleadingPmiCertificationClaim(claim))
})

test("C4: invalid JSON / Zod shape remains DETERMINISTIC_FAIL (no invented success)", () => {
  const c4 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_competing")!
  const invalidPlan = {
    situationSynthesis: "Trop court",
    topPriorities: ["seulement une"],
    actions: [],
    facts: [],
    hypotheses: [],
    recommendations: [],
    disclaimers: [],
    requiresArbitration: true,
  }
  const parsed = generateActionPlanOutputSchema.safeParse(invalidPlan)
  assert.equal(parsed.success, false)

  const result = failZodResult("generate_action_plan", "1.3.3")
  const det = scoreDeterministic(c4, result)
  assert.equal(det.allRequiredPassed, false)
  const v = validateLot19mScenario(c4, result, det)
  assert.equal(v.overall, "DETERMINISTIC_FAIL")
  assert.equal(v.deterministicOk, false)
})

test("C4: valid JSON with mandatory arbitration still required", async () => {
  const c4 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_competing")!
  // Aliases that previously broke Zod; normalize must accept them.
  const aliased = {
    situationSynthesis:
      "Plusieurs chantiers concurrent pour un budget unique ; arbitrage requis avant engagement.",
    topPriorities: [
      "Comparer options impact/effort",
      "Obtenir arbitrage sponsor",
      "Préparer plan conditionnel",
    ],
    actions: [
      {
        title: "Grille de décision",
        description: "Comparer les options fournies sans choisir à la place du décideur.",
        priority: "high",
        horizon: "30 jours",
        expectedOutcome: "Tableau comparatif",
        successIndicator: "Critères documentés",
      },
      {
        title: "Arbitrage",
        description: "Demander confirmation du chantier unique à financer.",
        priority: "haute",
        horizon: "immédiat",
        expectedOutcome: "Décision écrite",
        successIndicator: "Choix validé",
      },
      {
        title: "Plan A/B",
        description: "Deux squelettes activables après arbitrage, sans dépense.",
        priority: "moyenne",
        horizon: "90 jours",
        expectedOutcome: "Plans conditionnels",
        successIndicator: "Plans documentés",
      },
    ],
    facts: ["Budget unique fourni.", "Au moins deux écarts majeurs."],
    hypotheses: ["Les critères de priorité ne sont pas tous fournis."],
    recommendations: ["Ne pas engager de dépense avant confirmation."],
    disclaimers: ["Aucun chantier engagé automatiquement."],
    missingInformation: ["Critère prioritaire du sponsor."],
    requiresArbitration: "true",
    arbitrationQuestion:
      "Avec un budget pour un seul chantier majeur, quelle option priorisez-vous ?",
  }
  const parsed = generateActionPlanOutputSchema.safeParse(aliased)
  assert.equal(parsed.success, true, JSON.stringify(parsed.success ? {} : parsed.error.flatten()))
  if (parsed.success) {
    assert.equal(parsed.data.requiresArbitration, true)
    assert.equal(parsed.data.actions[0]?.horizon, "30_jours")
    assert.equal(parsed.data.actions[0]?.priority, "haute")
  }

  const result = await runFabricPattern(c4.patternId, c4.input, { allowInTests: true })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal((result.data as { requiresArbitration: boolean }).requiresArbitration, true)
    assert.ok((result.data as { arbitrationQuestion?: string }).arbitrationQuestion)
  }
  assert.equal(scoreDeterministic(c4, result).allRequiredPassed, true)
})

test("C1: limited budget must not force arbitration", async () => {
  const c1 = LOT19M_DATASET.find((s) => s.id === "d19m_plan_skills")!
  const result = await runFabricPattern(c1.patternId, c1.input, { allowInTests: true })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal((result.data as { requiresArbitration: boolean }).requiresArbitration, false)
  }
  assert.equal(scoreDeterministic(c1, result).allRequiredPassed, true)
})

test("B2: official scores echo unchanged", async () => {
  const b2 = LOT19M_DATASET.find((s) => s.id === "d19m_analyze_high")!
  const result = await runFabricPattern(b2.patternId, b2.input, { allowInTests: true })
  assert.equal(result.ok, true)
  if (result.ok) {
    const echo = (result.data as {
      officialScoresEcho: {
        globalScorePercent: number
        categoryScores: { name: string; scorePercent: number }[]
      }
    }).officialScoresEcho
    assert.equal(echo.globalScorePercent, 88)
    assert.deepEqual(
      echo.categoryScores.map((c) => c.scorePercent),
      [92, 85, 87],
    )
  }
  const det = scoreDeterministic(b2, result)
  assert.equal(det.checks.find((c) => c.id === "scoring_integrity")?.pass, true)
})

test("A4: clarification without inventing a scorecard", async () => {
  const a4 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_ambiguous")!
  const result = await runFabricPattern(a4.patternId, a4.input, { allowInTests: true })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal((result.data as { status: string }).status, "needs_clarification")
    assert.ok((result.data as { clarifyingQuestion?: string }).clarifyingQuestion)
  }
  assert.equal(scoreDeterministic(a4, result).allRequiredPassed, true)
})

test("normalize helpers: horizon/priority; clipString no longer silent by default", () => {
  assert.equal(normalizeHorizonToken("30 jours"), "30_jours")
  assert.equal(normalizeHorizonToken("6 mois"), "6_mois")
  assert.equal(normalizePriorityToken("high"), "haute")
  const over = "abc".padEnd(10, "x")
  assert.equal(clipString(over, 5), over)
  assert.equal(clipString(over, 5, { allowSilentClip: true }), "abcxx")
})
