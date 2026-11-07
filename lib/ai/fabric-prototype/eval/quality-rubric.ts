/**
 * Shared 0–5 qualitative rubric for human (or optional future LLM-as-judge) review.
 * Automatic Zod validity must NOT be mapped to high qualitative scores.
 *
 * LOT 19C — 10 criteria. Scores may only be computed from reviews actually performed.
 */

export const QUALITY_CRITERIA = [
  "pertinence",
  "precision",
  "coherence_metier",
  "clarte",
  "utilite_recommandations",
  "respect_donnees",
  "absence_inventions",
  "qualite_structure",
  "adaptation_contexte",
  "exploitabilite_woloyem",
] as const

export type QualityCriterion = (typeof QUALITY_CRITERIA)[number]

/** How a criterion can be assessed without inventing LIVE text. */
export type CriterionEvaluationMode = "deterministic" | "human_judgment" | "requires_live_payload"

export const CRITERION_MODE: Record<QualityCriterion, CriterionEvaluationMode> = {
  pertinence: "human_judgment",
  precision: "human_judgment",
  coherence_metier: "human_judgment",
  clarte: "human_judgment",
  utilite_recommandations: "human_judgment",
  respect_donnees: "deterministic",
  absence_inventions: "human_judgment",
  qualite_structure: "deterministic",
  adaptation_contexte: "human_judgment",
  exploitabilite_woloyem: "human_judgment",
}

export type QualityScore = {
  criterion: QualityCriterion
  score: 0 | 1 | 2 | 3 | 4 | 5
  notes?: string
  /** When true, score is a placeholder and must not enter averages. */
  unevaluable?: boolean
}

export type QualitativeReview = {
  scenarioId: string
  patternId: string
  reviewer: "human" | "llm_judge_pending" | "not_available"
  scores: QualityScore[]
  overallAverage: number | null
  status: "pending_human" | "scored" | "not_available"
  unavailableReason?: string
}

export const RUBRIC_GUIDE: Record<QualityCriterion, string> = {
  pertinence: "La réponse adresse réellement le besoin métier décrit (0=hors sujet, 5=parfaitement ciblé).",
  precision: "Informations exactes et concrètes, sans remplissage vague (0=faux/vague, 5=précis).",
  coherence_metier: "Cohérence avec les pratiques WOLOYEM / métier (0=contradictoire, 5=solide).",
  clarte: "Formulation claire et lisible (0=incompréhensible, 5=très clair).",
  utilite_recommandations: "Recommandations actionnables, non génériques (0=inutiles, 5=immédiatement exploitables).",
  respect_donnees: "Respect strict des données d'entrée / scores officiels (déterministe possible).",
  absence_inventions: "Pas de faits, certifications ou chiffres inventés (0=hallucinations, 5=prudent).",
  qualite_structure: "Structure JSON / sections attendues (en grande partie déterministe via Zod + checks).",
  adaptation_contexte: "Adaptation au public, locale, contraintes et cas d'usage.",
  exploitabilite_woloyem: "Prêt à être utilisé dans Builder / analyse / rapports après revue humaine.",
}

export const SCORE_ANCHORS: Record<0 | 1 | 2 | 3 | 4 | 5, string> = {
  0: "Inutilisable / dangereux / hors contrat",
  1: "Très faible — erreurs majeures",
  2: "Faible — utilisable seulement après réécriture lourde",
  3: "Acceptable — nécessite corrections notables",
  4: "Bon — corrections mineures",
  5: "Excellent — prêt revue produit légère",
}

export function emptyPendingReview(scenarioId: string, patternId: string): QualitativeReview {
  return {
    scenarioId,
    patternId,
    reviewer: "human",
    scores: QUALITY_CRITERIA.map((criterion) => ({
      criterion,
      score: 0,
      notes: "pending",
      unevaluable: true,
    })),
    overallAverage: null,
    status: "pending_human",
  }
}

/** Mark review impossible when LIVE model text was not persisted. */
export function notAvailableReview(
  scenarioId: string,
  patternId: string,
  reason: string,
): QualitativeReview {
  return {
    scenarioId,
    patternId,
    reviewer: "not_available",
    scores: QUALITY_CRITERIA.map((criterion) => ({
      criterion,
      score: 0,
      notes: reason,
      unevaluable: true,
    })),
    overallAverage: null,
    status: "not_available",
    unavailableReason: reason,
  }
}

/**
 * Average only scored (evaluable) criteria. Returns null if none were scored —
 * never invent an average from Zod-pass alone.
 */
export function averageScores(scores: QualityScore[]): number | null {
  const usable = scores.filter((item) => !item.unevaluable)
  if (usable.length === 0) return null
  return usable.reduce((sum, item) => sum + item.score, 0) / usable.length
}

export function criteriaByMode(mode: CriterionEvaluationMode): QualityCriterion[] {
  return QUALITY_CRITERIA.filter((criterion) => CRITERION_MODE[criterion] === mode)
}
