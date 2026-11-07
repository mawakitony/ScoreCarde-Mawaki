import Link from "next/link"
import { countryName } from "@/lib/geo/countries"
import { conversionRate, ctaClickRate, fillScoreBuckets, funnelRates, periodDelta, resultShares, share } from "@/lib/leads/metrics"
import { formatNumber, formatPercent } from "@/lib/format"

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

type Report = {
  current: Counts
  previous: Counts
  score_buckets: { label: string; count: number }[]
  result_distribution: { label: string; count: number }[]
  countries: { country: string; leads: number; completions: number; average_score: number | null; cta_clicks: number }[]
  sources: Channel[]
  campaigns: Channel[]
  mediums: Channel[]
  scorecards: { id: string; name: string; views: number; starts: number; leads: number; completed: number; average_score: number | null; cta_clicks: number }[]
  cta_ranges: { label: string; count: number }[]
  cta_destinations: { url: string; count: number }[]
  completion: { median_seconds: number | null; average_seconds: number | null; sample: number }
}

type Channel = { name: string; sessions: number; leads: number; completions: number; cta_clicks: number }

const funnelLabels = [
  "Vues landing",
  "Évaluations démarrées",
  "Leads capturés",
  "Évaluations terminées",
  "Résultats vus",
  "Clics CTA",
]

const panel = "rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)]"

