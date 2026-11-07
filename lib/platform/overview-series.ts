import "server-only"

import { chartBucketMode } from "@/lib/platform/range"
import type {
  ActivityPoint,
  BillingPoint,
  EvolutionPoint,
  ExpirationBucket,
  HealthStat,
  SignupPoint,
} from "@/lib/platform/series-types"
import { createAdminClient } from "@/lib/supabase/admin"

export type { MixSlice } from "@/lib/platform/mix"
export { attachMixPercents, buildSubscriptionMix, mixTotal } from "@/lib/platform/mix"
export type {
  ActivityPoint,
  BillingPoint,
  EvolutionPoint,
  ExpirationBucket,
  HealthStat,
  SignupPoint,
} from "@/lib/platform/series-types"

export async function loadSignupSeries(rangeDays: number, orgTotal: number): Promise<SignupPoint[]> {
  const mode = chartBucketMode(rangeDays)
  const admin = createAdminClient()
  const since = new Date(Date.now() - rangeDays * 864e5).toISOString()
  const { data } = await admin.from("organizations").select("created_at").gte("created_at", since).limit(8000)
  const bucket = emptyBuckets(rangeDays, mode, () => ({ organizations: 0 }))
  for (const row of data ?? []) {
    const key = bucketKey(row.created_at, mode)
    const current = bucket.get(key)
    if (current) current.organizations += 1
  }
  const beforeCount = Math.max(0, orgTotal - (data?.length ?? 0))
  let running = beforeCount
  return [...bucket.entries()].map(([key, value]) => {
    running += value.organizations
    return {
      key,
      label: formatLabel(key, mode),
      organizations: value.organizations,
      cumulative: running,
    }
  })
}

export async function loadBillingSeries(rangeDays: number): Promise<BillingPoint[]> {
  const mode = chartBucketMode(rangeDays)
  const admin = createAdminClient()
  const since = new Date(Date.now() - rangeDays * 864e5).toISOString()
  const [{ data: created }, { data: canceled }] = await Promise.all([
    admin
      .from("audit_logs")
      .select("created_at")
      .in("action", ["subscription.created", "subscription.upgraded"])
      .gte("created_at", since)
      .limit(8000),
    admin.from("audit_logs").select("created_at").eq("action", "subscription.canceled").gte("created_at", since).limit(8000),
  ])
  const bucket = emptyBuckets(rangeDays, mode, () => ({ created: 0, canceled: 0 }))
  for (const row of created ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (current) current.created += 1
  }
  for (const row of canceled ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (current) current.canceled += 1
  }
  return [...bucket.entries()].map(([key, value]) => ({
    key,
    label: formatLabel(key, mode),
    created: value.created,
    canceled: value.canceled,
    net: value.created - value.canceled,
  }))
}

export async function loadActivitySeries(rangeDays: number): Promise<ActivityPoint[]> {
  const mode = chartBucketMode(rangeDays)
  const admin = createAdminClient()
  const since = new Date(Date.now() - rangeDays * 864e5).toISOString()
  const [scorecards, assessments, leads] = await Promise.all([
    admin.from("scorecards").select("created_at").gte("created_at", since).limit(8000),
    admin.from("assessment_sessions").select("created_at").gte("created_at", since).limit(8000),
    admin.from("leads").select("created_at").gte("created_at", since).limit(8000),
  ])
  const bucket = emptyBuckets(rangeDays, mode, () => ({ scorecards: 0, assessments: 0, leads: 0 }))
  for (const row of scorecards.data ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (current) current.scorecards += 1
  }
  for (const row of assessments.data ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (current) current.assessments += 1
  }
  for (const row of leads.data ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (current) current.leads += 1
  }
  return [...bucket.entries()].map(([key, value]) => ({
    key,
    label: formatLabel(key, mode),
    ...value,
  }))
}

/** Evolution multi-série : inscriptions + démarrages essai/actif (créations réelles). */
export async function loadEvolutionSeries(rangeDays: number, orgTotal: number): Promise<EvolutionPoint[]> {
  const mode = chartBucketMode(rangeDays)
  const admin = createAdminClient()
  const since = new Date(Date.now() - rangeDays * 864e5).toISOString()
  const [{ data: orgs }, { data: subs }] = await Promise.all([
    admin.from("organizations").select("created_at").gte("created_at", since).limit(8000),
    admin
      .from("subscriptions")
      .select("created_at, status, plan")
      .gte("created_at", since)
      .limit(8000),
  ])
  const bucket = emptyBuckets(rangeDays, mode, () => ({ organizations: 0, trials: 0, actives: 0 }))
  for (const row of orgs ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (current) current.organizations += 1
  }
  for (const row of subs ?? []) {
    const current = bucket.get(bucketKey(row.created_at, mode))
    if (!current) continue
    if (row.status === "trialing") current.trials += 1
    if (row.status === "active" && row.plan !== "free" && row.plan !== "internal") current.actives += 1
  }
  const beforeCount = Math.max(0, orgTotal - (orgs?.length ?? 0))
  let running = beforeCount
  return [...bucket.entries()].map(([key, value]) => {
    running += value.organizations
    return {
      key,
      label: formatLabel(key, mode),
      organizations: value.organizations,
      cumulative: running,
      trials: value.trials,
      actives: value.actives,
    }
  })
}

