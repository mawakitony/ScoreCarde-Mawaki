import type { ExecutionPlan, ToolName } from "@/lib/ai/agent/schemas"

/** User-facing labels — never expose raw tool identifiers as primary copy. */
export const TOOL_LABELS: Record<ToolName, string> = {
  list_scorecards: "Lister les scorecards",
  get_scorecard: "Consulter une scorecard",
  list_questions: "Lister les questions",
  search_leads: "Rechercher des leads",
  get_lead: "Consulter un lead",
  get_dashboard_metrics: "Résumer le tableau de bord",
  get_scorecard_analytics: "Analyser une scorecard",
  get_report_summary: "Résumer un rapport",
  create_scorecard_draft: "Créer une scorecard brouillon",
  update_scorecard_draft: "Mettre à jour un brouillon",
  add_questions: "Ajouter des questions",
  update_question: "Modifier une question",
  create_question_categories: "Créer des catégories de questions",
  configure_scoring: "Configurer le scoring",
  create_result_ranges: "Créer des plages de résultats",
  add_lead_tag: "Créer une étiquette lead",
  assign_lead_tag: "Assigner une étiquette",
  change_lead_status: "Changer le statut d'un lead",
}

const STATUS_FR: Record<string, string> = {
  draft: "Brouillon",
  published: "Publiée",
  archived: "Archivée",
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  nurturing: "Nurturing",
  converted: "Converti",
  lost: "Perdu",
}

export function toolLabel(tool: string) {
  return (TOOL_LABELS as Record<string, string>)[tool] ?? tool.replace(/_/g, " ")
}

export function statusLabel(value: unknown) {
  const key = String(value ?? "").toLowerCase()
  return STATUS_FR[key] ?? (key || "—")
}

export type FactRow = { label: string; value: string }

/** Build human summary rows from real tool arguments only — never invent values. */
export function humanizePlanArguments(tool: string, args: Record<string, unknown>): FactRow[] {
  const rows: FactRow[] = []
  const push = (label: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return
    if (Array.isArray(value)) {
      if (value.length === 0) return
      rows.push({ label, value: String(value.length) })
      return
    }
    if (typeof value === "object") return
    rows.push({ label, value: String(value) })
  }

  if (tool === "create_scorecard_draft" || tool === "update_scorecard_draft") {
    push("Nom", args.name)
    if (args.language === "fr" || args.language === "en") {
      rows.push({ label: "Langue", value: args.language === "fr" ? "Français" : "English" })
    }
    push("Catégorie", args.category)
    rows.push({ label: "Statut", value: "Brouillon" })
    if (Array.isArray(args.questions) && args.questions.length > 0) {
      rows.push({ label: "Questions", value: String(args.questions.length) })
    }
    if (Array.isArray(args.questionCategories) && args.questionCategories.length > 0) {
      rows.push({ label: "Catégories de questions", value: String(args.questionCategories.length) })
    }
    if (Array.isArray(args.resultRanges) && args.resultRanges.length > 0) {
      rows.push({ label: "Plages de résultats", value: String(args.resultRanges.length) })
    }
    push("Description", typeof args.description === "string" ? args.description.slice(0, 120) : undefined)
    return rows
  }

  if (tool === "add_questions") {
    push("Questions à ajouter", Array.isArray(args.questions) ? args.questions.length : undefined)
    return rows
  }

  if (tool === "change_lead_status") {
    push("Statut", statusLabel(args.status))
    push("Leads concernés", Array.isArray(args.leadIds) ? args.leadIds.length : undefined)
    return rows
  }

  if (tool === "add_lead_tag" || tool === "assign_lead_tag") {
    push("Étiquette", args.name ?? args.tagName)
    push("Leads", Array.isArray(args.leadIds) ? args.leadIds.length : undefined)
    return rows
  }

  // Generic: only scalar non-id fields
  for (const [key, value] of Object.entries(args)) {
    if (/id$/i.test(key) || key === "slug") continue
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      rows.push({ label: key, value: String(value) })
    } else if (Array.isArray(value) && value.length > 0) {
      rows.push({ label: key, value: `${value.length} élément${value.length > 1 ? "s" : ""}` })
    }
  }
  return rows.slice(0, 8)
}

export type ReadPresentation = {
  title: string
  lines: string[]
  count?: number
}

