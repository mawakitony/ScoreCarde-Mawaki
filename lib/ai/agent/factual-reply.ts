/**
 * LOT 18B — deterministic final answers for simple factual reads.
 * Uses validated tool results only; never invents values.
 */

export type ReadResultItem = { tool: string; summary: string; result: unknown }

export type MetricKey =
  | "leads"
  | "conversionRate"
  | "averageScore"
  | "completed"
  | "started"
  | "ctaClicks"
  | "pageViews"

const METRIC_PATTERNS: { key: MetricKey; patterns: RegExp[] }[] = [
  {
    key: "leads",
    patterns: [
      /\b(nombre|total|combien)\b.{0,40}\bleads?\b/i,
      /\bleads?\b.{0,20}\b(total|nombre)\b/i,
      /\bcombien\s+(de\s+)?leads?\b/i,
      /\bj['’]ai\s+combien\s+de\s+leads?\b/i,
    ],
  },
  {
    key: "conversionRate",
    patterns: [/\btaux\s+de\s+conversion\b/i, /\bconversion\s*rate\b/i, /\bconversion\b/i],
  },
  {
    key: "averageScore",
    patterns: [/\bscore\s+moyen\b/i, /\bmoyenne\s+des?\s+scores?\b/i, /\baverage\s+score\b/i],
  },
  {
    key: "completed",
    patterns: [
      /\b(nombre|total|combien)\b.{0,40}\b(évaluations?|evaluations?|complét|complet)/i,
      /\bévaluations?\s+complét/i,
      /\bcompleted\b/i,
    ],
  },
  {
    key: "started",
    patterns: [/\b(démarr|started|commenc).{0,20}(évaluation|assessment)/i, /\bévaluations?\s+démarr/i],
  },
  {
    key: "ctaClicks",
    patterns: [/\b(clics?\s+cta|cta\s+clicks?)\b/i],
  },
  {
    key: "pageViews",
    patterns: [/\b(pages?\s+vues?|page\s*views?|vues?\s+de\s+page)\b/i],
  },
]

function unwrapResult(result: unknown): unknown {
  if (!result || typeof result !== "object") return result
  const record = result as Record<string, unknown>
  if (record._untrusted === true && "value" in record) return record.value
  return result
}

function asMetrics(result: unknown): Record<string, unknown> | null {
  const value = unwrapResult(result)
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function detectRequestedMetric(userMessage: string): MetricKey | null {
  const text = userMessage.normalize("NFD").replace(/\p{M}/gu, "")
  for (const entry of METRIC_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) return entry.key
  }
  return null
}

export function formatFrNumber(value: number, fractionDigits?: number) {
  const digits =
    fractionDigits ?? (Number.isInteger(value) ? 0 : Math.abs(value % 1) < 1e-9 ? 0 : 1)
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function looksLikeProgressMessage(message: string) {
  const text = message.trim()
  if (!text) return true
  return (
    /^(je\s+(récupère|recupere|consulte|cherche|charge|vais|peux)|un\s+instant|patientez|voici\s+(le|la|votre)\s+)/i.test(
      text,
    ) && !/\d/.test(text)
  )
}

function readMetricValue(metrics: Record<string, unknown>, key: MetricKey): number | null | undefined {
  const raw = metrics[key]
  if (raw === null) return null
  if (raw === undefined) return undefined
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw)
  return undefined
}

export function buildMetricSentence(key: MetricKey, value: number): string {
  switch (key) {
    case "leads":
      return `Vous avez actuellement ${formatFrNumber(value)} lead${value === 1 ? "" : "s"} dans votre compte.`
    case "conversionRate":
      return `Votre taux de conversion actuel est de ${formatFrNumber(value)} %.`
    case "averageScore":
      return `Votre score moyen est de ${formatFrNumber(value)}, selon l'unité définie pour cet indicateur.`
    case "completed":
      return `Vous avez actuellement ${formatFrNumber(value)} évaluation${value === 1 ? "" : "s"} complétée${value === 1 ? "" : "s"}.`
    case "started":
      return `Vous avez actuellement ${formatFrNumber(value)} évaluation${value === 1 ? "" : "s"} démarrée${value === 1 ? "" : "s"}.`
    case "ctaClicks":
      return `Vous avez actuellement ${formatFrNumber(value)} clic${value === 1 ? "" : "s"} CTA.`
    case "pageViews":
      return `Vous avez actuellement ${formatFrNumber(value)} vue${value === 1 ? "" : "s"} de page.`
  }
}

function findDashboardMetrics(readResults: ReadResultItem[]) {
  for (const item of readResults) {
    if (item.tool !== "get_dashboard_metrics") continue
    const metrics = asMetrics(item.result)
    if (metrics && ("leads" in metrics || "conversionRate" in metrics || "averageScore" in metrics)) {
      return metrics
    }
  }
  return null
}

function findSearchLeadsTotal(readResults: ReadResultItem[]) {
  for (const item of readResults) {
    if (item.tool !== "search_leads") continue
    const value = unwrapResult(item.result)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const total = (value as { total?: unknown }).total
      if (typeof total === "number" && Number.isFinite(total)) return total
    }
    if (Array.isArray(value)) return value.length
  }
  return undefined
}

