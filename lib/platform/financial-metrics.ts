/**
 * Pure financial metric helpers for Platform Admin.
 * Commercial KPIs use cohort conversion + period logo churn when data allows.
 * Legacy hybrid stock+flux formulas are retained for audit only — not as KPIs.
 */

import { PLANS, type BillingInterval, type PlanId } from "@/lib/billing/plans"
import { summarizeMrr, type Money } from "@/lib/platform/rules"

export type MetricAvailability = "ok" | "insufficient"

export type MetricFormula = {
  label: string
  numerator: number
  denominator: number
  numeratorLabel: string
  denominatorLabel: string
  windowDays: number
  rate: number | null
  availability: MetricAvailability
  note: string
}

export type SubscriptionMetricRow = {
  organization_id?: string | null
  plan: string
  status: string
  billing_interval?: string | null
  provider?: string | null
  provider_subscription_id?: string | null
  trial_end?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ResolvedPrice = {
  amountCents: number
  currency: string
  interval: BillingInterval
  source: "catalogue" | "stripe_price" | "stripe_subscription"
}

export type UndeterminedSubscription = {
  plan: string
  status: string
  organizationId: string | null
  provider: string | null
  providerSubscriptionId: string | null
  reason: string
}

export type MrrPartition = {
  calculable: Money[]
  undetermined: UndeterminedSubscription[]
  byCurrency: { currency: string; mrrCents: number; arrCents: number; source: "mixed" }[]
  includedActivePaid: number
  undeterminedActivePaid: number
  undeterminedPlans: string[]
  note: string
}

export type AuditEventRow = {
  action: string
  organization_id: string
  created_at: string
  metadata?: { plan?: string; status?: string } | null
}

const PAID_PLANS = new Set(["starter", "pro", "business", "enterprise"])

export function isActivePaid(row: Pick<SubscriptionMetricRow, "plan" | "status">) {
  return row.status === "active" && PAID_PLANS.has(row.plan)
}

/** Catalogue price when known (never invents null-priced plans). */
export function cataloguePrice(plan: string, interval: BillingInterval = "monthly"): ResolvedPrice | null {
  if (!(plan in PLANS)) return null
  const def = PLANS[plan as PlanId]
  const amount = interval === "yearly" ? def.yearlyPrice : def.monthlyPrice
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return null
  return {
    amountCents: Math.round(amount * 100),
    currency: "usd",
    interval,
    source: "catalogue",
  }
}

/**
 * Partition active paid subscriptions into calculable MRR vs undetermined.
 * Undetermined rows are listed and never fed into summarizeMrr as $0.
 */
export function partitionActivePaidMrr(
  rows: SubscriptionMetricRow[],
  resolve: (row: SubscriptionMetricRow) => ResolvedPrice | null = (row) =>
    cataloguePrice(row.plan, (row.billing_interval === "yearly" ? "yearly" : "monthly") as BillingInterval),
): MrrPartition {
  const calculable: Money[] = []
  const undetermined: UndeterminedSubscription[] = []
  const undeterminedPlans: string[] = []

  for (const row of rows) {
    if (!isActivePaid(row)) continue
    const price = resolve(row)
    if (!price) {
      undetermined.push({
        plan: row.plan,
        status: row.status,
        organizationId: row.organization_id ?? null,
        provider: row.provider ?? null,
        providerSubscriptionId: row.provider_subscription_id ?? null,
        reason: "Prix catalogue et Stripe indisponibles — non compté dans le MRR",
      })
      if (!undeterminedPlans.includes(row.plan)) undeterminedPlans.push(row.plan)
      continue
    }
    calculable.push({
      currency: price.currency,
      amountCents: price.amountCents,
      interval: price.interval,
      plan: row.plan,
      status: row.status,
    })
  }

  const summarized = summarizeMrr(calculable)
  // summarizeMrr may null a bucket if a null amount slipped in — feeder never sends null.
  const byCurrency = summarized
    .filter((row) => row.mrrCents !== null)
    .map((row) => ({
      currency: row.currency,
      mrrCents: row.mrrCents as number,
      arrCents: row.arrCents as number,
      source: "mixed" as const,
    }))

  return {
    calculable,
    undetermined,
    byCurrency,
    includedActivePaid: calculable.length,
    undeterminedActivePaid: undetermined.length,
    undeterminedPlans,
    note:
      "MRR calculable = somme des montants résolus (catalogue ou Stripe). " +
      "Les abonnements sans prix connu sont listés à part et ne sont jamais valorisés à 0 $.",
  }
}

/**
 * Trial → paid conversion on a closed cohort.
 * Cohort = trials whose trial_end is in [since, now] (outcome window closed).
 * Converted = still/now on an active paid plan (or canceled after paid is out of scope without history).
 */
export function computeCohortTrialConversion(
  rows: SubscriptionMetricRow[],
  windowDays: number,
  nowMs = Date.now(),
): MetricFormula {
  const sinceMs = nowMs - windowDays * 24 * 60 * 60 * 1000
  const closed = rows.filter((row) => {
    if (!row.trial_end) return false
    const end = Date.parse(row.trial_end)
    if (!Number.isFinite(end)) return false
    return end >= sinceMs && end <= nowMs
  })
  const converted = closed.filter((row) => isActivePaid(row)).length
  const denominator = closed.length
  const availability: MetricAvailability = denominator > 0 ? "ok" : "insufficient"
  return {
    label: "Conversion essai → payant (cohorte fermée)",
    numerator: converted,
    denominator,
    numeratorLabel: "essais clos devenus active payant",
    denominatorLabel: "essais avec trial_end dans la fenêtre et ≤ maintenant",
    windowDays,
    rate: availability === "ok" ? converted / denominator : null,
    availability,
    note:
      availability === "ok"
        ? "Cohorte fermée sur trial_end. Les essais encore ouverts sont exclus."
        : "Données insuffisantes : aucun essai clos dans la fenêtre (trial_end passé).",
  }
}

/**
 * Period logo churn from distinct organizations.
 * startPaid ≈ active paid still active that existed before the window
 *            + distinct orgs that canceled a paid plan during the window.
 * churned = distinct orgs with subscription.canceled (paid plan) in the window.
 */
export function computePeriodLogoChurn(
  rows: SubscriptionMetricRow[],
  cancelEvents: AuditEventRow[],
  windowDays: number,
  nowMs = Date.now(),
): MetricFormula {
  const sinceMs = nowMs - windowDays * 24 * 60 * 60 * 1000
  const sinceIso = new Date(sinceMs).toISOString()

  const canceledOrgIds = new Set<string>()
  for (const event of cancelEvents) {
    if (event.action !== "subscription.canceled") continue
    if (event.created_at < sinceIso) continue
    const plan = event.metadata?.plan
    if (plan && !PAID_PLANS.has(plan)) continue
    if (!plan) {
      // Without plan metadata we cannot prove it was a paid logo — skip for commercial KPI.
      continue
    }
    canceledOrgIds.add(event.organization_id)
  }

  const stillActiveBeforeWindow = rows.filter((row) => {
    if (!isActivePaid(row)) return false
    if (!row.created_at) return false
    return row.created_at < sinceIso
  })

  const startOrgIds = new Set<string>()
  for (const row of stillActiveBeforeWindow) {
    if (row.organization_id) startOrgIds.add(row.organization_id)
  }
  for (const id of canceledOrgIds) startOrgIds.add(id)

  const numerator = canceledOrgIds.size
  const denominator = startOrgIds.size
  const availability: MetricAvailability = denominator > 0 ? "ok" : "insufficient"

  return {
    label: "Churn logo (période)",
    numerator,
    denominator,
    numeratorLabel: "orgs distinctes canceled (plan payant) dans la fenêtre",
    denominatorLabel: "orgs payantes au début ≈ actives créées avant + canceled fenêtre",
    windowDays,
    rate: availability === "ok" ? numerator / denominator : null,
    availability,
    note:
      availability === "ok"
        ? "Churn logo sur orgs distinctes. Événements d'audit sans plan payant exclus."
        : "Données insuffisantes : aucune base d'abonnés payants reconstitutable pour la période.",
  }
}

/** Legacy hybrid stock+flux — audit documentation only, never a commercial KPI. */
export function computeLegacyHybridRates(
  rows: SubscriptionMetricRow[],
  paidEventCount: number,
  cancelEventCount: number,
  windowDays: number,
): { conversion: MetricFormula; churn: MetricFormula } {
  const trialing = rows.filter((row) => row.status === "trialing").length
  const activePaid = rows.filter((row) => isActivePaid(row)).length
  const trialBase = trialing + paidEventCount
  const activeBase = activePaid + cancelEventCount
  return {
    conversion: {
      label: "[Legacy] Conversion hybride stock+flux",
      numerator: paidEventCount,
      denominator: trialBase,
      numeratorLabel: "audit subscription.created|upgraded (événements, non distincts)",
      denominatorLabel: "stock trialing actuel + numérateur",
      windowDays,
      rate: trialBase > 0 ? paidEventCount / trialBase : null,
      availability: trialBase > 0 ? "ok" : "insufficient",
      note: "DEPRECATED — ne pas utiliser comme KPI. Conservé pour audit historique uniquement.",
    },
    churn: {
      label: "[Legacy] Désabonnement hybride stock+flux",
      numerator: cancelEventCount,
      denominator: activeBase,
      numeratorLabel: "audit subscription.canceled (événements, non distincts)",
      denominatorLabel: "stock activePaid actuel + numérateur",
      windowDays,
      rate: activeBase > 0 ? cancelEventCount / activeBase : null,
      availability: activeBase > 0 ? "ok" : "insufficient",
      note: "DEPRECATED — ne pas utiliser comme KPI. Conservé pour audit historique uniquement.",
    },
  }
}

export function formatMetricRate(formula: MetricFormula): string {
  if (formula.availability === "insufficient" || formula.rate === null) return "Données insuffisantes"
  return `${(formula.rate * 100).toFixed(1)} %`
}

export function formatCalculableMrr(
  byCurrency: MrrPartition["byCurrency"],
  undeterminedCount: number,
): string {
  if (byCurrency.length === 0) {
    return undeterminedCount > 0 ? "Données insuffisantes" : "—"
  }
  return byCurrency.map((row) => `${(row.mrrCents / 100).toFixed(2)} ${row.currency}`).join(" · ")
}
