import "server-only"

import { stripePriceId, type BillingInterval, type PlanId, PLAN_IDS } from "@/lib/billing/plans"
import { stripeClient } from "@/lib/billing/stripe"
import {
  cataloguePrice,
  computeCohortTrialConversion,
  computeLegacyHybridRates,
  computePeriodLogoChurn,
  partitionActivePaidMrr,
  type AuditEventRow,
  type MetricFormula,
  type MrrPartition,
  type ResolvedPrice,
  type SubscriptionMetricRow,
  type UndeterminedSubscription,
} from "@/lib/platform/financial-metrics"
import { buildSubscriptionMix, type MixSlice } from "@/lib/platform/mix"
import {
  loadActivitySeries,
  loadBillingSeries,
  loadEvolutionSeries,
  loadExpirationsTimeline,
  loadHealthStats,
} from "@/lib/platform/overview-series"
import type {
  ActivityPoint,
  BillingPoint,
  EvolutionPoint,
  ExpirationBucket,
  HealthStat,
} from "@/lib/platform/series-types"
import { createAdminClient } from "@/lib/supabase/admin"

export type { MetricFormula, MrrPartition, UndeterminedSubscription }

export type PlatformMetrics = {
  organizations: number
  users: number
  scorecards: number
  assessments: number
  leads: number
  trialing: number
  activePaid: number
  pastDue: number
  canceled: number
  suspended: number
  expiredRestrictedHint: number
  windowDays: number
  /** Calculable MRR only — never includes unknown-priced rows as $0. */
  mrr: { currency: string; mrrCents: number; arrCents: number; source: "mixed" }[]
  mrrMeta: {
    includedActivePaid: number
    undeterminedActivePaid: number
    undeterminedPlans: string[]
    undetermined: UndeterminedSubscription[]
    stripePricesVerified: { plan: string; interval: string; amountCents: number; currency: string; priceId: string }[]
    note: string
  }
  /** Commercial KPIs — null rate when availability is insufficient. */
  trialToPaidRate: number | null
  churnRate: number | null
  trialToPaidFormula: MetricFormula
  churnFormula: MetricFormula
  /** Audit-only legacy hybrids — not commercial KPIs. */
  legacyHybrid: { conversion: MetricFormula; churn: MetricFormula }
  activitySeries: ActivityPoint[]
  /** @deprecated Prefer evolutionSeries — kept for callers expecting signup-only shape. */
  signupSeries: EvolutionPoint[]
  evolutionSeries: EvolutionPoint[]
  billingSeries: BillingPoint[]
  subscriptionMix: MixSlice[]
  conversionFunnel: { id: string; label: string; value: number }[]
  expirations: ExpirationBucket[]
  healthStats: HealthStat[]
}

/**
 * Real aggregates for the platform overview.
 * MRR splits calculable vs undetermined; commercial conversion/churn use cohort/period formulas.
 */
export async function loadPlatformMetrics(rangeDays = 30): Promise<PlatformMetrics | null> {
  try {
    const admin = createAdminClient()
    const windowDays = Math.min(Math.max(rangeDays, 1), 365)
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

    const [
      organizations,
      users,
      scorecards,
      assessments,
      leads,
      subscriptions,
      suspended,
      paidEvents,
      cancelEvents,
      cancelEventRows,
    ] = await Promise.all([
      admin.from("organizations").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("scorecards").select("id", { count: "exact", head: true }),
      admin.from("assessment_sessions").select("id", { count: "exact", head: true }),
      admin.from("leads").select("id", { count: "exact", head: true }),
      admin
        .from("subscriptions")
        .select(
          "organization_id, plan, status, billing_interval, provider, provider_subscription_id, trial_end, created_at, updated_at",
        ),
      admin.from("organization_suspensions").select("id", { count: "exact", head: true }).is("lifted_at", null),
      admin
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .in("action", ["subscription.created", "subscription.upgraded"])
        .gte("created_at", since),
      admin
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("action", "subscription.canceled")
        .gte("created_at", since),
      admin
        .from("audit_logs")
        .select("action, organization_id, created_at, metadata")
        .eq("action", "subscription.canceled")
        .gte("created_at", since)
        .limit(5000),
    ])

    const rows = (subscriptions.data ?? []) as SubscriptionMetricRow[]
    const trialing = rows.filter((row) => row.status === "trialing").length
    const activePaid = rows.filter((row) => row.status === "active" && row.plan !== "free" && row.plan !== "internal").length
    const pastDue = rows.filter((row) => row.status === "past_due").length
    const canceled = rows.filter((row) => row.status === "canceled").length
    const expiredRestrictedHint = rows.filter(
      (row) => row.status === "trialing" && row.trial_end && new Date(row.trial_end).getTime() <= Date.now(),
    ).length

    const { priceMap, stripePricesVerified } = await loadStripePriceMap()
    const stripeSubCache = await loadStripeSubscriptionPrices(rows)

    const partition = partitionActivePaidMrr(rows, (row) =>
      resolveSubscriptionPrice(row, priceMap, stripeSubCache),
    )

    const trialToPaidFormula = computeCohortTrialConversion(rows, windowDays)
    const churnFormula = computePeriodLogoChurn(
      rows,
      (cancelEventRows.data ?? []) as AuditEventRow[],
      windowDays,
    )
    const legacyHybrid = computeLegacyHybridRates(
      rows,
      paidEvents.count ?? 0,
      cancelEvents.count ?? 0,
      windowDays,
    )

    const orgTotal = organizations.count ?? 0
    const [activitySeries, evolutionSeries, billingSeries, expirations, healthStats] = await Promise.all([
      loadActivitySeries(windowDays),
      loadEvolutionSeries(windowDays, orgTotal),
      loadBillingSeries(windowDays),
      loadExpirationsTimeline(),
      loadHealthStats(),
    ])

    const subscriptionMix = buildSubscriptionMix({
      trialing,
      activePaid,
      pastDue,
      canceled,
      suspended: suspended.count ?? 0,
      expired: expiredRestrictedHint,
    })

    const conversionFunnel = [
      { id: "orgs", label: "Organisations", value: orgTotal },
      { id: "trials", label: "En essai (stock)", value: trialing },
      {
        id: "closed",
        label: "Essais clos (fenêtre)",
        value: trialToPaidFormula.denominator,
      },
      {
        id: "converted",
        label: "Convertis payants",
        value: trialToPaidFormula.numerator,
      },
    ]

    return {
      organizations: orgTotal,
      users: users.count ?? 0,
      scorecards: scorecards.count ?? 0,
      assessments: assessments.count ?? 0,
      leads: leads.count ?? 0,
      trialing,
      activePaid,
      pastDue,
      canceled,
      suspended: suspended.count ?? 0,
      expiredRestrictedHint,
      windowDays,
      mrr: partition.byCurrency,
      mrrMeta: {
        includedActivePaid: partition.includedActivePaid,
        undeterminedActivePaid: partition.undeterminedActivePaid,
        undeterminedPlans: partition.undeterminedPlans,
        undetermined: partition.undetermined,
        stripePricesVerified,
        note: partition.note,
      },
      trialToPaidRate: trialToPaidFormula.rate,
      churnRate: churnFormula.rate,
      trialToPaidFormula,
      churnFormula,
      legacyHybrid,
      activitySeries,
      signupSeries: evolutionSeries,
      evolutionSeries,
      billingSeries,
      subscriptionMix,
      conversionFunnel,
      expirations,
      healthStats,
    }
  } catch {
    return null
  }
}

