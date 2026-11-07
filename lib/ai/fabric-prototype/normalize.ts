import { FABRIC_QUESTION_TYPES } from "@/lib/ai/fabric-prototype/question-types"

/**
 * Controlled normalizations for LLM JSON quirks.
 * Never invent titles, scores, or business values when source data is missing.
 */

export function pickStringField(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }
  return undefined
}

export function normalizeQuestionType(value: unknown): (typeof FABRIC_QUESTION_TYPES)[number] | undefined {
  const raw = String(value ?? "").trim()
  if (!raw) return undefined
  const snaked = raw
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase()
  const compact = snaked.replace(/_/g, "")
  const aliases: Record<string, (typeof FABRIC_QUESTION_TYPES)[number]> = {
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
  if (aliases[compact]) return aliases[compact]
  if (aliases[snaked]) return aliases[snaked]
  if ((FABRIC_QUESTION_TYPES as readonly string[]).includes(snaked)) {
    return snaked as (typeof FABRIC_QUESTION_TYPES)[number]
  }
  return undefined
}

/** String option → { label } — preserves label text; does not invent scores. */
export function normalizeOption(value: unknown): { label: string; score?: number } | undefined {
  if (typeof value === "string") {
    const label = value.trim()
    return label.length >= 1 ? { label } : undefined
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const label = pickStringField(record, ["label", "text", "name", "value", "title"])
  if (!label) return undefined
  const out: { label: string; score?: number } = { label: label.slice(0, 160) }
  if (typeof record.score === "number" && Number.isFinite(record.score)) {
    out.score = Math.min(100, Math.max(0, record.score))
  } else if (typeof record.score === "string" && record.score.trim() !== "" && !Number.isNaN(Number(record.score))) {
    out.score = Math.min(100, Math.max(0, Number(record.score)))
  }
  return out
}

export function normalizeOptions(value: unknown): { label: string; score?: number }[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      return value
        .split("|")
        .map((part) => normalizeOption(part.trim()))
        .filter((item): item is { label: string; score?: number } => Boolean(item))
    }
    return []
  }
  return value.map(normalizeOption).filter((item): item is { label: string; score?: number } => Boolean(item))
}

/**
 * Map common LLM question shapes → { title, ... }.
 * Rejects (returns undefined title) when no usable title-like field exists — never invents.
 */
export function normalizeDraftQuestion(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const title = pickStringField(record, ["title", "text", "question", "prompt", "label", "name"])
  const type = normalizeQuestionType(record.type ?? record.questionType ?? record.answerType)
  const options = normalizeOptions(record.options ?? record.choices ?? record.answers)
  const normalized: Record<string, unknown> = {
    ...record,
    title,
    type: type ?? record.type,
    options,
  }
  if (typeof record.categoryName !== "string") {
    const categoryName = pickStringField(record, [
      "categoryName",
      "category",
      "questionCategoryName",
      "scoringCategoryName",
    ])
    if (categoryName) normalized.categoryName = categoryName
  }
  return normalized
}

/**
 * Trim only — never truncate.
 * Over-length values are left intact so Zod `.max()` fails with an explicit diagnostic
 * instead of silently dropping constraints, deadlines, or arbitration wording (LOT 19T).
 */
export function trimBusinessString(value: unknown): unknown {
  if (typeof value !== "string") return value
  return value.trim()
}

/**
 * Optional soft-clip for non-critical / decorative helpers only.
 * Do NOT use on Plan/Draft business fields that carry constraints or decisions.
 * Prefer `trimBusinessString` + Zod max for critical content.
 */
export function clipString(
  value: unknown,
  max: number,
  options: { allowSilentClip: boolean } = { allowSilentClip: false },
): unknown {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  if (options.allowSilentClip) return trimmed.slice(0, max)
  return trimmed
}

/** Map common LLM horizon aliases to the closed enum. */
export function normalizeHorizonToken(value: unknown): unknown {
  if (typeof value !== "string") return value
  const raw = value.trim()
  const folded = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/-/g, "_")
  const map: Record<string, string> = {
    immediat: "immédiat",
    immediate: "immédiat",
    "30 jours": "30_jours",
    "30jours": "30_jours",
    "30_jours": "30_jours",
    "90 jours": "90_jours",
    "90jours": "90_jours",
    "90_jours": "90_jours",
    "6 mois": "6_mois",
    "6mois": "6_mois",
    "6_mois": "6_mois",
  }
  if (raw === "immédiat" || raw.toLowerCase() === "immédiat") return "immédiat"
  return map[folded] ?? raw
}

export function normalizePriorityToken(value: unknown): unknown {
  if (typeof value !== "string") return value
  const folded = value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
  const map: Record<string, string> = {
    haute: "haute",
    high: "haute",
    moyenne: "moyenne",
    medium: "moyenne",
    basse: "basse",
    low: "basse",
  }
  return map[folded] ?? value.trim()
}

export function coerceBooleanToken(value: unknown): unknown {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (v === "true" || v === "1" || v === "yes" || v === "oui") return true
    if (v === "false" || v === "0" || v === "no" || v === "non") return false
  }
  return value
}

export function normalizeStringList(value: unknown, maxItemLen = 400): string[] {
  if (typeof value === "string") {
    const text = value.trim()
    return text.length >= 2 ? [text.slice(0, maxItemLen)] : []
  }
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length >= 2)
    .map((item) => item.slice(0, maxItemLen))
}

export function normalizeCategory(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "string") {
    const name = value.trim()
    return name.length >= 2 ? { name } : undefined
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const name = pickStringField(record, ["name", "title", "label"])
  if (!name || name.length < 2) return undefined
  const out: Record<string, unknown> = { ...record, name: name.slice(0, 80) }
  if (typeof record.weightSuggestion !== "number" && typeof record.weight === "number") {
    out.weightSuggestion = record.weight
  }
  return out
}

/** Drop LLM-supplied officialScoresEcho before forcing input values (scoring integrity). */
export function stripLlmOfficialScores(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const clone = { ...(value as Record<string, unknown>) }
  delete clone.officialScoresEcho
  delete clone.globalScorePercent
  delete clone.categoryScores
  delete clone.recalculatedScores
  delete clone.correctedScores
  return clone
}
