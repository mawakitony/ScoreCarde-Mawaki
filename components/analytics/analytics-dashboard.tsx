"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  Flame,
  Gauge,
  Globe2,
  Info,
  Lightbulb,
  MousePointerClick,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ConversionSummary } from "@/components/analytics/conversions"
import { deltaLabel } from "@/components/analytics/report"
import { AmbientHalo } from "@/components/dashboard/ambient-halo"
import { chartAxisStroke, chartGridStroke, chartPieColors, chartSeries, chartTick } from "@/components/dashboard/chart-theme"
import { PremiumChartTooltip } from "@/components/dashboard/chart-tooltip"
import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { buildAnalyticsInsights } from "@/lib/analytics/insights"
import { buildKpiSnapshot, progressPercent, scorecardCompletionRate } from "@/lib/analytics/kpis"
import { withDisplayResultLabels } from "@/lib/dashboard/result-labels"
import { scorecardDetailHref } from "@/lib/dashboard/scorecard-links"
import { formatChartDate, formatNumber, formatPercent } from "@/lib/format"
import { countryName } from "@/lib/geo/countries"
import { fillScoreBuckets, share } from "@/lib/leads/metrics"
import { cn } from "@/lib/utils"
import type { Overview } from "@/lib/validators/scorecard"

type Counts = {
  leads: number
  new_leads: number
  page_views: number
  started: number
  captured: number
  completed: number
  viewed: number
  cta_clicks: number
  average_score: number | null
  hot_leads: number
}

type Commercial = {
  current: Counts
  previous: Counts
  score_buckets: { label: string; count: number }[]
  result_distribution: { label: string; count: number }[]
  countries: { country: string; leads: number; completions: number; average_score: number | null; cta_clicks: number }[]
  sources: { name: string; sessions: number; leads: number; completions: number; cta_clicks: number }[]
  campaigns: { name: string; sessions: number; leads: number; completions: number; cta_clicks: number }[]
  scorecards: {
    id: string
    name: string
    views: number
    starts: number
    leads: number
    completed: number
    average_score: number | null
    cta_clicks: number
  }[]
  completion: { median_seconds: number | null; average_seconds: number | null; sample: number }
}

const card = cn(
  "ws-panel ws-enter relative overflow-hidden p-4 md:p-5",
  "transition-[transform,box-shadow,border-color] duration-200 ease-out",
  "motion-safe:hover:-translate-y-0.5 hover:border-[color:var(--brand-500)]/30",
  "hover:shadow-[0_16px_40px_-28px_rgba(7,16,57,0.4)] dark:hover:border-[color:var(--brand-500)]/35",
)

const PARCOURS_COLORS = [
  chartSeries.primary,
  chartSeries.secondary,
  chartSeries.tertiary,
  chartSeries.quaternary,
  chartSeries.quinary,
] as const

const sectionTitle = "text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]"
const sectionHint = "mt-0.5 text-[12px] leading-snug text-muted-foreground md:text-[13px]"

