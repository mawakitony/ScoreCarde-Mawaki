import { z } from "zod"

export const assistantModeSchema = z.enum(["advise", "prepare", "execute"])
export type AssistantMode = z.infer<typeof assistantModeSchema>

export const TOOL_NAMES = [
  "list_scorecards",
  "get_scorecard",
  "list_questions",
  "search_leads",
  "get_lead",
  "get_dashboard_metrics",
  "get_scorecard_analytics",
  "get_report_summary",
  "create_scorecard_draft",
  "update_scorecard_draft",
  "add_questions",
  "update_question",
  "create_question_categories",
  "configure_scoring",
  "create_result_ranges",
  "add_lead_tag",
  "assign_lead_tag",
  "change_lead_status",
] as const

export const toolNameSchema = z.enum(TOOL_NAMES)
export type ToolName = z.infer<typeof toolNameSchema>

const QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "yes_no",
  "scale_5",
  "scale_10",
  "short_text",
  "long_text",
  "number",
  "email",
  "phone",
  "country",
  "dropdown",
] as const

function normalizeQuestionType(value: unknown) {
  const raw = String(value ?? "single_choice").trim()
  const snaked = raw
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase()
  const aliases: Record<string, (typeof QUESTION_TYPES)[number]> = {
    single: "single_choice",
    singlechoice: "single_choice",
    single_choice: "single_choice",
    multiple: "multiple_choice",
    multiplechoice: "multiple_choice",
    multiple_choice: "multiple_choice",
    yesno: "yes_no",
    yes_no: "yes_no",
    boolean: "yes_no",
    scale: "scale_5",
    scale5: "scale_5",
    scale_5: "scale_5",
    scale10: "scale_10",
    scale_10: "scale_10",
    text: "short_text",
    short: "short_text",
    shorttext: "short_text",
    short_text: "short_text",
    long: "long_text",
    longtext: "long_text",
    long_text: "long_text",
    textarea: "long_text",
    number: "number",
    email: "email",
    phone: "phone",
    country: "country",
    dropdown: "dropdown",
    select: "dropdown",
  }
  return aliases[snaked.replace(/_/g, "")] || aliases[snaked] || "single_choice"
}

const questionTypeSchema = z.preprocess(normalizeQuestionType, z.enum(QUESTION_TYPES))

const optionSchema = z.preprocess(
  (value) => (typeof value === "string" ? { label: value, score: 0 } : value),
  z.object({
    label: z.string().trim().min(1).max(160),
    value: z.string().trim().min(1).max(80).optional(),
    score: z.coerce.number().min(0).max(100).default(0),
  }),
)

function ensureLabel(value: unknown, fallback: string, max: number) {
  const text = String(value ?? "").trim().slice(0, max)
  return text.length >= 2 ? text : fallback
}

const proposedQuestionSchema = z.object({
  title: z.preprocess((value) => ensureLabel(value, "Question", 240), z.string().min(2).max(240)),
  description: z.string().trim().max(500).optional(),
  type: questionTypeSchema.default("single_choice"),
  isRequired: z.preprocess((value) => value !== false && value !== "false", z.boolean()).default(true),
  isScored: z.preprocess((value) => value !== false && value !== "false", z.boolean()).default(true),
  questionCategoryName: z.string().trim().max(80).optional(),
  scoringCategoryName: z.string().trim().max(80).optional(),
  options: z.preprocess((value) => {
    if (Array.isArray(value)) return value
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return value.split("|").map((label) => ({ label: label.trim(), score: 0 })).filter((item) => item.label)
      }
    }
    return []
  }, z.array(optionSchema).max(12)).default([]),
})

const categorySchema = z.preprocess(
  (value) => (typeof value === "string" ? { name: value } : value),
  z.object({
    name: z.preprocess((value) => ensureLabel(value, "Categorie", 80), z.string().min(2).max(80)),
    description: z.string().trim().max(240).optional(),
    weight: z.coerce.number().min(0).max(100).optional(),
  }),
)

const scoringCategorySchema = z.preprocess(
  (value) => (typeof value === "string" ? { name: value, weight: 1 } : value),
  z.object({
    name: z.preprocess((value) => ensureLabel(value, "Scoring", 80), z.string().min(2).max(80)),
    description: z.string().trim().max(240).optional(),
    weight: z.coerce.number().min(0).max(100).default(1),
    maxScore: z.coerce.number().min(1).max(1000).default(100),
  }),
)

const resultRangeSchema = z.object({
  minPercent: z.coerce.number().min(0).max(100),
  maxPercent: z.coerce.number().min(0).max(100),
  label: z.preprocess((value) => ensureLabel(value, "Resultat", 80), z.string().min(1).max(80)),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  badge: z.string().trim().max(80).optional(),
  recommendationTitle: z.string().trim().max(120).optional(),
  recommendationBody: z.string().trim().max(800).optional(),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaUrl: z.string().trim().max(300).optional(),
}).transform((value) => ({
  ...value,
  title: value.title?.trim() || value.label,
}))