export async function loadExpirationsTimeline(): Promise<ExpirationBucket[]> {
  const admin = createAdminClient()
  const now = Date.now()
  const until = new Date(now + 30 * 864e5).toISOString()
  const [{ data: trialSubs }, { data: activeSubs }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("organization_id, status, trial_end, current_period_end")
      .eq("status", "trialing")
      .not("trial_end", "is", null)
      .lte("trial_end", until)
      .limit(250),
    admin
      .from("subscriptions")
      .select("organization_id, status, trial_end, current_period_end")
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lte("current_period_end", until)
      .limit(250),
  ])
  const subs = [...(trialSubs ?? []), ...(activeSubs ?? [])]

  const orgIds = [...new Set((subs ?? []).map((row) => row.organization_id))]
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] }
  const nameById = new Map((orgs ?? []).map((row) => [row.id, row.name]))

  const buckets: Record<ExpirationBucket["id"], ExpirationBucket> = {
    today: { id: "today", label: "Aujourd'hui", count: 0, organizations: [] },
    d3: { id: "d3", label: "≤ 3 jours", count: 0, organizations: [] },
    d7: { id: "d7", label: "≤ 7 jours", count: 0, organizations: [] },
    d30: { id: "d30", label: "≤ 30 jours", count: 0, organizations: [] },
  }

  for (const row of subs ?? []) {
    const isTrial = row.status === "trialing"
    const deadline = isTrial ? row.trial_end : row.current_period_end
    if (!deadline) continue
    const at = Date.parse(deadline)
    if (!Number.isFinite(at) || at < now - 864e5) continue
    const days = Math.ceil((at - now) / 864e5)
    const entry = {
      id: row.organization_id,
      name: nameById.get(row.organization_id) ?? row.organization_id.slice(0, 8),
      deadline: deadline.slice(0, 10),
      kind: (isTrial ? "trial" : "period") as "trial" | "period",
    }
    const push = (id: ExpirationBucket["id"]) => {
      buckets[id].count += 1
      if (buckets[id].organizations.length < 8) buckets[id].organizations.push(entry)
    }
    if (days <= 0) push("today")
    else if (days <= 3) push("d3")
    else if (days <= 7) push("d7")
    else if (days <= 30) push("d30")
  }

  return [buckets.today, buckets.d3, buckets.d7, buckets.d30]
}

export async function loadHealthStats(): Promise<HealthStat[]> {
  try {
    const admin = createAdminClient()
    const since7 = new Date(Date.now() - 7 * 864e5).toISOString()
    const safeCount = async (run: () => PromiseLike<{ count: number | null }>) => {
      try {
        return (await run()).count ?? 0
      } catch {
        return 0
      }
    }
    const [deadEmailCount, deadIntegration, deadReport, alertCount, stripeCount] = await Promise.all([
      safeCount(() => admin.from("email_jobs").select("id", { count: "exact", head: true }).eq("status", "dead")),
      safeCount(async () => {
        const { count } = await admin
          .from("integration_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
        return { count }
      }),
      safeCount(async () => {
        const { count } = await admin
          .from("report_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
        return { count }
      }),
      safeCount(() => admin.from("platform_alerts").select("id", { count: "exact", head: true }).is("resolved_at", null)),
      safeCount(() => admin.from("stripe_events").select("id", { count: "exact", head: true }).gte("created_at", since7)),
    ])
    const deadJobCount = deadIntegration + deadReport
    return [
      {
        id: "jobs",
        label: "Jobs dead (intégration + rapports)",
        value: deadJobCount,
        tone: deadJobCount > 0 ? "bad" : "ok",
      },
      {
        id: "email",
        label: "E-mails dead",
        value: deadEmailCount,
        tone: deadEmailCount > 0 ? "bad" : "ok",
      },
      {
        id: "alerts",
        label: "Alertes ouvertes",
        value: alertCount,
        tone: alertCount > 0 ? "warn" : "ok",
      },
      {
        id: "stripe",
        label: "Événements Stripe (7 j)",
        value: stripeCount,
        tone: "neutral",
      },
    ]
  } catch {
    return []
  }
}

function bucketKey(iso: string, mode: "day" | "month") {
  return mode === "month" ? iso.slice(0, 7) : iso.slice(0, 10)
}

function formatLabel(key: string, mode: "day" | "month") {
  if (mode === "month") return key.slice(5)
  return key.slice(5)
}

function emptyBuckets<T>(rangeDays: number, mode: "day" | "month", factory: () => T) {
  const map = new Map<string, T>()
  if (mode === "month") {
    const months = Math.min(12, Math.ceil(rangeDays / 30))
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date()
      d.setUTCDate(1)
      d.setUTCMonth(d.getUTCMonth() - i)
      map.set(d.toISOString().slice(0, 7), factory())
    }
    return map
  }
  const days = Math.min(Math.max(rangeDays, 1), 90)
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
    map.set(day, factory())
  }
  return map
}
