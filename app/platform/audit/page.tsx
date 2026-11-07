import Link from "next/link"
import { ScrollText } from "lucide-react"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import {
  PlatformEmpty,
  PlatformField,
  PlatformPageHeader,
  PlatformPanel,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { maskEmail, pageWindow } from "@/lib/platform/rules"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

const PAGE = 40

export default async function PlatformAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const actor = await requirePlatformAdmin("platform.audit.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const window = pageWindow(Number(params.page ?? 1), PAGE)
  const admin = createAdminClient()
  let request = admin
    .from("audit_logs")
    .select("id, organization_id, actor_id, action, created_at, metadata", { count: "exact" })
    .order("created_at", { ascending: false })
  if (supportScope) {
    request = request.eq("organization_id", supportScope.organizationId)
  } else if (params.organization) {
    request = request.eq("organization_id", params.organization)
  }
  if (params.actor) request = request.eq("actor_id", params.actor)
  if (params.action) request = request.eq("action", params.action.replace(/[%_]/g, ""))
  if (params.from) request = request.gte("created_at", params.from)
  const { data, count } = await request.range(window.from, window.to)

  const orgIds = [...new Set((data ?? []).map((row) => row.organization_id).filter(Boolean))]
  const actorIds = [...new Set((data ?? []).map((row) => row.actor_id).filter(Boolean))] as string[]
  const [{ data: orgs }, { data: actors }] = await Promise.all([
    orgIds.length ? admin.from("organizations").select("id, name").in("id", orgIds) : Promise.resolve({ data: [] }),
    actorIds.length ? admin.from("profiles").select("id, email, full_name").in("id", actorIds) : Promise.resolve({ data: [] }),
  ])

  const detailId = params.detail ?? ""
  const detail = (data ?? []).find((row) => row.id === detailId) ?? null
  const preserved = linkQuery(params)

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Journal d'audit"
        description="Lecture seule. Aucune modification ni suppression des journaux."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Audit" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <MiniKpi index={0} label="Événements (filtre)" value={String(count ?? 0)} icon={ScrollText} hint="Total filtré" />
        <MiniKpi index={1} label="Page" value={String(window.page)} hint={`${PAGE} / page`} />
        <MiniKpi index={2} label="Sur cette page" value={String(data?.length ?? 0)} />
      </section>

      <FilterBar>
        <PlatformField name="organization" defaultValue={params.organization ?? ""} placeholder="ID organisation" className="max-w-[200px]" />
        <PlatformField name="actor" defaultValue={params.actor ?? ""} placeholder="ID acteur" className="max-w-[200px]" />
        <PlatformField name="action" defaultValue={params.action ?? ""} placeholder="Action (ex. subscription.created)" className="max-w-[220px]" />
        <PlatformField name="from" type="date" defaultValue={params.from ?? ""} className="max-w-[160px]" />
      </FilterBar>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {(data ?? []).length === 0 ? (
            <PlatformEmpty title="Aucun événement" description="Aucun journal pour ces filtres." />
          ) : (
            <PlatformPanel className="overflow-hidden p-0">
              <PlatformTable minWidth="920px">
                <thead>
                  <tr>
                    {["Quand (UTC)", "Action", "Organisation", "Auteur", "Actions"].map((heading) => (
                      <PlatformTh key={heading}>{heading}</PlatformTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((row) => {
                    const org = orgs?.find((o) => o.id === row.organization_id)
                    const actor = actors?.find((a) => a.id === row.actor_id)
                    return (
                      <tr key={row.id} className="hover:bg-[color:var(--pa-bg)]/80">
                        <PlatformTd className="tabular-nums text-[12px]">{row.created_at.slice(0, 19).replace("T", " ")}</PlatformTd>
                        <PlatformTd className="font-mono text-xs">{row.action}</PlatformTd>
                        <PlatformTd>
                          {org ? (
                            <Link className="font-medium text-[color:var(--pa-primary)] hover:underline" href={`/platform/organizations/${org.id}`}>
                              {org.name}
                            </Link>
                          ) : (
                            row.organization_id?.slice(0, 8) ?? "—"
                          )}
                        </PlatformTd>
                        <PlatformTd>
                          {actor ? (
                            <span>
                              {actor.full_name || "—"}
                              <span className="block text-[11px] text-muted-foreground">{maskEmail(actor.email)}</span>
                            </span>
                          ) : (
                            row.actor_id?.slice(0, 8) ?? "—"
                          )}
                        </PlatformTd>
                        <PlatformTd>
                          <Link
                            className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                            href={`/platform/audit?${preserved}&detail=${row.id}`}
                          >
                            Détail
                          </Link>
                        </PlatformTd>
                      </tr>
                    )
                  })}
                </tbody>
              </PlatformTable>
            </PlatformPanel>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {count ?? 0} événements · page {window.page}
            </p>
            <div className="flex gap-3">
              {window.page > 1 ? (
                <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/audit?${preserved}&page=${window.page - 1}`}>
                  Précédent
                </Link>
              ) : null}
              {(count ?? 0) > window.page * PAGE ? (
                <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/audit?${preserved}&page=${window.page + 1}`}>
                  Suivant
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        <div className="xl:col-span-4">
          <PlatformPanel title="Détail événement" description="Métadonnées non sensibles uniquement" className="!p-4">
            {!detail ? (
              <p className="text-sm text-muted-foreground">Sélectionnez un événement.</p>
            ) : (
              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-muted-foreground">Action</dt>
                  <dd className="font-mono text-xs">{detail.action}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Horodatage UTC</dt>
                  <dd className="tabular-nums">{detail.created_at}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Organisation</dt>
                  <dd>{orgs?.find((o) => o.id === detail.organization_id)?.name ?? detail.organization_id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Auteur</dt>
                  <dd>
                    {(() => {
                      const actor = actors?.find((a) => a.id === detail.actor_id)
                      return actor ? `${actor.full_name || "—"} · ${maskEmail(actor.email)}` : detail.actor_id ?? "—"
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Métadonnées</dt>
                  <dd className="rounded-xl bg-[color:var(--pa-bg)] p-2 font-mono text-[11px] break-all text-muted-foreground">
                    {safeMetadata(detail.metadata)}
                  </dd>
                </div>
              </dl>
            )}
          </PlatformPanel>
        </div>
      </div>
    </div>
  )
}

function safeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "—"
  const clone = { ...(metadata as Record<string, unknown>) }
  for (const key of Object.keys(clone)) {
    if (/secret|token|password|key|credential/i.test(key)) clone[key] = "[masqué]"
  }
  try {
    return JSON.stringify(clone, null, 2)
  } catch {
    return "—"
  }
}

function linkQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const key of ["organization", "actor", "action", "from"]) {
    if (params[key]) search.set(key, params[key]!)
  }
  return search.toString()
}