type StripePriceMap = Map<string, ResolvedPrice>

async function loadStripePriceMap(): Promise<{
  priceMap: StripePriceMap
  stripePricesVerified: PlatformMetrics["mrrMeta"]["stripePricesVerified"]
}> {
  const priceMap: StripePriceMap = new Map()
  const stripePricesVerified: PlatformMetrics["mrrMeta"]["stripePricesVerified"] = []
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
  if (!secret.startsWith("sk_test") && !secret.startsWith("sk_live")) {
    return { priceMap, stripePricesVerified }
  }

  try {
    const stripe = stripeClient()
    if (!stripe) return { priceMap, stripePricesVerified }
    for (const plan of PLAN_IDS) {
      for (const interval of ["monthly", "yearly"] as BillingInterval[]) {
        const priceId = stripePriceId(plan as PlanId, interval)
        if (!priceId) continue
        try {
          const price = await stripe.prices.retrieve(priceId)
          if (price.unit_amount === null || price.unit_amount === undefined) continue
          const resolved: ResolvedPrice = {
            amountCents: price.unit_amount,
            currency: (price.currency || "usd").toLowerCase(),
            interval: price.recurring?.interval === "year" ? "yearly" : "monthly",
            source: "stripe_price",
          }
          priceMap.set(`${plan}:${interval}`, resolved)
          priceMap.set(priceId, resolved)
          stripePricesVerified.push({
            plan,
            interval: resolved.interval,
            amountCents: resolved.amountCents,
            currency: resolved.currency.toUpperCase(),
            priceId,
          })
        } catch {
          // Price id configured but missing in Stripe — leave undetermined for that plan.
        }
      }
    }
  } catch {
    // Stripe unavailable — fall back to catalogue only.
  }
  return { priceMap, stripePricesVerified }
}

function resolveSubscriptionPrice(
  row: SubscriptionMetricRow,
  priceMap: StripePriceMap,
  stripeSubCache: Map<string, ResolvedPrice | null>,
): ResolvedPrice | null {
  const interval = (row.billing_interval === "yearly" ? "yearly" : "monthly") as BillingInterval
  const fromCatalogue = cataloguePrice(row.plan, interval)
  if (fromCatalogue) return fromCatalogue

  const fromEnvPrice = priceMap.get(`${row.plan}:${interval}`)
  if (fromEnvPrice) return { ...fromEnvPrice, source: "stripe_price" }

  const subId = row.provider_subscription_id
  if (subId && stripeSubCache.has(subId)) return stripeSubCache.get(subId) ?? null
  return null
}

/** Read-only batch lookup of Stripe subscription amounts (never mutates). */
async function loadStripeSubscriptionPrices(rows: SubscriptionMetricRow[]) {
  const cache = new Map<string, ResolvedPrice | null>()
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? ""
  if (!secret.startsWith("sk_test") && !secret.startsWith("sk_live")) return cache

  const ids = [
    ...new Set(
      rows
        .filter((row) => row.status === "active" && row.provider_subscription_id && row.plan !== "free" && row.plan !== "internal")
        .map((row) => row.provider_subscription_id as string),
    ),
  ]
  if (!ids.length) return cache

  try {
    const stripe = stripeClient()
    if (!stripe) return cache
    await Promise.all(
      ids.map(async (id) => {
        try {
          const sub = await stripe.subscriptions.retrieve(id)
          const price = sub.items.data[0]?.price
          if (!price || price.unit_amount === null || price.unit_amount === undefined) {
            cache.set(id, null)
            return
          }
          cache.set(id, {
            amountCents: price.unit_amount,
            currency: (price.currency || "usd").toLowerCase(),
            interval: price.recurring?.interval === "year" ? "yearly" : "monthly",
            source: "stripe_subscription",
          })
        } catch {
          cache.set(id, null)
        }
      }),
    )
  } catch {
    // Stripe unavailable — leave cache empty.
  }
  return cache
}
