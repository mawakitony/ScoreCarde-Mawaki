import { Suspense } from "react"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { AnalyticsHeader } from "@/components/analytics/analytics-header"
import { resolveRange } from "@/lib/analytics/range"
import { getConversionAnalytics } from "@/lib/data/conversions"
import { getCommercialAnalytics } from "@/lib/data/crm"
import { ensureMembership } from "@/lib/data/membership"
import { getOverview } from "@/lib/data/overview"
import { getReportMetrics } from "@/lib/data/reports"
import { listScorecards } from "@/lib/data/scorecards"

export const metadata = { title: "Analytics" }

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; scorecard?: string }>
}) {
  const params = await searchParams
  const range = resolveRange(params)
  const membership = await ensureMembership()
  const scorecardList = membership ? await listScorecards(membership.organization.id) : { scorecards: [] }
  const scorecardOptions = scorecardList.scorecards.map((row) => ({ id: row.id, name: row.name }))
  const requested = params.scorecard?.trim() || null
  const scorecardId =
    requested && scorecardOptions.some((row) => row.id === requested) ? requested : null

  // Trend series come from dashboard_overview (org-wide, no p_scorecard).
  // When a scorecard filter is active, omit them to avoid mixing scopes.
  const [commercial, conversions, reports, overview] = await Promise.all([
    getCommercialAnalytics(range, scorecardId ?? undefined),
    getConversionAnalytics(range),
    getReportMetrics(range),
    scorecardId ? Promise.resolve(null) : getOverview(range),
  ])

  return (
    <div className="space-y-4 bg-transparent md:space-y-5">
      <Suspense fallback={null}>
        <AnalyticsHeader
          range={range.key}
          from={range.fromInput}
          to={range.toInput}
          scorecardId={scorecardId}
          scorecards={scorecardOptions}
        />
      </Suspense>

      {"error" in commercial ? (
        <p className="rounded-2xl border border-border bg-card px-5 py-4 text-sm shadow-[var(--shadow-panel)]">
          {commercial.error}
        </p>
      ) : (
        <AnalyticsDashboard
          commercial={commercial.data}
          overview={overview && !("error" in overview) ? overview.data : null}
          scorecardFiltered={Boolean(scorecardId)}
          conversions={conversions}
          reports={reports}
        />
      )}
    </div>
  )
}
