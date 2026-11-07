import assert from "node:assert/strict"
import { test } from "node:test"
import {
  findGuaranteedPercentClaims,
  findOffTopicContactQuestions,
  shouldRequireArbitration,
} from "../business-guards.ts"
import { runLot19aEvaluation } from "../eval/harness.ts"
import { LOT19A_DATASET } from "../eval/dataset.ts"
import { listFabricPatterns, getFabricPattern } from "../registry.ts"
import { runFabricPattern } from "../runner.ts"
import {
  generateScorecardDraftOutputSchema,
  analyzeScorecardResultsOutputSchema,
  generateActionPlanOutputSchema,
} from "../schemas.ts"
import type { FabricLlmAdapter } from "../types.ts"

test("LOT 19I — patterns remain on 1.3.x line", () => {
  assert.ok(listFabricPatterns().every((p) => /^1\.3\.\d+$/.test(p.version)))
})

test("Zod draft union: draft_suggestion vs needs_clarification", () => {
  const draft = generateScorecardDraftOutputSchema.safeParse({
    status: "draft_suggestion",
    title: "Titre ok",
    description: "Description suffisamment longue",
    targetAudience: "Managers",
    objective: "Objectif suffisamment long ici",
    categories: [{ name: "Cat A" }],
    questions: [
      { title: "Q1 longue assez", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
      { title: "Q2 longue assez", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
      { title: "Q3 longue assez", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
    ],
    weightingNotes: "notes",
    recommendations: ["Revue humaine"],
    disclaimers: ["Validation humaine requise."],
  })
  assert.equal(draft.success, true)

  const clarify = generateScorecardDraftOutputSchema.safeParse({
    status: "needs_clarification",
    clarifyingQuestion: "Souhaitez-vous le leadership ou les ventes ?",
    options: ["Leadership", "Ventes"],
    disclaimers: ["Aucune scorecard persistée."],
  })
  assert.equal(clarify.success, true)

  const mixed = generateScorecardDraftOutputSchema.safeParse({
    status: "needs_clarification",
    clarifyingQuestion: "Pouvez-vous clarifier l'objectif ?",
    title: "Ignoré sur cette branche",
    disclaimers: ["Aucune scorecard persistée."],
  })
  assert.equal(mixed.success, true)
  if (mixed.success) assert.equal(mixed.data.status, "needs_clarification")
})

test("PMP / PMO / sales drafts stay on-topic without contact fields", async () => {
  const cases = [
    {
      description: "Je souhaite créer une scorecard pour évaluer les compétences en gestion de projet PMP.",
      expectCat: /Planification|Risques|Suivi/,
    },
    {
      description: "Diagnostic de maturité PMO pour une direction de projets de 40 personnes.",
      expectCat: /Gouvernance|Livraison|Reporting/,
    },
    {
      description: "Scorecard de qualification commerciale pour prospects B2B mid-market.",
      expectCat: /Besoin|Maturité|Fit/,
    },
  ]
  for (const item of cases) {
    const result = await runFabricPattern(
      "generate_scorecard_draft",
      { description: item.description, locale: "fr", maxQuestions: 12, maxCategories: 4 },
      { allowInTests: true },
    )
    assert.equal(result.ok, true, item.description)
    if (!result.ok) continue
    const parsed = generateScorecardDraftOutputSchema.safeParse(result.data)
    assert.equal(parsed.success, true)
    if (parsed.success && parsed.data.status === "draft_suggestion") {
      assert.ok(parsed.data.questions.length >= 3)
      assert.ok(parsed.data.questions.length <= 12)
      assert.ok(parsed.data.categories.length <= 4)
      assert.equal(
        findOffTopicContactQuestions(item.description, parsed.data.questions),
        null,
      )
      assert.ok(
        parsed.data.categories.some((c) => item.expectCat.test(c.name)),
        `categories=${parsed.data.categories.map((c) => c.name).join(",")}`,
      )
      assert.equal(
        parsed.data.questions.some((q) => q.type === "email" || q.type === "phone"),
        false,
      )
    }
  }
})

test("ambiguous and incomplete needs", async () => {
  const ambiguous = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description: "Je voudrais quelque chose sur le leadership ou les ventes.",
      locale: "fr",
    },
    { allowInTests: true },
  )
  assert.equal(ambiguous.ok, true)
  if (ambiguous.ok) {
    const data = ambiguous.data as { status: string; clarifyingQuestion?: string }
    assert.equal(data.status, "needs_clarification")
    assert.ok(data.clarifyingQuestion)
  }

  const incomplete = await runFabricPattern(
    "generate_scorecard_draft",
    { description: "Besoin" },
    { allowInTests: true },
  )
  assert.equal(incomplete.ok, false)
  if (!incomplete.ok) assert.equal(incomplete.error.code, "input_invalid")
})

test("size constraints and off-topic contact rejected", async () => {
  const oversizedAdapter: FabricLlmAdapter = {
    id: "oversized",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        status: "draft_suggestion",
        title: "Trop de questions",
        description: "Description suffisamment longue pour le schéma.",
        targetAudience: "Tous",
        objective: "Objectif suffisamment long ici pour passer.",
        categories: [{ name: "A" }, { name: "B" }, { name: "C" }],
        questions: Array.from({ length: 8 }, (_, i) => ({
          title: `Question numéro ${i + 1} assez longue`,
          type: "yes_no",
          options: [{ label: "Oui" }, { label: "Non" }],
        })),
        weightingNotes: "notes",
        recommendations: ["Revue"],
        disclaimers: ["Validation humaine requise."],
      })
    },
  }
  const overQ = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description: "Scorecard courte de maturité organisationnelle pour test de limite.",
      maxQuestions: 5,
      maxCategories: 2,
    },
    { allowInTests: true, adapter: oversizedAdapter },
  )
  assert.equal(overQ.ok, false)
  if (!overQ.ok) assert.equal(overQ.error.code, "output_invalid")

  const contactAdapter: FabricLlmAdapter = {
    id: "contact",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        status: "draft_suggestion",
        title: "Maturité PMO",
        description: "Diagnostic organisationnel sans besoin de contact.",
        targetAudience: "PMO",
        objective: "Mesurer la maturité organisationnelle du PMO.",
        categories: [{ name: "Gouvernance" }],
        questions: [
          { title: "Quelle est l'adresse e-mail du responsable PMO ?", type: "email", options: [] },
          { title: "Les rôles sont-ils formalisés ?", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
          { title: "Le reporting est-il mensuel ?", type: "yes_no", options: [{ label: "Oui" }, { label: "Non" }] },
        ],
        weightingNotes: "notes",
        recommendations: ["Revue"],
        disclaimers: ["Validation humaine requise."],
      })
    },
  }
  const contact = await runFabricPattern(
    "generate_scorecard_draft",
    {
      description: "Diagnostic de maturité PMO pour une direction de projets.",
      maxQuestions: 12,
      maxCategories: 4,
    },
    { allowInTests: true, adapter: contactAdapter },
  )
  assert.equal(contact.ok, false)
  if (!contact.ok) {
    assert.equal(contact.error.code, "output_invalid")
    assert.match(contact.error.message, /contact/i)
  }
})

