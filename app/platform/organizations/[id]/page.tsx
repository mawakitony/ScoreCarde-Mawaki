import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft, ExternalLink, MoreHorizontal } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import {
  checkPlatformDomain,
  startSupportSession,
  suspendOrganization,
  unsuspendOrganization,
  updateEntitlement,
} from "@/actions/platform"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { OrgAvatar } from "@/components/platform/org-avatar"
import { OrgDetailTabs } from "@/components/platform/org-tabs"
import {
  PlatformBtn,
  PlatformEmpty,
  PlatformField,
  PlatformNotice,
  PlatformPanel,
  PlatformSelect,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { StatusBadge } from "@/components/platform/status-badge"
import { loadEntitlements } from "@/lib/billing/account"
import { FEATURES, METRICS, PLANS, isPlanId } from "@/lib/billing/plans"
import { cataloguePrice } from "@/lib/platform/financial-metrics"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { accountState, activeSuspension, readSupportSession } from "@/lib/platform/data"
import { credentialState } from "@/lib/platform/dto"
import { canPlatform } from "@/lib/platform/permissions"
import {
  canEditEntitlements,
  canSuspendOrganization,
  maskEmail,
  supportCanRead,
  WOLOYEM_SLUG,
} from "@/lib/platform/rules"
import { accessStateLabel, daysRemaining, subscriptionStatusLabel } from "@/lib/platform/status-labels"
import {
  entitlementCopy,
  ENTITLEMENT_KEYS,
  parseOrgDetailTab,
  platformEnvironment,
} from "@/lib/platform/ui"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformOrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ notice?: string; tab?: string; q?: string; filter?: string }>
}) {
  const admin = await requirePlatformAdmin("platform.organizations.read")
  const { id } = await params
  const sp = await searchParams
  const tab = parseOrgDetailTab(sp.tab)
  const support = await readSupportSession(admin.userId)
  if (support && !supportCanRead({ open: true, sessionOrgId: support.organization_id, requestedOrgId: id })) notFound()

  const client = createAdminClient()
  const { data: organization } = await client
    .from("organizations")
    .select("id, name, slug, country, created_at")
    .eq("id", id)
    .maybeSingle()
  if (!organization) notFound()

  const [
    { data: subscription },
    { data: members },
    { data: domains },
    { data: integrations },
    { data: integrationsWithCreds },
    { data: entitlements },
    suspension,
    resolved,
    tallies,
    activity,
    owner,
  ] = await Promise.all([
    client
      .from("subscriptions")
      .select(
        "plan, status, billing_interval, provider_customer_id, provider_subscription_id, trial_end, current_period_end, past_due_at, cancel_at_period_end",
      )
      .eq("organization_id", id)
      .maybeSingle(),
    client.from("organization_members").select("user_id, role, access_role, profile:profiles(email)").eq("organization_id", id),
    client.from("custom_domains").select("id, domain, status, verified_at").eq("organization_id", id),
    client.from("integrations").select("id, provider, status").eq("organization_id", id),
    client.from("integrations").select("id").eq("organization_id", id).not("encrypted_credentials", "is", null),
    client.from("organization_entitlements").select("feature, enabled, limit_override").eq("organization_id", id),
    activeSuspension(id),
    loadEntitlements(id),
    loadOrgTallies(id),
    loadOrgActivity(id),
    loadOwner(id),
  ])
  const credentialConfiguredIds = new Set((integrationsWithCreds ?? []).map((row) => row.id))

  const storedPlan = subscription?.plan ?? "free"
  const plan = isPlanId(storedPlan) ? storedPlan : "free"
  const state = accountState({
    plan,
    status: subscription?.status ?? "active",
    trialEnd: subscription?.trial_end ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    pastDueAt: subscription?.past_due_at ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  })
  const canEdit = canEditEntitlements({ slug: organization.slug, allowed: canPlatform(admin, "platform.entitlements.manage") })
  const canSuspend = canSuspendOrganization({
    slug: organization.slug,
    allowed: canPlatform(admin, "platform.organizations.manage"),
  })
  const accessLabel = accessStateLabel(state, Boolean(suspension))
  const subLabel = subscription ? subscriptionStatusLabel(subscription.status) : "—"
  const trialDays = daysRemaining(subscription?.trial_end)
  const interval = subscription?.billing_interval === "yearly" ? "yearly" : "monthly"
  const price = cataloguePrice(plan, interval)
  const priceLabel = price ? `${(price.amountCents / 100).toFixed(2)} ${price.currency.toUpperCase()} / ${interval === "yearly" ? "an" : "mois"}` : "Non déterminé"
  const ctx = {
    organization,
    subscription,
    members: members ?? [],
    domains: domains ?? [],
    integrations: (integrations ?? []).map((row) => ({
      ...row,
      credentialsLabel: credentialConfiguredIds.has(row.id) ? credentialState("configured") : credentialState(null),
    })),
    entitlements: entitlements ?? [],
    suspension,
    resolved,
    tallies,
    activity,
    owner,
    plan,
    state,
    canEdit,
    canSuspend,
    accessLabel,
    subLabel,
    trialDays,
    priceLabel,
    adminCanSupport: canPlatform(admin, "platform.support.access"),
    notice: sp.notice,
    filter: sp.filter ?? "all",
    q: sp.q ?? "",
  }

  return (
    <div className="space-y-3.5 md:space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/platform/organizations"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Entreprises
        </Link>
      </div>

      <header className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(8,20,59,0.04)] md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <OrgAvatar name={organization.name} size="lg" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl tracking-tight text-[color:var(--pa-ink)] md:text-2xl">
                  {organization.name}
                </h1>
                <StatusBadge label={accessLabel} />
                {subscription ? <StatusBadge label={subLabel} /> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-[13px]">{organization.slug}</span>
                {" · "}
                {organization.country ?? "Pays —"}
                {" · "}
                Créée le {organization.created_at.slice(0, 10)}
                {" · "}
                {members?.length ?? 0} membre{(members?.length ?? 0) > 1 ? "s" : ""}
                {" · "}
                Plan {PLANS[plan].name}
              </p>
            </div>
          </div>
          <details className="relative">
            <summary className="flex h-10 list-none cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold marker:content-none">
              <MoreHorizontal className="size-4" aria-hidden />
              Actions
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-border bg-white p-1 shadow-lg">
              <Link
                className="block rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--pa-bg)]"
                href={`/platform/organizations/${id}?tab=settings`}
              >
                Paramètres & suspension
              </Link>
              {subscription?.provider_customer_id ? (
                <a
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--pa-bg)]"
                  href={stripeCustomerUrl(subscription.provider_customer_id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir Stripe
                </a>
              ) : null}
            </div>
          </details>
        </div>
        {sp.notice ? <div className="mt-4"><PlatformNotice message={sp.notice} /></div> : null}
      </header>

      <Suspense fallback={<div className="h-12 animate-pulse rounded-2xl bg-white" />}>
        <OrgDetailTabs organizationId={id} />
      </Suspense>

      {tab === "overview" ? <OverviewTab {...ctx} /> : null}
      {tab === "subscription" ? <SubscriptionTab {...ctx} /> : null}
      {tab === "users" ? <UsersTab {...ctx} /> : null}
      {tab === "permissions" ? <PermissionsTab {...ctx} /> : null}
      {tab === "activity" ? <ActivityTab {...ctx} /> : null}
      {tab === "invoices" ? <InvoicesTab /> : null}
      {tab === "domains" ? <DomainsTab {...ctx} /> : null}
      {tab === "settings" ? <SettingsTab {...ctx} /> : null}
    </div>
  )
}

