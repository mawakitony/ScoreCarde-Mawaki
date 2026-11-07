import assert from "node:assert/strict"
import { test } from "node:test"
import {
  findDraftScoringBiasSignals,
  findGuaranteedPercentClaims,
  findHorizonInconsistencies,
  findUnvalidatedPercentTargets,
  hasExclusiveResourceConstraint,
  shouldRequireArbitration,
} from "../business-guards.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import { LOT19A_DATASET } from "../eval/dataset.ts"
import { getFabricPattern, listFabricPatterns } from "../registry.ts"
import { runFabricPattern } from "../runner.ts"
import {
  analyzeScorecardResultsOutputSchema,
  generateActionPlanOutputSchema,
  generateScorecardDraftOutputSchema,
} from "../schemas.ts"
import type { FabricLlmAdapter } from "../types.ts"

test("LOT 19L versions: draft 1.3.1, plan 1.3.x, analyze 1.3.0", () => {
  assert.equal(getFabricPattern("generate_scorecard_draft")?.version, "1.3.1")
  assert.ok(/^1\.3\.\d+$/.test(getFabricPattern("generate_action_plan")?.version ?? ""))
  assert.equal(getFabricPattern("analyze_scorecard_results")?.version, "1.3.0")
  assert.ok(listFabricPatterns().every((p) => /^1\.3\.\d+$/.test(p.version)))
})

test("PMP mock: no frequency/tool ownership scoring bias", async () => {
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description:
        "Je souhaite créer une scorecard pour évaluer les compétences en gestion de projet PMP.",
      locale: "fr",
      maxQuestions: 12,
      maxCategories: 4,
    },
    { allowInTests: true },
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  const parsed = generateScorecardDraftOutputSchema.safeParse(result.data)
  assert.equal(parsed.success, true)
  if (!parsed.success || parsed.data.status !== "draft_suggestion") return
  const biases = findDraftScoringBiasSignals(parsed.data.questions)
  assert.deepEqual(biases, [])
  assert.ok(parsed.data.disclaimers.some((d) => /PMI|certification/i.test(d)))
  const followUp = parsed.data.questions.find((q) => /utilité|utilite|décision|decision|efficacité|efficacite/i.test(`${q.title} ${q.description ?? ""}`))
  assert.ok(followUp, "expected decision-usefulness framing on follow-up/reporting")
})

test("PMO mock: governance adapted, not automation/autonomy-max bias", async () => {
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description: "Diagnostic de maturité PMO pour une direction de projets de 40 personnes.",
      locale: "fr",
      maxQuestions: 12,
      maxCategories: 4,
    },
    { allowInTests: true },
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  const data = result.data as { status: string; questions: Array<Record<string, unknown>> }
  assert.equal(data.status, "draft_suggestion")
  assert.deepEqual(findDraftScoringBiasSignals(data.questions as never), [])
  const reporting = data.questions.find((q) =>
    /reporting|arbitrage|décision|decision/i.test(String(q.title ?? "")),
  )
  assert.ok(reporting)
})

test("B2B mock: constraints not scored as positive by themselves", async () => {
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description: "Scorecard de qualification commerciale pour prospects B2B mid-market.",
      locale: "fr",
      maxQuestions: 12,
      maxCategories: 4,
    },
    { allowInTests: true },
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  const data = result.data as {
    status: string
    questions: Array<{ title?: string; isScored?: boolean; type?: string }>
  }
  assert.equal(data.status, "draft_suggestion")
  assert.deepEqual(findDraftScoringBiasSignals(data.questions as never), [])
  const constraintQ = data.questions.find((q) => /contraintes? de sécurité|conformité/i.test(q.title ?? ""))
  assert.ok(constraintQ)
  assert.equal(constraintQ?.isScored, false)
  const fitQ = data.questions.find((q) => /couvre-t-elle les contraintes|répond-elle/i.test(q.title ?? ""))
  assert.ok(fitQ)
  assert.equal(fitQ?.isScored, true)
  assert.equal(
    data.questions.some((q) => q.type === "email" || q.type === "phone"),
    false,
  )
})

test("ambiguous request returns needs_clarification", async () => {
  const result = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Je voudrais quelque chose sur le leadership ou les ventes.", locale: "fr" },
    { allowInTests: true },
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  const data = result.data as { status: string }
  assert.equal(data.status, "needs_clarification")
})

