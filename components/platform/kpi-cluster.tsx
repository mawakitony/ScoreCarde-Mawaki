import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, CircleDollarSign } from "lucide-react"
import { enterDelayMs, MOTION_CARD_LIFT, MOTION_ENTER } from "@/lib/ui/motion"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export type ClusterMetric = {
  label: string
  value: string
  href?: string
  tone?: "default" | "good" | "warn" | "bad"
  hint?: string
  icon?: LucideIcon
}

export function FinancePremiumCard({
  mrrDisplay,
  mrrIncomplete,
  undetermined,
  pastDue,
  conversion,
  index = 0,
}: {
  /** Affichage principal — jamais « 0 $ » inventé. */
  mrrDisplay: string
  mrrIncomplete: boolean
  undetermined: number
  pastDue: number
  conversion: string
  index?: number
}) {
  return (
    <article
      className={cn(
        MOTION_ENTER,
        "relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl p-4 text-white",
        "bg-[linear-gradient(145deg,#08143B_0%,#0B1F5C_48%,#123A8C_100%)]",
        "shadow-[0_12px_40px_-20px_rgba(8,20,59,0.65)]",
        "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200",
        "motion-safe:hover:-translate-y-0.5",
      )}
      style={{ animationDelay: `${enterDelayMs(index)}ms` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(37,99,235,0.55), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(16,185,129,0.18), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-white/55 uppercase">Revenus récurrents</p>
          <p className="mt-2 text-[11px] font-medium text-sky-200/90">MRR calculable</p>
          <p className="mt-1 text-[28px] leading-none font-semibold tracking-tight tabular-nums">{mrrDisplay}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <CircleDollarSign className="size-4 text-sky-200" strokeWidth={2} aria-hidden />
        </span>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        {mrrIncomplete ? (
          <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-200 ring-1 ring-amber-300/25">
            Données incomplètes
          </span>
        ) : (
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-200 ring-1 ring-emerald-300/20">
            Fiabilité OK
          </span>
        )}
      </div>

      <dl className="relative mt-auto grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div>
          <dt className="text-[10px] text-white/50">Sans prix connu</dt>
          <dd className={cn("mt-0.5 text-sm font-semibold tabular-nums", undetermined > 0 ? "text-amber-200" : "text-white")}>
            {undetermined}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-white/50">Paiements en retard</dt>
          <dd className={cn("mt-0.5 text-sm font-semibold tabular-nums", pastDue > 0 ? "text-rose-200" : "text-white")}>
            {pastDue}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[10px] text-white/50">Conversion cohorte</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-white/90">{conversion}</dd>
        </div>
      </dl>

      <Link
        href="/platform/subscriptions"
        className="relative mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        Voir les abonnements
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </article>
  )
}

/** Dense mini KPI — cible ~85–105 px. Server Component (icons OK from page). */
export function MiniKpi({
  label,
  value,
  href,
  tone = "default",
  hint,
  icon: Icon,
  index = 0,
}: ClusterMetric & { index?: number }) {
  const body = (
    <div
      className={cn(WS_PANEL, MOTION_ENTER, MOTION_CARD_LIFT, "flex h-[96px] flex-col justify-between p-3.5")}
      style={{ animationDelay: `${enterDelayMs(index + 1)}ms` }}
      title={hint}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">{label}</p>
        {Icon ? (
          <span className="flex size-6 items-center justify-center rounded-lg bg-[color:var(--pa-primary)]/10 text-[color:var(--pa-primary)]">
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "text-[22px] leading-none font-semibold tracking-tight tabular-nums",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600",
          tone === "bad" && "text-rose-600",
          tone === "default" && "text-[color:var(--pa-ink)]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="truncate text-[10px] text-muted-foreground">{hint}</p> : <span className="h-3" />}
    </div>
  )
  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none"
      >
        {body}
      </Link>
    )
  }
  return body
}

/** @deprecated Prefer FinancePremiumCard / MiniKpi — kept for other pages. */
export function KpiCluster({
  title,
  icon: Icon,
  primary,
  metrics,
  accent = "blue",
  className,
  index = 0,
}: {
  title: string
  icon: LucideIcon
  primary: ClusterMetric
  metrics: ClusterMetric[]
  accent?: "blue" | "navy" | "emerald" | "amber"
  className?: string
  index?: number
}) {
  const accentClass =
    accent === "emerald"
      ? "bg-emerald-500/12 text-emerald-700"
      : accent === "amber"
        ? "bg-amber-500/15 text-amber-800"
        : accent === "navy"
          ? "bg-[color:var(--pa-navy)] text-white"
          : "bg-[color:var(--pa-primary)]/12 text-[color:var(--pa-primary)]"

  return (
    <article
      className={cn(
        WS_PANEL,
        MOTION_ENTER,
        MOTION_CARD_LIFT,
        "flex min-h-[108px] flex-col justify-between gap-3 p-3.5",
        className,
      )}
      style={{ animationDelay: `${enterDelayMs(index)}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{title}</p>
          <p className="mt-1 text-[26px] leading-none font-semibold tracking-tight text-[color:var(--pa-ink)] tabular-nums">
            {primary.href ? (
              <Link href={primary.href} className="hover:text-[color:var(--pa-primary)]">
                {primary.value}
              </Link>
            ) : (
              primary.value
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{primary.label}</p>
        </div>
        <span className={cn("flex size-8 items-center justify-center rounded-xl", accentClass)}>
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-2.5">
        {metrics.map((metric) => (
          <MetricChip key={metric.label} metric={metric} dense />
        ))}
      </div>
    </article>
  )
}

/** @deprecated Prefer MiniKpi */
export function MiniMetric(props: ClusterMetric) {
  return <MiniKpi {...props} />
}

export function MetricChip({ metric, dense }: { metric: Omit<ClusterMetric, "icon">; dense?: boolean }) {
  const content = (
    <div
      className={cn(
        dense ? "min-w-0" : "rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/60 px-3 py-2.5",
        !dense && MOTION_CARD_LIFT,
      )}
    >
      <p className="truncate text-[10px] font-medium text-muted-foreground">{metric.label}</p>
      <p
        className={cn(
          "mt-0.5 font-semibold tabular-nums",
          dense ? "text-[14px]" : "text-[16px]",
          metric.tone === "good" && "text-emerald-700",
          metric.tone === "warn" && "text-amber-700",
          metric.tone === "bad" && "text-rose-700",
          (!metric.tone || metric.tone === "default") && "text-[color:var(--pa-ink)]",
        )}
      >
        {metric.value}
      </p>
    </div>
  )
  if (metric.href) {
    return (
      <Link
        href={metric.href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/30"
      >
        {content}
      </Link>
    )
  }
  return content
}