test("analyze: facts/interpretations + scoring integrity cases", async () => {
  const scenarios = [
    {
      name: "faible",
      globalScorePercent: 28,
      categoryScores: [
        { name: "Gouvernance", scorePercent: 20 },
        { name: "Livraison", scorePercent: 35 },
      ],
      thresholds: [{ label: "Faible", minPercent: 0, maxPercent: 39 }],
      respondentCount: 1,
    },
    {
      name: "élevé",
      globalScorePercent: 88,
      categoryScores: [
        { name: "A", scorePercent: 90 },
        { name: "B", scorePercent: 85 },
      ],
      thresholds: [{ label: "Élevé", minPercent: 75, maxPercent: 100 }],
      respondentCount: 12,
    },
    {
      name: "déséquilibré",
      globalScorePercent: 55,
      categoryScores: [
        { name: "Fort", scorePercent: 95 },
        { name: "Faible", scorePercent: 15 },
      ],
      thresholds: [{ label: "Moyen", minPercent: 40, maxPercent: 74 }],
      respondentCount: 3,
    },
    {
      name: "une catégorie",
      globalScorePercent: 50,
      categoryScores: [{ name: "Seul", scorePercent: 50 }],
      thresholds: [],
      respondentCount: 1,
    },
    {
      name: "scores identiques",
      globalScorePercent: 60,
      categoryScores: [
        { name: "X", scorePercent: 60 },
        { name: "Y", scorePercent: 60 },
      ],
      thresholds: [{ label: "Moyen", minPercent: 40, maxPercent: 74 }],
      respondentCount: 2,
    },
  ]

  for (const s of scenarios) {
    const result = await runFabricPattern(
      "analyze_scorecard_results",
      {
        scorecardName: "Test",
        objective: `Analyse ${s.name}`,
        globalScorePercent: s.globalScorePercent,
        categoryScores: s.categoryScores,
        thresholds: s.thresholds,
        allowedMetadata: { language: "fr", respondentCount: s.respondentCount, notes: s.name },
      },
      { allowInTests: true },
    )
    assert.equal(result.ok, true, s.name)
    if (!result.ok) continue
    const parsed = analyzeScorecardResultsOutputSchema.safeParse(result.data)
    assert.equal(parsed.success, true, s.name)
    if (parsed.success) {
      assert.equal(parsed.data.officialScoresEcho.globalScorePercent, s.globalScorePercent)
      assert.deepEqual(parsed.data.officialScoresEcho.categoryScores, s.categoryScores)
      assert.ok(parsed.data.facts.length >= 1)
      assert.ok(parsed.data.interpretations.length >= 1)
      assert.ok(parsed.data.analysisLimits.length >= 1)
    }
  }
})

