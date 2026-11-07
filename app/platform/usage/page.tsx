import Link from "next/link"
import { Activity, BarChart3, Gauge, TrendingUp } from "lucide-react"
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
import { PlatformActivityChart } from "@/components/platform/platform-charts"
import { METRICS, type UsageMetric } from "@/lib/billing/plans"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { loadOverview, planLimits, usageRatio } from "@/lib/platform/data"
import { loadActivitySeries } from "@/lib/platform/overview-series"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; metric?: string; q?: string }>
}) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const query = (params.q ?? "").trim().toLowerCase()
  const planFilter = params.plan ?? ""
  const metricFilter = params.metric ?? ""

  const [overview, counters, activitySeries] = await Promise.all([
    supportScope ? Promise.resolve(null) : loadOverview(),
    currentCounters(supportScope?.organizationId),
    supportScope ? Promise.resolve([]) : loadActivitySeries(30),
  ])

  const orgIds = [...new Set(counters.map((row) => row.organization_id))]
  const admin = createAdminClient()
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] }
  const nameOf = (id: string) => orgs?.find((o) => o.id === id)?.name ?? id.slice(0, 8)

  let rows = counters.map((row) => ({
    ...row,
    name: nameOf(row.organization_id),
    ratio: usageRatio(row.value, row.limit),
  }))
  if (planFilter) rows = rows.filter((row) => row.plan === planFilter)
  if (metricFilter) rows = rows.filter((row) => row.metric === metricFilter)
  if (query) rows = rows.filter((row) => row.name.toLowerCase().includes(query) || row.metric.includes(query))

  const high = rows.filter((row) => row.ratio >= 0.8)
  const totalScorecards = rows.filter((r) => r.metric === "scorecards").reduce((s, r) => s + r.value, 0)
  const totalLeads = rows.filter((r) => r.metric === "leads").reduce((s, r) => s + r.value, 0)
  const totalAssessments = rows.filter((r) => r.metric === "assessment_starts").reduce((s, r) => s + r.value, 0)
  const nearLimit = high.length

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Usage"
        description="Consommation et seuils plan — lecture seule, données réelles du mois en cours."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Usage" }]}
        actions={
          <Link
            className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-sm font-semibold text-[color:var(--pa-primary)]"
            href="/platform/usage/export"
          >
            Export CSV
          </Link>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Scorecards (mois)" value={String(totalScorecards)} icon={BarChart3} hint="Compteurs période" />
        <MiniKpi index={1} label="Leads (mois)" value={String(totalLeads)} icon={TrendingUp} />
        <MiniKpi index={2} label="Réponses (mois)" value={String(totalAssessments)} icon={Activity} />
        <MiniKpi
          index={3}
          label="Proches quotas"
          value={String(nearLimit)}
          icon={Gauge}
          tone={nearLimit > 0 ? "warn" : "good"}
          hint="≥ 80 % du plan"
        />
      </section>

      <PlatformActivityChart data={activitySeries} compact />

      <FilterBar>
        <PlatformField name="q" defaultValue={params.q ?? ""} placeholder="Organisation ou métrique" className="max-w-xs" />
        <PlatformSelect name="plan" defaultValue={planFilter} className="max-w-[140px]">
          <option value="">Tous les plans</option>
          {["free", "starter", "pro", "business", "enterprise"].map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </PlatformSelect>
        <PlatformSelect name="metric" defaultValue={metricFilter} className="max-w-[180px]">
          <option value="">Toutes métriques</option>
          {METRICS.map((metric) => (
            <option key={metric} value={metric}>
              {metric}
            </option>
          ))}
        </PlatformSelect>
      </FilterBar>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {rows.length === 0 ? (
            <PlatformEmpty title="Aucune consommation" description="Pas de compteurs pour ces filtres (échantillon ≤ 200)." />
          ) : (
            <PlatformPanel title="Consommation par organisation" description="Mois en cours · limites catalogue" className="overflow-hidden !p-0">
              <div className="p-0">
                <PlatformTable minWidth="900px">
                  <thead>
                    <tr>
                      {["Organisation", "Métrique", "Plan", "Valeur", "Limite", "Ratio"].map((heading) => (
                        <PlatformTh key={heading}>{heading}</PlatformTh>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice()
                      .sort((a, b) => b.ratio - a.ratio)
                      .map((row) => (
                        <tr key={`${row.organization_id}-${row.metric}`} className="hover:bg-[color:var(--pa-bg)]/80">
                          <PlatformTd>
                            <div className="flex items-center gap-2.5">
                              <OrgAvatar name={row.name} size="sm" />
                              <Link
                                className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                                href={`/platform/organizations/${row.organization_id}`}
                              >
                                {row.name}
                              </Link>
                            </div>
                          </PlatformTd>
                          <PlatformTd className="font-mono text-xs">{row.metric}</PlatformTd>
                          <PlatformTd className="capitalize">{row.plan}</PlatformTd>
                          <PlatformTd className="tabular-nums">{row.value}</PlatformTd>
                          <PlatformTd className="tabular-nums">{row.limit === null ? "∞" : row.limit}</PlatformTd>
                          <PlatformTd>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--pa-bg)]">
                                <div
                                  className={`h-full rounded-full ${row.ratio >= 1 ? "bg-rose-500" : row.ratio >= 0.8 ? "bg-amber-500" : "bg-[color:var(--pa-primary)]"}`}
                                  style={{ width: `${Math.min(100, Math.round(row.ratio * 100))}%` }}
                                />
                              </div>
                              <span className="tabular-nums text-[12px]">{Math.round(row.ratio * 100)} %</span>
                            </div>
                          </PlatformTd>
                        </tr>
                      ))}
                  </tbody>
                </PlatformTable>
              </div>
            </PlatformPanel>
          )}
        </div>
        <div className="xl:col-span-4 space-y-3">
          <PlatformPanel title="Seuils ≥ 80 %" description="Attention quotas" className="!p-4">
            {high.length === 0 ? (
              <PlatformEmpty title="Aucun seuil critique" description="Aucune métrique ≥ 80 % du plan." />
            ) : (
              <ul className="space-y-2 text-sm">
                {high.slice(0, 12).map((row) => (
                  <li key={`${row.organization_id}-${row.metric}`} className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {row.metric} · {Math.round(row.ratio * 100)} %
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PlatformPanel>
          <PlatformPanel title="Historique agrégé" description="6 mois (overview RPC)" className="!p-4">
            {(overview?.usageMonths ?? []).length === 0 ? (
              <PlatformEmpty title="Données insuffisantes" description="Aucun agrégat mensuel disponible." />
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-auto text-sm">
                {(overview?.usageMonths ?? []).map((row) => (
                  <li key={`${row.period_start}-${row.metric}`} className="flex justify-between gap-2 tabular-nums">
                    <span className="text-muted-foreground">
                      {row.period_start.slice(0, 7)} · {row.metric}
                    </span>
                    <span className="font-semibold">{row.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </PlatformPanel>
        </div>
      </div>
    </div>
  )
}

async function currentCounters(organizationId?: string) {
  const admin = createAdminClient()
  const start = new Date(Date.parse(new Date().toISOString()))
  start.setUTCDate(1)
  const period = start.toISOString().slice(0, 10)
  let request = admin.from("usage_counters").select("organization_id, metric, value").eq("period_start", period).limit(200)
  if (organizationId) request = request.eq("organization_id", organizationId)
  const { data } = await request
  const ids = [...new Set((data ?? []).map((row) => row.organization_id))]
  const { data: subscriptions } = ids.length
    ? await admin.from("subscriptions").select("organization_id, plan").in("organization_id", ids)
    : { data: [] }
  return (data ?? []).map((row) => {
    const plan = subscriptions?.find((item) => item.organization_id === row.organization_id)?.plan ?? "free"
    const limits = planLimits(plan)
    const limit = METRICS.some((metric) => metric === row.metric) ? limits[row.metric as UsageMetric] : null
    return { ...row, plan, limit }
  })
}
