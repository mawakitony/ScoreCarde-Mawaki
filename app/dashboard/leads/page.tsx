import Link from "next/link"
import { Archive, Users } from "lucide-react"
import { LeadsBoard } from "@/components/leads/leads-board"
import { LeadTrash } from "@/components/leads/lead-trash"
import { TagManager } from "@/components/leads/lead-editor"
import { can } from "@/lib/auth/permissions"
import { canEdit } from "@/lib/auth/session"
import { loadLeadFacets, queryLeads, queryTrashLeads } from "@/lib/data/crm"
import { ensureMembership } from "@/lib/data/membership"
import { listScorecards } from "@/lib/data/scorecards"
import { displayAvatarUrl } from "@/lib/leads/avatar-resolver"
import { parseLeadFilters } from "@/lib/leads/filters"
import { WS_FOCUS, WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

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

  const count = trash ? trashed?.rows.length ?? 0 : loaded?.total ?? 0

  return (
    <div className={cn(WS_PANEL, "overflow-hidden")}>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
            <Users className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
              Leads
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {count} lead{count > 1 ? "s" : ""} · {trash ? "Corbeille" : "Participants enregistrés"}
            </p>
          </div>
        </div>
        <div
          className="flex gap-1 rounded-xl bg-muted/70 p-1"
          role="tablist"
          aria-label="Vue des leads"
        >
          <Link
            href="/dashboard/leads"
            role="tab"
            aria-selected={!trash}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors",
              WS_FOCUS,
              !trash
                ? "bg-[color:var(--brand-950)] text-white shadow-sm dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Users className="size-3.5" aria-hidden />
            Actifs
          </Link>
          <Link
            href="/dashboard/leads?view=trash"
            role="tab"
            aria-selected={trash}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors",
              WS_FOCUS,
              trash
                ? "bg-[color:var(--brand-950)] text-white shadow-sm dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Archive className="size-3.5" aria-hidden />
            Corbeille
          </Link>
        </div>
      </div>
      {trash ? (
        <LeadTrash rows={trashed?.rows ?? []} canManage={editor && canRead} error={trashed?.error ?? null} />
      ) : null}
      {!trash && loaded && facets ? (
        <>
          <LeadsBoard
            rows={await Promise.all(
              loaded.rows.map(async (row) => {
                const organizationId = membership?.organization.id ?? ""
                const avatarUrl = organizationId
                  ? await displayAvatarUrl({
                      organizationId,
                      leadId: row.id,
                      email: row.email,
                      name: row.name,
                      // No respondent.avatar_url column yet — stored photos stay null until migration.
                      storedUrl: null,
                    })
                  : null
                return {
                  ...row,
                  email: row.email ?? null,
                  phone: row.phone ?? null,
                  whatsapp: row.whatsapp ?? null,
                  company: row.company ?? null,
                  country: row.country ?? null,
                  scorecard: row.scorecard ?? null,
                  utm_source: row.utm_source ?? null,
                  avatarUrl,
                }
              }),
            )}
            total={loaded.total}
            filters={filters}
            facets={{
              ...facets,
              scorecards: catalog.scorecards.map((scorecard) => ({ id: scorecard.id, name: scorecard.name })),
            }}
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
