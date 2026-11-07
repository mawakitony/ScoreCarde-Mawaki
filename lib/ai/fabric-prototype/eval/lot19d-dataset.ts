import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"

/**
 * LOT 19D — 12 synthetic scenarios for qualitative LIVE review.
 * Fictional data only — no clients, CRM, tenants, or PII.
 */

const draft = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
  category: EvalScenario["expectations"]["category"] = "happy",
  extras: { mustClarify?: boolean } = {},
): EvalScenario => ({
  id: `d19d_draft_${id}`,
  patternId: "generate_scorecard_draft",
  name,
  description,
  input: { locale: "fr", maxQuestions: 12, maxCategories: 4, ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustBeDraftSuggestion: !extras.mustClarify,
    mustClarify: extras.mustClarify,
  },
})

const analyze = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
  category: EvalScenario["expectations"]["category"] = "happy",
): EvalScenario => ({
  id: `d19d_analyze_${id}`,
  patternId: "analyze_scorecard_results",
  name,
  description,
  input,
  expectations: {
    category,
    mustPassZodWhenOk: true,
    scoringIntegrity: true,
  },
})

const plan = (
  id: string,
  name: string,
  description: string,
  input: Record<string, unknown>,
  category: EvalScenario["expectations"]["category"] = "happy",
): EvalScenario => ({
  id: `d19d_plan_${id}`,
  patternId: "generate_action_plan",
  name,
  description,
  input: { locale: "fr", strengths: [], gaps: [], constraints: [], ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustHaveThreePriorities: true,
  },
})

export const LOT19D_DATASET: EvalScenario[] = [
  // —— Draft (4)
  draft("pmp", "Compétences PMP (synthétique)", "Évaluation de compétences PMP fictive", {
    description:
      "Créer une scorecard d'auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI.",
  }),
  draft("pmo", "Maturité PMO (synthétique)", "Diagnostic de maturité PMO fictif", {
    description:
      "Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting).",
  }),
  draft("prospects", "Qualification prospects", "Qualification commerciale B2B fictive", {
    description:
      "Scorecard de qualification de prospects B2B mid-market (besoin, budget indicatif, calendrier, décideurs) — données fictives uniquement.",
  }),
  draft(
    "ambiguous",
    "Demande incomplète / ambiguë",
    "Besoin volontairement vague",
    {
      description: "Je ne sais pas trop — quelque chose sur le leadership ou peut-être les ventes, à préciser.",
    },
    "edge",
    { mustClarify: true },
  ),

  // —— Analyze (4)
  analyze("low", "Score faible", "Profil global faible synthétique", {
    scorecardName: "Maturité PMO (synthétique)",
    objective: "Mesurer la maturité PMO",
    globalScorePercent: 27,
    categoryScores: [
      { name: "Gouvernance", scorePercent: 18 },
      { name: "Livraison", scorePercent: 32 },
      { name: "Reporting", scorePercent: 30 },
    ],
    thresholds: [{ label: "Faible", minPercent: 0, maxPercent: 39 }],
    allowedMetadata: { language: "fr", respondentCount: 1, notes: "échantillon synthétique faible" },
  }),
  analyze("high", "Score élevé", "Profil global élevé synthétique", {
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
  analyze("imbalanced", "Catégories déséquilibrées", "Écarts marqués entre catégories", {
    scorecardName: "Leadership de proximité (synthétique)",
    objective: "Évaluer les pratiques de leadership",
    globalScorePercent: 54,
    categoryScores: [
      { name: "Communication", scorePercent: 82 },
      { name: "Délégation", scorePercent: 28 },
      { name: "Feedback", scorePercent: 51 },
    ],
    thresholds: [{ label: "Intermédiaire", minPercent: 40, maxPercent: 74 }],
    allowedMetadata: { language: "fr", respondentCount: 1, notes: "déséquilibre synthétique" },
  }),
  analyze(
    "partial",
    "Données partielles",
    "Métadonnées limitées + une seule catégorie",
    {
      scorecardName: "Diagnostic partiel (synthétique)",
      objective: "Interpréter un résultat incomplet",
      globalScorePercent: 61,
      categoryScores: [{ name: "Processus", scorePercent: 61 }],
      thresholds: [],
      allowedMetadata: { language: "fr", respondentCount: 1 },
    },
    "edge",
  ),

  // —— Action plan (4)
  plan("skills", "Amélioration des compétences", "Plan compétences fictif", {
    situationSummary: "Écarts sur planification et suivi des risques ; bonnes bases de communication.",
    useCase: "developpement_competences",
    strengths: ["Communication claire avec les parties prenantes"],
    gaps: ["Planification des jalons irrégulière", "Registre de risques peu tenu"],
    constraints: ["Budget formation limité", "Disponibilité 2h/semaine"],
  }),
  plan("pmo", "Développement d'un PMO", "Plan PMO fictif", {
    situationSummary: "PMO émergent : gouvernance partielle, reporting manuel, livraison hétérogène.",
    useCase: "maturite_organisationnelle",
    strengths: ["Sponsor direction identifié"],
    gaps: ["Cadre de gouvernance incomplet", "Indicateurs de portefeuille absents"],
    constraints: ["Équipe PMO de 2 personnes", "Pas de nouvel outil cette année"],
  }),
  plan("digital", "Transformation digitale", "Plan transformation digitale fictif", {
    situationSummary: "Adoption outils collaboratifs avancée ; sécurité et automatisation en retard.",
    useCase: "maturite_organisationnelle",
    strengths: ["Adoption forte des outils collaboratifs"],
    gaps: ["Hygiène sécurité inégale", "Peu d'automatisation des processus métier"],
    constraints: ["Pas de recrutement IT immédiat", "Priorité conformité"],
  }),
  plan(
    "competing",
    "Priorités concurrentes",
    "Plusieurs urgences sans ordre clair",
    {
      situationSummary:
        "Diagnostic avec priorités concurrentes : qualité client, réduction des coûts et montée en compétences — sans arbitrage fourni.",
      useCase: "performance_equipe",
      strengths: ["Équipe motivée", "Process de base documentés"],
      gaps: ["Satisfaction client en baisse", "Coûts opérationnels élevés", "Compétences critiques concentrées"],
      constraints: ["Budget unique pour un seul chantier majeur", "Délai 90 jours"],
    },
    "edge",
  ),
]

export function lot19dDatasetSummary() {
  return {
    total: LOT19D_DATASET.length,
    byPattern: {
      generate_scorecard_draft: LOT19D_DATASET.filter((s) => s.patternId === "generate_scorecard_draft").length,
      analyze_scorecard_results: LOT19D_DATASET.filter((s) => s.patternId === "analyze_scorecard_results").length,
      generate_action_plan: LOT19D_DATASET.filter((s) => s.patternId === "generate_action_plan").length,
    },
    ids: LOT19D_DATASET.map((s) => s.id),
  }
}