test("analyze non-regression: score integrity + facts/interpretations", async () => {
  const result = await runFabricPattern(
    "analyze_scorecard_results",
    {
      scorecardName: "Test",
      objective: "Analyse non-régression 19L",
      globalScorePercent: 88,
      categoryScores: [
        { name: "Outils", scorePercent: 92 },
        { name: "Collaboration", scorePercent: 85 },
      ],
      thresholds: [{ label: "Élevé", minPercent: 75, maxPercent: 100 }],
      allowedMetadata: { language: "fr", respondentCount: 1, notes: "élevé" },
    },
    { allowInTests: true },
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  const parsed = analyzeScorecardResultsOutputSchema.safeParse(result.data)
  assert.equal(parsed.success, true)
  if (!parsed.success) return
  assert.equal(parsed.data.officialScoresEcho.globalScorePercent, 88)
  assert.ok(parsed.data.facts.length >= 1)
  assert.ok(parsed.data.interpretations.length >= 1)
  assert.ok(parsed.data.analysisLimits.length >= 1)
  assert.equal(getFabricPattern("analyze_scorecard_results")?.version, "1.3.0")
})

test("limited budget does NOT require arbitration; exclusive does", () => {
  assert.equal(
    shouldRequireArbitration({
      gaps: ["A", "B"],
      constraints: ["Budget formation limité", "Disponibilité 3h/semaine"],
    }),
    false,
  )
  assert.equal(hasExclusiveResourceConstraint(["Budget formation limité"]), false)
  assert.equal(
    shouldRequireArbitration({
      gaps: ["Satisfaction client", "Coûts"],
      constraints: ["Budget unique pour un seul chantier majeur"],
    }),
    true,
  )
})

test("plan: limited budget → no forced arbitration; exclusive → arbitration", async () => {
  const limited = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Lacunes risques et communication avec budget formation limité.",
      useCase: "developpement_competences",
      strengths: ["Bases techniques"],
      gaps: ["Gestion des risques", "Communication parties prenantes"],
      constraints: ["Budget formation limité"],
      locale: "fr",
    },
    { allowInTests: true },
  )
  assert.equal(limited.ok, true)
  if (limited.ok) {
    const data = limited.data as { requiresArbitration: boolean }
    assert.equal(data.requiresArbitration, false)
  }

  const exclusive = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Plusieurs problèmes avec budget pour un seul chantier.",
      useCase: "performance_equipe",
      strengths: ["Équipe motivée"],
      gaps: ["Satisfaction client", "Coûts opérationnels"],
      constraints: ["Budget unique pour un seul chantier majeur"],
      locale: "fr",
    },
    { allowInTests: true },
  )
  assert.equal(exclusive.ok, true)
  if (exclusive.ok) {
    const data = exclusive.data as { requiresArbitration: boolean; arbitrationQuestion?: string }
    assert.equal(data.requiresArbitration, true)
    assert.ok(data.arbitrationQuestion)
  }
})

