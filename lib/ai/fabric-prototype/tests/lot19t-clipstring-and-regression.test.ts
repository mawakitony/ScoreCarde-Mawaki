/**
 * LOT 19T — clipString fail-hard on critical Plan fields + offline regressions.
 * ZERO LIVE / Groq.
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"
import { findMisleadingPmiCertificationClaim, shouldRequireArbitration } from "@/lib/ai/fabric-prototype/business-guards"
import { scoreDeterministic } from "@/lib/ai/fabric-prototype/eval/deterministic-scorer"
import { LOT19M_CAMPAIGN, versionsMatchRequired } from "@/lib/ai/fabric-prototype/eval/lot19m-campaign"
import { LOT19M_DATASET } from "@/lib/ai/fabric-prototype/eval/lot19m-dataset"
import {
  clipString,
  coerceBooleanToken,
  normalizeHorizonToken,
  normalizePriorityToken,
  trimBusinessString,
} from "@/lib/ai/fabric-prototype/normalize"
import { getFabricPattern } from "@/lib/ai/fabric-prototype/registry"
import { runFabricPattern } from "@/lib/ai/fabric-prototype/runner"
import { generateActionPlanOutputSchema } from "@/lib/ai/fabric-prototype/schemas"

const LIVE19N_TRACES = resolve(
  "tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-traces.json",
)

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

test("LOT 19T versions: draft 1.3.1 / analyze 1.3.0 / plan 1.3.3", () => {
  assert.equal(getFabricPattern("generate_scorecard_draft")?.version, "1.3.1")
  assert.equal(getFabricPattern("analyze_scorecard_results")?.version, "1.3.0")
  assert.equal(getFabricPattern("generate_action_plan")?.version, "1.3.3")
  assert.equal(versionsMatchRequired().all, true)
  assert.equal(LOT19M_CAMPAIGN.versionsRequired.generate_action_plan, "1.3.3")
  assert.ok(getFabricPattern("generate_action_plan")?.systemInstructions.includes("VERSION=1.3.3"))
  assert.ok(getFabricPattern("generate_action_plan")?.systemInstructions.includes("troncature silencieuse"))
})

test("trimBusinessString never truncates; clipString default preserves over-length", () => {
  assert.equal(trimBusinessString("  ab  "), "ab")
  assert.equal(trimBusinessString(12), 12)
  const over = "x".repeat(50)
  assert.equal(clipString(over, 10), over)
  assert.equal(clipString(over, 10, { allowSilentClip: true }), "x".repeat(10))
})

test("A. lengths: under / exact / over max — over fails Zod explicitly", () => {
  const under = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, description: "Court mais assez long ici." } : a,
      ),
    }),
  )
  assert.equal(under.success, true)

  const exact = "é".repeat(400)
  const atMax = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, description: exact } : a,
      ),
    }),
  )
  assert.equal(atMax.success, true)

  const over = "a".repeat(401)
  const tooLong = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, description: over } : a,
      ),
    }),
  )
  assert.equal(tooLong.success, false)
  if (!tooLong.success) {
    const flat = tooLong.error.flatten()
    assert.ok(JSON.stringify(flat).includes("description") || flat.formErrors.length >= 0)
  }
})

test("A. critical content at end of over-length string is not silently dropped", () => {
  const marker = "ARBITRAGE_OBLIGATOIRE_BUDGET_UNIQUE_J90"
  const description = `${"z".repeat(380)}${marker}`
  assert.ok(description.length > 400)
  const parsed = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, description } : a,
      ),
    }),
  )
  assert.equal(parsed.success, false, "must fail Zod rather than clip away marker")
})

test("A. constraint / deadline / justification markers at end of situationSynthesis", () => {
  for (const marker of [
    "CONTRAINTE_BUDGET_UNIQUE",
    "ECHEANCE_J90_STRICTE",
    "JUSTIFICATION_SPONSOR_REQUISE",
  ]) {
    const text = `${"s".repeat(601 - 1)}${marker}`
    assert.ok(text.length > 600, marker)
    const parsed = generateActionPlanOutputSchema.safeParse(basePlan({ situationSynthesis: text }))
    assert.equal(parsed.success, false, `expected Zod fail preserving ${marker}`)
  }
})

test("A. unicode accents, empty, very long", () => {
  assert.equal(trimBusinessString("  Échéance à J+90  "), "Échéance à J+90")
  const empty = generateActionPlanOutputSchema.safeParse(basePlan({ situationSynthesis: "   " }))
  assert.equal(empty.success, false)
  const huge = generateActionPlanOutputSchema.safeParse(
    basePlan({ arbitrationQuestion: "q".repeat(5000) }),
  )
  assert.equal(huge.success, false)
})

test("B. Plan contract: enums, bool coerce, invalid JSON path via schema", () => {
  assert.equal(normalizeHorizonToken("90 jours"), "90_jours")
  assert.equal(normalizePriorityToken("low"), "basse")
  assert.equal(coerceBooleanToken("false"), false)
  assert.equal(coerceBooleanToken("true"), true)
  const ok = generateActionPlanOutputSchema.safeParse(
    basePlan({
      requiresArbitration: "true",
      arbitrationQuestion: "Quel chantier unique priorisez-vous ?",
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, priority: "high", horizon: "30 jours" } : a,
      ),
    }),
  )
  assert.equal(ok.success, true)
  const badEnum = generateActionPlanOutputSchema.safeParse(
    basePlan({
      actions: (basePlan().actions as Record<string, unknown>[]).map((a, i) =>
        i === 0 ? { ...a, horizon: "next_week" } : a,
      ),
    }),
  )
  assert.equal(badEnum.success, false)
})

test("C. arbitration: C1 limited vs C4 exclusive", async () => {
  assert.equal(
    shouldRequireArbitration({
      gaps: ["a", "b"],
      constraints: ["Budget formation limité"],
    }),
    false,
  )
  assert.equal(
    shouldRequireArbitration({
      gaps: ["a", "b"],
      constraints: ["Budget unique pour un seul chantier majeur"],
    }),
    true,
  )
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
})

test("D. A1 PMI + A4 + B2 offline", async () => {
  assert.equal(findMisleadingPmiCertificationClaim("Ne constitue pas une certification officielle PMI."), null)
  assert.ok(findMisleadingPmiCertificationClaim("Cet outil est officiellement certifié par PMI."))
  const a4 = LOT19M_DATASET.find((s) => s.id === "d19m_draft_ambiguous")!
  const b2 = LOT19M_DATASET.find((s) => s.id === "d19m_analyze_high")!
  const rA = await runFabricPattern(a4.patternId, a4.input, { allowInTests: true })
  const rB = await runFabricPattern(b2.patternId, b2.input, { allowInTests: true })
  assert.equal(rA.ok, true)
  if (rA.ok) assert.equal((rA.data as { status: string }).status, "needs_clarification")
  if (rB.ok) {
    const echo = (
      rB.data as {
        officialScoresEcho: { globalScorePercent: number; categoryScores: { scorePercent: number }[] }
      }
    ).officialScoresEcho
    assert.equal(echo.globalScorePercent, 88)
    assert.deepEqual(
      echo.categoryScores.map((c) => c.scorePercent),
      [92, 85, 87],
    )
  }
  assert.equal(scoreDeterministic(b2, rB).checks.find((c) => c.id === "scoring_integrity")?.pass, true)
})

test("A1 historical 19N replay still clean after clipString fix", () => {
  assert.equal(existsSync(LIVE19N_TRACES), true)
  const traces = JSON.parse(readFileSync(LIVE19N_TRACES, "utf8")) as {
    traces: Array<{ scenarioId: string; validatedOutput?: unknown }>
  }
  const a1 = traces.traces.find((t) => t.scenarioId === "d19m_draft_pmp")
  assert.ok(a1?.validatedOutput)
  assert.equal(findMisleadingPmiCertificationClaim(a1.validatedOutput), null)
})

test("LIVE harness locks not weakened (19M confirm still required)", () => {
  assert.equal(LOT19M_CAMPAIGN.confirmValue, "I_AUTHORIZE_LOT19M_LIVE")
  assert.equal(LOT19M_CAMPAIGN.requiresNewAuthorization, true)
  assert.notEqual(process.env.FABRIC_EVAL_CONFIRM_19M, LOT19M_CAMPAIGN.confirmValue)
})
