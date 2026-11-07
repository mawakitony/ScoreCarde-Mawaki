import { can, normalizeAccessRole } from "@/lib/auth/permissions"
import type { ToolName } from "@/lib/ai/agent/schemas"

function canEditCrm(role: string) {
  const normalized = normalizeAccessRole(role)
  return normalized === "owner" || normalized === "admin"
}

const WRITE_SCORECARD: ToolName[] = [
  "create_scorecard_draft",
  "update_scorecard_draft",
  "add_questions",
  "update_question",
  "create_question_categories",
  "configure_scoring",
  "create_result_ranges",
]

const WRITE_CRM: ToolName[] = ["add_lead_tag", "assign_lead_tag", "change_lead_status"]

const READ: ToolName[] = [
  "list_scorecards",
  "get_scorecard",
  "list_questions",
  "search_leads",
  "get_lead",
  "get_dashboard_metrics",
  "get_scorecard_analytics",
  "get_report_summary",
]

export function toolWrites(tool: ToolName) {
  return WRITE_SCORECARD.includes(tool) || WRITE_CRM.includes(tool)
}

export function canUseTool(role: string, tool: ToolName) {
  if (READ.includes(tool)) {
    if (tool === "search_leads" || tool === "get_lead") return can({ role }, "lead.read")
    if (tool === "get_dashboard_metrics" || tool === "get_scorecard_analytics") return can({ role }, "analytics.read")
    if (tool === "get_report_summary") return can({ role }, "report.read")
    return true
  }
  if (WRITE_SCORECARD.includes(tool)) return can({ role }, "scorecard.edit")
  if (WRITE_CRM.includes(tool)) return canEditCrm(role)
  return false
}

export function toolPermissionError(tool: ToolName) {
  if (WRITE_CRM.includes(tool)) return "Vous n'avez pas la permission de modifier ces leads."
  if (WRITE_SCORECARD.includes(tool)) return "Vous n'avez pas la permission de modifier les scorecards."
  return "Permission refusée."
}
