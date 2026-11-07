import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"

/**
 * LOT 19M — 8 synthetic scenarios for targeted LIVE retest after LOT 19L.
 * Versions: draft 1.3.1, plan 1.3.3, analyze 1.3.0.
 * Fictional data only — no clients, CRM, tenants, or PII.
 */

const draft = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
  category: EvalScenario["expectations"]["category"] = "happy",
  extras: { mustClarify?: boolean; humanReviewRequired?: boolean } = {},
): EvalScenario => ({
  id: `d19m_draft_${id}`,
  patternId: "generate_scorecard_draft",
  name,
  description,
  input: { locale: "fr", maxQuestions: 12, maxCategories: 4, ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustBeDraftSuggestion: !extras.mustClarify,
    mustClarify: extras.mustClarify,
    expectedPatternVersion: "1.3.1",
    humanReviewRequired: extras.humanReviewRequired ?? !extras.mustClarify,
    forbiddenSubstrings: extras.mustClarify
      ? undefined
      : ["certification officielle pmi", "certification pmi officielle"],
  },
})

const analyze = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
): EvalScenario => ({
  id: `d19m_analyze_${id}`,
  patternId: "analyze_scorecard_results",
  name,
  description,
  input,
  expectations: {
    category: "happy",
    mustPassZodWhenOk: true,
    scoringIntegrity: true,
    expectedPatternVersion: "1.3.0",
    humanReviewRequired: true,
  },
})

const plan = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
  category: EvalScenario["expectations"]["category"] = "happy",
  extras: {
    mustRequireArbitration?: boolean
    mustNotRequireArbitration?: boolean
    humanReviewRequired?: boolean
  } = {},
): EvalScenario => ({
  id: `d19m_plan_${id}`,
  patternId: "generate_action_plan",
  name,
  description,
  input: { locale: "fr", strengths: [], gaps: [], constraints: [], ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustHaveThreePriorities: true,
    mustRequireArbitration: extras.mustRequireArbitration,
    mustNotRequireArbitration: extras.mustNotRequireArbitration,
    expectedPatternVersion: "1.3.3",
    humanReviewRequired: extras.humanReviewRequired ?? true,
  },
})

export const LOT19M_DATASET: EvalScenario[] = [
  draft(
    "pmp",
    "A1 PMP compétences",
    "Anti-biais fréquence / outil ; efficacité des pratiques",
    {
      description:
        "Créer une scorecard d'auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI.",
    },
    "happy",
    { humanReviewRequired: true },
  ),
  draft(
    "pmo",
    "A2 Maturité PMO",
    "Gouvernance adaptée ; pas d'autonomie max / automatisation auto ; pas de contact",
    {
      description:
        "Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting).",
    },
    "happy",
    { humanReviewRequired: true },
  ),
  draft(
    "prospects",
    "A3 Prospects B2B",
    "Qualification B2B ; contraintes ≠ points ; pas d'email",
    {
      description:
        "Scorecard de qualification de prospects B2B mid-market fictifs : besoin métier, urgence, maturité d'achat et adéquation solution — sans collecte d'e-mail.",
    },
    "happy",
    { humanReviewRequired: true },
  ),
  draft(
    "ambiguous",
    "A4 Ambigu leadership/ventes",
    "needs_clarification obligatoire",
    {
      description: "Je voudrais quelque chose sur le leadership ou les ventes.",
    },
    "edge",
    { mustClarify: true, humanReviewRequired: false },
  ),

  analyze("high", "B2 Score élevé petits écarts", "Echo 88 % ; prudence écarts 1–4 pts", {
    scorecardName: "Compétences digitales (synthétique)",
    objective: "Cartographier les compétences numériques",
    globalScorePercent: 88,
    categoryScores: [
      { name: "Outils", scorePercent: 92 },
      { name: "Collaboration", scorePercent: 85 },
      { name: "Sécurité", scorePercent: 87 },
    ],
    thresholds: [{ label: "Élevé", minPercent: 75, maxPercent: 100 }],
    allowedMetadata: { language: "fr", respondentCount: 1, notes: "échantillon synthétique élevé" },
  }),

  plan(
    "skills",
    "C1 Compétences budget limité",
    "Budget formation limité ≠ arbitrage exclusif ; 3h/semaine",
    {
      situationSummary:
        "Diagnostic synthétique d'une équipe projet fictive : lacunes en gestion des risques, communication parties prenantes irrégulière et planification des jalons peu formalisée. Bases techniques correctes.",
      useCase: "developpement_competences",
      strengths: ["Bases techniques correctes", "Motivation individuelle"],
      gaps: [
        "Gestion des risques peu structurée",
        "Communication parties prenantes irrégulière",
        "Planification des jalons peu formalisée",
      ],
      constraints: ["Budget formation limité", "Disponibilité 3h/semaine"],
    },
    "happy",
    { mustNotRequireArbitration: true, humanReviewRequired: true },
  ),
  plan(
    "pmo",
    "C2 PMO reporting",
    "Pas de nouvel outil ; équipe 3 ; cibles % indicatives seulement",
    {
      situationSummary:
        "Organisation fictive dont le PMO produit un volume élevé de reporting opérationnel mais manque d'indicateurs utiles à l'arbitrage et à la priorisation du portefeuille.",
      useCase: "maturite_organisationnelle",
      strengths: ["Discipline de reporting établie", "Sponsor direction présent"],
      gaps: [
        "Indicateurs peu orientés décision",
        "Priorisation de portefeuille floue",
        "Temps passé en reporting au détriment de l'arbitrage",
      ],
      constraints: ["Pas de nouvel outil cette année", "Équipe PMO de 3 personnes"],
    },
    "happy",
    { mustNotRequireArbitration: true, humanReviewRequired: true },
  ),
  plan(
    "competing",
    "C4 Budget unique / arbitrage",
    "Un seul chantier majeur — arbitrage obligatoire",
    {
      situationSummary:
        "Organisation fictive aux ressources limitées confrontée simultanément à une baisse de satisfaction client, des coûts opérationnels élevés et une concentration des compétences critiques — sans arbitrage fourni.",
      useCase: "performance_equipe",
      strengths: ["Équipe motivée", "Process de base documentés"],
      gaps: [
        "Satisfaction client en baisse",
        "Coûts opérationnels élevés",
        "Compétences critiques concentrées sur peu de personnes",
      ],
      constraints: ["Budget unique pour un seul chantier majeur", "Délai 90 jours"],
    },
    "edge",
    { mustRequireArbitration: true, humanReviewRequired: true },
  ),
]

export function lot19mDatasetSummary() {
  const ids = LOT19M_DATASET.map((s) => s.id)
  return {
    total: LOT19M_DATASET.length,
    ids,
    uniqueIds: new Set(ids).size === ids.length,
    byPattern: {
      generate_scorecard_draft: LOT19M_DATASET.filter((s) => s.patternId === "generate_scorecard_draft").length,
      analyze_scorecard_results: LOT19M_DATASET.filter((s) => s.patternId === "analyze_scorecard_results")
        .length,
      generate_action_plan: LOT19M_DATASET.filter((s) => s.patternId === "generate_action_plan").length,
    },
    humanReviewRequiredIds: LOT19M_DATASET.filter((s) => s.expectations.humanReviewRequired).map(
      (s) => s.id,
    ),
    allSynthetic: true,
  }
}
