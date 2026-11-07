import Link from "next/link"
import { Cable, ShieldAlert, ShieldCheck, Unplug } from "lucide-react"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { OrgAvatar } from "@/components/platform/org-avatar"
import {
  PlatformEmpty,
  PlatformPageHeader,
  PlatformPanel,
  PlatformSelect,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { StatusBadge } from "@/components/platform/status-badge"
import { isBrevoTransactionalConfigured } from "@/lib/email/brevo-ready"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { integrationHealth, rangeStart } from "@/lib/platform/rules"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; health?: string }>
}) {
  const actor = await requirePlatformAdmin("platform.jobs.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const admin = createAdminClient()
  const since = rangeStart("1")
  let integrationsQ = admin
    .from("integrations")
    .select("id, organization_id, provider, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
  let failedQ = admin.from("webhook_deliveries").select("integration_id").eq("status", "failed").gte("created_at", since).limit(500)
  let deadQ = admin.from("webhook_deliveries").select("integration_id").eq("status", "dead").limit(500)
  if (supportScope) {
    integrationsQ = integrationsQ.eq("organization_id", supportScope.organizationId)
    failedQ = failedQ.eq("organization_id", supportScope.organizationId)
    deadQ = deadQ.eq("organization_id", supportScope.organizationId)
  }
  const [{ data: integrations }, { data: failed }, { data: dead }] = await Promise.all([integrationsQ, failedQ, deadQ])

  const failedCount = new Map<string, number>()
  for (const row of failed ?? []) failedCount.set(row.integration_id, (failedCount.get(row.integration_id) ?? 0) + 1)
  const deadIds = new Set((dead ?? []).map((row) => row.integration_id))

  const orgIds = [...new Set((integrations ?? []).map((row) => row.organization_id))]
  const { data: orgs } = orgIds.length ? await admin.from("organizations").select("id, name").in("id", orgIds) : { data: [] }

  let rows = (integrations ?? []).map((row) => {
    const failures = failedCount.get(row.id) ?? 0
    const health = integrationHealth({ failures24h: failures, dead: deadIds.has(row.id) })
    return {
      ...row,
      failures,
      health,
      orgName: orgs?.find((o) => o.id === row.organization_id)?.name ?? "—",
    }
  })
  if (params.provider) rows = rows.filter((row) => row.provider === params.provider)
  if (params.health === "degraded") rows = rows.filter((row) => row.health === "degraded")
  if (params.health === "healthy") rows = rows.filter((row) => row.health === "healthy")

  const active = (integrations ?? []).filter((r) => r.status === "active").length
  const degraded = (integrations ?? []).filter((r) => {
    const failures = failedCount.get(r.id) ?? 0
    return integrationHealth({ failures24h: failures, dead: deadIds.has(r.id) }) === "degraded"
  }).length
  const brevoReady = isBrevoTransactionalConfigured()
  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") || process.env.STRIPE_SECRET_KEY?.startsWith("sk_live"),
  )

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Intégrations"
        description="États mesurés via webhooks et configuration. Aucun secret affiché. WhatsApp reste indisponible."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Intégrations" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Connecteurs" value={String(integrations?.length ?? 0)} icon={Cable} hint="Lignes DB" />
        <MiniKpi index={1} label="Actifs" value={String(active)} icon={ShieldCheck} tone="good" />
        <MiniKpi index={2} label="Dégradés" value={String(degraded)} icon={ShieldAlert} tone={degraded > 0 ? "bad" : "good"} />
        <MiniKpi index={3} label="Échecs 24 h" value={String(failed?.length ?? 0)} icon={Unplug} tone={(failed?.length ?? 0) > 0 ? "warn" : "good"} />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ServiceCard
          title="Stripe"
          detail={stripeConfigured ? "Clé secrète présente (test ou live)." : "Aucune clé Stripe configurée."}
          ok={stripeConfigured}
          note="Présence de variable ≠ paiements confirmés."
        />
        <ServiceCard
          title="Brevo"
          detail={brevoReady ? "Configuration transactionnelle détectée." : "Brevo non configuré."}
          ok={brevoReady}
          note="Ne simule pas de livraisons réussies."
        />
        <ServiceCard title="WhatsApp" detail="Connecteur non disponible." ok={false} note="Indisponible par conception." />
      </section>

      <FilterBar>
        <PlatformSelect name="provider" defaultValue={params.provider ?? ""} className="max-w-[160px]">
          <option value="">Tous les providers</option>
          {[...new Set((integrations ?? []).map((r) => r.provider))].map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </PlatformSelect>
        <PlatformSelect name="health" defaultValue={params.health ?? ""} className="max-w-[160px]">
          <option value="">Toute santé</option>
          <option value="healthy">Saine</option>
          <option value="degraded">Dégradée</option>
        </PlatformSelect>
      </FilterBar>

      {rows.length === 0 ? (
        <PlatformEmpty title="Aucune intégration" description="Aucun connecteur pour ces filtres." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="900px">
            <thead>
              <tr>
                {["Provider", "Organisation", "Activé", "Échecs 24 h", "Santé", "Actions"].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[color:var(--pa-bg)]/80">
                  <PlatformTd className="font-semibold capitalize">{row.provider}</PlatformTd>
                  <PlatformTd>
                    <div className="flex items-center gap-2">
                      <OrgAvatar name={row.orgName} size="sm" />
                      <span>{row.orgName}</span>
                    </div>
                  </PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={row.status === "active" ? "Actif" : "Désactivé"} />
                  </PlatformTd>
                  <PlatformTd className="tabular-nums">{row.failures}{(failed?.length ?? 0) >= 500 ? "+" : ""}</PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={row.health === "degraded" ? "En retard" : "Traité"} />
                  </PlatformTd>
                  <PlatformTd>
                    <Link
                      className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                      href={`/platform/organizations/${row.organization_id}?tab=subscription`}
                    >
                      Fiche
                    </Link>
                  </PlatformTd>
                </tr>
              ))}
              <tr>
                <PlatformTd className="font-semibold">whatsapp</PlatformTd>
                <PlatformTd>—</PlatformTd>
                <PlatformTd>
                  <StatusBadge label="Désactivé" />
                </PlatformTd>
                <PlatformTd>—</PlatformTd>
                <PlatformTd>
                  <StatusBadge label="Suspendu" />
                </PlatformTd>
                <PlatformTd>—</PlatformTd>
              </tr>
            </tbody>
          </PlatformTable>
        </PlatformPanel>
      )}
    </div>
  )
}

function ServiceCard({ title, detail, ok, note }: { title: string; detail: string; ok: boolean; note: string }) {
  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(8,20,59,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[color:var(--pa-ink)]">{title}</h3>
        <StatusBadge label={ok ? "Actif" : "Désactivé"} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </article>
  )
}
