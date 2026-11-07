import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"

/**
 * LOT 19J — 12 synthetic scenarios for LIVE retest of Patterns v1.3.0.
 * Aligned with docs/ai/lot19i-targeted-retest-plan.md (A1–C4).
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
  id: `d19j_draft_${id}`,
  patternId: "generate_scorecard_draft",
  name,
  description,
  input: { locale: "fr", maxQuestions: 12, maxCategories: 4, ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustBeDraftSuggestion: !extras.mustClarify,
    mustClarify: extras.mustClarify,
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
  category: EvalScenario["expectations"]["category"] = "happy",
): EvalScenario => ({
  id: `d19j_analyze_${id}`,
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
  extras: { mustRequireArbitration?: boolean } = {},
): EvalScenario => ({
  id: `d19j_plan_${id}`,
  patternId: "generate_action_plan",
  name,
  description,
  input: { locale: "fr", strengths: [], gaps: [], constraints: [], ...input },
  expectations: {
    category,
    mustPassZodWhenOk: true,
    mustHaveThreePriorities: true,
    mustRequireArbitration: extras.mustRequireArbitration,
  },
})

export const LOT19J_DATASET: EvalScenario[] = [
  // —— A draft (4)
  draft("pmp", "A1 PMP compétences", "Questions métier PMP / échelles explicites", {
    description:
      "Créer une scorecard d'auto-évaluation des pratiques de gestion de projet inspirées du référentiel PMP, sans prétendre à une certification officielle PMI.",
  }),
  draft("pmo", "A2 Maturité PMO", "Maturité organisationnelle sans collecte de contact", {
    description:
      "Diagnostic de maturité PMO pour une direction de projets fictive de 40 personnes (gouvernance, livraison, reporting).",
  }),
  draft("prospects", "A3 Prospects B2B", "Qualification commerciale besoin / maturité / fit", {
    description:
      "Scorecard de qualification de prospects B2B mid-market fictifs : besoin métier, urgence, maturité d'achat et adéquation solution — sans collecte d'e-mail.",
  }),
  draft(
    "ambiguous",
    "A4 Ambigu leadership/ventes",
    "Clarification obligatoire",
    {
      description: "Je voudrais quelque chose sur le leadership ou les ventes.",
    },
    "edge",
    { mustClarify: true },
  ),

  // —— B analyze (4)
  analyze("low", "B1 Score faible", "Échantillon 1 + score bas", {
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
  analyze("high", "B2 Score élevé petits écarts", "Nuance sur écarts <5 pts", {
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
  analyze("imbalanced", "B3 Déséquilibré", "Amplitude sans cause inventée", {
    scorecardName: "Leadership de proximité (synthétique)",
    objective: "Évaluer les pratiques de leadership",
    globalScorePercent: 54,
    categoryScores: [
      { name: "Communication", scorePercent: 95 },
      { name: "Délégation", scorePercent: 20 },
      { name: "Feedback", scorePercent: 48 },
    ],
    thresholds: [{ label: "Intermédiaire", minPercent: 40, maxPercent: 74 }],
    allowedMetadata: { language: "fr", respondentCount: 3, notes: "déséquilibre synthétique" },
  }),
  analyze(
    "partial",
    "B4 Partiel / une catégorie",
    "Données insuffisantes, sans seuils",
    {
      scorecardName: "Diagnostic partiel (synthétique)",
      objective: "Interpréter un résultat incomplet",
      globalScorePercent: 61,
      categoryScores: [{ name: "Processus", scorePercent: 61 }],
      thresholds: [],
      allowedMetadata: { language: "fr", respondentCount: 1, notes: "partiel" },
    },
    "edge",
  ),

  // —— C action plan (4)
  plan("skills", "C1 Compétences / risques", "Actions concrètes sans % garantis", {
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
  }),
  plan("pmo", "C2 PMO reporting", "Contrainte pas de nouvel outil", {
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
  }),
  plan("digital", "C3 Digital adoption", "Adoption progressive sans recrutement inventé", {
    situationSummary:
      "Organisation fictive en transformation digitale : adoption inégale des outils collaboratifs et coordination inter-équipes insuffisante, malgré un sponsor digital identifié.",
    useCase: "maturite_organisationnelle",
    strengths: ["Sponsor digital identifié", "Quelques équipes déjà à l'aise avec les outils"],
    gaps: [
      "Adoption inégale des outils",
      "Coordination inter-équipes insuffisante",
      "Manque de rituels de suivi communs",
    ],
    constraints: ["Pas de recrutement IT immédiat", "Changement progressif exigé"],
  }),
  plan(
    "competing",
    "C4 Budget unique / arbitrage",
    "Priorités concurrentes — pas de choix arbitraire",
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
    { mustRequireArbitration: true },
  ),
]

export function lot19jDatasetSummary() {
  return {
    total: LOT19J_DATASET.length,
    ids: LOT19J_DATASET.map((s) => s.id),
    byPattern: {
      generate_scorecard_draft: LOT19J_DATASET.filter((s) => s.patternId === "generate_scorecard_draft").length,
      analyze_scorecard_results: LOT19J_DATASET.filter((s) => s.patternId === "analyze_scorecard_results")
        .length,
      generate_action_plan: LOT19J_DATASET.filter((s) => s.patternId === "generate_action_plan").length,
    },
    allSynthetic: true,
  }
}

