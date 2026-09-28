import { can } from "@/lib/auth/permissions"
import type { LeadFilters } from "@/lib/leads/filters"

const KEPT = "Les résultats d'évaluation, les sessions, les rapports et les métriques sont conservés."

export function canDeleteLeads(role: string) {
  return can({ role }, "lead.edit")
}

export function canRestoreLeads(role: string) {
  return can({ role }, "lead.edit")
}

export const REDACTED_NOTE = "Note retirée lors de l'anonymisation."

export function leadAnonymizeCopy() {
  return {
    title: "Anonymiser définitivement ce lead ?",
    body: "Cette action retire les données personnelles et ne peut pas être annulée. Les résultats statistiques et historiques non personnels peuvent être conservés.",
  }
}

export function anonymizeEffect() {
  return {
    deletesLeadRow: false,
    clearsRespondentIdentity: true,
    clearsNormalizedPhones: true,
    clearsNoteContents: true,
    clearsTagArray: true,
    keepsReports: true,
    keepsResults: true,
    keepsSessions: true,
    keepsConversions: true,
    keepsActivities: true,
    keepsCrmStatus: true,
  }
}

export function canExportLeads(role: string) {
  return can({ role }, "lead.export")
}

export function leadRemovalEffect() {
  return {
    strategy: "soft" as const,
    column: "deleted_at" as const,
    hidesFromCrm: true,
    deletesAssessmentResults: false,
    deletesSessions: false,
    deletesReports: false,
    deletesRespondents: false,
    keepsMetricRows: true,
  }
}

export function leadDeleteCopy(count: number) {
  if (count <= 1) {
    return {
      title: "Supprimer ce lead ?",
      body: `Cette action supprimera les données CRM associées à ce lead. ${KEPT}`,
    }
  }
  return {
    title: `Vous êtes sur le point de supprimer ${count} leads.`,
    body: `Cette action supprimera les données CRM associées à ces leads. ${KEPT}`,
  }
}

export function exportScope(filters: LeadFilters): LeadFilters {
  if (filters.ids.length === 0) return filters
  return {
    query: "",
    scorecardId: null,
    status: null,
    temperature: null,
    country: null,
    tagId: null,
    resultRangeId: null,
    scoreMin: null,
    scoreMax: null,
    from: null,
    to: null,
    utmSource: null,
    utmCampaign: null,
    cta: null,
    sort: "newest",
    page: 1,
    size: filters.size,
    ids: [...filters.ids],
  }
}

export function selectionMatches(requested: string[], matched: string[]) {
  if (requested.length === 0) return false
  const found = new Set(matched)
  return requested.length === found.size && requested.every((id) => found.has(id))
}