test("action plan: no guaranteed %, arbitration on competing budget", async () => {
  const normal = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Écarts modérés sur le suivi KPI avec bases process correctes.",
      useCase: "performance_equipe",
      strengths: ["Process documentés"],
      gaps: ["Suivi KPI irrégulier"],
      constraints: ["Budget formation limité"],
      locale: "fr",
    },
    { allowInTests: true },
  )
  assert.equal(normal.ok, true)
  if (normal.ok) {
    const parsed = generateActionPlanOutputSchema.safeParse(normal.data)
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(findGuaranteedPercentClaims(parsed.data), null)
      assert.equal(parsed.data.requiresArbitration, false)
      assert.ok(parsed.data.missingInformation !== undefined)
    }
  }

  const competing = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Plusieurs problèmes simultanés avec budget unique.",
      useCase: "performance_equipe",
      strengths: ["Équipe motivée"],
      gaps: ["Satisfaction client en baisse", "Coûts opérationnels élevés"],
      constraints: ["Budget unique pour un seul chantier majeur", "Délai 90 jours"],
      locale: "fr",
    },
    { allowInTests: true },
  )
  assert.equal(competing.ok, true)
  if (competing.ok) {
    const data = competing.data as {
      requiresArbitration: boolean
      arbitrationQuestion?: string
    }
    assert.equal(data.requiresArbitration, true)
    assert.ok(data.arbitrationQuestion)
  }

  assert.equal(
    shouldRequireArbitration({
      gaps: ["A", "B"],
      constraints: ["Budget unique pour un seul chantier majeur"],
    }),
    true,
  )

  const guaranteedAdapter: FabricLlmAdapter = {
    id: "guaranteed-pct",
    mode: "mock",
    async completeJson() {
      return JSON.stringify({
        situationSynthesis: "Plan avec promesse chiffrée abusive.",
        topPriorities: ["P1", "P2", "P3"],
        actions: [
          {
            title: "Couper le bruit",
            description: "Action qui réduira de 50 % les demandes d'information.",
            priority: "haute",
            horizon: "30_jours",
            expectedOutcome: "Réduction garantie de 50 %",
            successIndicator: "−50 % garanti",
          },
          {
            title: "Deux",
            description: "Deuxième action concrète liée au diagnostic fourni.",
            priority: "moyenne",
            horizon: "30_jours",
            expectedOutcome: "Livrable",
            successIndicator: "Date",
          },
          {
            title: "Trois",
            description: "Troisième action concrète liée au diagnostic fourni.",
            priority: "basse",
            horizon: "90_jours",
            expectedOutcome: "Livrable",
            successIndicator: "Date",
          },
        ],
        facts: ["Écarts fournis en entrée."],
        hypotheses: ["Causes non fournies possibles."],
        recommendations: ["Valider avant exécution."],
        disclaimers: ["Aucun résultat n'est garanti."],
        missingInformation: [],
        requiresArbitration: false,
      })
    },
  }
  const badPct = await runFabricPattern(
    "generate_action_plan",
    {
      situationSummary: "Diagnostic synthétique pour tester le garde anti-garantie.",
      useCase: "maturite_organisationnelle",
      gaps: ["Reporting trop long"],
      constraints: ["Budget limité"],
      locale: "fr",
    },
    { allowInTests: true, adapter: guaranteedAdapter },
  )
  assert.equal(badPct.ok, false)
  if (!badPct.ok) assert.equal(badPct.error.code, "output_invalid")
})

test("isolation: no unauthorized writes; patterns remain prototype-only", () => {
  const draft = getFabricPattern("generate_scorecard_draft")
  assert.ok(draft)
  assert.match(draft?.version ?? "", /^1\.3\.\d+$/)
  assert.ok(draft?.businessConstraints.some((c) => /persistence|persist/i.test(c)))
})

test("LOT19A mock regression still green on 1.3.x", async () => {
  const report = await runLot19aEvaluation({
    mode: "mock",
    scenarios: LOT19A_DATASET,
    campaignId: "lot19i-regression",
  })
  assert.equal(report.scenarioCount, 30)
  assert.equal(report.summary.deterministicFail, 0)
  assert.equal(report.summary.scoringIntegrityFail, 0)
  assert.ok(report.results.every((r) => !r.runOk || /^1\.3\.\d+$/.test(r.patternVersion ?? "")))
})
