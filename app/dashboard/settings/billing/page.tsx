import { CreditCard, Gauge, ShieldCheck } from "lucide-react"
import { PlanActions, PortalButton } from "@/components/billing/plan-actions"
import { can } from "@/lib/auth/permissions"
import { loadEntitlements, monthlyUsage } from "@/lib/billing/account"
import { usageLevel } from "@/lib/billing/usage"
import { PLANS, publicPlans, type Feature, type PlanDefinition } from "@/lib/billing/plans"
import { ensureMembership } from "@/lib/data/membership"
import { requireUser } from "@/lib/auth/session"
import { formatNumber } from "@/lib/format"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { WS_ENTER, WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Facturation" }

const statusLabels: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
  past_due: "Paiement en retard",
  canceled: "Annulé",
  unpaid: "Impayé",
  incomplete: "Incomplet",
  incomplete_expired: "Expiré",
  paused: "En pause",
  unavailable: "Indisponible",
}

const featureLabels: Record<Feature, string> = {
  advanced_analytics: "Analytics avancées",
  csv_export: "Export CSV",
  pdf_reports: "Rapports PDF",
  webhooks: "Webhooks",
  basic_automation: "Automatisations de base",
  advanced_automation: "Automatisations avancées",
  brevo: "Brevo",
  api: "API",
  ai: "Assistant IA",
  custom_branding: "Marque personnalisée",
  custom_domain: "Domaine personnalisé",
  remove_powered_by: "Sans mention WOLOYEM",
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  await requireUser()
  const membership = await ensureMembership()
  if (!membership) return null
  const params = await searchParams
  const entitlements = await loadEntitlements(membership.organization.id)
  const manager = can({ role: membership.role }, "billing.manage")
  const viewer = manager || can({ role: membership.role }, "billing.view")
  if (!viewer) {
    return (
      <p className={cn(WS_PANEL, "p-5 text-sm text-muted-foreground")}>Permission refusée.</p>
    )
  }

  let periodEnd: string | null = null
  let status: string = entitlements.access
  let interval = "monthly"
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("subscriptions")
      .select("status, billing_interval, current_period_end, trial_end")
      .eq("organization_id", membership.organization.id)
      .maybeSingle()
    periodEnd = data?.current_period_end ?? data?.trial_end ?? null
    status = data?.status ?? status
    interval = data?.billing_interval ?? interval
  } catch {
    status = "unavailable"
  }

  const [starts, leads, scorecards, members, aiGenerations] = await Promise.all([
    monthlyUsage(membership.organization.id, "assessment_starts"),
    monthlyUsage(membership.organization.id, "leads"),
    countRows("scorecards", membership.organization.id),
    countRows("organization_members", membership.organization.id),
    monthlyUsage(membership.organization.id, "ai_generations"),
  ])

  const plan = PLANS[entitlements.plan]
  const plans = publicPlans()
  const yearly = interval === "yearly"
  const priceLabel = priceOf(plan, yearly ? "yearly" : "monthly")
  const statusLabel = statusLabels[status] ?? status

  return (
    <div className="space-y-4">
      {params.checkout === "return" ? (
        <p className={cn(WS_PANEL, "p-4 text-[13px] text-[color:var(--brand-500)]")}>
          Paiement reçu par Stripe. Le plan est activé après confirmation du webhook.
        </p>
      ) : null}
      {params.checkout === "cancel" ? (
        <p className={cn(WS_PANEL, "p-4 text-[13px] text-muted-foreground")}>
          Paiement annulé. Aucun changement n&apos;a été appliqué.
        </p>
      ) : null}
      {status === "unavailable" ? (
        <p className={cn(WS_PANEL, "p-4 text-[13px] text-muted-foreground")}>
          Les informations de facturation sont temporairement indisponibles.
        </p>
      ) : null}

      <section className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
                <CreditCard className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                  Abonnement actuel
                </p>
                <h2 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-foreground">
                  {plan.name}
                </h2>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Item label="Statut" value={statusLabel} />
              <Item label="Période" value={yearly ? "Annuelle" : "Mensuelle"} />
              <Item label="Tarif catalogue" value={priceLabel ?? "Confirmé sur Stripe au paiement"} />
              <Item
                label="Renouvellement"
                value={
                  periodEnd
                    ? new Date(periodEnd).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Sans échéance Stripe"
                }
              />
            </dl>
            {entitlements.exceedsPlan ? (
              <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                Votre consommation actuelle dépasse les limites du plan.
              </p>
            ) : null}
          </div>
          <div className="shrink-0">
            {manager && entitlements.plan !== "internal" ? <PortalButton /> : null}
          </div>
        </div>
      </section>

      <section className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-9")}>
            <Gauge className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Utilisation et quotas</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Consommation réelle par rapport aux limites du plan actuel.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Quota label="Scorecards" used={scorecards} limit={entitlements.limits.scorecards} />
          <Quota label="Leads (mois)" used={leads} limit={entitlements.limits.leads} />
          <Quota label="Évaluations démarrées (mois)" used={starts} limit={entitlements.limits.assessment_starts} />
          <Quota label="Membres" used={members} limit={entitlements.limits.team_members} />
          <Quota label="Générations IA (mois)" used={aiGenerations} limit={entitlements.limits.ai_generations} />
        </div>
      </section>

      {manager && entitlements.plan !== "internal" ? (
        <section className={cn(WS_PANEL, "p-5 md:p-6")}>
          <h2 className="text-base font-semibold text-foreground">Plans disponibles</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Les montants définitifs sont confirmés par Stripe. Aucune promotion n&apos;est inventée ici.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((item, index) => {
              const current = item.id === entitlements.plan
              const monthly = priceOf(item, "monthly")
              return (
                <article
                  key={item.id}
                  className={cn(
                    WS_ENTER,
                    "flex flex-col rounded-2xl border p-4",
                    current
                      ? "border-[color:var(--brand-500)]/50 bg-[color:var(--brand-500)]/5"
                      : "border-border bg-[color:var(--surface)]",
                  )}
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                    {current ? (
                      <span className="rounded-full bg-[color:var(--brand-950)] px-2.5 py-0.5 text-[11px] font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]">
                        Actuel
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    {monthly ?? (item.id === "enterprise" ? "Sur devis" : "Via Stripe")}
                    {monthly && item.monthlyPrice !== 0 ? " / mois" : ""}
                  </p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-[13px] text-foreground">
                    <li>{limitLabel(item.limits.scorecards)} scorecards</li>
                    <li>{limitLabel(item.limits.assessment_starts)} démarrages / mois</li>
                    <li>{limitLabel(item.limits.leads)} leads / mois</li>
                    <li>{limitLabel(item.limits.team_members)} membres</li>
                    <li>{limitLabel(item.limits.ai_generations)} générations IA / mois</li>
                    {item.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="text-muted-foreground">
                        {featureLabels[feature]}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 space-y-2">
                    {item.selfServe ? (
                      <>
                        <PlanActions
                          plan={item.id}
                          interval="monthly"
                          current={current && !yearly}
                          label={current && !yearly ? undefined : `Choisir ${item.name} mensuel`}
                        />
                        {item.id === "pro" ? (
                          <PlanActions
                            plan="pro"
                            interval="yearly"
                            current={current && yearly}
                            label={current && yearly ? undefined : "Choisir Pro annuel"}
                          />
                        ) : null}
                      </>
                    ) : item.id === "free" ? (
                      <p className="text-[13px] text-muted-foreground">
                        {current ? "Plan actuel" : "Plan d'entrée"}
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">Contact commercial</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-9")}>
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Gestion</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Le portail Stripe permet de mettre à jour le moyen de paiement et les informations de
              facturation déjà configurées.
            </p>
          </div>
        </div>
        <div className="mt-4">
          {manager && entitlements.plan !== "internal" ? (
            <PortalButton />
          ) : (
            <p className="text-[13px] text-muted-foreground">Consultation seule pour votre rôle.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-[color:var(--surface)] p-5 md:p-6">
        <h2 className="text-base font-semibold text-foreground">Zone sensible</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">
          La suppression d&apos;organisation n&apos;est pas disponible tant que Stripe et le stockage ne
          sont pas audités.
        </p>
      </section>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2.5">
      <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-foreground">{value}</dd>
    </div>
  )
}

function Quota({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const level = usageLevel(used, limit)
  const ratio = limit === null || limit <= 0 ? null : Math.min(1, used / limit)
  const percent = ratio === null ? null : Math.round(ratio * 100)
  return (
    <div className="rounded-xl border border-border bg-[color:var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3 text-[13px]">
        <p className="font-medium text-foreground">{label}</p>
        <p className="shrink-0 tabular-nums text-muted-foreground">
          {formatNumber(used)} / {limitLabel(limit)}
        </p>
      </div>
      {ratio === null ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          {limit === null
            ? "Illimité"
            : level === "full"
              ? "Limite atteinte"
              : "Aucune capacité sur ce plan"}
        </p>
      ) : (
        <>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent ?? 0}
            aria-label={label}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                level === "full"
                  ? "bg-destructive"
                  : level === "warn90" || level === "warn80"
                    ? "bg-[color:var(--brand-300)]"
                    : "bg-[color:var(--brand-500)]",
              )}
              style={{ width: `${Math.max(percent && percent > 0 ? 4 : 0, percent ?? 0)}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {percent} %
            {level === "full"
              ? " · limite atteinte"
              : level === "warn90" || level === "warn80"
                ? " · proche de la limite"
                : ""}
          </p>
        </>
      )}
    </div>
  )
}

function limitLabel(value: number | null) {
  return value === null ? "Illimité" : formatNumber(value)
}

function priceOf(plan: PlanDefinition, interval: "monthly" | "yearly") {
  const amount = interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
  if (amount === null) return null
  if (amount === 0) return "Gratuit"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount)
}

async function countRows(table: "scorecards" | "organization_members", organizationId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
  return count ?? 0
}
