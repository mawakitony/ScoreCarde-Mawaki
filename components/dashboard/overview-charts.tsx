"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  chartAxisStroke,
  chartGridStroke,
  chartLegendStyle,
  chartSeries,
  chartTick,
  chartTickSm,
} from "@/components/dashboard/chart-theme"
import { PremiumChartTooltip } from "@/components/dashboard/chart-tooltip"
import { EmptyState } from "@/components/dashboard/empty-state"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { ResultDistributionCard } from "@/components/dashboard/result-distribution-card"
import { TopScorecardsCard } from "@/components/dashboard/top-scorecards-card"
import { formatChartDate, formatNumber } from "@/lib/format"
import type { Overview } from "@/lib/validators/scorecard"

export function ResultShare({ data }: { data: Overview }) {
  return <ResultDistributionCard data={data} />
}

export function ScorecardLeaders({ data }: { data: Overview }) {
  return <TopScorecardsCard data={data} />
}

function seriesOf(data: Overview) {
  const leads = data.leads_by_day.map((row) => ({ ...row, label: formatChartDate(row.date) }))
  const completion = data.completion_by_day.map((row) => ({
    ...row,
    label: formatChartDate(row.date),
    rate: row.started === 0 ? 0 : Math.round((row.completed / row.started) * 1000) / 10,
  }))
  const scores = data.score_by_day.map((row) => ({ ...row, label: formatChartDate(row.date) }))
  return { leads, completion, scores }
}

function ChartTooltip() {
  return (
    <Tooltip
      content={<PremiumChartTooltip />}
      cursor={{ fill: "var(--muted)", opacity: 0.32 }}
      animationDuration={160}
      wrapperStyle={{ outline: "none" }}
    />
  )
}

function ChartHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export function LeadsTrend({ data }: { data: Overview }) {
  const reduced = usePrefersReducedMotion()
  const { leads } = seriesOf(data)
  const hasLeads = data.leads_by_day.some((row) => row.count > 0)
  const sparse = hasLeads && data.leads_by_day.filter((row) => row.count > 0).length <= 2

  return (
    <div className="min-w-0">
      <ChartHeading
        title="Leads par jour"
        subtitle={sparse ? "Peu de jours avec activité sur cette période" : "Volume capturé sur la période sélectionnée"}
      />
      <div className="mt-3 h-80 min-w-0 md:h-[22rem]">
        {hasLeads ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leads} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={chartGridStroke} strokeDasharray="3 6" />
              <XAxis dataKey="label" tick={chartTick} stroke={chartAxisStroke} tickLine={false} axisLine={{ stroke: chartAxisStroke }} />
              <YAxis allowDecimals={false} tick={chartTick} stroke={chartAxisStroke} tickLine={false} axisLine={{ stroke: chartAxisStroke }} width={36} />
              <ChartTooltip />
              <Bar
                dataKey="count"
                name="Leads"
                fill={chartSeries.primary}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
                isAnimationActive={!reduced}
                animationDuration={450}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Pas encore de leads" description="Les leads apparaîtront ici dès les premières évaluations." />
        )}
      </div>
    </div>
  )
}

export function CompletionTrend({ data }: { data: Overview }) {
  const reduced = usePrefersReducedMotion()
  const { completion } = seriesOf(data)
  const hasCompletion = data.completion_by_day.length > 0
  return (
    <div className="min-w-0">
      <ChartHeading title="Taux de complétion" subtitle="Sessions démarrées vs terminées" />
      <div className="mt-4 h-64 min-w-0">
        {hasCompletion ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completion} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={chartGridStroke} strokeDasharray="3 6" />
              <XAxis dataKey="label" tick={chartTickSm} stroke={chartAxisStroke} tickLine={false} axisLine={{ stroke: chartAxisStroke }} />
              <YAxis tick={chartTickSm} stroke={chartAxisStroke} tickLine={false} axisLine={{ stroke: chartAxisStroke }} width={36} />
              <ChartTooltip />
              <Legend wrapperStyle={chartLegendStyle} iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="started"
                name="Démarrées"
                stroke={chartSeries.primary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={!reduced}
                animationDuration={450}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Terminées"
                stroke={chartSeries.secondary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={!reduced}
                animationDuration={450}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Aucune session" description="Le taux de complétion se calcule quand des évaluations démarrent." />
        )}
      </div>
    </div>
  )
}

export function ScoreTrend({ data }: { data: Overview }) {
  const reduced = usePrefersReducedMotion()
  const { scores } = seriesOf(data)
  const hasScores = data.score_by_day.length > 0
  return (
    <div className="min-w-0">
      <ChartHeading title="Score moyen" subtitle="Pourcentage moyen des évaluations terminées" />
      <div className="mt-4 h-64 min-w-0">
        {hasScores ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scores} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={chartGridStroke} strokeDasharray="3 6" />
              <XAxis dataKey="label" tick={chartTickSm} stroke={chartAxisStroke} tickLine={false} axisLine={{ stroke: chartAxisStroke }} />
              <YAxis domain={[0, 100]} tick={chartTickSm} stroke={chartAxisStroke} tickLine={false} axisLine={{ stroke: chartAxisStroke }} width={36} />
              <ChartTooltip />
              <Legend wrapperStyle={chartLegendStyle} iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="average"
                name="Score %"
                stroke={chartSeries.tertiary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={!reduced}
                animationDuration={450}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="Aucun score" description="Le score moyen s'affichera après les premières évaluations terminées." />
        )}
      </div>
    </div>
  )
}

export function LeadSources({ data }: { data: Overview }) {
  return (
    <section className="ws-panel ws-enter p-4 md:p-5">
      <h2 className="text-[16px] font-semibold tracking-tight text-foreground">Sources des leads</h2>
      {data.sources.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted-foreground">Les sources apparaîtront avec les premiers leads.</p>
      ) : (
        <ul className="mt-4 space-y-2.5 text-[13px]">
          {data.sources.map((source) => (
            <li key={source.source} className="flex items-center justify-between gap-3">
              <span className="capitalize font-medium text-foreground">{source.source}</span>
              <span className="tabular-nums text-muted-foreground">{formatNumber(source.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
