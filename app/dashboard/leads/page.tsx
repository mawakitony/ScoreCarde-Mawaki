import Link from "next/link"
import { LeadsBoard } from "@/components/leads/leads-board"
import { LeadTrash } from "@/components/leads/lead-trash"
import { TagManager } from "@/components/leads/lead-editor"
import { can } from "@/lib/auth/permissions"
import { canEdit } from "@/lib/auth/session"
import { loadLeadFacets, queryLeads, queryTrashLeads } from "@/lib/data/crm"
import { ensureMembership } from "@/lib/data/membership"
import { listScorecards } from "@/lib/data/scorecards"
import { parseLeadFilters } from "@/lib/leads/filters"

export const metadata = { title: "Leads" }

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filters = parseLeadFilters(params)
  const trash = (Array.isArray(params.view) ? params.view[0] : params.view) === "trash"
  const membership = await ensureMembership()
  const editor = membership ? canEdit(membership.role) : false
  const canRead = membership ? can({ role: membership.role }, "lead.read") : false
  const [loaded, facets, catalog, trashed] = await Promise.all([
    trash ? Promise.resolve(null) : queryLeads({ ...filters, ids: [] }),
    trash ? Promise.resolve(null) : loadLeadFacets(),
    trash || !membership ? Promise.resolve({ scorecards: [] }) : listScorecards(membership.organization.id),
    trash ? queryTrashLeads() : Promise.resolve(null),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">CRM</p>
        <h1 className="font-display text-4xl">Leads</h1>
        <p className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/leads" className={trash ? "text-muted-foreground underline" : "underline"} aria-current={trash ? undefined : "page"}>Actifs</Link>
          <Link href="/dashboard/leads?view=trash" className={trash ? "underline" : "text-muted-foreground underline"} aria-current={trash ? "page" : undefined}>Corbeille</Link>
        </p>
      </div>
      {trash ? (
        <LeadTrash rows={trashed?.rows ?? []} canManage={editor && canRead} error={trashed?.error ?? null} />
      ) : null}
      {!trash && loaded && facets ? (
        <>
          <LeadsBoard
            rows={loaded.rows.map((row) => ({ ...row, email: row.email ?? null, phone: row.phone ?? null, country: row.country ?? null, scorecard: row.scorecard ?? null, utm_source: row.utm_source ?? null }))}
            total={loaded.total}
            filters={filters}
            facets={{ ...facets, scorecards: catalog.scorecards.map((scorecard) => ({ id: scorecard.id, name: scorecard.name })) }}
            canEdit={editor}
            canExport={membership ? can({ role: membership.role }, "lead.export") : false}
            canDelete={membership ? can({ role: membership.role }, "lead.edit") : false}
            error={loaded.error}
          />
          {editor ? <TagManager tags={facets.tags} /> : null}
        </>
      ) : null}
    </div>
  )
}
