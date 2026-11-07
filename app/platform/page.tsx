import Link from "next/link"
import { Suspense } from "react"
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  ShieldAlert,
  Timer,
  UserRound,
  Zap,
} from "lucide-react"
import { AllMetricsPanel } from "@/components/platform/all-metrics-panel"
import { FinancePremiumCard, MiniKpi } from "@/components/platform/kpi-cluster"
import {
  PlatformActionNeeded,
  PlatformActivityChart,
  PlatformBillingChart,
  PlatformEvolutionChart,
  PlatformExpirationsTimeline,
  PlatformFunnelChart,
  PlatformHealthCards,
  PlatformMixChart,
} from "@/components/platform/platform-charts"
import { PlatformPageHeader, PlatformPanel } from "@/components/platform/page-chrome"
import { PlatformRangeFilter } from "@/components/platform/range-filter"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { loadOverview } from "@/lib/platform/data"
import { formatCalculableMrr, formatMetricRate, type MetricFormula } from "@/lib/platform/financial-metrics"
import { loadPlatformMetrics } from "@/lib/platform/metrics"
import { parsePlatformRange } from "@/lib/platform/range"
import { redirectIfSupportScoped } from "@/lib/platform/support-scope"
import { WS_PANEL } from "@/lib/ui/workspace-surface"

