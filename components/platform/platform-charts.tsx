"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
  chartTickSm,
} from "@/components/dashboard/chart-theme"
import { PremiumChartTooltip } from "@/components/dashboard/chart-tooltip"
import { PlatformEmpty } from "@/components/platform/page-chrome"
import { attachMixPercents, mixTotal, type MixSlice } from "@/lib/platform/mix"
import type {
  ActivityPoint,
  BillingPoint,
  EvolutionPoint,
  ExpirationBucket,
  HealthStat,
  SignupPoint,
} from "@/lib/platform/series-types"
import { MOTION_CARD_LIFT, MOTION_ENTER } from "@/lib/ui/motion"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

function ChartShell({
  title,
  description,
  children,
  className,
  compact,
  action,
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
  compact?: boolean
  action?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        WS_PANEL,
        MOTION_ENTER,
        MOTION_CARD_LIFT,
        compact ? "p-3.5" : "p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn("font-semibold tracking-tight text-[color:var(--pa-ink)]", compact ? "text-[14px]" : "text-[15px]")}>
            {title}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className={cn(compact ? "mt-2.5" : "mt-3")}>{children}</div>
    </section>
  )
}

/** Graphique principal — inscriptions + essais + actifs (créations). */
export function PlatformEvolutionChart({
  data,
  hero,
}: {
  data: EvolutionPoint[] | SignupPoint[]
  hero?: boolean
}) {
  const rows = data.map((row) => ({
    ...row,
    trials: "trials" in row ? row.trials : 0,
    actives: "actives" in row ? row.actives : 0,
  }))
  const has = rows.some((row) => row.organizations > 0 || row.cumulative > 0 || row.trials > 0 || row.actives > 0)
  return (
    <ChartShell
      title="Évolution de la plateforme"
      description="Inscriptions, essais démarrés et actifs créés — données réelles"
      compact={!hero}
      className="h-full"
    >
      {!has ? (
        <PlatformEmpty title="Données insuffisantes" description="Aucune création sur cette période." />
      ) : (
        <div className={hero ? "h-[260px]" : "h-[280px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="paEvoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="paTrialFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={chartTickSm} stroke={chartAxisStroke} />
              <YAxis allowDecimals={false} tick={chartTickSm} stroke={chartAxisStroke} width={28} />
              <Tooltip content={<PremiumChartTooltip />} />
              <Legend wrapperStyle={chartLegendStyle} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulé orgs"
                stroke="#2563EB"
                fill="url(#paEvoFill)"
                strokeWidth={2.25}
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="trials"
                name="Essais démarrés"
                stroke="#38BDF8"
                fill="url(#paTrialFill)"
                strokeWidth={1.75}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="actives"
                name="Actifs créés"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="organizations"
                name="Nouvelles orgs"
                stroke="#60A5FA"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartShell>
  )
}

export function PlatformSignupChart({ data, compact }: { data: SignupPoint[] | EvolutionPoint[]; compact?: boolean }) {
  return <PlatformEvolutionChart data={data} hero={!compact} />
}

export function PlatformBillingChart({
  data,
  mrrLabel,
  undetermined,
  compact,
}: {
  data: BillingPoint[]
  mrrLabel: string
  undetermined: number
  compact?: boolean
}) {
  const has = data.some((row) => row.created > 0 || row.canceled > 0)
  return (
    <ChartShell
      title="Événements d'abonnement"
      description={`MRR calculable : ${mrrLabel}${undetermined ? ` · ${undetermined} sans prix exclus` : ""}`}
      compact={compact}
    >
      {!has ? (
        <PlatformEmpty title="Données insuffisantes" description="Aucun événement d'abonnement sur la période." />
      ) : (
        <div className={compact ? "h-[250px]" : "h-[280px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={chartTickSm} stroke={chartAxisStroke} />
              <YAxis allowDecimals={false} tick={chartTickSm} stroke={chartAxisStroke} width={28} />
              <Tooltip content={<PremiumChartTooltip />} />
              <Legend wrapperStyle={chartLegendStyle} />
              <Bar dataKey="created" name="Créés / upgradés" fill="#2563EB" radius={[6, 6, 0, 0]} animationDuration={650} />
              <Bar dataKey="canceled" name="Annulés" fill="#F97316" radius={[6, 6, 0, 0]} animationDuration={650} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartShell>
  )
}

export function PlatformMixChart({ data, compact }: { data: MixSlice[]; compact?: boolean }) {
  const slices = attachMixPercents(data)
  const total = mixTotal(slices)
  const tooltipRows = slices.map((row) => ({
    name: row.label,
    value: row.value,
    percent: row.percent ?? 0,
    fill: row.tone,
  }))

  return (
    <ChartShell
      title="Répartition des abonnements"
      description={total ? `Stock actuel · ${total} abonnement${total > 1 ? "s" : ""} catégorisé${total > 1 ? "s" : ""}` : "Stock actuel par statut"}
      compact
      className="h-full"
    >
      {total === 0 ? (
        <PlatformEmpty title="Données insuffisantes" description="Aucun abonnement catégorisé." />
      ) : (
        <div className={cn("grid items-center gap-3", compact ? "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(140px,1.1fr)]" : "md:grid-cols-[1fr_160px]")}>
          <div className="relative mx-auto h-[190px] w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tooltipRows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="transparent"
                  animationDuration={750}
                >
                  {tooltipRows.map((row) => (
                    <Cell key={row.name} fill={row.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0]?.payload as { name: string; value: number; percent: number; fill: string }
                    return (
                      <div className="rounded-xl border border-border bg-popover px-3 py-2 text-sm shadow-[var(--shadow-panel)]">
                        <p className="flex items-center gap-2 font-semibold text-foreground">
                          <span className="size-2 rounded-full" style={{ background: row.fill }} aria-hidden />
                          {row.name}
                        </p>
                        <p className="mt-1 tabular-nums text-muted-foreground">
                          {row.value} · {row.percent} %
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Total</p>
              <p className="text-xl font-semibold tabular-nums text-[color:var(--pa-ink)]">{total}</p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm">
            {slices.map((row) => (
              <li key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="inline-flex min-w-0 items-center gap-2 text-[12px] text-muted-foreground">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: row.tone }} aria-hidden />
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="w-6 text-right text-[13px] font-semibold tabular-nums text-[color:var(--pa-ink)]">{row.value}</span>
                <span className="w-10 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
                  {row.percent ?? 0} %
                </span>
              </li>
            ))}
          </ul>
          {slices.length > 2 ? (
            <p className="col-span-full text-[11px] leading-relaxed text-muted-foreground">
              Les pourcentages portent sur les {total} abonnements affichés (y compris inactifs). Deux statuts seuls
              = 50 % / 50 %.
            </p>
          ) : null}
        </div>
      )}
    </ChartShell>
  )
}

export function PlatformFunnelChart({
  data,
  availability,
  compact,
}: {
  data: { id: string; label: string; value: number }[]
  availability: "ok" | "insufficient"
  compact?: boolean
}) {
  const max = Math.max(...data.map((row) => row.value), 1)
  return (
    <ChartShell
      title="Conversion des essais"
      description="Parcours réel — cohorte fermée pour le taux commercial"
      compact={compact}
    >
      {availability === "insufficient" ? (
        <PlatformEmpty
          title="Données insuffisantes"
          description="Aucun essai clos dans la fenêtre : le taux de conversion cohorte ne peut pas être calculé."
        />
      ) : null}
      <div className="mt-2 space-y-3">
        {data.map((row, index) => (
          <div key={row.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold tabular-nums">{row.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[color:var(--pa-bg)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#08143B] to-[#2563EB] motion-safe:transition-[width] motion-safe:duration-700"
                style={{ width: `${Math.max(8, (row.value / max) * 100)}%`, transitionDelay: `${index * 60}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartShell>
  )
}

export function PlatformActivityChart({ data, compact }: { data: ActivityPoint[]; compact?: boolean }) {
  const has = data.some((row) => row.scorecards > 0 || row.assessments > 0 || row.leads > 0)
  return (
    <ChartShell title="Activité scorecards" description="Créations, réponses et leads (données réelles)" compact={compact}>
      {!has ? (
        <PlatformEmpty title="Données insuffisantes" description="Aucune activité produit sur cette période." />
      ) : (
        <div className={compact ? "h-[250px]" : "h-[280px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={chartTickSm} stroke={chartAxisStroke} />
              <YAxis allowDecimals={false} tick={chartTickSm} stroke={chartAxisStroke} width={28} />
              <Tooltip content={<PremiumChartTooltip />} />
              <Legend wrapperStyle={chartLegendStyle} />
              <Line type="monotone" dataKey="scorecards" name="Scorecards" stroke={chartSeries.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="assessments" name="Réponses" stroke={chartSeries.secondary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="leads" name="Leads" stroke={chartSeries.tertiary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartShell>
  )
}

export function PlatformExpirationsTimeline({ data }: { data: ExpirationBucket[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0)
  return (
    <ChartShell title="Expirations à venir" description="Essais et périodes se terminant dans les 30 prochains jours" compact>
      {total === 0 ? (
        <PlatformEmpty title="Aucune échéance proche" description="Pas d'essai ni de période se terminant sous 30 jours." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((bucket) => (
            <article
              key={bucket.id}
              className={cn(
                "rounded-xl border border-border/80 bg-[color:var(--pa-bg)]/70 p-3",
                bucket.id === "today" && "border-rose-200 bg-rose-50/70",
                bucket.id === "d3" && "border-orange-200 bg-orange-50/60",
              )}
            >
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{bucket.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--pa-ink)]">{bucket.count}</p>
              <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                {bucket.organizations.length === 0 ? <li>—</li> : null}
                {bucket.organizations.map((org) => (
                  <li key={`${org.id}-${org.deadline}`} className="truncate">
                    <a className="font-medium text-[color:var(--pa-primary)] hover:underline" href={`/platform/organizations/${org.id}`}>
                      {org.name}
                    </a>
                    <span className="text-muted-foreground"> · {org.deadline}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </ChartShell>
  )
}

export function PlatformHealthCards({ data, embedded }: { data: HealthStat[]; embedded?: boolean }) {
  const grid = (
    <div className={cn("grid gap-2", embedded ? "grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4")}>
      {data.map((row) => (
        <article
          key={row.id}
          className={cn(
            "rounded-xl border px-2.5 py-2.5",
            row.tone === "ok" && "border-emerald-200 bg-emerald-50/70",
            row.tone === "warn" && "border-amber-200 bg-amber-50/70",
            row.tone === "bad" && "border-rose-200 bg-rose-50/70",
            row.tone === "neutral" && "border-border bg-white",
          )}
        >
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{row.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--pa-ink)]">{row.value}</p>
        </article>
      ))}
    </div>
  )
  if (embedded) return grid
  return (
    <ChartShell title="Santé de la plateforme" description="Compteurs réels jobs / e-mails / alertes / Stripe" compact>
      {grid}
    </ChartShell>
  )
}

export function PlatformActionNeeded({
  undetermined,
  pastDue,
  alertsOpen,
  jobsFailed,
}: {
  undetermined: number
  pastDue: number
  alertsOpen: number
  jobsFailed: number
}) {
  const items = [
    {
      label: "Abonnements sans prix",
      value: undetermined,
      href: "/platform/subscriptions",
      tone: undetermined > 0 ? "warn" : "ok",
    },
    {
      label: "Paiements en retard",
      value: pastDue,
      href: "/platform/payments",
      tone: pastDue > 0 ? "bad" : "ok",
    },
    {
      label: "Alertes ouvertes",
      value: alertsOpen,
      href: "/platform/alerts",
      tone: alertsOpen > 0 ? "warn" : "ok",
    },
    {
      label: "Jobs en échec",
      value: jobsFailed,
      href: "/platform/jobs",
      tone: jobsFailed > 0 ? "bad" : "ok",
    },
  ] as const

  return (
    <ChartShell title="Nécessite une action" description="Abonnements et ops à traiter" compact>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 motion-safe:transition-colors",
                item.tone === "ok" && "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50",
                item.tone === "warn" && "border-amber-200 bg-amber-50/60 hover:bg-amber-50",
                item.tone === "bad" && "border-rose-200 bg-rose-50/60 hover:bg-rose-50",
              )}
            >
              <span className="text-[13px] font-medium text-[color:var(--pa-ink)]">{item.label}</span>
              <span className="text-base font-semibold tabular-nums">{item.value}</span>
            </a>
          </li>
        ))}
      </ul>
    </ChartShell>
  )
}
