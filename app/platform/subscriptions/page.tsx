import Link from "next/link"
import { Suspense } from "react"
import { Ban, CircleDollarSign, Clock, Sparkles, UserCheck } from "lucide-react"
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
import { PlatformEvolutionChart, PlatformMixChart } from "@/components/platform/platform-charts"
import { PlatformRangeFilter } from "@/components/platform/range-filter"
import { StatusBadge } from "@/components/platform/status-badge"
import { UndeterminedPriceBanner } from "@/components/platform/undetermined-banner"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { cataloguePrice, isActivePaid } from "@/lib/platform/financial-metrics"
import { loadPlatformMetrics } from "@/lib/platform/metrics"
import { parsePlatformRange } from "@/lib/platform/range"
import { pageWindow } from "@/lib/platform/rules"
import { daysRemaining, subscriptionStatusLabel } from "@/lib/platform/status-labels"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"
import type { BillingInterval } from "@/lib/billing/plans"

const PAGE = 40

export default async function PlatformSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const actor = await requirePlatformAdmin("platform.billing.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const { days } = parsePlatformRange(params.range)
  const window = pageWindow(Number(params.page ?? 1), PAGE)
  const page = window.page
  const query = (params.q ?? "").replace(/[%_,]/g, "").trim()
  const priceFilter = params.price === "unknown" ? "unknown" : params.price === "known" ? "known" : ""

  const admin = createAdminClient()
  const metrics = supportScope ? null : await loadPlatformMetrics(days)

  let request = admin
    .from("subscriptions")
    .select(
      "organization_id, plan, billing_interval, status, provider_customer_id, provider_subscription_id, current_period_end, cancel_at_period_end, trial_end, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })

  if (supportScope) request = request.eq("organization_id", supportScope.organizationId)
  if (params.plan) request = request.eq("plan", params.plan)
  if (params.status) request = request.eq("status", params.status)
  if (params.interval === "monthly" || params.interval === "yearly") {
    request = request.eq("billing_interval", params.interval)
  }

  const { data: raw, count, error } = await request.limit(500)
  if (error) {
    console.error("[platform/subscriptions] list unavailable", error.message)
    return (
      <PlatformEmpty
        title="Liste indisponible"
        description="Impossible de charger les abonnements pour le moment. Réessayez plus tard."
      />
    )
  }

  const orgIds = [...new Set((raw ?? []).map((row) => row.organization_id))]
  const { data: organizations } = orgIds.length
    ? await admin.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] }
  const nameById = new Map((organizations ?? []).map((row) => [row.id, row.name]))

  let rows = (raw ?? []).map((row) => {
    const interval = (row.billing_interval === "yearly" ? "yearly" : "monthly") as BillingInterval
    const price = cataloguePrice(row.plan, interval)
    const activePaid = isActivePaid(row)
    const undetermined = activePaid && !price
    return {
      ...row,
      orgName: nameById.get(row.organization_id) ?? "—",
      price,
      undetermined,
      priceLabel: price
        ? `${(price.amountCents / 100).toFixed(2)} ${price.currency.toUpperCase()}`
        : activePaid
          ? "Non déterminé"
          : "—",
    }
  })

  if (query) {
    const q = query.toLowerCase()
    rows = rows.filter(
      (row) =>
        row.orgName.toLowerCase().includes(q) ||
        row.organization_id.includes(q) ||
        (row.provider_customer_id ?? "").toLowerCase().includes(q) ||
        (row.provider_subscription_id ?? "").toLowerCase().includes(q),
    )
  }
  if (priceFilter === "unknown") rows = rows.filter((row) => row.undetermined)
  if (priceFilter === "known") rows = rows.filter((row) => Boolean(row.price))

  const totalFiltered = rows.length
  const pageRows = rows.slice(window.from, window.to + 1)
  const undeterminedCount = metrics?.mrrMeta.undeterminedActivePaid ?? rows.filter((r) => r.undetermined).length
  const preserved = linkQuery(params)

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Abonnements"
        description="Stripe reste la source de vérité. Cette console ne modifie ni le statut, ni le plan, ni la période."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Abonnements" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded-xl bg-white" />}>
              <PlatformRangeFilter basePath="/platform/subscriptions" />
            </Suspense>
            <Link
              className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-sm font-semibold text-[color:var(--pa-primary)]"
              href="/platform/subscriptions/export"
            >
              Export CSV
            </Link>
          </div>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <MiniKpi index={0} label="Actifs payants" value={String(metrics?.activePaid ?? 0)} tone="good" icon={UserCheck} hint="Stock" />
        <MiniKpi
          index={1}
          label="Essais"
          value={String(metrics?.trialing ?? 0)}
          tone={(metrics?.trialing ?? 0) > 0 ? "warn" : "default"}
          icon={Sparkles}
        />
        <MiniKpi
          index={2}
          label="En retard"
          value={String(metrics?.pastDue ?? 0)}
          tone={(metrics?.pastDue ?? 0) > 0 ? "bad" : "good"}
          icon={Clock}
        />
        <MiniKpi index={3} label="Annulés" value={String(metrics?.canceled ?? 0)} icon={Ban} />
        <MiniKpi
          index={4}
          label="Sans prix"
          value={String(undeterminedCount)}
          tone={undeterminedCount > 0 ? "warn" : "good"}
          icon={CircleDollarSign}
          href="/platform/subscriptions?price=unknown"
          hint="Exclus du MRR"
        />
      </section>

      <UndeterminedPriceBanner count={undeterminedCount} />

      <section className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <PlatformEvolutionChart data={metrics?.evolutionSeries ?? []} hero />
        </div>
        <div className="xl:col-span-5">
          <PlatformMixChart data={metrics?.subscriptionMix ?? []} compact />
        </div>
      </section>

      <FilterBar>
        <PlatformField name="q" defaultValue={query} placeholder="Organisation, cus_, sub_" className="max-w-xs" />
        <PlatformSelect name="plan" defaultValue={params.plan ?? ""} className="max-w-[140px]">
          <option value="">Plan</option>
          {["free", "starter", "pro", "business", "enterprise", "internal"].map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </PlatformSelect>
        <PlatformSelect name="status" defaultValue={params.status ?? ""} className="max-w-[150px]">
          <option value="">Statut</option>
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
        <PlatformSelect name="interval" defaultValue={params.interval ?? ""} className="max-w-[140px]">
          <option value="">Intervalle</option>
          <option value="monthly">Mensuel</option>
          <option value="yearly">Annuel</option>
        </PlatformSelect>
        <PlatformSelect name="price" defaultValue={priceFilter} className="max-w-[160px]">
          <option value="">Prix</option>
          <option value="known">Prix connu</option>
          <option value="unknown">Sans prix connu</option>
        </PlatformSelect>
        {params.range ? <input type="hidden" name="range" value={params.range} /> : null}
      </FilterBar>

      {pageRows.length === 0 ? (
        <PlatformEmpty title="Aucun abonnement" description="Aucun résultat pour ces filtres." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="1100px">
            <thead>
              <tr>
                {[
                  "Organisation",
                  "Plan",
                  "Prix",
                  "Statut",
                  "Début",
                  "Fin essai",
                  "Échéance",
                  "Jours",
                  "Actions",
                ].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const deadline = row.status === "trialing" ? row.trial_end : row.current_period_end
                const days = daysRemaining(deadline)
                return (
                  <tr key={`${row.organization_id}-${row.provider_subscription_id ?? row.plan}`} className="hover:bg-[color:var(--pa-bg)]/80">
                    <PlatformTd>
                      <div className="flex items-center gap-2.5">
                        <OrgAvatar name={row.orgName} size="sm" />
                        <div>
                          <div className="font-semibold text-[color:var(--pa-ink)]">{row.orgName}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {row.provider_customer_id ?? "—"}
                          </div>
                        </div>
                      </div>
                    </PlatformTd>
                    <PlatformTd>
                      <span className="capitalize">{row.plan}</span>
                      <div className="text-[11px] text-muted-foreground">
                        {row.billing_interval === "yearly" ? "Annuel" : "Mensuel"}
                        {row.cancel_at_period_end ? " · fin de période" : ""}
                      </div>
                    </PlatformTd>
                    <PlatformTd>
                      <span className={row.undetermined ? "font-semibold text-amber-700" : "tabular-nums"}>
                        {row.priceLabel}
                      </span>
                      {row.undetermined ? (
                        <div className="text-[10px] font-medium text-amber-700">Hors MRR</div>
                      ) : null}
                    </PlatformTd>
                    <PlatformTd>
                      <StatusBadge label={subscriptionStatusLabel(row.status)} />
                    </PlatformTd>
                    <PlatformTd className="tabular-nums">{row.created_at?.slice(0, 10) ?? "—"}</PlatformTd>
                    <PlatformTd className="tabular-nums">{row.trial_end?.slice(0, 10) ?? "—"}</PlatformTd>
                    <PlatformTd className="tabular-nums">{row.current_period_end?.slice(0, 10) ?? "—"}</PlatformTd>
                    <PlatformTd className="tabular-nums">
                      {days === null ? (
                        "—"
                      ) : (
                        <span className={days <= 3 ? "font-semibold text-rose-700" : days <= 7 ? "font-semibold text-amber-700" : undefined}>
                          {days}
                        </span>
                      )}
                    </PlatformTd>
                    <PlatformTd>
                      <Link
                        className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                        href={`/platform/organizations/${row.organization_id}?tab=subscription`}
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
          {totalFiltered} abonnement{totalFiltered > 1 ? "s" : ""}
          {count != null && count !== totalFiltered ? ` (sur ${count} chargés)` : ""} · page {page}
        </p>
        <div className="flex gap-3">
          {page > 1 ? (
            <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/subscriptions?${preserved}&page=${page - 1}`}>
              Précédent
            </Link>
          ) : null}
          {totalFiltered > page * PAGE ? (
            <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/subscriptions?${preserved}&page=${page + 1}`}>
              Suivant
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function linkQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const key of ["q", "plan", "status", "interval", "price", "range"]) {
    const value = params[key]
    if (value) search.set(key, value)
  }
  return search.toString()
}