export default async function PlatformHomePage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  await redirectIfSupportScoped(actor.userId)
  const { range } = await searchParams
  const { id: rangeId, days } = parsePlatformRange(range)
  const overview = await loadOverview()
  const metrics = await loadPlatformMetrics(days)
  if (!overview && !metrics) {
    return <p className="text-sm text-muted-foreground">La migration platform admin n&apos;est pas encore appliquée.</p>
  }

  const undetermined = metrics?.mrrMeta.undeterminedActivePaid ?? 0
  const mrrByCurrency = metrics?.mrr ?? []
  const mrrIncomplete = mrrByCurrency.length === 0 && undetermined > 0
  const mrrDisplay =
    mrrByCurrency.length > 0
      ? formatCalculableMrr(mrrByCurrency, undetermined)
      : undetermined > 0
        ? "— USD"
        : "—"
  const mrrLabel = formatCalculableMrr(mrrByCurrency, undetermined)

  const expirationsTotal = (metrics?.expirations ?? []).reduce((sum, row) => sum + row.count, 0)
  const expiringSoon =
    ((metrics?.expirations ?? []).find((row) => row.id === "today")?.count ?? 0) +
    ((metrics?.expirations ?? []).find((row) => row.id === "d3")?.count ?? 0)
  const alertsOpen = Number(metrics?.healthStats?.find((row) => row.id === "alerts")?.value ?? 0)
  const jobsFailed = Number(metrics?.healthStats?.find((row) => row.id === "jobs")?.value ?? 0)
  const emailsDead = Number(metrics?.healthStats?.find((row) => row.id === "email")?.value ?? 0)
  const orgs = metrics?.organizations ?? overview?.organizations ?? 0
  const trialing = metrics?.trialing ?? overview?.trialsActive ?? 0
  const activePaid = metrics?.activePaid ?? 0
  const conversion = formatMetricRate(metrics?.trialToPaidFormula ?? insufficient("Conversion"))
  const churn = formatMetricRate(metrics?.churnFormula ?? insufficient("Churn"))
  const periodLabel = rangeId === "1" ? "aujourd'hui" : `${days} j`

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Vue d'ensemble"
        description={`Cockpit plateforme · période ${periodLabel} · stock actuel vs flux filtrés.`}
        crumbs={[{ label: "Vue d'ensemble" }]}
        actions={
          <Suspense fallback={<div className="h-9 w-72 animate-pulse rounded-2xl bg-white" />}>
            <PlatformRangeFilter />
          </Suspense>
        }
      />

      {/* Cockpit : finance 30 % · mini KPI 30 % · évolution 40 % */}
      <section className="grid gap-3 xl:grid-cols-10 xl:items-stretch">
        <div className="xl:col-span-3">
          <FinancePremiumCard
            mrrDisplay={mrrDisplay}
            mrrIncomplete={mrrIncomplete}
            undetermined={undetermined}
            pastDue={metrics?.pastDue ?? 0}
            conversion={conversion}
            index={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 content-start xl:col-span-3">
          <MiniKpi
            index={0}
            label="Entreprises"
            value={String(orgs)}
            href="/platform/organizations"
            icon={Building2}
            hint="Stock actuel"
          />
          <MiniKpi
            index={1}
            label="Actifs payants"
            value={String(activePaid)}
            href="/platform/subscriptions"
            tone="good"
            icon={Zap}
            hint="Hors free / internal"
          />
          <MiniKpi
            index={2}
            label="Essais"
            value={String(trialing)}
            tone={trialing > 0 ? "warn" : "default"}
            icon={Timer}
            hint="Stock actuel"
          />
          <MiniKpi
            index={3}
            label="Utilisateurs"
            value={String(metrics?.users ?? 0)}
            href="/platform/users"
            icon={UserRound}
            hint="Stock actuel"
          />
          <MiniKpi
            index={4}
            label="Expirations"
            value={String(expirationsTotal)}
            href="/platform/expirations"
            tone={expiringSoon > 0 ? "bad" : "default"}
            icon={ClipboardList}
            hint="≤ 30 jours"
          />
          <MiniKpi
            index={5}
            label="Alertes"
            value={String(alertsOpen)}
            href="/platform/alerts"
            tone={alertsOpen > 0 ? "warn" : "good"}
            icon={ShieldAlert}
            hint="Ouvertes"
          />
        </div>

        <div className="xl:col-span-4">
          <PlatformEvolutionChart data={metrics?.evolutionSeries ?? []} hero />
        </div>
      </section>

      <AllMetricsPanel
        metrics={[
          { label: "Scorecards", value: String(metrics?.scorecards ?? 0), hint: "Stock" },
          { label: "Leads", value: String(metrics?.leads ?? 0), hint: "Stock" },
          { label: "Réponses", value: String(metrics?.assessments ?? 0), hint: "Stock" },
          {
            label: "Sans prix connu",
            value: String(undetermined),
            href: "/platform/subscriptions",
            tone: undetermined > 0 ? "warn" : "good",
          },
          {
            label: "Paiements en retard",
            value: String(metrics?.pastDue ?? 0),
            href: "/platform/payments",
            tone: (metrics?.pastDue ?? 0) > 0 ? "bad" : "good",
          },
          {
            label: "Jobs en échec",
            value: String(jobsFailed),
            href: "/platform/jobs",
            tone: jobsFailed > 0 ? "bad" : "good",
          },
          {
            label: "E-mails dead",
            value: String(emailsDead),
            tone: emailsDead > 0 ? "bad" : "good",
          },
          { label: "Conversion cohorte", value: conversion },
          { label: "Churn période", value: churn },
          {
            label: "Suspendus",
            value: String(metrics?.suspended ?? 0),
            tone: (metrics?.suspended ?? 0) > 0 ? "warn" : "default",
          },
          { label: "Annulés", value: String(metrics?.canceled ?? 0) },
          {
            label: "Expirés / restreints",
            value: String(metrics?.expiredRestrictedHint ?? 0),
            tone: (metrics?.expiredRestrictedHint ?? 0) > 0 ? "warn" : "default",
          },
        ]}
      />

      {/* Analytics : évolution/billing 65 % · donut 35 % */}
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PlatformBillingChart
            data={metrics?.billingSeries ?? []}
            mrrLabel={mrrLabel}
            undetermined={undetermined}
            compact
          />
        </div>
        <div className="xl:col-span-4">
          <PlatformMixChart data={metrics?.subscriptionMix ?? []} compact />
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <PlatformActivityChart data={metrics?.activitySeries ?? []} compact />
        <PlatformFunnelChart
          data={metrics?.conversionFunnel ?? []}
          availability={metrics?.trialToPaidFormula.availability ?? "insufficient"}
          compact
        />
      </section>

      {/* Opérations */}
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <PlatformExpirationsTimeline data={metrics?.expirations ?? []} />
        </div>
        <div className="flex flex-col gap-3 xl:col-span-5">
          <PlatformActionNeeded
            undetermined={undetermined}
            pastDue={metrics?.pastDue ?? 0}
            alertsOpen={alertsOpen}
            jobsFailed={jobsFailed}
          />
          <div className={`${WS_PANEL} p-3.5`}>
            <h3 className="text-[14px] font-semibold text-[color:var(--pa-ink)]">Santé plateforme</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Jobs, e-mails, alertes, Stripe</p>
            <div className="mt-2.5">
              <PlatformHealthCards data={metrics?.healthStats ?? []} embedded />
            </div>
          </div>
        </div>
      </section>

      <PlatformPanel
        title="Détail des formules"
        description="Indicateurs commerciaux validés — formules legacy en audit uniquement."
        className="!p-4"
      >
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <FormulaCard
            title="MRR calculable"
            value={mrrLabel}
            lines={[
              `Inclus : ${metrics?.mrrMeta.includedActivePaid ?? 0}`,
              `Non déterminable : ${undetermined}`,
            ]}
          />
          <FormulaCard
            title="Conversion cohorte"
            value={conversion}
            lines={formulaLines(metrics?.trialToPaidFormula, days)}
          />
          <FormulaCard
            title="Churn période"
            value={churn}
            lines={formulaLines(metrics?.churnFormula, days)}
          />
          <FormulaCard
            title="Legacy (non KPI)"
            value={`${legacyPct(metrics?.legacyHybrid.conversion)} / ${legacyPct(metrics?.legacyHybrid.churn)}`}
            lines={["Hybride stock+flux — documentation seulement."]}
          />
        </div>
      </PlatformPanel>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <AlertTriangle className="size-3.5" aria-hidden />
        <Link className="font-semibold text-[color:var(--pa-primary)] hover:underline" href="/platform/alerts">
          Alertes
        </Link>
        <Link className="font-semibold text-[color:var(--pa-primary)] hover:underline" href="/platform/expirations">
          Expirations
        </Link>
        <Link className="font-semibold text-[color:var(--pa-primary)] hover:underline" href="/platform/organizations">
          Entreprises
        </Link>
        <Link className="font-semibold text-[color:var(--pa-primary)] hover:underline" href="/platform/health">
          Santé
        </Link>
      </p>
    </div>
  )
}

function FormulaCard({ title, value, lines }: { title: string; value: string; lines: string[] }) {
  return (
    <article className="rounded-xl border border-border/80 bg-[color:var(--pa-bg)]/50 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
        <p className="text-base font-semibold tabular-nums text-[color:var(--pa-ink)]">{value}</p>
      </div>
      <ul className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground">
        {lines.filter(Boolean).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  )
}

function formulaLines(formula: MetricFormula | undefined, days: number) {
  if (!formula) return []
  return [
    `${formula.numerator} / ${formula.denominator}`,
    `${formula.windowDays || days} j · ${formula.availability === "ok" ? "ok" : "insuffisant"}`,
  ]
}

function legacyPct(formula: MetricFormula | undefined) {
  if (!formula || formula.rate === null) return "—"
  return `${(formula.rate * 100).toFixed(1)} %`
}

function insufficient(label: string): MetricFormula {
  return {
    label,
    numerator: 0,
    denominator: 0,
    numeratorLabel: "",
    denominatorLabel: "",
    windowDays: 0,
    rate: null,
    availability: "insufficient",
    note: "Données insuffisantes",
  }
}