export function AnalyticsReport({ data }: { data: Report }) {
  const steps = [data.current.page_views, data.current.started, data.current.captured, data.current.completed, data.current.viewed, data.current.cta_clicks]
  const rates = funnelRates(steps)
  const buckets = fillScoreBuckets(data.score_buckets)
  const bucketTotal = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const results = resultShares(data.result_distribution)
  const maxBucket = Math.max(...buckets.map((bucket) => bucket.count), 1)
  const maxFunnel = Math.max(...rates.map((step) => step.count), 1)

  return (
    <div className="space-y-4">
      <section className={`${panel} p-5 md:p-6`}>
        <h2 className="text-base font-semibold text-foreground">Indicateurs</h2>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4 xl:grid-cols-5">
          <Metric label="Leads" value={formatNumber(data.current.leads)} hint={deltaLabel(data.current.leads, data.previous.leads)} />
          <Metric label="Terminées" value={formatNumber(data.current.completed)} hint={deltaLabel(data.current.completed, data.previous.completed)} />
          <Metric label="Score moyen" value={formatPercent(data.current.average_score)} hint="Score d'évaluation moyen" />
          <Metric label="Clics CTA" value={formatNumber(data.current.cta_clicks)} hint={deltaLabel(data.current.cta_clicks, data.previous.cta_clicks)} />
          <Metric label="Vues landing" value={formatNumber(data.current.page_views)} hint={deltaLabel(data.current.page_views, data.previous.page_views)} />
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <section className={`${panel} p-5 md:p-6 xl:col-span-8`}>
          <h2 className="text-base font-semibold text-foreground">Funnel</h2>
          <ol className="mt-5 space-y-4">
            {rates.map((step, index) => (
              <li key={funnelLabels[index]}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{funnelLabels[index]}</span>
                  <span className="text-foreground">{formatNumber(step.count)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[#071039]" style={{ width: `${Math.max(step.count > 0 ? 6 : 0, (step.count / maxFunnel) * 100)}%` }} />
                </div>
                {step.rate !== null ? (
                  <p className="mt-1 text-xs text-muted-foreground">{formatPercent(step.rate)} de l&apos;étape précédente</p>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            Temps de complétion médian {duration(data.completion.median_seconds)} · moyenne {duration(data.completion.average_seconds)}.
            Les sessions de plus de 24 heures sont exclues ({formatNumber(data.completion.sample)} sessions retenues).
          </p>
        </section>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          <article className={`${panel} p-5`}>
            <h2 className="text-sm font-semibold text-foreground">Distribution des scores</h2>
            <ul className="mt-4 space-y-3">
              {buckets.map((bucket) => (
                <li key={bucket.label}>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{bucket.label}</span><span>{formatNumber(bucket.count)}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[#2E5DE6]" style={{ width: `${(bucket.count / maxBucket) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{formatNumber(bucketTotal)} résultats</p>
          </article>
          <article className={`${panel} p-5`}>
            <h2 className="text-sm font-semibold text-foreground">Répartition des résultats</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {results.length === 0 ? <li className="text-muted-foreground">Aucun résultat sur la période.</li> : null}
              {results.map((row) => (
                <li key={row.label} className="flex justify-between gap-3">
                  <span className="truncate">{row.label}</span>
                  <span className="shrink-0 text-muted-foreground">{formatPercent(row.percent)}</span>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>

      <DataTable
        title="Pays"
        columns={["Pays", "Leads", "Completions", "Score moyen", "CTA"]}
        rows={data.countries.map((row) => [countryLabel(row.country), formatNumber(row.leads), formatNumber(row.completions), formatPercent(row.average_score), formatNumber(row.cta_clicks)])}
      />
      <ChannelTable title="Sources" rows={data.sources} />
      <ChannelTable title="Campagnes" rows={data.campaigns} />
      <ChannelTable title="Mediums" rows={data.mediums} />

      <section className={`overflow-x-auto ${panel}`}>
        <h2 className="px-5 pt-5 text-base font-semibold text-foreground">Scorecards</h2>
        {data.scorecards.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">Aucune scorecard sur la période.</p>
        ) : (
          <table className="mt-3 w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["Scorecard", "Vues", "Démarrages", "Leads", "Terminées", "Conversion", "Score moy.", "CTA"].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.scorecards.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-background">
                  <td className="px-4 py-4">
                    <Link className="font-medium text-primary hover:underline" href={`/dashboard/scorecards/${row.id}/analytics`}>{row.name}</Link>
                  </td>
                  <td className="px-4 py-4">{formatNumber(row.views)}</td>
                  <td className="px-4 py-4">{formatNumber(row.starts)}</td>
                  <td className="px-4 py-4">{formatNumber(row.leads)}</td>
                  <td className="px-4 py-4">{formatNumber(row.completed)}</td>
                  <td className="px-4 py-4">{formatPercent(conversionRate(row.cta_clicks, row.completed))}</td>
                  <td className="px-4 py-4">{formatPercent(row.average_score)}</td>
                  <td className="px-4 py-4">{formatNumber(row.cta_clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className={`${panel} p-5 text-sm`}>
          <h2 className="text-sm font-semibold text-foreground">CTA</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{formatNumber(data.current.cta_clicks)}</p>
          <p className="mt-1 text-muted-foreground">CTR {formatPercent(ctaClickRate(data.current.cta_clicks, data.current.viewed))}</p>
        </article>
        <List title="Par résultat" rows={data.cta_ranges.map((row) => `${row.label} · ${formatNumber(row.count)} · ${formatPercent(share(row.count, data.current.cta_clicks))}`)} />
        <List title="Destinations" rows={data.cta_destinations.map((row) => `${row.url} · ${formatNumber(row.count)}`)} />
      </section>
    </div>
  )
}

export function deltaLabel(current: number, previous: number) {
  const delta = periodDelta(current, previous)
  if (delta === null) return "Nouvelle activité sur la période"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${formatPercent(delta)} vs période précédente`
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function countryLabel(code: string) {
  if (code === "—") return code
  try { return countryName(code) } catch { return code }
}

function duration(seconds: number | null) {
  if (seconds === null) return "—"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

function ChannelTable({ title, rows }: { title: string; rows: Report["sources"] }) {
  return (
    <DataTable
      title={title}
      columns={["Nom", "Sessions", "Leads", "Completions", "Conversion", "CTA"]}
      rows={rows.map((row) => [row.name, formatNumber(row.sessions), formatNumber(row.leads), formatNumber(row.completions), formatPercent(row.sessions > 0 ? (row.cta_clicks / row.sessions) * 100 : 0), formatNumber(row.cta_clicks)])}
    />
  )
}

function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className={`overflow-x-auto ${panel}`}>
      <h2 className="px-5 pt-5 text-base font-semibold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">Aucune donnée sur la période.</p>
      ) : (
        <table className="mt-3 w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-xs font-medium">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("|")} className="border-b border-border last:border-0 hover:bg-background">
                {row.map((cell) => (
                  <td key={cell} className="px-4 py-4">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function List({ title, rows }: { title: string; rows: string[] }) {
  return (
    <article className={`${panel} p-5 text-sm`}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2 text-foreground">
        {rows.length === 0 ? <li className="text-muted-foreground">—</li> : rows.map((row) => <li key={row} className="break-all">{row}</li>)}
      </ul>
    </article>
  )
}
