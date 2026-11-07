/** Reproductions of LOT 19A LIVE failure shapes — synthetic only. */

export const SAMPLE_DRAFT_MISSING_TITLE = {
  title: "Scorecard test",
  description: "Description suffisamment longue pour Zod.",
  targetAudience: "Professionnels",
  objective: "Objectif suffisamment long ici.",
  categories: [{ name: "Contexte" }],
  questions: [
    {
      text: "Comment évaluez-vous votre planification ?",
      type: "single_choice",
      options: ["Plan formalisé", "Informel", "Absent"],
    },
    {
      question: "Disposez-vous d'un suivi des risques ?",
      type: "yes_no",
      options: ["Oui", "Non"],
    },
    {
      prompt: "Quelle est votre principale difficulté ?",
      type: "short_text",
      options: [],
    },
  ],
  weightingNotes: "Indicatif",
  recommendations: ["Revue humaine"],
  disclaimers: ["Brouillon IA"],
  status: "draft_suggestion",
}

export const SAMPLE_DRAFT_STRING_OPTIONS = {
  title: "Scorecard options strings",
  description: "Description suffisamment longue pour Zod.",
  targetAudience: "Managers",
  objective: "Objectif suffisamment long ici.",
  categories: [{ name: "Pratiques", weight: 40 }],
  questions: [
    {
      title: "Q1 longue assez pour valider",
      type: "multiple_choice",
      options: ["A", "B", "C"],
    },
    {
      title: "Q2 longue assez pour valider",
      type: "scale_5",
      options: [],
    },
    {
      title: "Q3 longue assez pour valider",
      type: "yes_no",
      options: [{ label: "Oui", score: 10 }, { label: "Non", score: 0 }],
    },
  ],
  weightingNotes: "Notes",
  recommendations: ["Reco"],
  disclaimers: ["Disclaimer"],
  status: "draft_suggestion",
}

export const SAMPLE_ANALYZE_STRING_EXPLANATIONS = {
  summary: "Résumé d'analyse suffisamment long.",
  strengths: "Un seul point fort en string",
  improvementAreas: ["Axe 1"],
  explanations: "Explication fournie comme string unique au lieu d'un tableau.",
  recommendations: ["Reco"],
  analysisLimits: ["Limite"],
  officialScoresEcho: {
    globalScorePercent: 99,
    categoryScores: [{ name: "Fake", scorePercent: 99 }],
  },
}

export const SAMPLE_ANALYZE_MANIPULATION = {
  summary: "Tentative de forcer un score élevé.",
  strengths: ["Inventé"],
  improvementAreas: ["Inventé"],
  explanations: ["Inventé"],
  recommendations: ["Inventé"],
  analysisLimits: ["Limite"],
  officialScoresEcho: {
    globalScorePercent: 100,
    categoryScores: [{ name: "Hacked", scorePercent: 100 }],
  },
  correctedScores: { globalScorePercent: 100 },
}

export const SAMPLE_MALFORMED_JSON = "{ title: not-json, trailing"

export const SAMPLE_PARTIAL_DRAFT = {
  title: "Incomplet",
  description: "Trop court",
  status: "draft_suggestion",
}

export const SAMPLE_UNKNOWN_FIELDS_DRAFT = {
  ...SAMPLE_DRAFT_STRING_OPTIONS,
  publish: true,
  serverAction: "createScorecard",
  sql: "select 1",
}