export const toolArgsSchemas = {
  list_scorecards: z.object({ query: z.string().trim().max(80).optional() }).default({}),
  get_scorecard: z.object({ scorecardId: z.string().uuid() }),
  list_questions: z.object({ scorecardId: z.string().uuid() }),
  search_leads: z.object({
    query: z.string().trim().max(80).optional(),
    scorecardId: z.string().uuid().optional(),
    temperature: z.enum(["cold", "warm", "hot"]).optional(),
    days: z.number().int().min(1).max(90).optional(),
    limit: z.number().int().min(1).max(25).default(10),
  }),
  get_lead: z.object({ leadId: z.string().uuid() }),
  get_dashboard_metrics: z.object({ days: z.number().int().min(1).max(90).default(30) }),
  get_scorecard_analytics: z.object({ scorecardId: z.string().uuid(), days: z.number().int().min(1).max(90).default(30) }),
  get_report_summary: z.object({ leadId: z.string().uuid() }),
  create_scorecard_draft: z.object({
    name: z.preprocess((value) => ensureLabel(value, "Scorecard E2E", 160), z.string().min(2).max(160)),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    description: z.string().trim().max(600).default(""),
    language: z.enum(["fr", "en"]).default("fr"),
    category: z.preprocess((value) => ensureLabel(value, "Assessment", 80), z.string().min(2).max(80)).default("Assessment"),
    landingTitle: z.string().trim().max(160).optional(),
    landingSubtitle: z.string().trim().max(240).optional(),
    ctaText: z.string().trim().max(80).optional(),
    questionCategories: z.array(categorySchema).max(12).default([]),
    scoringCategories: z.array(scoringCategorySchema).max(12).default([]),
    questions: z.array(proposedQuestionSchema).max(50).default([]),
    resultRanges: z.array(resultRangeSchema).max(8).default([]),
  }),
  update_scorecard_draft: z.object({
    scorecardId: z.string().uuid(),
    name: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(600).optional(),
    landingTitle: z.string().trim().max(160).optional(),
    landingSubtitle: z.string().trim().max(240).optional(),
    ctaText: z.string().trim().max(80).optional(),
  }),
  add_questions: z.object({
    scorecardId: z.string().uuid(),
    questions: z.array(proposedQuestionSchema).min(1).max(50),
  }),
  update_question: z.object({
    scorecardId: z.string().uuid(),
    questionId: z.string().uuid(),
    title: z.string().trim().min(2).max(240).optional(),
    description: z.string().trim().max(500).optional(),
    isRequired: z.boolean().optional(),
    isScored: z.boolean().optional(),
  }),
  create_question_categories: z.object({
    scorecardId: z.string().uuid(),
    categories: z.array(categorySchema).min(1).max(12),
  }),
  configure_scoring: z.object({
    scorecardId: z.string().uuid(),
    categories: z.array(scoringCategorySchema).min(1).max(12),
  }),
  create_result_ranges: z.object({
    scorecardId: z.string().uuid(),
    ranges: z.array(resultRangeSchema).min(1).max(8),
  }),
  add_lead_tag: z.object({
    name: z.string().trim().min(1).max(40),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6E92F2"),
  }),
  assign_lead_tag: z.object({
    tagId: z.string().uuid().optional(),
    tagName: z.string().trim().min(1).max(40).optional(),
    leadIds: z.array(z.string().uuid()).min(1).max(25),
  }).refine((value) => Boolean(value.tagId || value.tagName), { message: "tagId ou tagName requis" }),
  change_lead_status: z.object({
    leadIds: z.array(z.string().uuid()).min(1).max(25),
    status: z.enum(["new", "contacted", "qualified", "nurturing", "converted", "lost"]),
  }),
} as const

export const toolCallSchema = z.object({
  tool: toolNameSchema,
  arguments: z.record(z.string(), z.unknown()).default({}),
  summary: z.string().trim().min(1).max(240),
})

export const planStepSchema = z.object({
  id: z.string().trim().min(1).max(40),
  tool: toolNameSchema,
  arguments: z.record(z.string(), z.unknown()).default({}),
  summary: z.string().trim().min(1).max(240),
  writes: z.boolean(),
})

export const diffItemSchema = z.object({
  label: z.preprocess((value) => String(value ?? "diff").trim().slice(0, 120) || "diff", z.string().min(1).max(120)),
  before: z.preprocess((value) => String(value ?? "").trim().slice(0, 200), z.string().max(200)),
  after: z.preprocess((value) => String(value ?? "").trim().slice(0, 200), z.string().max(200)),
})

export const assistantLlmResponseSchema = z.object({
  intent: z.preprocess((value) => String(value ?? "action").trim().slice(0, 80) || "action", z.string().min(1).max(80)),
  mode: z.preprocess(
    (value) => (value === "advise" || value === "prepare" || value === "execute" ? value : "prepare"),
    assistantModeSchema,
  ),
  message: z.preprocess(
    (value) => {
      const text = String(value ?? "").trim().slice(0, 4_000)
      return text || "Proposition préparée."
    },
    z.string().min(1).max(4_000),
  ),
  tools: z.array(toolCallSchema).max(5).default([]),
  requiresConfirmation: z.boolean().default(false),
  diffs: z.array(diffItemSchema).max(40).default([]).catch([]),
  preview: z
    .object({
      title: z.string().trim().max(160).optional(),
      subtitle: z.string().trim().max(240).optional(),
      bullets: z.array(z.string().trim().max(160)).max(12).default([]),
    })
    .optional()
    .catch(undefined),
})

export type AssistantLlmResponse = z.infer<typeof assistantLlmResponseSchema>

export const executionPlanSchema = z.object({
  id: z.string().uuid(),
  mode: assistantModeSchema,
  summary: z.string().trim().min(1).max(500),
  steps: z.array(planStepSchema).min(1).max(12),
  diffs: z.array(diffItemSchema).max(40).default([]),
  preview: z
    .object({
      title: z.string().trim().max(160).optional(),
      subtitle: z.string().trim().max(240).optional(),
      bullets: z.array(z.string().trim().max(160)).max(12).default([]),
    })
    .optional(),
})

export type ExecutionPlan = z.infer<typeof executionPlanSchema>

export const pageContextSchema = z.object({
  route: z.string().trim().max(200).optional(),
  scorecardId: z.string().uuid().optional(),
  scorecardName: z.string().trim().max(160).optional(),
  scorecardSlug: z.string().trim().max(80).optional(),
})

export type PageContext = z.infer<typeof pageContextSchema>
