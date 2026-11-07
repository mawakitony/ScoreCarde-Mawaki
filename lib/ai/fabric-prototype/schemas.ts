import { z } from "zod"
import {
  coerceBooleanToken,
  normalizeCategory,
  normalizeDraftQuestion,
  normalizeHorizonToken,
  normalizeOptions,
  normalizePriorityToken,
  normalizeQuestionType,
  normalizeStringList,
  trimBusinessString,
} from "@/lib/ai/fabric-prototype/normalize"
import { FABRIC_QUESTION_TYPES } from "@/lib/ai/fabric-prototype/question-types"

export { FABRIC_QUESTION_TYPES } from "@/lib/ai/fabric-prototype/question-types"

export const fabricQuestionTypeSchema = z.preprocess((value) => {
  const normalized = normalizeQuestionType(value)
  return normalized ?? value
}, z.enum(FABRIC_QUESTION_TYPES))

const optionSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") return { label: value.trim() }
    return value
  },
  z.object({
    label: z.string().trim().min(1).max(160),
    score: z.number().min(0).max(100).optional(),
  }),
)

const draftQuestionSchema = z.preprocess((value) => normalizeDraftQuestion(value) ?? value, z.object({
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().max(500).optional(),
  type: fabricQuestionTypeSchema,
  isRequired: z.preprocess((value) => value !== false && value !== "false", z.boolean()).default(true),
  isScored: z.preprocess((value) => value !== false && value !== "false", z.boolean()).default(true),
  categoryName: z.string().trim().max(80).optional(),
  options: z.preprocess((value) => normalizeOptions(value), z.array(optionSchema).max(12)).default([]),
}))

const draftCategorySchema = z.preprocess((value) => normalizeCategory(value) ?? value, z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  weightSuggestion: z.coerce.number().min(0).max(100).optional(),
}))

/** Prototype 1 — input */
export const generateScorecardDraftInputSchema = z.object({
  description: z.string().trim().min(8).max(4_000),
  locale: z.enum(["fr", "en"]).default("fr"),
  maxQuestions: z.number().int().min(3).max(40).default(12),
  maxCategories: z.number().int().min(1).max(12).default(4),
})

const draftSuggestionSchema = z.object({
  status: z.literal("draft_suggestion"),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(8).max(600),
  targetAudience: z.string().trim().min(2).max(240),
  objective: z.string().trim().min(8).max(400),
  categories: z.preprocess(
    (value) => (Array.isArray(value) ? value.map((item) => normalizeCategory(item) ?? item) : value),
    z.array(draftCategorySchema).min(1).max(12),
  ),
  questions: z.preprocess(
    (value) => (Array.isArray(value) ? value.map((item) => normalizeDraftQuestion(item) ?? item) : value),
    z.array(draftQuestionSchema).min(3).max(40),
  ),
  weightingNotes: z.string().trim().max(600),
  recommendations: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  disclaimers: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).min(1).max(6)),
})

/** Clarification branch — no persisted scorecard, no draft body required. */
const needsClarificationSchema = z.object({
  status: z.literal("needs_clarification"),
  clarifyingQuestion: z.string().trim().min(8).max(400),
  options: z.preprocess(
    (value) => normalizeStringList(value, 120),
    z.array(z.string().trim().min(2).max(120)).max(6),
  ).default([]),
  rationale: z.string().trim().max(400).optional(),
  disclaimers: z.preprocess(
    (value) => normalizeStringList(value, 240),
    z.array(z.string().trim().min(2).max(240)).min(1).max(6),
  ),
})

/**
 * Prototype 1 — output (LOT 19I discriminated union).
 * Consumers must switch on `status` — clarification never implies a draft.
 */
export const generateScorecardDraftOutputSchema = z.discriminatedUnion("status", [
  draftSuggestionSchema,
  needsClarificationSchema,
])

/** Prototype 2 — input (official numbers must be supplied; AI must not recompute) */
export const analyzeScorecardResultsInputSchema = z.object({
  scorecardName: z.string().trim().min(2).max(160),
  objective: z.string().trim().min(4).max(400),
  globalScorePercent: z.number().min(0).max(100),
  categoryScores: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        scorePercent: z.number().min(0).max(100),
      }),
    )
    .max(20),
  thresholds: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        minPercent: z.number().min(0).max(100),
        maxPercent: z.number().min(0).max(100),
      }),
    )
    .max(12)
    .default([]),
  allowedMetadata: z
    .object({
      language: z.enum(["fr", "en"]).optional(),
      respondentCount: z.number().int().min(0).max(1_000_000).optional(),
      notes: z.string().trim().max(400).optional(),
    })
    .default({}),
})

