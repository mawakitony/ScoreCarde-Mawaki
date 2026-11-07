import { Suspense } from "react"
import Link from "next/link"
import { deltaLabel } from "@/components/analytics/report"
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts"
import { FunnelPanel } from "@/components/dashboard/funnel-panel"
import { HotLeadsList } from "@/components/dashboard/hot-leads-list"
import { KpiCard } from "@/components/dashboard/kpi-card"
import {
  CompletionTrend,
  LeadSources,
  LeadsTrend,
  ResultShare,
  ScorecardLeaders,
  ScoreTrend,
} from "@/components/dashboard/overview-charts"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { TrialStatusBanner } from "@/components/billing/trial-status-banner"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { can } from "@/lib/auth/permissions"
import { resolveRange } from "@/lib/analytics/range"
import { trialDaysRemaining } from "@/lib/billing/workspace-access-policy"
import { getCommercialAnalytics } from "@/lib/data/crm"
import { ensureMembership } from "@/lib/data/membership"
import { getOverview } from "@/lib/data/overview"
import { dashboardShortcutsForRole } from "@/lib/dashboard/shortcuts"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { formatNumber, formatPercent } from "@/lib/format"
import { conversionRate, ctaClickRate } from "@/lib/leads/metrics"
import { WS_ENTER, WS_LINK, WS_PANEL, WS_PANEL_ENTER } from "@/lib/ui/workspace-surface"

export const metadata = { title: "Dashboard" }

const sectionTitle = "text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]"

