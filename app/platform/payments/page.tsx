import Link from "next/link"
import { Suspense } from "react"
import { AlertCircle, CheckCircle2, CircleDollarSign, Clock } from "lucide-react"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { OrgAvatar } from "@/components/platform/org-avatar"
import {
  PlatformEmpty,
  PlatformPageHeader,
  PlatformPanel,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { PlatformBillingChart } from "@/components/platform/platform-charts"
import { PlatformRangeFilter } from "@/components/platform/range-filter"
import { StatusBadge } from "@/components/platform/status-badge"
import { UndeterminedPriceBanner } from "@/components/platform/undetermined-banner"
import { cataloguePrice, formatCalculableMrr } from "@/lib/platform/financial-metrics"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { loadPlatformMetrics } from "@/lib/platform/metrics"
import { parsePlatformRange } from "@/lib/platform/range"
import { subscriptionStatusLabel } from "@/lib/platform/status-labels"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"
import type { BillingInterval } from "@/lib/billing/plans"

export default async function PlatformPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const actor = await requirePlatformAdmin("platform.billing.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const { range } = await searchParams
  const { days } = parsePlatformRange(range)
  const admin = createAdminClient()
  const sinceIso = new Date(Date.parse(new Date().toISOString()) - days * 864e5).toISOString()

  let subsQuery = admin
    .from("subscriptions")
    .select(
      "organization_id, plan, status, billing_interval, trial_end, current_period_end, past_due_at, cancel_at_period_end, provider_customer_id, provider_subscription_id, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100)
  let eventsQuery = admin
    .from("audit_logs")
    .select("organization_id, action, created_at, metadata")
    .in("action", [
      "payment.failed",
      "subscription.canceled",
      "subscription.created",
      "subscription.upgraded",
      "subscription.changed",
    ])
    .order("created_at", { ascending: false })
    .limit(50)
  let failedQuery = admin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("action", "payment.failed")
    .gte("created_at", sinceIso)
  if (supportScope) {
    subsQuery = subsQuery.eq("organization_id", supportScope.organizationId)
    eventsQuery = eventsQuery.eq("organization_id", supportScope.organizationId)
    failedQuery = failedQuery.eq("organization_id", supportScope.organizationId)
  }

  const [metrics, { data: subscriptions }, { data: events }, { count: failedCount }] = await Promise.all([
    supportScope ? Promise.resolve(null) : loadPlatformMetrics(days),
    subsQuery,
    eventsQuery,
    failedQuery,
  ])

  const orgIds = [
    ...new Set([
      ...(subscriptions ?? []).map((row) => row.organization_id),
      ...(events ?? []).map((row) => row.organization_id),
    ]),
  ]
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name, slug").in("id", orgIds)
    : { data: [] }

  const mrrLabel = formatCalculableMrr(metrics?.mrr ?? [], metrics?.mrrMeta.undeterminedActivePaid ?? 0)
  const undetermined = metrics?.mrrMeta.undeterminedActivePaid ?? 0
  const pastDue = metrics?.pastDue ?? 0
  const failed = failedCount ?? 0
  const paidEvents = (events ?? []).filter((e) =>
    ["subscription.created", "subscription.upgraded"].includes(e.action),
  ).length

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Paiements"
        description="Stripe reste la source de vérité. Un abonnement actif n'est pas une preuve de paiement. Aucune mutation Stripe depuis cette console."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Paiements" }]}
        actions={
          <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded-xl bg-white" />}>
            <PlatformRangeFilter basePath="/platform/payments" />
          </Suspense>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="MRR calculable" value={mrrLabel} icon={CircleDollarSign} hint="Jamais 0 $ inventé" href="/platform/subscriptions" />
        <MiniKpi
          index={1}
          label="Événements abo."
          value={String(paidEvents)}
          tone="good"
          icon={CheckCircle2}
          hint={`Période ${days} j — créés / upgradés`}
        />
        <MiniKpi
          index={2}
          label="Paiements échoués"
          value={String(failed)}
          tone={failed > 0 ? "bad" : "good"}
          icon={AlertCircle}
          hint={`Audit payment.failed · ${days} j`}
        />
        <MiniKpi
          index={3}
          label="En retard"
          value={String(pastDue)}
          tone={pastDue > 0 ? "warn" : "good"}
          icon={Clock}
          href="/platform/subscriptions?status=past_due"
        />
      </section>

      <UndeterminedPriceBanner count={undetermined} />

      <PlatformBillingChart
        data={metrics?.billingSeries ?? []}
        mrrLabel={mrrLabel}
        undetermined={undetermined}
        compact
      />

      <PlatformPanel
        title="État des abonnements (référence)"
        description="Prix catalogue uniquement — pas une preuve d'encaissement Stripe."
        className="overflow-hidden !p-0"
      >
        {(subscriptions ?? []).length === 0 ? (
          <div className="p-5">
            <PlatformEmpty
              title="Aucune donnée d'abonnement"
              description="Aucun abonnement à afficher. Les encaissements confirmés nécessitent des webhooks Stripe payment_*."
            />
          </div>
        ) : (
          <PlatformTable minWidth="1000px">
            <thead>
              <tr>
                {["Organisation", "Plan", "Prix catalogue", "Statut", "Fin essai", "Période", "En retard", "Stripe", "Actions"].map(
                  (heading) => (
                    <PlatformTh key={heading}>{heading}</PlatformTh>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(subscriptions ?? []).map((row) => {
                const org = orgs?.find((item) => item.id === row.organization_id)
                const interval = (row.billing_interval === "yearly" ? "yearly" : "monthly") as BillingInterval
                const price = cataloguePrice(row.plan, interval)
                const priceLabel = price
                  ? `${(price.amountCents / 100).toFixed(2)} ${price.currency.toUpperCase()}`
                  : row.status === "active" && row.plan !== "free" && row.plan !== "internal"
                    ? "Non déterminé"
                    : "—"
                return (
                  <tr key={row.organization_id} className="hover:bg-[color:var(--pa-bg)]/80">
                    <PlatformTd>
                      <div className="flex items-center gap-2.5">
                        <OrgAvatar name={org?.name ?? "?"} size="sm" />
                        <span className="font-semibold">{org?.name ?? row.organization_id.slice(0, 8)}</span>
                      </div>
                    </PlatformTd>
                    <PlatformTd>
                      <span className="capitalize">{row.plan}</span>
                      <div className="text-[11px] text-muted-foreground">
                        {row.billing_interval === "yearly" ? "Annuel" : "Mensuel"}
                      </div>
                    </PlatformTd>
                    <PlatformTd>
                      <span className={priceLabel === "Non déterminé" ? "font-semibold text-amber-700" : "tabular-nums"}>
                        {priceLabel}
                      </span>
                    </PlatformTd>
                    <PlatformTd>
                      <div className="flex flex-col gap-1">
                        <StatusBadge label={subscriptionStatusLabel(row.status)} />
                        {row.cancel_at_period_end ? (
                          <span className="text-[11px] text-muted-foreground">Fin de période</span>
                        ) : null}
                      </div>
                    </PlatformTd>
                    <PlatformTd className="tabular-nums">{row.trial_end?.slice(0, 10) ?? "—"}</PlatformTd>
                    <PlatformTd className="tabular-nums">{row.current_period_end?.slice(0, 10) ?? "—"}</PlatformTd>
                    <PlatformTd className="tabular-nums">{row.past_due_at?.slice(0, 10) ?? "—"}</PlatformTd>
                    <PlatformTd className="font-mono text-xs">
                      {row.provider_customer_id ? (
                        <a
                          className="underline"
                          href={`https://dashboard.stripe.com/test/customers/${row.provider_customer_id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.provider_customer_id.slice(0, 14)}…
                        </a>
                      ) : (
                        "—"
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
        )}
      </PlatformPanel>

      <PlatformPanel title="Événements de facturation récents" description="Journal d'audit — pas un relevé bancaire.">
        {(events ?? []).length === 0 ? (
          <PlatformEmpty
            title="Aucun événement"
            description="Aucun payment.failed / subscription.* récent. Les encaissements confirmés ne sont pas inventés."
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {(events ?? []).map((event) => {
              const org = orgs?.find((item) => item.id === event.organization_id)
              return (
                <li
                  key={`${event.organization_id}-${event.created_at}-${event.action}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/40 px-3 py-2"
                >
                  <span>
                    <Link
                      className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                      href={`/platform/organizations/${event.organization_id}`}
                    >
                      {org?.name ?? event.organization_id.slice(0, 8)}
                    </Link>
                    <span className="text-muted-foreground"> · {eventLabel(event.action)}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">{event.created_at.slice(0, 19).replace("T", " ")}</span>
                </li>
              )
            })}
          </ul>
        )}
      </PlatformPanel>
    </div>
  )
}

function eventLabel(action: string) {
  switch (action) {
    case "payment.failed":
      return "Paiement échoué"
    case "subscription.canceled":
      return "Abonnement annulé"
    case "subscription.created":
      return "Abonnement créé"
    case "subscription.upgraded":
      return "Abonnement upgradé"
    case "subscription.changed":
      return "Abonnement modifié"
    default:
      return action
  }
}