/** Present tool read results without dumping raw JSON as primary content. */
export function presentReadResult(tool: string, summary: string, result: unknown): ReadPresentation {
  const title = summary.trim() || toolLabel(tool)

  if (result && typeof result === "object" && "error" in (result as object)) {
    return { title, lines: [String((result as { error: unknown }).error)] }
  }

  if (tool === "list_scorecards" && Array.isArray(result)) {
    const lines = result.slice(0, 12).map((row) => {
      if (!row || typeof row !== "object") return String(row)
      const item = row as { name?: string; status?: string }
      return `${item.name ?? "Scorecard"} · ${statusLabel(item.status)}`
    })
    return {
      title,
      lines: lines.length ? lines : ["Aucune scorecard trouvée."],
      count: result.length,
    }
  }

  if (tool === "search_leads" && result && typeof result === "object") {
    const data = result as { leads?: unknown[]; total?: number }
    const leads = Array.isArray(data.leads) ? data.leads : Array.isArray(result) ? result : []
    const lines = leads.slice(0, 10).map((row) => {
      if (!row || typeof row !== "object") return String(row)
      const item = row as { name?: string; email?: string; status?: string; temperature?: string }
      const bits = [item.name || item.email || "Lead", item.status ? statusLabel(item.status) : null, item.temperature]
        .filter(Boolean)
      return bits.join(" · ")
    })
    return {
      title,
      lines: lines.length ? lines : ["Aucun lead correspondant."],
      count: typeof data.total === "number" ? data.total : leads.length,
    }
  }

  if (tool === "get_scorecard" && result && typeof result === "object") {
    const item = result as {
      name?: string
      status?: string
      language?: string
      category?: string
      questionCount?: number
    }
    const lines: string[] = []
    if (item.name) lines.push(`Nom : ${item.name}`)
    if (item.status) lines.push(`Statut : ${statusLabel(item.status)}`)
    if (item.language) lines.push(`Langue : ${item.language === "fr" ? "Français" : item.language}`)
    if (item.category) lines.push(`Catégorie : ${item.category}`)
    if (typeof item.questionCount === "number") lines.push(`Questions : ${item.questionCount}`)
    return { title, lines: lines.length ? lines : ["Scorecard consultée."] }
  }

  if (tool === "get_dashboard_metrics" && result && typeof result === "object") {
    const item = result as Record<string, unknown>
    const labels: Record<string, string> = {
      leads: "Leads",
      started: "Évaluations démarrées",
      completed: "Évaluations complétées",
      conversionRate: "Taux de conversion",
      averageScore: "Score moyen",
      ctaClicks: "Clics CTA",
      pageViews: "Vues de page",
    }
    const lines: string[] = []
    for (const [key, value] of Object.entries(item)) {
      if (typeof value !== "number" && typeof value !== "string") continue
      const label = labels[key] ?? key
      if (key === "conversionRate" && typeof value === "number") {
        lines.push(`${label} : ${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`)
      } else if (typeof value === "number") {
        lines.push(`${label} : ${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`)
      } else {
        lines.push(`${label} : ${value}`)
      }
      if (lines.length >= 8) break
    }
    return { title, lines: lines.length ? lines : ["Indicateurs chargés."] }
  }

  if (Array.isArray(result)) {
    return {
      title,
      lines: [`${result.length} élément${result.length > 1 ? "s" : ""} trouvé${result.length > 1 ? "s" : ""}.`],
      count: result.length,
    }
  }

  if (result && typeof result === "object") {
    const keys = Object.keys(result as object).filter((k) => !k.startsWith("_")).slice(0, 4)
    return {
      title,
      lines: keys.length ? [`Données disponibles : ${keys.join(", ")}.`] : ["Lecture effectuée."],
    }
  }

  return { title, lines: ["Lecture effectuée."] }
}

export function planActionTitle(plan: ExecutionPlan) {
  return plan.preview?.title?.trim() || plan.summary.trim() || "Action proposée"
}

/** Strip accidental JSON dumps from user-facing assistant message copy. */
export function sanitizeAssistantMessage(content: string) {
  const text = content.trim()
  if (!text) return text
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text) as { message?: unknown }
      if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message.trim()
    } catch {
      /* keep original */
    }
  }
  return text
    .replace(/```json[\s\S]*?```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
