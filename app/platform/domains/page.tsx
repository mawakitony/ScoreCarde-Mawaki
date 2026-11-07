import Link from "next/link"
import { CheckCircle2, Globe, Hourglass, XCircle } from "lucide-react"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { OrgAvatar } from "@/components/platform/org-avatar"
import {
  PlatformEmpty,
  PlatformField,
  PlatformPageHeader,
  PlatformPanel,
  PlatformSelect,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { StatusBadge } from "@/components/platform/status-badge"
import { activeDomainProvider } from "@/lib/domains/provider"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; detail?: string }>
}) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const query = (params.q ?? "").trim().toLowerCase()
  const statusFilter = params.status ?? ""
  const detailId = params.detail ?? ""
  const admin = createAdminClient()
  let domainsQuery = admin
    .from("custom_domains")
    .select("id, domain, organization_id, status, verified_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
  if (supportScope) domainsQuery = domainsQuery.eq("organization_id", supportScope.organizationId)
  const { data } = await domainsQuery
  const ids = [...new Set((data ?? []).map((row) => row.organization_id))]
  const { data: organizations } = ids.length ? await admin.from("organizations").select("id, name").in("id", ids) : { data: [] }
  const { data: subscriptions } = ids.length
    ? await admin.from("subscriptions").select("organization_id, plan").in("organization_id", ids)
    : { data: [] }
  const vercel = activeDomainProvider().id === "vercel-ready"

  let rows = (data ?? []).map((row) => ({
    ...row,
    orgName: organizations?.find((item) => item.id === row.organization_id)?.name ?? "—",
    plan: subscriptions?.find((item) => item.organization_id === row.organization_id)?.plan ?? "—",
  }))
  if (statusFilter) rows = rows.filter((row) => row.status === statusFilter)
  if (query) rows = rows.filter((row) => row.domain.toLowerCase().includes(query) || row.orgName.toLowerCase().includes(query))

  const verified = (data ?? []).filter((r) => Boolean(r.verified_at) || r.status === "verified").length
  const pending = (data ?? []).filter((r) => !r.verified_at && r.status === "pending").length
  const errored = (data ?? []).filter((r) => r.status === "failed" || r.status === "disabled").length
  const detail = rows.find((row) => row.id === detailId) ?? null
  const preserved = linkQuery(params)

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Domaines"
        description={
          vercel
            ? "Domaines personnalisés — statuts issus de custom_domains (pas d'invention DNS)."
            : "Automatisation Vercel non configurée — statuts affichés tels quels en base."
        }
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Domaines" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Configurés" value={String(data?.length ?? 0)} icon={Globe} />
        <MiniKpi index={1} label="Vérifiés" value={String(verified)} icon={CheckCircle2} tone="good" />
        <MiniKpi index={2} label="En attente" value={String(pending)} icon={Hourglass} tone={pending > 0 ? "warn" : "default"} />
        <MiniKpi index={3} label="Erreurs" value={String(errored)} icon={XCircle} tone={errored > 0 ? "bad" : "good"} />
      </section>

      <FilterBar>
        <PlatformField name="q" defaultValue={params.q ?? ""} placeholder="Domaine ou organisation" className="max-w-xs" />
        <PlatformSelect name="status" defaultValue={statusFilter} className="max-w-[180px]">
          <option value="">Tous les statuts</option>
          {[...new Set((data ?? []).map((r) => r.status))].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </PlatformSelect>
      </FilterBar>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {rows.length === 0 ? (
            <PlatformEmpty title="Aucun domaine" description="Aucun domaine personnalisé pour ces filtres." />
          ) : (
            <PlatformPanel className="overflow-hidden p-0">
              <PlatformTable minWidth="880px">
                <thead>
                  <tr>
                    {["Domaine", "Organisation", "Statut", "Vérifié", "Plan", "Créé", "Actions"].map((heading) => (
                      <PlatformTh key={heading}>{heading}</PlatformTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-[color:var(--pa-bg)]/80">
                      <PlatformTd className="font-semibold">{row.domain}</PlatformTd>
                      <PlatformTd>
                        <div className="flex items-center gap-2">
                          <OrgAvatar name={row.orgName} size="sm" />
                          <span>{row.orgName}</span>
                        </div>
                      </PlatformTd>
                      <PlatformTd>
                        <StatusBadge label={domainStatusLabel(row.status, row.verified_at)} />
                      </PlatformTd>
                      <PlatformTd className="tabular-nums">{row.verified_at?.slice(0, 10) ?? "—"}</PlatformTd>
                      <PlatformTd className="capitalize">{row.plan}</PlatformTd>
                      <PlatformTd className="tabular-nums">{row.created_at.slice(0, 10)}</PlatformTd>
                      <PlatformTd>
                        <Link
                          className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                          href={`/platform/domains?${preserved}&detail=${row.id}`}
                        >
                          Détail
                        </Link>
                      </PlatformTd>
                    </tr>
                  ))}
                </tbody>
              </PlatformTable>
            </PlatformPanel>
          )}
        </div>
        <div className="xl:col-span-4">
          <PlatformPanel title="Fiche domaine" description="Lecture seule" className="!p-4">
            {!detail ? (
              <p className="text-sm text-muted-foreground">Sélectionnez un domaine.</p>
            ) : (
              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-muted-foreground">Domaine</dt>
                  <dd className="font-semibold">{detail.domain}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Organisation</dt>
                  <dd>{detail.orgName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Statut enregistré</dt>
                  <dd>
                    <StatusBadge label={domainStatusLabel(detail.status, detail.verified_at)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Vérifié le</dt>
                  <dd className="tabular-nums">{detail.verified_at?.slice(0, 19).replace("T", " ") ?? "Non vérifié"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="capitalize">{detail.plan}</dd>
                </div>
                <Link
                  className="inline-flex font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                  href={`/platform/organizations/${detail.organization_id}?tab=domains`}
                >
                  Ouvrir l&apos;organisation
                </Link>
              </dl>
            )}
          </PlatformPanel>
        </div>
      </div>
    </div>
  )
}

function domainStatusLabel(status: string, verifiedAt: string | null) {
  if (verifiedAt || status === "verified") return "Traité"
  if (status === "failed" || status === "disabled") return "Suspendu"
  if (status === "pending") return "Ouvert"
  return status
}

function linkQuery(params: { q?: string; status?: string }) {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.status) search.set("status", params.status)
  return search.toString()
}