export const analyzeScorecardResultsOutputSchema = z.object({
  summary: z.string().trim().min(8).max(800),
  strengths: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  improvementAreas: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  explanations: z.preprocess((value) => normalizeStringList(value, 400), z.array(z.string().trim().min(2).max(400)).max(8)),
  recommendations: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  /** Observable facts grounded in provided scores only. */
  facts: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)).default([]),
  /** Non-certain interpretations — must not invent causes. */
  interpretations: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)).default([]),
  analysisLimits: z.preprocess(
    (value) => normalizeStringList(value, 240),
    z.array(z.string().trim().min(2).max(240)).min(1).max(8),
  ),
  /** Echo of official numbers — must match input, never recomputed. */
  officialScoresEcho: z.object({
    globalScorePercent: z.number().min(0).max(100),
    categoryScores: z.array(
      z.object({
        name: z.string(),
        scorePercent: z.number().min(0).max(100),
      }),
    ),
  }),
})

/** Prototype 3 — action plan */
export const generateActionPlanInputSchema = z.object({
  situationSummary: z.string().trim().min(8).max(1_200),
  useCase: z.enum([
    "formation_certification",
    "developpement_competences",
    "performance_equipe",
    "maturite_organisationnelle",
    "qualification_prospects",
  ]),
  strengths: z.array(z.string().trim().min(2).max(240)).max(8).default([]),
  gaps: z.array(z.string().trim().min(2).max(240)).max(8).default([]),
  constraints: z.array(z.string().trim().min(2).max(240)).max(8).default([]),
  locale: z.enum(["fr", "en"]).default("fr"),
})

const actionItemSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  const title =
    typeof record.title === "string"
      ? record.title
      : typeof record.name === "string"
        ? record.name
        : record.title
  return {
    ...record,
    // Critical fields: trim only — over-length must fail Zod.max (no silent clip).
    title: trimBusinessString(title),
    description: trimBusinessString(record.description),
    expectedOutcome: trimBusinessString(record.expectedOutcome),
    successIndicator: trimBusinessString(record.successIndicator),
    priority: normalizePriorityToken(record.priority),
    horizon: normalizeHorizonToken(record.horizon),
  }
}, z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(8).max(400),
  priority: z.enum(["haute", "moyenne", "basse"]),
  horizon: z.enum(["immédiat", "30_jours", "90_jours", "6_mois"]),
  expectedOutcome: z.string().trim().min(4).max(240),
  successIndicator: z.string().trim().min(4).max(240),
}))

export const generateActionPlanOutputSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  return {
    ...record,
    situationSynthesis: trimBusinessString(record.situationSynthesis),
    arbitrationQuestion:
      record.arbitrationQuestion === undefined || record.arbitrationQuestion === null
        ? record.arbitrationQuestion
        : trimBusinessString(record.arbitrationQuestion),
    requiresArbitration: coerceBooleanToken(record.requiresArbitration),
  }
}, z.object({
  situationSynthesis: z.string().trim().min(8).max(600),
  topPriorities: z.preprocess((value) => normalizeStringList(value, 160), z.array(z.string().trim().min(2).max(160)).length(3)),
  actions: z.array(actionItemSchema).min(3).max(12),
  facts: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  hypotheses: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  recommendations: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).max(8)),
  disclaimers: z.preprocess((value) => normalizeStringList(value, 240), z.array(z.string().trim().min(2).max(240)).min(1).max(6)),
  missingInformation: z.preprocess(
    (value) => normalizeStringList(value, 240),
    z.array(z.string().trim().min(2).max(240)).max(8),
  ).default([]),
  /** When true, consumer must ask the user before choosing a single major chantier. */
  requiresArbitration: z.boolean().default(false),
  arbitrationQuestion: z.string().trim().min(8).max(400).optional(),
}))

export type GenerateScorecardDraftInput = z.infer<typeof generateScorecardDraftInputSchema>
export type GenerateScorecardDraftOutput = z.infer<typeof generateScorecardDraftOutputSchema>
export type GenerateScorecardDraftSuggestion = z.infer<typeof draftSuggestionSchema>
export type GenerateScorecardClarification = z.infer<typeof needsClarificationSchema>
export type AnalyzeScorecardResultsInput = z.infer<typeof analyzeScorecardResultsInputSchema>
export type AnalyzeScorecardResultsOutput = z.infer<typeof analyzeScorecardResultsOutputSchema>
export type GenerateActionPlanInput = z.infer<typeof generateActionPlanInputSchema>
export type GenerateActionPlanOutput = z.infer<typeof generateActionPlanOutputSchema>
