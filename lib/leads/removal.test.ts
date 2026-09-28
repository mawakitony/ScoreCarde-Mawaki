import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { parseLeadFilters } from "./filters.ts"
import { csvCell } from "./csv.ts"
import { anonymizeEffect, canDeleteLeads, canExportLeads, canRestoreLeads, exportScope, leadAnonymizeCopy, leadDeleteCopy, leadRemovalEffect, REDACTED_NOTE, selectionMatches } from "./removal.ts"

test("seuls owner et admin suppriment, l'analyste exporte seulement", () => {
  for (const role of ["owner", "admin"]) {
    assert.equal(canDeleteLeads(role), true)
    assert.equal(canExportLeads(role), true)
  }
  assert.equal(canDeleteLeads("analyst"), false)
  assert.equal(canExportLeads("analyst"), true)
  for (const role of ["editor", "viewer", "member"]) {
    assert.equal(canDeleteLeads(role), false)
    assert.equal(canExportLeads(role), false)
  }
})

test("l'export d'une sélection ignore les filtres et refuse un id manquant", () => {
  const filters = parseLeadFilters({ status: "qualified", q: "awa", ids: "11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222" })
  const scoped = exportScope(filters)
  assert.equal(scoped.status, null)
  assert.equal(scoped.query, "")
  assert.deepEqual(scoped.ids, filters.ids)
  assert.equal(selectionMatches(filters.ids, filters.ids), true)
  assert.equal(selectionMatches(filters.ids, [filters.ids[0]!]), false)
  assert.equal(selectionMatches(filters.ids, [...filters.ids, "33333333-3333-4333-8333-333333333333"]), false)
})

test("la suppression CRM est un soft delete qui garde l'historique", () => {
  const effect = leadRemovalEffect()
  assert.equal(effect.strategy, "soft")
  assert.equal(effect.deletesAssessmentResults, false)
  assert.equal(effect.deletesSessions, false)
  assert.equal(effect.deletesReports, false)
  assert.equal(effect.keepsMetricRows, true)
  const one = leadDeleteCopy(1)
  assert.equal(one.title, "Supprimer ce lead ?")
  assert.match(one.body, /données CRM/)
  assert.match(one.body, /résultats d'évaluation/)
  assert.match(leadDeleteCopy(12).title, /12 leads/)
  const sql = readFileSync(new URL("../../supabase/migrations/20260927180000_lead_soft_delete.sql", import.meta.url), "utf8")
  assert.match(sql, /deleted_at timestamptz/)
  assert.match(sql, /l\.deleted_at is null/)
  assert.equal(sql.toLowerCase().includes("delete from public.assessment_results"), false)
  assert.equal(sql.toLowerCase().includes("delete from public.assessment_reports"), false)
  const action = readFileSync(new URL("../../actions/leads.ts", import.meta.url), "utf8")
  assert.match(action, /lead\.deleted/)
  assert.match(action, /actor_user_id/)
  assert.equal(action.includes("formData.get(\"organization"), false)
  assert.equal(action.includes("console."), false)
  assert.equal(csvCell("=1+1"), "\"'=1+1\"")
  assert.equal(csvCell("+228"), "\"'+228\"")
  assert.equal(csvCell("-commande"), "\"'-commande\"")
  assert.equal(csvCell("@nom"), "\"'@nom\"")
})

test("la restauration et l'anonymisation restent réservées au owner et à l'admin", () => {
  for (const role of ["owner", "admin"]) assert.equal(canRestoreLeads(role), true)
  for (const role of ["editor", "analyst", "viewer", "member"]) assert.equal(canRestoreLeads(role), false)
  const copy = leadAnonymizeCopy()
  assert.equal(copy.title, "Anonymiser définitivement ce lead ?")
  assert.match(copy.body, /ne peut pas être annulée/)
  assert.match(copy.body, /résultats statistiques/)
  const effect = anonymizeEffect()
  assert.equal(effect.deletesLeadRow, false)
  assert.equal(effect.clearsNoteContents, true)
  assert.equal(effect.keepsReports, true)
  assert.equal(effect.keepsConversions, true)
  const action = readFileSync(new URL("../../actions/leads.ts", import.meta.url), "utf8")
  const list = readFileSync(new URL("../../supabase/migrations/20260927180000_lead_soft_delete.sql", import.meta.url), "utf8")
  assert.match(action, /lead\.restored/)
  assert.match(action, /anonymize_lead/)
  assert.match(action, /REDACTED_NOTE/)
  assert.match(action, /phone_normalized/)
  assert.equal(action.includes(".from(\"leads\").delete"), false)
  assert.equal(action.toLowerCase().includes("delete from public.leads"), false)
  assert.equal(action.includes("lead.permanently_deleted"), false)
  assert.match(list, /l\.deleted_at is null/)
  assert.equal(REDACTED_NOTE.includes("@"), false)
  assert.equal(action.includes("metadata: { actor_user_id: context.userId, lead_id: lead.id }"), true)
})