function periodLabel(range: { key: string; fromInput: string; toInput: string }) {
  if (range.key === "today") return "aujourd’hui"
  if (range.key === "7d") return "les 7 derniers jours"
  if (range.key === "90d") return "les 90 derniers jours"
  if (range.key === "custom") return `du ${range.fromInput} au ${range.toInput}`
  return "les 30 derniers jours"
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; welcome?: string }>
}) {
  const params = await searchParams
  const range = resolveRange(params)
  const [overview, commercial, membership] = await Promise.all([
    getOverview(range),
    getCommercialAnalytics(range),
    ensureMembership(),
  ])
  const scorecardCount = membership ? await scorecardTotal(membership.organization.id) : 0
  const trialInfo = membership ? await loadTrialBanner(membership.organization.id) : null
  const role = membership?.role ?? null
  const canCreate = role ? can({ role }, "scorecard.edit") : false
  const shortcuts = dashboardShortcutsForRole(role)
  const userName = await currentUserDisplayName()
  const leadSparkline =
    !("error" in overview) && overview.data.leads_by_day.some((row) => row.count > 0)
      ? overview.data.leads_by_day.map((row) => row.count)
      : undefined

  return (
    <div className="mx-auto w-full space-y-4 md:space-y-5">
      <WelcomeBanner
        name={userName}
        organizationName={membership?.organization.name ?? "WOLOYEM Score"}
        periodLabel={periodLabel(range)}
        primaryHref={canCreate ? "/dashboard/scorecards" : "/dashboard/leads"}
        primaryLabel={canCreate ? "Créer une scorecard" : "Voir les leads"}
        welcomeFlash={params.welcome === "1" && Boolean(membership)}
      />

      {trialInfo ? (
        <TrialStatusBanner daysRemaining={trialInfo.days} trialEndLabel={trialInfo.endLabel} />
      ) : null}

      {scorecardCount === 0 ? (
        <section className={`${WS_PANEL_ENTER} p-6 md:p-7`}>
          <h2 className={sectionTitle}>Premiers pas</h2>
          <ul className="mt-4 space-y-2.5 text-[14px] text-muted-foreground">
            <li>Créer votre première scorecard</li>
            <li>La publier</li>
            <li>Recevoir le premier lead</li>
            <li>Inviter un collègue</li>
            <li>Connecter une intégration</li>
          </ul>
          {canCreate ? (
            <Link href="/dashboard/scorecards" className={`mt-5 inline-flex text-[14px] ${WS_LINK}`}>
              Aller aux scorecards
            </Link>
          ) : null}
        </section>
      ) : null}

      <section
        className={`${WS_PANEL_ENTER} flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-5`}
        style={{ animationDelay: "40ms" }}
      >
        <div className="min-w-0 shrink-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Période d’analyse</h2>
          <p className="text-[12px] text-muted-foreground">Synchronisée avec l’URL</p>
        </div>
        <div className="min-w-0 flex-1 sm:flex sm:justify-end">
          <Suspense fallback={<div className="h-9 w-full max-w-md animate-pulse rounded-xl bg-muted" />}>
            <PeriodFilter range={range.key} from={range.fromInput} to={range.toInput} compact />
          </Suspense>
        </div>
      </section>

      {"error" in commercial ? (
        <p className={`${WS_PANEL} px-5 py-4 text-[14px]`}>{commercial.error}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              index={0}
              label="Total leads"
              value={formatNumber(commercial.data.current.leads)}
              numericValue={commercial.data.current.leads}
              numberFormat="integer"
              hint={deltaLabel(commercial.data.current.leads, commercial.data.previous.leads)}
              icon="users"
              sparkline={leadSparkline}
              tooltip="Leads capturés sur la période sélectionnée."
            />
            <KpiCard
              index={1}
              label="Scorecards"
              value={formatNumber(scorecardCount)}
              numericValue={scorecardCount}
              numberFormat="integer"
              hint="Catalogue actuel de l’organisation"
              icon="target"
              tooltip="Nombre total de scorecards de l’organisation (hors filtre de période)."
            />
            <KpiCard
              index={2}
              label="Évaluations terminées"
              value={formatNumber(commercial.data.current.completed)}
              numericValue={commercial.data.current.completed}
              numberFormat="integer"
              hint={deltaLabel(commercial.data.current.completed, commercial.data.previous.completed)}
              icon="check"
              tooltip="Évaluations terminées sur la période."
            />
            <KpiCard
              index={3}
              label="Conversion CTA"
              value={formatPercent(conversionRate(commercial.data.current.cta_clicks, commercial.data.current.completed))}
              hint="Clics CTA / évaluations terminées"
              icon="cta"
              tooltip="Clics CTA ÷ évaluations terminées. Les clics peuvent se répéter."
            />
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-12 md:gap-5">
            <div className="min-w-0 space-y-4 xl:col-span-8 md:space-y-5">
              <section className={`${WS_PANEL_ENTER} p-4 md:p-5`} style={{ animationDelay: "100ms" }}>
                {"error" in overview ? (
                  <p className="text-[14px] text-muted-foreground">{overview.error}</p>
                ) : (
                  <LeadsTrend data={overview.data} />
                )}
              </section>

              {"error" in overview ? null : (
                <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
                  <section className={`${WS_PANEL_ENTER} p-4 md:p-5`} style={{ animationDelay: "140ms" }}>
                    <CompletionTrend data={overview.data} />
                  </section>
                  <section className={`${WS_PANEL_ENTER} p-4 md:p-5`} style={{ animationDelay: "160ms" }}>
                    <ScoreTrend data={overview.data} />
                  </section>
                </div>
              )}

              <section className={`${WS_PANEL_ENTER} p-4 md:p-5`} style={{ animationDelay: "180ms" }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={sectionTitle}>Leads chauds récents</h2>
                  <Link href="/dashboard/leads" className={`text-[13px] ${WS_LINK}`}>
                    Voir le CRM
                  </Link>
                </div>
                <HotLeadsList leads={commercial.data.hot_leads} />
              </section>
            </div>

            <aside className="min-w-0 space-y-4 xl:col-span-4 md:space-y-5">
              <FunnelPanel counts={commercial.data.current} />
              <section className={`${WS_PANEL_ENTER} space-y-4 p-4 md:p-5`}>
                <h2 className={sectionTitle}>Compléments</h2>
                <SideRow label="Score moyen" value={formatPercent(commercial.data.current.average_score)} hint="Score d'évaluation moyen" />
                <SideRow label="Leads chauds" value={formatNumber(commercial.data.current.hot_leads)} hint={deltaLabel(commercial.data.current.hot_leads, commercial.data.previous.hot_leads)} />
                <SideRow label="Taux de clic CTA" value={formatPercent(ctaClickRate(commercial.data.current.cta_clicks, commercial.data.current.viewed))} hint="Clics CTA / résultats vus" />
                <SideRow label="Nouveaux leads" value={formatNumber(commercial.data.current.new_leads)} hint={deltaLabel(commercial.data.current.new_leads, commercial.data.previous.new_leads)} />
              </section>
              {"error" in overview ? (
                <p className={`${WS_PANEL} px-5 py-4 text-sm`}>{overview.error}</p>
              ) : (
                <>
                  <ResultShare data={overview.data} />
                  <ScorecardLeaders data={overview.data} />
                  <LeadSources data={overview.data} />
                </>
              )}
            </aside>
          </div>
        </>
      )}

      <DashboardShortcuts items={shortcuts} />

      {"error" in commercial && !("error" in overview) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`${WS_PANEL} ${WS_ENTER} p-4 md:p-5`}>
            <CompletionTrend data={overview.data} />
          </section>
          <section className={`${WS_PANEL} ${WS_ENTER} p-4 md:p-5`}>
            <ScoreTrend data={overview.data} />
          </section>
        </div>
      ) : null}
    </div>
  )
}

function SideRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border-t border-border pt-3.5 first:border-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] text-muted-foreground">{label}</p>
        <p className="text-[20px] font-semibold tabular-nums text-foreground">{value}</p>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>
    </div>
  )
}

async function scorecardTotal(organizationId: string) {
  const supabase = await createClient()
  const { count } = await supabase.from("scorecards").select("id", { count: "exact", head: true }).eq("organization_id", organizationId)
  return count ?? 0
}

async function currentUserDisplayName() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const meta = data.user?.user_metadata
  return typeof meta?.full_name === "string" ? meta.full_name : null
}

async function loadTrialBanner(organizationId: string) {
  // subscriptions has RLS without member SELECT policies — use admin like billing/entitlements.
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("subscriptions")
      .select("status, trial_end")
      .eq("organization_id", organizationId)
      .maybeSingle()
    if (!data || data.status !== "trialing" || !data.trial_end) return null
    const days = trialDaysRemaining(data.trial_end)
    if (days === null || days <= 0) return null
    return {
      days,
      endLabel: new Date(data.trial_end).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    }
  } catch {
    return null
  }
}
