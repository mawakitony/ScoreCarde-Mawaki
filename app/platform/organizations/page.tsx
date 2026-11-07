import Link from "next/link"
import { Building2, Clock, PauseCircle, Sparkles, UserCheck } from "lucide-react"
import { FilterBar } from "@/components/platform/filter-bar"
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
import { PlatformEvolutionChart } from "@/components/platform/platform-charts"
import { StatusBadge } from "@/components/platform/status-badge"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { accountState } from "@/lib/platform/data"
import { loadPlatformMetrics } from "@/lib/platform/metrics"
import { constrainOrgIds, maskEmail, pageWindow, searchTarget } from "@/lib/platform/rules"
import { accessStateLabel, daysRemaining, subscriptionStatusLabel } from "@/lib/platform/status-labels"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

const PAGE = 25

export default async function PlatformOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const window = pageWindow(Number(params.page ?? 1), PAGE)
  const page = window.page
  const query = (params.q ?? "").replace(/[%_,]/g, "").trim()
  const sort = params.sort === "name" ? "name" : "created_at"
  const admin = createAdminClient()
  const ids: string[] | null = constrainOrgIds(
    supportScope?.organizationId ?? null,
    await matchingOrganizations(admin, params, query),
  )

  let request = admin
    .from("organizations")
    .select("id, name, slug, country, created_at", { count: "exact" })
    .order(sort, { ascending: sort === "name" })
  if (ids !== null) request = request.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
  if (query && searchTarget(query) === "organization" && !query.includes("@")) {
    request = request.or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
  }
  if (params.country) request = request.eq("country", params.country)
  if (params.created) request = request.gte("created_at", params.created)

  const [{ data, count, error }, metrics] = await Promise.all([
    request.range(window.from, window.to),
    supportScope ? Promise.resolve(null) : loadPlatformMetrics(30),
  ])
  if (error) {
    console.error("[platform/organizations] list unavailable", error.message)
    return (
      <PlatformEmpty
        title="Liste indisponible"
        description="Impossible de charger les organisations pour le moment. Réessayez ou contactez l’équipe technique si le problème persiste."
      />
    )
  }

  const pageIds = (data ?? []).map((row) => row.id)
  const [{ data: subscriptions }, counts, owners, suspensions] = await Promise.all([
    pageIds.length
      ? admin
          .from("subscriptions")
          .select("organization_id, plan, status, trial_end, current_period_end, past_due_at, cancel_at_period_end")
          .in("organization_id", pageIds)
      : Promise.resolve({ data: [] }),
    pageCounts(pageIds),
    pageOwners(pageIds),
    pageSuspensions(pageIds),
  ])
  const preserved = linkQuery(params, query)

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Entreprises"
        description="Centre de gestion des organisations clientes — données réelles."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Entreprises" }]}
        actions={
          <Link
            className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-sm font-semibold text-[color:var(--pa-primary)]"
            href="/platform/organizations/export"
          >
            Export CSV
          </Link>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <MiniKpi index={0} label="Total" value={String(metrics?.organizations ?? count ?? 0)} icon={Building2} hint="Stock actuel" />
        <MiniKpi
          index={1}
          label="Actives payantes"
          value={String(metrics?.activePaid ?? 0)}
          tone="good"
          icon={UserCheck}
          hint="Hors free / internal"
        />
        <MiniKpi
          index={2}
          label="Essais"
          value={String(metrics?.trialing ?? 0)}
          tone={(metrics?.trialing ?? 0) > 0 ? "warn" : "default"}
          icon={Sparkles}
        />
        <MiniKpi
          index={3}
          label="Expirés / restreints"
          value={String(metrics?.expiredRestrictedHint ?? 0)}
          tone={(metrics?.expiredRestrictedHint ?? 0) > 0 ? "bad" : "default"}
          icon={Clock}
        />
        <MiniKpi
          index={4}
          label="Suspendues"
          value={String(metrics?.suspended ?? 0)}
          tone={(metrics?.suspended ?? 0) > 0 ? "bad" : "default"}
          icon={PauseCircle}
        />
      </section>

      <PlatformEvolutionChart data={metrics?.evolutionSeries ?? []} hero />

      <FilterBar>
        <PlatformField name="q" defaultValue={query} placeholder="Nom, slug, e-mail, cus_" className="max-w-xs" />
        <PlatformSelect name="plan" defaultValue={params.plan ?? ""} className="max-w-[140px]">
          <option value="">Plan</option>
          {["free", "starter", "pro", "business", "enterprise", "internal"].map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </PlatformSelect>
        <PlatformSelect name="status" defaultValue={params.status ?? ""} className="max-w-[150px]">
          <option value="">Statut abo.</option>
          {[
            ["trialing", "Essai"],
            ["active", "Actif"],
            ["past_due", "En retard"],
            ["canceled", "Annulé"],
            ["unpaid", "Impayé"],
            ["incomplete", "Incomplet"],
            ["paused", "En pause"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </PlatformSelect>
        <PlatformSelect name="state" defaultValue={params.state ?? ""} className="max-w-[140px]">
          <option value="">Compte</option>
          <option value="suspended">Suspendu</option>
        </PlatformSelect>
        <PlatformSelect name="trial" defaultValue={params.trial ?? ""} className="max-w-[150px]">
          <option value="">Essai</option>
          <option value="yes">En essai</option>
          <option value="expiring">Fin proche (≤7 j)</option>
        </PlatformSelect>
        <PlatformField name="country" defaultValue={params.country ?? ""} placeholder="Pays" className="max-w-[110px]" />
        <PlatformField name="created" type="date" defaultValue={params.created ?? ""} className="max-w-[160px]" />
        <PlatformSelect name="domain" defaultValue={params.domain ?? ""} className="max-w-[140px]">
          <option value="">Domaine</option>
          <option value="yes">Avec domaine</option>
        </PlatformSelect>
        <PlatformSelect name="sort" defaultValue={sort} className="max-w-[150px]">
          <option value="created_at">Tri : création</option>
          <option value="name">Tri : nom</option>
        </PlatformSelect>
      </FilterBar>

      {(data ?? []).length === 0 ? (
        <PlatformEmpty title="Aucune entreprise" description="Aucun résultat pour ces filtres." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="1120px">
            <thead>
              <tr>
                {[
                  "Entreprise",
                  "Propriétaire",
                  "Pays",
                  "Plan",
                  "Statut",
                  "Jours",
                  "Collab.",
                  "Activité",
                  "Créée",
                  "Accès",
                  "Actions",
                ].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((organization) => {
                const subscription = subscriptions?.find((item) => item.organization_id === organization.id)
                const tally = counts.get(organization.id)
                const owner = owners.get(organization.id)
                const suspended = suspensions.has(organization.id)
                const state = accountState({
                  plan: subscription?.plan ?? "free",
                  status: subscription?.status ?? "active",
                  trialEnd: subscription?.trial_end ?? null,
                  currentPeriodEnd: subscription?.current_period_end ?? null,
                  pastDueAt: subscription?.past_due_at ?? null,
                  cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
                })
                const deadline =
                  subscription?.status === "trialing" ? subscription.trial_end : subscription?.current_period_end
                const days = daysRemaining(deadline)
                return (
                  <tr key={organization.id} className="hover:bg-[color:var(--pa-bg)]/80">
                    <PlatformTd>
                      <div className="flex items-center gap-2.5">
                        <OrgAvatar name={organization.name} />
                        <div>
                          <div className="font-semibold text-[color:var(--pa-ink)]">{organization.name}</div>
                          <div className="font-mono text-[12px] text-muted-foreground">{organization.slug}</div>
                        </div>
                      </div>
                    </PlatformTd>
                    <PlatformTd>
                      {owner?.name ?? "—"}
                      <div className="text-muted-foreground">{maskEmail(owner?.email ?? null)}</div>
                    </PlatformTd>
                    <PlatformTd>{organization.country ?? "—"}</PlatformTd>
                    <PlatformTd className="capitalize">{subscription?.plan ?? "—"}</PlatformTd>
                    <PlatformTd>
                      {subscription ? <StatusBadge label={subscriptionStatusLabel(subscription.status)} /> : "—"}
                    </PlatformTd>
                    <PlatformTd className="tabular-nums">
                      {days === null ? (
                        "—"
                      ) : (
                        <span className={days <= 3 ? "font-semibold text-rose-700" : days <= 7 ? "font-semibold text-amber-700" : undefined}>
                          {days}
                        </span>
                      )}
                    </PlatformTd>
                    <PlatformTd className="tabular-nums">{tally?.members ?? 0}</PlatformTd>
                    <PlatformTd className="tabular-nums text-muted-foreground">{tally?.activity ?? "—"}</PlatformTd>
                    <PlatformTd className="tabular-nums">{organization.created_at.slice(0, 10)}</PlatformTd>
                    <PlatformTd>
                      <StatusBadge label={accessStateLabel(state, suspended)} />
                    </PlatformTd>
                    <PlatformTd>
                      <Link
                        className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                        href={`/platform/organizations/${organization.id}`}
                      >
                        Ouvrir
                      </Link>
                    </PlatformTd>
                  </tr>
                )
              })}
            </tbody>
          </PlatformTable>
        </PlatformPanel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {count ?? 0} organisations · page {page}
        </p>
        <div className="flex gap-3">
          {page > 1 ? (
            <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/organizations?${preserved}&page=${page - 1}`}>
              Précédent
            </Link>
          ) : null}
          {(count ?? 0) > page * PAGE ? (
            <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/organizations?${preserved}&page=${page + 1}`}>
              Suivant
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

async function matchingOrganizations(
  admin: ReturnType<typeof createAdminClient>,
  params: Record<string, string | undefined>,
  query: string,
): Promise<string[] | null> {
  const box: { ids: string[] | null } = { ids: null }
  const take = (next: string[]) => {
    box.ids = box.ids ? box.ids.filter((id) => next.includes(id)) : next
  }
  const target = searchTarget(query)
  if (query && target === "stripe") {
    const column = query.startsWith("sub_") ? "provider_subscription_id" : "provider_customer_id"
    const { data } = await admin.from("subscriptions").select("organization_id").eq(column, query).limit(PAGE)
    take((data ?? []).map((row) => row.organization_id))
  }
  if (query && target === "domain") {
    const { data } = await admin.from("custom_domains").select("organization_id").ilike("domain", query).limit(PAGE)
    take((data ?? []).map((row) => row.organization_id))
  }
  if (query.includes("@")) {
    const { data: profiles } = await admin.from("profiles").select("id").ilike("email", query).limit(10)
    const profileIds = (profiles ?? []).map((row) => row.id)
    const { data } = profileIds.length
      ? await admin.from("organization_members").select("organization_id").in("user_id", profileIds).eq("role", "owner")
      : { data: [] }
    take((data ?? []).map((row) => row.organization_id))
  }
  if (params.plan || params.status || params.trial === "yes" || params.trial === "expiring") {
    let request = admin.from("subscriptions").select("organization_id, trial_end, status")
    if (params.plan) request = request.eq("plan", params.plan)
    if (params.status) request = request.eq("status", params.status)
    if (params.trial === "yes" || params.trial === "expiring") request = request.eq("status", "trialing")
    const { data } = await request.limit(1000)
    let rows = data ?? []
    if (params.trial === "expiring") {
      const until = Date.parse(new Date().toISOString()) + 7 * 864e5
      rows = rows.filter((row) => row.trial_end && Date.parse(row.trial_end) <= until)
    }
    take(rows.map((row) => row.organization_id))
  }
  if (params.domain === "yes") {
    const { data } = await admin.from("custom_domains").select("organization_id").limit(1000)
    take([...new Set((data ?? []).map((row) => row.organization_id))])
  }
  if (params.state === "suspended") {
    const { data } = await admin.from("organization_suspensions").select("organization_id").is("lifted_at", null)
    take((data ?? []).map((row) => row.organization_id))
  }
  return box.ids
}

async function pageOwners(ids: string[]) {
  const owners = new Map<string, { name: string | null; email: string | null }>()
  if (!ids.length) return owners
  const admin = createAdminClient()
  const { data: members } = await admin
    .from("organization_members")
    .select("organization_id, user_id")
    .in("organization_id", ids)
    .eq("role", "owner")
  const userIds = [...new Set((members ?? []).map((row) => row.user_id))]
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] }
  for (const member of members ?? []) {
    const profile = profiles?.find((row) => row.id === member.user_id)
    owners.set(member.organization_id, { name: profile?.full_name ?? null, email: profile?.email ?? null })
  }
  return owners
}

async function pageSuspensions(ids: string[]) {
  const set = new Set<string>()
  if (!ids.length) return set
  const admin = createAdminClient()
  const { data } = await admin
    .from("organization_suspensions")
    .select("organization_id")
    .in("organization_id", ids)
    .is("lifted_at", null)
  for (const row of data ?? []) set.add(row.organization_id)
  return set
}

async function pageCounts(ids: string[]) {
  const counts = new Map<
    string,
    { members: number; scorecards: number; assessments: number; leads: number; activity: string | null }
  >()
  if (!ids.length) return counts
  const admin = createAdminClient()
  await Promise.all(
    ids.map(async (id) => {
      const [members, scorecards, leads] = await Promise.all([
        admin.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", id),
        admin.from("scorecards").select("id").eq("organization_id", id),
        admin.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", id),
      ])
      const cardIds = (scorecards.data ?? []).map((card) => card.id)
      const assessments = cardIds.length
        ? await admin.from("assessment_sessions").select("id", { count: "exact", head: true }).in("scorecard_id", cardIds)
        : { count: 0 }
      const activity = cardIds.length
        ? await admin
            .from("assessment_sessions")
            .select("last_activity_at")
            .in("scorecard_id", cardIds)
            .order("last_activity_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null }
      counts.set(id, {
        members: members.count ?? 0,
        scorecards: cardIds.length,
        assessments: assessments.count ?? 0,
        leads: leads.count ?? 0,
        activity: activity.data?.last_activity_at?.slice(0, 10) ?? null,
      })
    }),
  )
  return counts
}

function linkQuery(params: Record<string, string | undefined>, query: string) {
  const search = new URLSearchParams()
  if (query) search.set("q", query)
  for (const key of ["plan", "status", "state", "trial", "country", "created", "domain", "sort"]) {
    const value = params[key]
    if (value) search.set(key, value)
  }
  return search.toString()
}