export function AnalyticsDashboard({
  commercial,
  overview,
  scorecardFiltered = false,
  conversions,
  reports,
}: {
  commercial: Commercial
  overview: Overview | null
  scorecardFiltered?: boolean
  conversions: {
    conversions: number
    values: { currency: string; total: number }[]
    byScorecard: { name: string; currency: string; total: number }[]
    byCampaign: { name: string; currency: string; total: number }[]
  }
  reports: {
    reports_generated: number
    reports_downloaded: number
    reports_shared: number
    report_email_sent: number
  }
}) {
  const reduced = usePrefersReducedMotion()
  const [sortKey, setSortKey] = useState<"completed" | "starts" | "leads" | "rate">("completed")
  const [activeResult, setActiveResult] = useState<number | undefined>(undefined)
  const [showStarted, setShowStarted] = useState(true)
  const [showCompleted, setShowCompleted] = useState(true)
  const [showAllScorecards, setShowAllScorecards] = useState(false)
  const [showInactiveScorecards, setShowInactiveScorecards] = useState(false)

  const kpis = buildKpiSnapshot(commercial.current, commercial.previous)
  const insights = buildAnalyticsInsights({
    current: commercial.current,
    previous: commercial.previous,
    scorecards: commercial.scorecards,
    sources: commercial.sources,
    result_distribution: commercial.result_distribution,
  })

  const results = withDisplayResultLabels(commercial.result_distribution)
  const resultTotal = results.reduce((sum, row) => sum + row.count, 0)
  const buckets = fillScoreBuckets(commercial.score_buckets)
  const bucketMax = Math.max(...buckets.map((row) => row.count), 0)
  const bucketTotal = buckets.reduce((sum, row) => sum + row.count, 0)

  const parcoursSteps = [
    {
      label: "Démarrées",
      value: commercial.current.started,
      hint: "Évaluations commencées",
      icon: PlayCircle,
      sequential: true,
    },
    {
      label: "Capturées",
      value: commercial.current.captured,
      hint: "Leads enregistrés",
      icon: Users,
      sequential: true,
    },
    {
      label: "Terminées",
      value: commercial.current.completed,
      hint: "Évaluations complétées",
      icon: CheckCircle2,
      sequential: true,
    },
    {
      label: "Résultats vus",
      value: commercial.current.viewed,
      hint: "Événements (peuvent se répéter)",
      icon: Eye,
      sequential: false,
    },
    {
      label: "Clics CTA",
      value: commercial.current.cta_clicks,
      hint: "Événements (peuvent se répéter)",
      icon: MousePointerClick,
      sequential: false,
    },
  ]
  const parcoursMax = Math.max(...parcoursSteps.map((step) => step.value), 0)

  const { activeScorecards, inactiveScorecards } = useMemo(() => {
    const rows = [...commercial.scorecards]
    rows.sort((a, b) => {
      if (sortKey === "rate") {
        return scorecardCompletionRate(b.starts, b.completed) - scorecardCompletionRate(a.starts, a.completed)
      }
      return (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
    })
    const active = rows.filter((row) => row.starts > 0 || row.completed > 0 || row.leads > 0)
    const inactive = rows.filter((row) => row.starts === 0 && row.completed === 0 && row.leads === 0)
    return { activeScorecards: active, inactiveScorecards: inactive }
  }, [commercial.scorecards, sortKey])

  const visibleScorecards = showAllScorecards ? activeScorecards : activeScorecards.slice(0, 5)
  const scorecardMax = Math.max(...activeScorecards.map((row) => row.completed), 0)

  const trend = overview
    ? overview.completion_by_day.map((row) => ({
        label: formatChartDate(row.date),
        started: row.started,
        completed: row.completed,
      }))
    : []
  const sparseTrend = trend.length > 0 && trend.every((row) => row.started === 0 && row.completed === 0)

  const sourceMax = Math.max(...commercial.sources.map((row) => row.leads), 0)
  const countryMax = Math.max(...commercial.countries.map((row) => row.leads), 0)
  const hotShare =
    commercial.current.leads > 0 ? share(commercial.current.hot_leads, commercial.current.leads) : null

  const leadSpark =
    overview?.leads_by_day.some((row) => row.count > 0)
      ? overview.leads_by_day.map((row) => row.count)
      : undefined

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          index={0}
          label="Leads"
          tooltip="Nombre de leads capturés sur la période filtrée."
          icon={<Users className="size-4" />}
          value={kpis.leads.value}
          hint={deltaLabel(commercial.current.leads, commercial.previous.leads)}
          spark={leadSpark}
        />
        <Kpi
          index={1}
          label="Démarrées"
          tooltip="Évaluations démarrées sur la période."
          icon={<PlayCircle className="size-4" />}
          value={kpis.started.value}
          hint={deltaLabel(commercial.current.started, commercial.previous.started)}
        />
        <Kpi
          index={2}
          label="Terminées"
          tooltip="Évaluations terminées sur la période."
          icon={<CheckCircle2 className="size-4" />}
          value={kpis.completed.value}
          hint={deltaLabel(commercial.current.completed, commercial.previous.completed)}
        />
        <Kpi
          index={3}
          label="Complétion"
          tooltip="Terminées ÷ démarrées. Affiché à 0 % s’il n’y a aucun démarrage."
          icon={<Target className="size-4" />}
          value={kpis.completion.value}
          format="percent"
          hint={rateDeltaHint(kpis.completion.delta, "Terminées / démarrées")}
        />
        <Kpi
          index={4}
          label="Score moyen"
          tooltip="Moyenne des scores sur les évaluations terminées."
          icon={<Gauge className="size-4" />}
          value={kpis.averageScore ?? 0}
          format="percent"
          nullable={kpis.averageScore === null}
          hint="Sur les évaluations terminées"
        />
        <Kpi
          index={5}
          label="CTA / terminées"
          tooltip="Clics CTA ÷ évaluations terminées (événements CTA pouvant se répéter)."
          icon={<MousePointerClick className="size-4" />}
          value={kpis.ctaRate.value}
          format="percent"
          hint={rateDeltaHint(kpis.ctaRate.delta, "Clics CTA / évaluations terminées")}
        />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <section className={cn(card, "xl:col-span-8")} style={{ animationDelay: "70ms" }}>
          <AmbientHalo className="-top-16 -right-8 size-48 opacity-70" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={sectionTitle}>Performance des évaluations</h2>
              <p className={sectionHint}>Démarrages et complétions — données quotidiennes réelles</p>
            </div>
            {!scorecardFiltered && trend.length > 0 && !sparseTrend ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Séries du graphique">
                <SeriesToggle
                  label="Démarrées"
                  color={chartSeries.primary}
                  active={showStarted}
                  locked={showStarted && !showCompleted}
                  onClick={() => setShowStarted((v) => (v && !showCompleted ? v : !v))}
                />
                <SeriesToggle
                  label="Terminées"
                  color={chartSeries.tertiary}
                  active={showCompleted}
                  locked={showCompleted && !showStarted}
                  onClick={() => setShowCompleted((v) => (v && !showStarted ? v : !v))}
                />
              </div>
            ) : null}
          </div>
          {scorecardFiltered ? (
            <p className="relative mt-8 text-center text-[13px] text-muted-foreground">
              Série quotidienne disponible au niveau organisation. Retirez le filtre scorecard pour l’afficher.
            </p>
          ) : trend.length === 0 || sparseTrend ? (
            <p className="relative mt-8 text-center text-[13px] text-muted-foreground">
              Pas encore assez d’activité quotidienne pour tracer une courbe.
            </p>
          ) : (
            <div className="relative mt-3 h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsStarted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartSeries.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartSeries.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analyticsCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartSeries.tertiary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chartSeries.tertiary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartGridStroke} vertical={false} strokeDasharray="3 6" />
                  <XAxis dataKey="label" tick={chartTick} stroke={chartAxisStroke} minTickGap={28} />
                  <YAxis tick={chartTick} stroke={chartAxisStroke} width={34} allowDecimals={false} />
                  <Tooltip content={<PremiumChartTooltip />} cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }} />
                  {showStarted ? (
                    <Area
                      type="monotone"
                      dataKey="started"
                      name="Démarrées"
                      stroke={chartSeries.primary}
                      fill="url(#analyticsStarted)"
                      strokeWidth={2.25}
                      isAnimationActive={!reduced}
                      animationDuration={650}
                      animationBegin={0}
                      dot={false}
                      activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--card)" }}
                    />
                  ) : null}
                  {showCompleted ? (
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Terminées"
                      stroke={chartSeries.tertiary}
                      fill="url(#analyticsCompleted)"
                      strokeWidth={2.25}
                      isAnimationActive={!reduced}
                      animationDuration={650}
                      animationBegin={reduced ? 0 : 80}
                      dot={false}
                      activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--card)" }}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className={cn(card, "xl:col-span-4")} style={{ animationDelay: "100ms" }}>
          <h2 className={sectionTitle}>Indicateurs de parcours</h2>
          <p className={sectionHint}>
            Compteurs de période — pas un funnel strict. Les vues résultat et CTA peuvent se cumuler.
          </p>
          <ul className="mt-4 space-y-2.5">
            {parcoursSteps.map((step, index) => {
              const Icon = step.icon
              const width = progressPercent(step.value, parcoursMax)
              const prev = index > 0 ? parcoursSteps[index - 1] : null
              const vsPrev =
                step.sequential && prev && prev.sequential && prev.value > 0
                  ? share(step.value, prev.value)
                  : null
              return (
                <li key={step.label} className="rounded-xl bg-muted/35 px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white dark:text-[#0B1220]"
                      style={{ background: PARCOURS_COLORS[index % PARCOURS_COLORS.length] }}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="font-medium text-foreground">{step.label}</span>
                        <span className="font-semibold tabular-nums">{formatNumber(step.value)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                        {width > 0 ? (
                          <div
                            className={cn(
                              "h-full rounded-full",
                              !reduced && "transition-[width] duration-500 ease-out",
                            )}
                            style={{
                              width: `${width}%`,
                              background: PARCOURS_COLORS[index % PARCOURS_COLORS.length],
                            }}
                          />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {step.hint}
                        {vsPrev !== null ? ` · ${formatPercent(vsPrev)} vs précédent` : null}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
            Durée médiane {duration(commercial.completion.median_seconds)} · moyenne{" "}
            {duration(commercial.completion.average_seconds)} ({formatNumber(commercial.completion.sample)} sessions)
          </p>
        </section>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className={card} style={{ animationDelay: "120ms" }}>
          <h2 className={sectionTitle}>Répartition des résultats</h2>
          <p className={sectionHint}>Catégories des évaluations terminées</p>
          {results.length === 0 || resultTotal === 0 ? (
            <p className="mt-8 text-center text-[13px] text-muted-foreground">Pas encore de répartition.</p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-stretch">
              <div className="relative h-52 w-full max-w-[220px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={results.length > 1 ? 3 : 0}
                      isAnimationActive={!reduced}
                      animationDuration={650}
                      onMouseEnter={(_, index) => setActiveResult(index)}
                      onMouseLeave={() => setActiveResult(undefined)}
                    >
                      {results.map((row, index) => (
                        <Cell
                          key={row.key}
                          fill={chartPieColors[index % chartPieColors.length]}
                          stroke="var(--card)"
                          strokeWidth={activeResult === index ? 3 : 2}
                          style={{
                            opacity: activeResult === undefined || activeResult === index ? 1 : 0.42,
                            filter:
                              activeResult === index && !reduced
                                ? "brightness(1.06)"
                                : undefined,
                            transition: reduced ? undefined : "opacity 180ms ease",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const row = payload[0]
                        const count = typeof row.value === "number" ? row.value : Number(row.value)
                        const pct = Number.isFinite(count) ? share(count, resultTotal) : 0
                        return (
                          <div className="rounded-xl border border-border bg-popover px-3 py-2 text-[12px] shadow-[var(--shadow-panel)]">
                            <p className="font-semibold text-foreground">{String(row.name)}</p>
                            <p className="mt-0.5 text-muted-foreground">
                              {formatNumber(count)} · {pct} %
                            </p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Total</p>
                  <p className="text-[22px] font-semibold tabular-nums">{formatNumber(resultTotal)}</p>
                </div>
              </div>
              <ul className="w-full flex-1 space-y-1">
                {results.map((row, index) => (
                  <li key={row.key}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] transition-colors",
                        activeResult === index ? "bg-muted" : "hover:bg-muted/60",
                      )}
                      onMouseEnter={() => setActiveResult(index)}
                      onMouseLeave={() => setActiveResult(undefined)}
                      onFocus={() => setActiveResult(index)}
                      onBlur={() => setActiveResult(undefined)}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: chartPieColors[index % chartPieColors.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">{row.label}</span>
                      <span className="tabular-nums text-muted-foreground">{formatNumber(row.count)}</span>
                      <span className="w-11 text-right font-semibold tabular-nums">
                        {share(row.count, resultTotal)} %
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className={card} style={{ animationDelay: "140ms" }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className={sectionTitle}>Qualité & capture</h2>
              <p className={sectionHint}>Leads chauds, scores, sources et pays</p>
            </div>
            <Link
              href="/dashboard/leads"
              className="inline-flex shrink-0 items-center gap-1 rounded-md text-[12px] font-semibold text-[color:var(--brand-500)] hover:underline focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"
            >
              CRM <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-[#F5A524]/25 bg-[#F5A524]/8 p-3 dark:bg-[#F5A524]/10">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#F5A524]/20 text-[#B7791F]">
                <Flame className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Leads chauds</p>
                <p className="text-[22px] font-semibold tabular-nums leading-none">
                  <AnimatedNumber value={commercial.current.hot_leads} />
                </p>
              </div>
              <p className="text-right text-[12px] text-muted-foreground">
                {hotShare === null ? "—" : `${hotShare} % des leads`}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[12px] font-semibold text-foreground">Distribution des scores</p>
            {bucketTotal === 0 ? (
              <p className="mt-2 text-[12px] text-muted-foreground">Aucun score sur la période.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {buckets.map((bucket) => (
                  <li key={bucket.label} className="flex items-center gap-2 text-[12px]">
                    <span className="w-10 shrink-0 text-muted-foreground">{bucket.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      {progressPercent(bucket.count, bucketMax) > 0 ? (
                        <div
                          className={cn(
                            "h-full rounded-full bg-[#8B7CF6]",
                            !reduced && "transition-[width] duration-500",
                          )}
                          style={{ width: `${progressPercent(bucket.count, bucketMax)}%` }}
                        />
                      ) : null}
                    </div>
                    <span className="w-7 text-right tabular-nums font-medium">{formatNumber(bucket.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                <TrendingUp className="size-3.5 text-[#22B88A]" aria-hidden />
                Sources
              </p>
              {commercial.sources.length === 0 ? (
                <p className="mt-2 text-[12px] text-muted-foreground">Aucune source.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {commercial.sources.slice(0, 5).map((row, index) => (
                    <li key={`${row.name}-${index}`}>
                      <div className="flex justify-between gap-2 text-[12px]">
                        <span className="truncate font-medium">
                          <span className="mr-1 text-muted-foreground">{index + 1}.</span>
                          {row.name?.trim() || "Non renseignée"}
                        </span>
                        <span className="shrink-0 tabular-nums">{formatNumber(row.leads)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        {progressPercent(row.leads, sourceMax) > 0 ? (
                          <div
                            className="h-full rounded-full bg-[#22B88A]"
                            style={{ width: `${progressPercent(row.leads, sourceMax)}%` }}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                <Globe2 className="size-3.5 text-[color:var(--brand-500)]" aria-hidden />
                Pays
              </p>
              {commercial.countries.length === 0 ? (
                <p className="mt-2 text-[12px] text-muted-foreground">Aucun pays renseigné.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {commercial.countries.slice(0, 5).map((row) => (
                    <li key={row.country || "missing"}>
                      <div className="flex justify-between gap-2 text-[12px]">
                        <span className="truncate font-medium">{safeCountry(row.country)}</span>
                        <span className="shrink-0 tabular-nums">{formatNumber(row.leads)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        {progressPercent(row.leads, countryMax) > 0 ? (
                          <div
                            className="h-full rounded-full bg-[color:var(--brand-500)]"
                            style={{ width: `${progressPercent(row.leads, countryMax)}%` }}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className={card} style={{ animationDelay: "160ms" }}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={sectionTitle}>Performance par scorecard</h2>
            <p className={sectionHint}>
              Top {Math.min(5, activeScorecards.length)} actifs
              {inactiveScorecards.length > 0 ? ` · ${inactiveScorecards.length} sans activité` : null}
            </p>
          </div>
          <label className="text-[12px] font-medium text-muted-foreground">
            Trier{" "}
            <select
              className="ml-1 h-8 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
            >
              <option value="completed">Terminées</option>
              <option value="starts">Démarrages</option>
              <option value="leads">Leads</option>
              <option value="rate">Complétion</option>
            </select>
          </label>
        </div>

        {activeScorecards.length === 0 && inactiveScorecards.length === 0 ? (
          <p className="mt-5 text-center text-[13px] text-muted-foreground">Aucune scorecard sur la période.</p>
        ) : (
          <>
            {activeScorecards.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted-foreground">Aucune scorecard active sur la période.</p>
            ) : (
              <ul className="mt-4 space-y-1.5">
                {visibleScorecards.map((row, index) => {
                  const href = scorecardDetailHref(row.id)
                  const rate = scorecardCompletionRate(row.starts, row.completed)
                  const width = progressPercent(row.completed, scorecardMax)
                  return (
                    <li key={row.id}>
                      <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/55 focus-within:bg-muted/55">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-950)]/8 text-[12px] font-semibold tabular-nums text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          {href ? (
                            <Link
                              href={`${href}/analytics`}
                              className="block truncate text-[13px] font-semibold hover:underline focus-visible:outline-none"
                              title={row.name}
                            >
                              {row.name}
                            </Link>
                          ) : (
                            <p className="truncate text-[13px] font-semibold" title={row.name}>
                              {row.name}
                            </p>
                          )}
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            {width > 0 ? (
                              <div
                                className="h-full rounded-full bg-[var(--chart-1)]"
                                style={{ width: `${width}%` }}
                              />
                            ) : null}
                          </div>
                        </div>
                        <div className="w-[4.5rem] shrink-0 text-right text-[11px]">
                          <p className="font-semibold tabular-nums">{formatNumber(row.completed)}</p>
                          <p className="text-muted-foreground">{formatPercent(rate)}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {activeScorecards.length > 5 ? (
              <button
                type="button"
                onClick={() => setShowAllScorecards((v) => !v)}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"
              >
                {showAllScorecards
                  ? "Réduire le classement"
                  : `Voir tous les scorecards (${activeScorecards.length})`}
                <ChevronDown className={cn("size-3.5 transition-transform", showAllScorecards && "rotate-180")} />
              </button>
            ) : null}

            {inactiveScorecards.length > 0 ? (
              <div className="mt-3 border-t border-border pt-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left text-[12px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setShowInactiveScorecards((v) => !v)}
                  aria-expanded={showInactiveScorecards}
                >
                  Scorecards sans activité ({inactiveScorecards.length})
                  <ChevronDown
                    className={cn("size-4 transition-transform", showInactiveScorecards && "rotate-180")}
                  />
                </button>
                {showInactiveScorecards ? (
                  <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto">
                    {inactiveScorecards.map((row) => {
                      const href = scorecardDetailHref(row.id)
                      return (
                        <li key={row.id} className="flex items-center justify-between gap-2 px-2 py-1 text-[12px]">
                          {href ? (
                            <Link href={`${href}/analytics`} className="truncate hover:underline">
                              {row.name}
                            </Link>
                          ) : (
                            <span className="truncate">{row.name}</span>
                          )}
                          <span className="shrink-0 text-muted-foreground">0</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className={cn(card, "overflow-hidden")} style={{ animationDelay: "180ms" }}>
        <AmbientHalo className="-bottom-14 -left-8 size-44 opacity-60" />
        <div className="relative flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
            <Lightbulb className="size-4" />
          </span>
          <div>
            <h2 className={sectionTitle}>Insights & recommandations</h2>
            <p className={sectionHint}>
              Règles déterministes sur vos métriques — pas un modèle d’IA générative.
            </p>
          </div>
        </div>
        {insights.length === 0 ? (
          <p className="relative mt-5 rounded-xl bg-muted/45 px-4 py-4 text-center text-[13px] text-muted-foreground">
            Pas encore assez de données pour générer des insights fiables.
          </p>
        ) : (
          <ul className="relative mt-4 grid gap-3 lg:grid-cols-2">
            {insights.map((insight) => {
              const meta = insightMeta(insight.tone)
              const Icon = meta.icon
              return (
                <li key={insight.id} className={cn("rounded-2xl border p-3.5", meta.shell)}>
                  <div className="flex items-start gap-2.5">
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.iconShell)}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-foreground">{insight.title}</p>
                        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase", meta.badge)}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-foreground/90">{insight.observation}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{insight.explanation}</p>
                      {insight.action ? (
                        <p className="mt-2 text-[12px] font-medium text-foreground">{insight.action}</p>
                      ) : null}
                      {insight.href ? (
                        <Link
                          href={insight.href}
                          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--brand-500)] hover:underline"
                        >
                          Voir <ArrowUpRight className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className={card} style={{ animationDelay: "200ms" }}>
          <h2 className={sectionTitle}>Synthèse de période</h2>
          <p className={sectionHint}>Repères complémentaires aux KPI ci-dessus</p>
          <dl className="mt-3 grid grid-cols-2 gap-2.5">
            <SummaryChip label="Capturés" value={formatNumber(commercial.current.captured)} />
            <SummaryChip label="Vues résultat" value={formatNumber(commercial.current.viewed)} />
            <SummaryChip label="Durée médiane" value={duration(commercial.completion.median_seconds)} />
            <SummaryChip
              label="Sessions durée"
              value={formatNumber(commercial.completion.sample)}
            />
          </dl>
          <dl className="mt-3 grid grid-cols-2 gap-2.5 border-t border-border pt-3">
            <SummaryChip label="Rapports générés" value={formatNumber(reports.reports_generated)} />
            <SummaryChip label="Téléchargés" value={formatNumber(reports.reports_downloaded)} />
            <SummaryChip label="Partagés" value={formatNumber(reports.reports_shared)} />
            <SummaryChip label="Emails" value={formatNumber(reports.report_email_sent)} />
          </dl>
        </section>

        <ConversionSummary
          ctaClicks={commercial.current.cta_clicks}
          leads={commercial.current.captured}
          conversions={conversions.conversions}
          values={conversions.values}
          byScorecard={conversions.byScorecard}
          byCampaign={conversions.byCampaign}
          compact
        />
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  hint,
  icon,
  index,
  format = "integer",
  nullable,
  spark,
  tooltip,
}: {
  label: string
  value: number
  hint: string
  icon: ReactNode
  index: number
  format?: "integer" | "percent"
  nullable?: boolean
  spark?: number[]
  tooltip: string
}) {
  const tone = hint.startsWith("+")
    ? "text-[#22B88A] dark:text-[#3DDBA8]"
    : hint.startsWith("-")
      ? "text-[#9C3B3B] dark:text-[#E57373]"
      : "text-muted-foreground"
  const max = spark && spark.length > 1 ? Math.max(...spark, 1) : 1
  const hasSpark = Boolean(spark && spark.length > 1)

  return (
    <article
      className={cn(card, "flex min-h-[8.25rem] flex-col")}
      style={{ animationDelay: `${index * 40}ms` }}
      title={tooltip}
      aria-label={`${label}. ${tooltip}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-xl bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-[28px] font-semibold tracking-tight tabular-nums text-foreground md:text-[32px]">
        {nullable ? (
          "—"
        ) : format === "percent" ? (
          <>
            <AnimatedNumber value={value} />
            <span className="text-[17px]"> %</span>
          </>
        ) : (
          <AnimatedNumber value={value} />
        )}
      </p>
      <p className={cn("mt-1 min-h-[1.1rem] text-[12px] leading-snug", tone)}>{hint}</p>
      {hasSpark ? (
        <svg
          viewBox={`0 0 ${Math.max((spark?.length ?? 1) - 1, 1) * 10} 24`}
          className="mt-auto h-6 w-full pt-2 text-[color:var(--brand-500)]"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            points={(spark ?? []).map((point, i) => `${i * 10},${22 - (point / max) * 18}`).join(" ")}
          />
        </svg>
      ) : (
        <div className="mt-auto h-6 pt-2" aria-hidden />
      )}
    </article>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

function SeriesToggle({
  label,
  color,
  active,
  locked,
  onClick,
}: {
  label: string
  color: string
  active: boolean
  locked?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-disabled={locked || undefined}
      title={locked ? "Au moins une série doit rester visible" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
        active
          ? "border-border bg-background text-foreground shadow-sm"
          : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
        locked && "cursor-default opacity-90",
      )}
    >
      <span className="size-2 rounded-full" style={{ background: color, opacity: active ? 1 : 0.35 }} />
      {label}
    </button>
  )
}

function rateDeltaHint(delta: number | null, fallback: string) {
  if (delta === null) return fallback
  if (delta === 0) return "Stable vs période précédente"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${formatPercent(delta)} vs période précédente`
}

function insightMeta(tone: "info" | "positive" | "attention") {
  if (tone === "positive") {
    return {
      label: "Opportunité",
      icon: Sparkles,
      shell: "border-[#22B88A]/30 bg-[#22B88A]/8",
      iconShell: "bg-[#22B88A]/15 text-[#178A66]",
      badge: "bg-[#22B88A]/15 text-[#178A66]",
    }
  }
  if (tone === "attention") {
    return {
      label: "Attention",
      icon: AlertTriangle,
      shell: "border-[#F5A524]/35 bg-[#F5A524]/10",
      iconShell: "bg-[#F5A524]/18 text-[#B7791F]",
      badge: "bg-[#F5A524]/18 text-[#B7791F]",
    }
  }
  return {
    label: "Information",
    icon: Info,
    shell: "border-border bg-muted/40",
    iconShell:
      "bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]",
    badge: "bg-muted text-muted-foreground",
  }
}

function duration(seconds: number | null) {
  if (seconds === null) return "—"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

function safeCountry(code: string) {
  const raw = (code ?? "").trim()
  if (!raw || raw === "—" || raw.toLowerCase() === "inconnu" || raw.toLowerCase() === "unknown") {
    return "Non renseigné"
  }
  try {
    return countryName(raw)
  } catch {
    return raw
  }
}