type Ctx = {
  organization: { id: string; name: string; slug: string; country: string | null; created_at: string }
  subscription: {
    plan: string
    status: string
    billing_interval: string
    provider_customer_id: string | null
    provider_subscription_id: string | null
    trial_end: string | null
    current_period_end: string | null
    past_due_at: string | null
    cancel_at_period_end: boolean
  } | null
  members: { user_id: string; role: string; access_role: string | null; profile: unknown }[]
  domains: { id: string; domain: string; status: string; verified_at: string | null }[]
  integrations: { id: string; provider: string; status: string; credentialsLabel: string }[]
  entitlements: { feature: string; enabled: boolean; limit_override: number | null }[]
  suspension: Awaited<ReturnType<typeof activeSuspension>>
  resolved: Awaited<ReturnType<typeof loadEntitlements>>
  tallies: { scorecards: number; leads: number; assessments: number }
  activity: { id: string; action: string; created_at: string; actor_id: string | null }[]
  owner: { email: string | null } | null
  plan: keyof typeof PLANS
  state: string
  canEdit: boolean
  canSuspend: boolean
  accessLabel: string
  subLabel: string
  trialDays: number | null
  priceLabel: string
  adminCanSupport: boolean
  notice?: string
  filter: string
  q: string
}

function OverviewTab(ctx: Ctx) {
  return (
    <div className="space-y-3.5 md:space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Accès" value={ctx.accessLabel} hint="Statut compte" />
        <MiniKpi index={1} label="Plan" value={PLANS[ctx.plan].name} hint={ctx.subLabel} />
        <MiniKpi
          index={2}
          label="Essai restant"
          value={ctx.trialDays === null ? "—" : `${ctx.trialDays} j`}
          hint={ctx.subscription?.trial_end?.slice(0, 10) ?? "Pas d'essai daté"}
          tone={ctx.trialDays !== null && ctx.trialDays <= 3 ? "bad" : ctx.trialDays !== null && ctx.trialDays <= 7 ? "warn" : "default"}
        />
        <MiniKpi index={3} label="Membres" value={String(ctx.members.length)} hint="Collaborateurs" />
        <MiniKpi index={4} label="Scorecards" value={String(ctx.tallies.scorecards)} hint="Créées" />
        <MiniKpi index={5} label="Leads" value={String(ctx.tallies.leads)} hint="Collectés" />
        <MiniKpi index={6} label="Réponses" value={String(ctx.tallies.assessments)} hint="Sessions" />
        <MiniKpi
          index={7}
          label="Prix catalogue"
          value={ctx.priceLabel === "Non déterminé" ? "—" : ctx.priceLabel}
          hint={ctx.priceLabel === "Non déterminé" ? "Données incomplètes" : "Catalogue"}
          tone={ctx.priceLabel === "Non déterminé" ? "warn" : "default"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PlatformPanel title="Informations entreprise">
          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="Nom" value={ctx.organization.name} />
            <InfoItem label="Identifiant" value={ctx.organization.slug} mono />
            <InfoItem label="Pays" value={ctx.organization.country ?? "—"} />
            <InfoItem label="Création" value={ctx.organization.created_at.slice(0, 10)} />
            <InfoItem label="Propriétaire" value={maskEmail(ctx.owner?.email ?? null)} />
            <InfoItem label="Statut" value={ctx.accessLabel} />
            <InfoItem label="Client Stripe" value={ctx.subscription?.provider_customer_id ?? "—"} mono />
          </dl>
        </PlatformPanel>
        <SubscriptionCard ctx={ctx} compact />
      </div>
    </div>
  )
}

function SubscriptionTab(ctx: Ctx) {
  return (
    <div className="space-y-5">
      <SubscriptionCard ctx={ctx} />
      <PlatformPanel title="Intégrations" description="État réel des connecteurs (aucun secret affiché).">
        {ctx.integrations.length === 0 ? (
          <PlatformEmpty title="Aucune intégration" description="Pas de connecteur enregistré pour cette organisation." />
        ) : (
          <PlatformTable minWidth="520px">
            <thead>
              <tr>
                <PlatformTh>Fournisseur</PlatformTh>
                <PlatformTh>Credentials</PlatformTh>
                <PlatformTh>Statut</PlatformTh>
              </tr>
            </thead>
            <tbody>
              {ctx.integrations.map((row) => (
                <tr key={row.id}>
                  <PlatformTd>{row.provider}</PlatformTd>
                  <PlatformTd>{row.credentialsLabel}</PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={row.status.toUpperCase()} />
                  </PlatformTd>
                </tr>
              ))}
            </tbody>
          </PlatformTable>
        )}
      </PlatformPanel>
    </div>
  )
}

function SubscriptionCard({ ctx, compact }: { ctx: Ctx; compact?: boolean }) {
  const sub = ctx.subscription
  return (
    <PlatformPanel
      title="Abonnement actuel"
      description={compact ? undefined : "Données issues de la base — aucun prix inventé."}
      actions={
        sub?.provider_customer_id ? (
          <a
            href={stripeCustomerUrl(sub.provider_customer_id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-[color:var(--pa-primary)]"
          >
            Stripe <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null
      }
    >
      {!sub ? (
        <PlatformEmpty title="Aucun abonnement" description="Pas de ligne subscriptions pour cette organisation." />
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Plan" value={PLANS[ctx.plan].name} />
          <InfoItem label="Prix" value={ctx.priceLabel} />
          <InfoItem label="Statut" value={ctx.subLabel} />
          <InfoItem label="Fin d'essai" value={sub.trial_end?.slice(0, 10) ?? "—"} />
          <InfoItem label="Prochaine échéance" value={sub.current_period_end?.slice(0, 10) ?? "—"} />
          <InfoItem label="Période de grâce" value={sub.past_due_at ? `depuis ${sub.past_due_at.slice(0, 10)}` : "—"} />
          <InfoItem label="Intervalle" value={sub.billing_interval} />
          <InfoItem label="Subscription Stripe" value={sub.provider_subscription_id ?? "—"} mono />
        </dl>
      )}
    </PlatformPanel>
  )
}

function UsersTab(ctx: Ctx) {
  return (
    <PlatformPanel title="Membres" description={`${ctx.members.length} collaborateur(s)`}>
      {ctx.members.length === 0 ? (
        <PlatformEmpty title="Aucun membre" />
      ) : (
        <PlatformTable>
          <thead>
            <tr>
              <PlatformTh>Utilisateur</PlatformTh>
              <PlatformTh>E-mail</PlatformTh>
              <PlatformTh>Rôle</PlatformTh>
              <PlatformTh>Statut</PlatformTh>
              <PlatformTh>Actions</PlatformTh>
            </tr>
          </thead>
          <tbody>
            {ctx.members.map((member) => {
              const email = joinedEmail(member.profile)
              const role = member.access_role ?? member.role
              return (
                <tr key={member.user_id}>
                  <PlatformTd>
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-[color:var(--pa-navy)] text-[11px] font-semibold text-white">
                        {(email ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium">{role === "owner" ? "Propriétaire" : "Membre"}</span>
                    </div>
                  </PlatformTd>
                  <PlatformTd className="font-mono text-[13px]">{maskEmail(email)}</PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={role.toUpperCase()} />
                  </PlatformTd>
                  <PlatformTd>
                    <StatusBadge label="ACTIVE" />
                  </PlatformTd>
                  <PlatformTd className="text-muted-foreground">—</PlatformTd>
                </tr>
              )
            })}
          </tbody>
        </PlatformTable>
      )}
    </PlatformPanel>
  )
}

function PermissionsTab(ctx: Ctx) {
  const q = ctx.q.trim().toLowerCase()
  const rows = ENTITLEMENT_KEYS.filter((key) => {
    const copy = entitlementCopy(key)
    if (q && !`${key} ${copy.label} ${copy.description}`.toLowerCase().includes(q)) return false
    const isFeature = (FEATURES as readonly string[]).includes(key)
    const planDefault = isFeature ? PLANS[ctx.plan].features.includes(key as (typeof FEATURES)[number]) : false
    const override = ctx.entitlements.find((item) => item.feature === key)
    const effective = isFeature
      ? ctx.resolved.features.has(key as (typeof FEATURES)[number])
      : ctx.resolved.limits[key as (typeof METRICS)[number]] !== undefined
    if (ctx.filter === "active" && !effective) return false
    if (ctx.filter === "disabled" && effective) return false
    if (ctx.filter === "override" && !override) return false
    if (ctx.filter === "plan" && (!planDefault || override)) return false
    return true
  })

  return (
    <div className="space-y-5">
      <PlatformPanel title="Permissions" description="Fonctionnalités effectives et overrides — contrôlés côté serveur. Compte internal non modifiable.">
        <form className="mb-4 flex flex-wrap gap-2" method="get">
          <input type="hidden" name="tab" value="permissions" />
          <PlatformField name="q" defaultValue={ctx.q} placeholder="Rechercher une fonctionnalité" className="max-w-xs" />
          <PlatformSelect name="filter" defaultValue={ctx.filter} className="max-w-[180px]">
            <option value="all">Toutes</option>
            <option value="active">Effectives actives</option>
            <option value="disabled">Effectives off</option>
            <option value="override">Avec override</option>
            <option value="plan">Incluses au plan</option>
          </PlatformSelect>
          <PlatformBtn type="submit" variant="secondary">
            Filtrer
          </PlatformBtn>
        </form>

        <PlatformTable minWidth="880px">
          <thead>
            <tr>
              <PlatformTh>Fonctionnalité</PlatformTh>
              <PlatformTh>Description</PlatformTh>
              <PlatformTh>Inclus plan</PlatformTh>
              <PlatformTh>Override</PlatformTh>
              <PlatformTh>Statut effectif</PlatformTh>
            </tr>
          </thead>
          <tbody>
            {rows.map((key) => {
              const copy = entitlementCopy(key)
              const isFeature = (FEATURES as readonly string[]).includes(key)
              const planDefault = isFeature ? PLANS[ctx.plan].features.includes(key as (typeof FEATURES)[number]) : false
              const override = ctx.entitlements.find((item) => item.feature === key)
              const effectiveOn = isFeature
                ? ctx.resolved.features.has(key as (typeof FEATURES)[number])
                : Number(ctx.resolved.limits[key as (typeof METRICS)[number]] ?? 0) > 0 ||
                  ctx.resolved.limits[key as (typeof METRICS)[number]] === null
              return (
                <tr key={key}>
                  <PlatformTd>
                    <div className="font-medium">{copy.label}</div>
                  </PlatformTd>
                  <PlatformTd className="max-w-[220px] text-muted-foreground">{copy.description}</PlatformTd>
                  <PlatformTd>
                    {isFeature ? (
                      <StatusBadge label={planDefault ? "Actif" : "Désactivé"} />
                    ) : (
                      <span className="text-muted-foreground">limite</span>
                    )}
                  </PlatformTd>
                  <PlatformTd>
                    {override
                      ? `${override.enabled ? "on" : "off"}${override.limit_override !== null ? ` · lim ${override.limit_override}` : ""}`
                      : "—"}
                  </PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={effectiveOn ? "Actif" : "Désactivé"} />
                  </PlatformTd>
                </tr>
              )
            })}
          </tbody>
        </PlatformTable>
        {rows.length === 0 ? <div className="mt-3"><PlatformEmpty title="Aucun résultat" description="Ajustez la recherche ou le filtre." /></div> : null}
      </PlatformPanel>

      {ctx.canEdit ? (
        <PlatformPanel title="Modifier un entitlement" description="Confirmation implicite via enregistrement — contrôle serveur obligatoire.">
          <form action={saveEntitlement.bind(null, ctx.organization.id)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Fonctionnalité</span>
              <PlatformSelect name="feature" required>
                {ENTITLEMENT_KEYS.map((feature) => (
                  <option key={feature} value={feature}>
                    {entitlementCopy(feature).label}
                  </option>
                ))}
              </PlatformSelect>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Override</span>
              <PlatformSelect name="enabled" required>
                <option value="true">Activer</option>
                <option value="false">Désactiver</option>
              </PlatformSelect>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Limite (optionnel)</span>
              <PlatformField name="limit" placeholder="vide = aucune" />
            </label>
            <div className="flex items-end">
              <PlatformBtn type="submit" className="w-full">
                Enregistrer
              </PlatformBtn>
            </div>
          </form>
        </PlatformPanel>
      ) : (
        <PlatformPanel title="Modification">
          <p className="text-sm text-muted-foreground">
            {ctx.organization.slug === WOLOYEM_SLUG
              ? "Le plan internal de WOLOYEM reste inchangé."
              : "Permission insuffisante pour modifier les entitlements."}
          </p>
        </PlatformPanel>
      )}
    </div>
  )
}

function ActivityTab(ctx: Ctx) {
  return (
    <PlatformPanel title="Activité" description="Journal d'audit réel de l'organisation (50 derniers).">
      {ctx.activity.length === 0 ? (
        <PlatformEmpty title="Aucune activité" description="Pas d'événements d'audit pour cette organisation." />
      ) : (
        <PlatformTable>
          <thead>
            <tr>
              <PlatformTh>Date</PlatformTh>
              <PlatformTh>Action</PlatformTh>
              <PlatformTh>Acteur</PlatformTh>
            </tr>
          </thead>
          <tbody>
            {ctx.activity.map((row) => (
              <tr key={row.id}>
                <PlatformTd className="tabular-nums">{row.created_at.slice(0, 19).replace("T", " ")}</PlatformTd>
                <PlatformTd className="font-mono text-[13px]">{row.action}</PlatformTd>
                <PlatformTd className="font-mono text-[12px] text-muted-foreground">{row.actor_id ? `${row.actor_id.slice(0, 8)}…` : "système"}</PlatformTd>
              </tr>
            ))}
          </tbody>
        </PlatformTable>
      )}
    </PlatformPanel>
  )
}

function InvoicesTab() {
  return (
    <PlatformPanel title="Factures" description="Aucune facture n'est inventée. Les factures Stripe ne sont listées que si synchronisées localement.">
      <PlatformEmpty
        title="Aucune facture locale"
        description="Pas de table de factures synchronisée pour l'instant. Utilisez le lien Stripe client lorsqu'un identifiant valide existe."
      />
    </PlatformPanel>
  )
}

function DomainsTab(ctx: Ctx) {
  return (
    <PlatformPanel title="Domaines personnalisés">
      {ctx.domains.length === 0 ? (
        <PlatformEmpty title="Aucun domaine" description="Cette organisation n'a pas de domaine personnalisé." />
      ) : (
        <PlatformTable>
          <thead>
            <tr>
              <PlatformTh>Domaine</PlatformTh>
              <PlatformTh>Statut</PlatformTh>
              <PlatformTh>Vérifié</PlatformTh>
              <PlatformTh>Actions</PlatformTh>
            </tr>
          </thead>
          <tbody>
            {ctx.domains.map((domain) => (
              <tr key={domain.id}>
                <PlatformTd className="font-medium">{domain.domain}</PlatformTd>
                <PlatformTd>
                  <StatusBadge label={domain.status.toUpperCase()} />
                </PlatformTd>
                <PlatformTd>{domain.verified_at?.slice(0, 10) ?? "non vérifié"}</PlatformTd>
                <PlatformTd>
                  <form action={checkDomain.bind(null, domain.id)}>
                    <PlatformBtn type="submit" variant="secondary">
                      Vérifier DNS
                    </PlatformBtn>
                  </form>
                </PlatformTd>
              </tr>
            ))}
          </tbody>
        </PlatformTable>
      )}
    </PlatformPanel>
  )
}

function SettingsTab(ctx: Ctx) {
  return (
    <div className="space-y-5">
      {ctx.adminCanSupport ? (
        <PlatformPanel title="Mode support" description="Ouverture d'une session support journalisée (raison ≥ 20 caractères).">
          <form action={openSupport.bind(null, ctx.organization.id)} className="space-y-3">
            <textarea
              name="reason"
              required
              minLength={20}
              placeholder="Motif d'accès support…"
              className="min-h-24 w-full rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-[color:var(--pa-primary)] focus:ring-2 focus:ring-[color:var(--pa-primary)]/20"
            />
            <PlatformBtn type="submit">Ouvrir le mode support</PlatformBtn>
          </form>
        </PlatformPanel>
      ) : null}

      {ctx.canSuspend && !ctx.suspension ? (
        <PlatformPanel title="Suspension" description="Action sensible — journalisée. WOLOYEM ne peut pas être suspendu.">
          <form action={suspend.bind(null, ctx.organization.id)} className="space-y-3">
            <PlatformField name="reason" required minLength={8} placeholder="Motif (≥ 8 caractères)" />
            <PlatformBtn type="submit" variant="danger">
              Suspendre l&apos;organisation
            </PlatformBtn>
          </form>
        </PlatformPanel>
      ) : null}

      {ctx.canSuspend && ctx.suspension ? (
        <PlatformPanel title="Organisation suspendue" description={ctx.suspension.reason ? `Motif : ${ctx.suspension.reason}` : "Suspension active"}>
          <form action={unsuspend.bind(null, ctx.organization.id)}>
            <PlatformBtn type="submit" variant="secondary">
              Lever la suspension
            </PlatformBtn>
          </form>
        </PlatformPanel>
      ) : null}

      {!ctx.adminCanSupport && !ctx.canSuspend ? (
        <PlatformEmpty title="Aucune action disponible" description="Permissions insuffisantes pour le support ou la suspension." />
      ) : null}
    </div>
  )
}

function stripeCustomerUrl(customerId: string) {
  const env = platformEnvironment()
  const base = env.code === "PRODUCTION" ? "https://dashboard.stripe.com/customers" : "https://dashboard.stripe.com/test/customers"
  return `${base}/${customerId}`
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/50 px-3 py-2.5">
      <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={`mt-1 text-sm font-medium text-[color:var(--pa-ink)] ${mono ? "font-mono text-[13px] break-all" : ""}`}>
        {value}
      </dd>
    </div>
  )
}

function joinedEmail(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0]
    return first && typeof first === "object" && "email" in first && typeof first.email === "string" ? first.email : null
  }
  if (value && typeof value === "object" && "email" in value && typeof value.email === "string") return value.email
  return null
}

async function loadOrgTallies(organizationId: string) {
  const admin = createAdminClient()
  const [{ data: cards }, leads] = await Promise.all([
    admin.from("scorecards").select("id").eq("organization_id", organizationId),
    admin.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
  ])
  const cardIds = (cards ?? []).map((row) => row.id)
  const assessments = cardIds.length
    ? await admin.from("assessment_sessions").select("id", { count: "exact", head: true }).in("scorecard_id", cardIds)
    : { count: 0 }
  return {
    scorecards: cardIds.length,
    leads: leads.count ?? 0,
    assessments: assessments.count ?? 0,
  }
}

async function loadOrgActivity(organizationId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("audit_logs")
    .select("id, action, created_at, actor_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50)
  return data ?? []
}

async function loadOwner(organizationId: string) {
  const admin = createAdminClient()
  const { data: member } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .maybeSingle()
  if (!member) return null
  const { data: profile } = await admin.from("profiles").select("email").eq("id", member.user_id).maybeSingle()
  return { email: profile?.email ?? null }
}

async function saveEntitlement(organizationId: string, formData: FormData) {
  "use server"
  const result = await updateEntitlement(
    organizationId,
    String(formData.get("feature") ?? ""),
    String(formData.get("enabled")) === "true",
    String(formData.get("limit") ?? ""),
  )
  if (result && "error" in result && result.error) {
    redirect(`/platform/organizations/${organizationId}?tab=permissions&notice=${encodeURIComponent(result.error)}`)
  }
  redirect(`/platform/organizations/${organizationId}?tab=permissions&notice=${encodeURIComponent("Entitlement enregistré.")}`)
}

async function openSupport(organizationId: string, formData: FormData) {
  "use server"
  const result = await startSupportSession(organizationId, String(formData.get("reason") ?? ""))
  if (result && "error" in result && result.error) {
    redirect(`/platform/organizations/${organizationId}?tab=settings&notice=${encodeURIComponent(result.error)}`)
  }
  // Stay on the scoped org fiche — never imply the client dashboard switched tenants.
  redirect(`/platform/organizations/${organizationId}?tab=overview&notice=${encodeURIComponent("Session support ouverte — consultation limitée à cette organisation.")}`)
}

async function suspend(organizationId: string, formData: FormData) {
  "use server"
  const result = await suspendOrganization(organizationId, String(formData.get("reason") ?? ""))
  if (result && "error" in result && result.error) {
    redirect(`/platform/organizations/${organizationId}?tab=settings&notice=${encodeURIComponent(result.error)}`)
  }
  redirect(`/platform/organizations/${organizationId}?tab=settings&notice=${encodeURIComponent("Organisation suspendue.")}`)
}

async function unsuspend(organizationId: string) {
  "use server"
  const result = await unsuspendOrganization(organizationId)
  if (result && "error" in result && result.error) {
    redirect(`/platform/organizations/${organizationId}?tab=settings&notice=${encodeURIComponent(result.error)}`)
  }
  redirect(`/platform/organizations/${organizationId}?tab=settings&notice=${encodeURIComponent("Suspension levée.")}`)
}

async function checkDomain(domainId: string) {
  "use server"
  await checkPlatformDomain(domainId)
}