/**
 * Build a final user-facing reply from tool results when the question is factual.
 * Returns null when synthesis does not apply (keep LLM message).
 */
export function synthesizeFactualReply(input: {
  userMessage: string
  llmMessage: string
  readResults: ReadResultItem[]
  hasWritePlan?: boolean
}): string | null {
  if (input.hasWritePlan) return null
  if (!input.readResults.length) return null

  const errored = input.readResults.find(
    (item) => item.result && typeof item.result === "object" && "error" in (item.result as object),
  )
  if (errored) {
    const error = String((errored.result as { error: unknown }).error)
    return error || "La lecture des données a échoué."
  }

  const metricKey = detectRequestedMetric(input.userMessage)
  const dashboard = findDashboardMetrics(input.readResults)

  if (metricKey === "leads" || (!metricKey && /leads?/i.test(input.userMessage))) {
    const fromDash = dashboard ? readMetricValue(dashboard, "leads") : undefined
    const fromSearch = findSearchLeadsTotal(input.readResults)
    const value = fromDash !== undefined ? fromDash : fromSearch
    if (value === undefined) {
      if (metricKey === "leads") return "Le nombre de leads n'est pas disponible pour le moment."
    } else if (value === null) {
      return "Le nombre de leads n'est pas disponible pour le moment."
    } else {
      return buildMetricSentence("leads", value)
    }
  }

  if (metricKey && dashboard) {
    const value = readMetricValue(dashboard, metricKey)
    if (value === undefined) {
      return `La donnée demandée (${metricKey}) n'est pas disponible dans le résultat.`
    }
    if (value === null) {
      return `Aucune valeur n'est disponible pour cet indicateur pour le moment.`
    }
    return buildMetricSentence(metricKey, value)
  }

  // LLM announced a fetch/progress but tools already returned dashboard metrics
  // and the user asked something metric-like without a precise key — do not dump all metrics.
  if (dashboard && looksLikeProgressMessage(input.llmMessage) && metricKey) {
    const value = readMetricValue(dashboard, metricKey)
    if (typeof value === "number") return buildMetricSentence(metricKey, value)
  }

  // If LLM message already lacks digits for a clear metric ask, force synthesis when we have the value
  if (metricKey && dashboard && !/\d/.test(input.llmMessage)) {
    const value = readMetricValue(dashboard, metricKey)
    if (typeof value === "number") return buildMetricSentence(metricKey, value)
    if (value === null) return `Aucune valeur n'est disponible pour cet indicateur pour le moment.`
  }

  return null
}

/** Prefer factual synthesis over progressive / incomplete LLM copy. */
export function finalizeAssistantReply(input: {
  userMessage: string
  llmMessage: string
  readResults: ReadResultItem[]
  hasWritePlan?: boolean
}) {
  const synthesized = synthesizeFactualReply(input)
  if (synthesized) return synthesized
  return input.llmMessage
}
