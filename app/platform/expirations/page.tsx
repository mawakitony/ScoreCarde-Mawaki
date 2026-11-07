import Link from "next/link"
import { AlertTriangle, CalendarClock, Hourglass, Timer } from "lucide-react"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { OrgAvatar } from "@/components/platform/org-avatar"
import {
  PlatformEmpty,
  PlatformField,
  PlatformPageHeader,
  PlatformPanel,
  PlatformSelect,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { FilterBar } from "@/components/platform/filter-bar"
import { PlatformExpirationsTimeline } from "@/components/platform/platform-charts"
import { StatusBadge } from "@/components/platform/status-badge"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { loadExpirationsTimeline } from "@/lib/platform/overview-series"
import { daysRemaining, subscriptionStatusLabel } from "@/lib/platform/status-labels"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformExpirationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const query = (params.q ?? "").trim().toLowerCase()
  const bucket = params.bucket ?? "all"
  const admin = createAdminClient()
  // Snapshot unique pour la requête serveur (pas de re-render client).
  const snapshotMs = Date.parse(new Date().toISOString())
  const horizon30 = new Date(snapshotMs + 30 * 864e5).toISOString()
  const nowIso = new Date(snapshotMs).toISOString()
  const orgId = supportScope?.organizationId

  let trialsQ = admin
    .from("subscriptions")
    .select("organization_id, plan, status, trial_end")
    .eq("status", "trialing")
    .not("trial_end", "is", null)
    .lte("trial_end", horizon30)
    .gte("trial_end", nowIso)
    .order("trial_end")
    .limit(200)
  let periodsQ = admin
    .from("subscriptions")
    .select("organization_id, plan, status, current_period_end")
    .eq("status", "active")
    .not("current_period_end", "is", null)
    .lte("current_period_end", horizon30)
    .gte("current_period_end", nowIso)
    .order("current_period_end")
    .limit(200)
  let pastDueQ = admin
    .from("subscriptions")
    .select("organization_id, plan, status, past_due_at, current_period_end")
    .eq("status", "past_due")
    .order("past_due_at")
    .limit(100)
  let cancelingQ = admin
    .from("subscriptions")
    .select("organization_id, plan, status, current_period_end, cancel_at_period_end")
    .eq("cancel_at_period_end", true)
    .order("current_period_end")
    .limit(100)
  let expiredTrialsQ = admin
    .from("subscriptions")
    .select("organization_id, plan, status, trial_end")
    .eq("status", "trialing")
    .not("trial_end", "is", null)
    .lt("trial_end", nowIso)
    .order("trial_end", { ascending: false })
    .limit(100)
  if (orgId) {
    trialsQ = trialsQ.eq("organization_id", orgId)
    periodsQ = periodsQ.eq("organization_id", orgId)
    pastDueQ = pastDueQ.eq("organization_id", orgId)
    cancelingQ = cancelingQ.eq("organization_id", orgId)
    expiredTrialsQ = expiredTrialsQ.eq("organization_id", orgId)
  }

  const [timeline, { data: trials }, { data: periods }, { data: pastDue }, { data: canceling }, { data: expiredTrials }] =
    await Promise.all([
      orgId ? Promise.resolve([]) : loadExpirationsTimeline(),
      trialsQ,
      periodsQ,
      pastDueQ,
      cancelingQ,
      expiredTrialsQ,
    ])

  const ids = [
    ...new Set(
      [
        ...(trials ?? []),
        ...(periods ?? []),
        ...(pastDue ?? []),
        ...(canceling ?? []),
        ...(expiredTrials ?? []),
      ].map((row) => row.organization_id),
    ),
  ]
  const { data: orgs } = ids.length ? await admin.from("organizations").select("id, name").in("id", ids) : { data: [] }
  const nameOf = (id: string) => orgs?.find((row) => row.id === id)?.name ?? id.slice(0, 8)

  type Row = {
    id: string
    name: string
    kind: string
    plan: string
    status: string
    deadline: string | null
    days: number | null
    urgency: "today" | "d3" | "d7" | "d30" | "expired" | "other"
  }

  const toUrgency = (days: number | null): Row["urgency"] => {
    if (days === null) return "other"
    if (days < 0) return "expired"
    if (days <= 0) return "today"
    if (days <= 3) return "d3"
    if (days <= 7) return "d7"
    if (days <= 30) return "d30"
    return "other"
  }

  const allRows: Row[] = [
    ...(trials ?? []).map((row) => {
      const days = daysRemaining(row.trial_end)
      return {
        id: row.organization_id,
        name: nameOf(row.organization_id),
        kind: "Fin d'essai",
        plan: row.plan,
        status: row.status,
        deadline: row.trial_end,
        days,
        urgency: toUrgency(days),
      }
    }),
    ...(periods ?? []).map((row) => {
      const days = daysRemaining(row.current_period_end)
      return {
        id: row.organization_id,
        name: nameOf(row.organization_id),
        kind: "Fin de période",
        plan: row.plan,
        status: row.status,
        deadline: row.current_period_end,
        days,
        urgency: toUrgency(days),
      }
    }),
    ...(pastDue ?? []).map((row) => ({
      id: row.organization_id,
      name: nameOf(row.organization_id),
      kind: "Paiement en retard",
      plan: row.plan,
      status: row.status,
      deadline: row.current_period_end,
      days: daysRemaining(row.current_period_end),
      urgency: "other" as const,
    })),
    ...(canceling ?? []).map((row) => {
      const days = daysRemaining(row.current_period_end)
      return {
        id: `${row.organization_id}-cancel`,
        name: nameOf(row.organization_id),
        kind: "Annulation planifiée",
        plan: row.plan,
        status: row.status,
        deadline: row.current_period_end,
        days,
        urgency: toUrgency(days),
      }
    }),
    ...(expiredTrials ?? []).map((row) => ({
      id: `${row.organization_id}-expired`,
      name: nameOf(row.organization_id),
      kind: "Essai déjà expiré",
      plan: row.plan,
      status: row.status,
      deadline: row.trial_end,
      days: daysRemaining(row.trial_end),
      urgency: "expired" as const,
    })),
  ]

  let filtered = allRows
  if (query) filtered = filtered.filter((row) => row.name.toLowerCase().includes(query) || row.plan.includes(query))
  if (bucket !== "all") filtered = filtered.filter((row) => row.urgency === bucket)

  const todayCount = timeline.find((b) => b.id === "today")?.count ?? 0
  const d3 = timeline.find((b) => b.id === "d3")?.count ?? 0
  const d7 = timeline.find((b) => b.id === "d7")?.count ?? 0
  const d30 = timeline.find((b) => b.id === "d30")?.count ?? 0
  const expiredCount = (expiredTrials ?? []).length

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Expirations"
        description="Surveillance des échéances essais et périodes — données réelles à 30 jours."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Expirations" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <MiniKpi index={0} label="Aujourd'hui" value={String(todayCount)} tone={todayCount > 0 ? "bad" : "good"} icon={AlertTriangle} />
        <MiniKpi index={1} label="≤ 3 jours" value={String(d3)} tone={d3 > 0 ? "warn" : "default"} icon={Timer} />
        <MiniKpi index={2} label="≤ 7 jours" value={String(d7)} tone={d7 > 0 ? "warn" : "default"} icon={Hourglass} />
        <MiniKpi index={3} label="≤ 30 jours" value={String(d30)} icon={CalendarClock} />
        <MiniKpi
          index={4}
          label="Déjà expirés"
          value={String(expiredCount)}
          tone={expiredCount > 0 ? "bad" : "good"}
          icon={AlertTriangle}
        />
      </section>

      <PlatformExpirationsTimeline data={timeline} />

      <FilterBar>
        <PlatformField name="q" defaultValue={params.q ?? ""} placeholder="Organisation ou plan" className="max-w-xs" />
        <PlatformSelect name="bucket" defaultValue={bucket} className="max-w-[180px]">
          <option value="all">Toutes les échéances</option>
          <option value="today">Aujourd&apos;hui</option>
          <option value="d3">≤ 3 jours</option>
          <option value="d7">≤ 7 jours</option>
          <option value="d30">≤ 30 jours</option>
          <option value="expired">Déjà expirés</option>
        </PlatformSelect>
      </FilterBar>

      {filtered.length === 0 ? (
        <PlatformEmpty title="Aucune échéance" description="Aucun résultat pour ces filtres." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="960px">
            <thead>
              <tr>
                {["Organisation", "Type", "Plan", "Statut", "Échéance", "Jours", "Actions"].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.id}-${row.kind}-${row.deadline}`} className="hover:bg-[color:var(--pa-bg)]/80">
                  <PlatformTd>
                    <div className="flex items-center gap-2.5">
                      <OrgAvatar name={row.name} size="sm" />
                      <span className="font-semibold text-[color:var(--pa-ink)]">{row.name}</span>
                    </div>
                  </PlatformTd>
                  <PlatformTd>{row.kind}</PlatformTd>
                  <PlatformTd className="capitalize">{row.plan}</PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={subscriptionStatusLabel(row.status)} />
                  </PlatformTd>
                  <PlatformTd className="tabular-nums">{row.deadline?.slice(0, 10) ?? "—"}</PlatformTd>
                  <PlatformTd className="tabular-nums">
                    {row.days === null ? (
                      "—"
                    ) : (
                      <span
                        className={
                          row.days <= 0
                            ? "font-semibold text-rose-700"
                            : row.days <= 3
                              ? "font-semibold text-rose-700"
                              : row.days <= 7
                                ? "font-semibold text-amber-700"
                                : undefined
                        }
                      >
                        {row.days}
                      </span>
                    )}
                  </PlatformTd>
                  <PlatformTd>
                    <Link
                      className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                      href={`/platform/organizations/${row.id.replace(/-cancel$|-expired$/, "")}`}
                    >
                      Ouvrir
                    </Link>
                  </PlatformTd>
                </tr>
              ))}
            </tbody>
          </PlatformTable>
        </PlatformPanel>
      )}
    </div>
  )
}