test("horizon inconsistency and bare % are rejected", async () => {
  assert.ok(
    findHorizonInconsistencies([
      {
        title: "Bad calendar",
        horizon: "6_mois",
        description: "Livrer le correctif à J+60.",
        expectedOutcome: "Correctif en prod",
        successIndicator: "Fait à J+60",
      },
    ]),
  )
  assert.equal(
    findHorizonInconsistencies([
      {
        title: "OK",
        horizon: "90_jours",
        description: "Suivre l'indicateur.",
        expectedOutcome: "Tableau prêt",
        successIndicator: "Indicateur renseigné à J+90",
      },
    ]),
    null,
  )
  assert.ok(findUnvalidatedPercentTargets({
    actions: [
      {
        description: "Améliorer le process",
        expectedOutcome: "Réduction de 20 % du temps",
        successIndicator: "-20 %",
      },
    ],
  }))
  assert.equal(
    findUnvalidatedPercentTargets({
      actions: [
        {
          description: "Améliorer le process",
          expectedOutcome: "Cible proposée à valider : −20 % (indicatif)",
          successIndicator: "Mesure renseignée",
        },
      ],
    }),
    null,
  )

  const badHorizon: FabricLlmAdapter = {
    id: "bad-horizon",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        situationSynthesis: "Plan avec calendrier incohérent volontairement.",
        topPriorities: ["P1 claire", "P2 claire", "P3 claire"],
        actions: [
          {
            title: "Livraison lointaine mal classée",
            description: "Réaliser le correctif à J+60.",
            priority: "haute",
            horizon: "6_mois",
            expectedOutcome: "Correctif livré",
            successIndicator: "Fait à J+60",
          },
          {
            title: "Deux",
            description: "Deuxième action concrète liée au diagnostic fourni.",
            priority: "moyenne",
            horizon: "30_jours",
            expectedOutcome: "Livrable",
            successIndicator: "Date J+30",
          },
          {
            title: "Trois",
            description: "Troisième action concrète liée au diagnostic fourni.",
            priority: "basse",
            horizon: "90_jours",
            expectedOutcome: "Livrable",
            successIndicator: "Date J+90",
          },
        ],
        facts: ["Écarts fournis en entrée."],
        hypotheses: ["Hypothèse explicite."],
        recommendations: ["Valider avant exécution."],
        disclaimers: ["Aucun résultat n'est garanti."],
        missingInformation: [],
        requiresArbitration: false,
      })
    },
  }
  const bad = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Diagnostic synthétique pour tester cohérence horizon.",
      useCase: "maturite_organisationnelle",
      gaps: ["Reporting"],
      constraints: ["Budget formation limité"],
      locale: "fr",
    },
    { allowInTests: true, adapter: badHorizon },
  )
  assert.equal(bad.ok, false)
  if (!bad.ok) assert.match(bad.error.message, /horizon/i)

  const barePct: FabricLlmAdapter = {
    id: "bare-pct",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        situationSynthesis: "Plan avec pourcentage non validé.",
        topPriorities: ["P1 claire", "P2 claire", "P3 claire"],
        actions: [
          {
            title: "Accélérer",
            description: "Réduire les délais de reporting.",
            priority: "haute",
            horizon: "30_jours",
            expectedOutcome: "Réduction de 20 % du temps de reporting",
            successIndicator: "Temps mesuré",
          },
          {
            title: "Deux",
            description: "Deuxième action concrète liée au diagnostic fourni.",
            priority: "moyenne",
            horizon: "30_jours",
            expectedOutcome: "Livrable",
            successIndicator: "Date J+30",
          },
          {
            title: "Trois",
            description: "Troisième action concrète liée au diagnostic fourni.",
            priority: "basse",
            horizon: "90_jours",
            expectedOutcome: "Livrable",
            successIndicator: "Date J+90",
          },
        ],
        facts: ["Écarts fournis."],
        hypotheses: ["Hypothèse."],
        recommendations: ["Valider."],
        disclaimers: ["Aucun résultat n'est garanti."],
        requiresArbitration: false,
      })
    },
  }
  const pct = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Diagnostic synthétique pour tester pourcentages non validés.",
      useCase: "maturite_organisationnelle",
      gaps: ["Reporting trop long"],
      constraints: ["Budget formation limité"],
      locale: "fr",
    },
    { allowInTests: true, adapter: barePct },
  )
  assert.equal(pct.ok, false)
  if (!pct.ok) assert.match(pct.error.message, /Pourcentage|valider/i)
  assert.equal(findGuaranteedPercentClaims({ situationSynthesis: "ok" }), null)
})

test("LOT19A mock regression still green after 19L", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: LOT19A_DATASET,
    campaignId: "lot19l-regression",
  })
  assert.equal(report.scenarioCount, 30)
  assert.equal(report.summary.deterministicFail, 0)
  assert.equal(report.summary.scoringIntegrityFail, 0)
})

test("draft/plan prompts advertise anti-bias rules and current versions", () => {
  const draft = getFabricPattern("generate_scorecard_draft")
  assert.ok(draft?.systemInstructions.includes("VERSION=1.3.1"))
  assert.ok(draft?.systemInstructions.includes("ANTI-BIAIS"))
  const plan = getFabricPattern("generate_action_plan")
  assert.ok(/VERSION=1\.3\.\d+/.test(plan?.systemInstructions ?? ""))
  assert.ok(plan?.systemInstructions.includes("budget simplement") || plan?.systemInstructions.includes("limité"))
  const parsed = generateActionPlanOutputSchema.safeParse({
    situationSynthesis: "Synthèse suffisamment longue pour le schéma.",
    topPriorities: ["A un", "B deux", "C trois"],
    actions: [
      {
        title: "Action une",
        description: "Description suffisamment longue ici.",
        priority: "haute",
        horizon: "immédiat",
        expectedOutcome: "Livrable",
        successIndicator: "Sous 7 jours",
      },
      {
        title: "Action deux",
        description: "Description suffisamment longue ici.",
        priority: "moyenne",
        horizon: "30_jours",
        expectedOutcome: "Livrable",
        successIndicator: "À J+30",
      },
      {
        title: "Action trois",
        description: "Description suffisamment longue ici.",
        priority: "basse",
        horizon: "90_jours",
        expectedOutcome: "Livrable",
        successIndicator: "À J+90",
      },
    ],
    facts: ["Fait fourni."],
    hypotheses: ["Hypothèse."],
    recommendations: ["Reco."],
    disclaimers: ["Disclaimer ok."],
  })
  assert.equal(parsed.success, true)
})
