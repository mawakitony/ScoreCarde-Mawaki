import { formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

const panel = "ws-panel"

export function ConversionSummary({
  ctaClicks,
  leads,
  conversions,
  values,
  byScorecard,
  byCampaign,
  compact = false,
}: {
  ctaClicks: number
  leads: number
  conversions: number
  values: { currency: string; total: number }[]
  byScorecard: { name: string; currency: string; total: number }[]
  byCampaign: { name: string; currency: string; total: number }[]
  compact?: boolean
}) {
  const rate = leads > 0 ? (conversions / leads) * 100 : null
  return (
    <section
      className={cn(
        panel,
        "ws-enter transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "motion-safe:hover:-translate-y-0.5 hover:border-[color:var(--brand-500)]/30",
        compact ? "p-4 md:p-5" : "p-5 md:p-6",
      )}
      style={{ animationDelay: "210ms" }}
    >
      <h2 className="text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]">Conversions réelles</h2>
      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground md:text-[13px]">
        Distinctes des clics CTA. Valeur commerciale uniquement si renseignée — devises non converties.
      </p>
      <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Metric label="Clics CTA" value={formatNumber(ctaClicks)} hint="Événements (peuvent se répéter)" />
        <Metric label="Leads convertis" value={formatNumber(conversions)} hint="Conversions CRM enregistrées" />
        <Metric
          label="Taux réel"
          value={rate === null ? "—" : formatPercent(rate)}
          hint={leads > 0 ? "Convertis ÷ leads capturés" : "Indisponible sans leads capturés"}
        />
        <Metric
          label="Valeur commerciale"
          value={
            values.length === 0
              ? "—"
              : values.map((row) => `${formatNumber(row.total)} ${row.currency}`).join(" · ")
          }
          hint={
            values.length === 0
              ? "Aucune valeur renseignée"
              : leads > 0
                ? values
                    .map((row) => `${formatNumber(Math.round(row.total / leads))} ${row.currency} / lead`)
                    .join(" · ")
                : "Total sur la période"
          }
        />
      </dl>
      <div className="mt-4 grid gap-4 border-t border-border pt-3 lg:grid-cols-2">
        <ValueList title="Par scorecard" rows={byScorecard} />
        <ValueList title="Par campagne" rows={byCampaign} />
      </div>
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-[18px] font-semibold tracking-tight tabular-nums text-foreground">{value}</dd>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function ValueList({ title, rows }: { title: string; rows: { name: string; currency: string; total: number }[] }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">Aucune valeur.</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5 text-[12px]">
          {rows.map((row) => (
            <li key={`${row.name}-${row.currency}`} className="flex justify-between gap-3">
              <span className="truncate text-foreground">{row.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatNumber(row.total)} {row.currency}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
