import Link from "next/link"
import { Activity, AlertTriangle, HeartPulse, Server } from "lucide-react"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { PlatformEmpty, PlatformPageHeader, PlatformPanel } from "@/components/platform/page-chrome"
import { PlatformHealthCards } from "@/components/platform/platform-charts"
import { StatusBadge } from "@/components/platform/status-badge"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { loadOverview } from "@/lib/platform/data"
import { loadHealth, syncPlatformAlerts } from "@/lib/platform/health"
import { loadHealthStats } from "@/lib/platform/overview-series"
import { redirectIfSupportScoped } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"
import { cn } from "@/lib/utils"

export default async function PlatformHealthPage() {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  await redirectIfSupportScoped(actor.userId)
  const [checks, overview, events, alerts, healthStats] = await Promise.all([
    loadHealth(),
    loadOverview(),
    stripeEvents(),
    openAlerts(),
    loadHealthStats(),
  ])
  const degraded = checks.some((check) => check.name.endsWith("worker") && (check.status === "degraded" || check.status === "unavailable"))
  await syncPlatformAlerts({ deadJobs: overview?.jobsDead ?? 0, workersDegraded: degraded })

  const okCount = checks.filter((c) => c.status === "healthy").length
  const warnCount = checks.filter((c) => c.status === "degraded" || c.status === "not_configured").length
  const badCount = checks.filter((c) => c.status === "unavailable").length

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Santé système"
        description="Contrôles mesurés, événements Stripe enregistrés et alertes ouvertes. Aucune clé secrète affichée."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Santé" }]}
        actions={
          <Link className="text-sm font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline" href="/platform/alerts">
            Centre d&apos;alertes
          </Link>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Services OK" value={String(okCount)} icon={HeartPulse} tone="good" />
        <MiniKpi index={1} label="Dégradés" value={String(warnCount)} icon={Activity} tone={warnCount > 0 ? "warn" : "good"} />
        <MiniKpi index={2} label="Indisponibles" value={String(badCount)} icon={Server} tone={badCount > 0 ? "bad" : "good"} />
        <MiniKpi
          index={3}
          label="Alertes ouvertes"
          value={String(alerts.length)}
          icon={AlertTriangle}
          tone={alerts.length > 0 ? "warn" : "good"}
          href="/platform/alerts"
        />
      </section>

      <PlatformHealthCards data={healthStats} />

      <PlatformPanel title="Contrôles opérationnels" description="Résultat réel de loadHealth()">
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <li
              key={check.name}
              className={cn(
                "rounded-xl border px-3.5 py-3 text-sm",
                checkTone(check.status),
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[color:var(--pa-ink)]">{check.name}</p>
                <StatusBadge label={healthBadge(check.status)} />
              </div>
            </li>
          ))}
        </ul>
      </PlatformPanel>

      <div className="grid gap-3 xl:grid-cols-2">
        <PlatformPanel title="Événements Stripe" description="Uniquement les événements acceptés puis enregistrés.">
          {events.length === 0 ? (
            <PlatformEmpty title="Aucun événement" description="Aucun stripe_events récent — un webhook rejeté avant insertion n'apparaît pas." />
          ) : (
            <ul className="max-h-72 space-y-2 overflow-auto text-sm">
              {events.map((event) => (
                <li key={event.event_id} className="rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/50 px-3 py-2">
                  <p className="font-mono text-[12px]">{event.event_type}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {event.event_id.slice(0, 22)}… · {event.processed_at.slice(0, 19)} UTC
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PlatformPanel>

        <PlatformPanel title="Alertes ouvertes" description="Synchronisées au chargement">
          {alerts.length === 0 ? (
            <PlatformEmpty title="Aucune alerte ouverte" description="Aucun signal non résolu." />
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-3 py-2">
                  <p className="font-semibold">{alert.code.replace(/_/g, " ")}</p>
                  <p className="text-[12px] text-muted-foreground">{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </PlatformPanel>
      </div>

      <PlatformPanel title="Opérations" description="Compteurs overview">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <OpStat label="Jobs échoués" value={overview?.jobsFailed ?? "—"} />
          <OpStat label="Jobs dead" value={overview?.jobsDead ?? "—"} />
          <OpStat label="Domaines en attente" value={overview?.domainsPending ?? "—"} />
          <OpStat label="Essais ≤ 7 j" value={overview?.trials7d ?? "—"} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Fournisseur IA : {checks.find((check) => check.name === "AI provider")?.status ?? "—"}. Les volumes mensuels sont dans{" "}
          <Link className="font-semibold text-[color:var(--pa-primary)] hover:underline" href="/platform/usage">
            Usage
          </Link>
          .
        </p>
      </PlatformPanel>
    </div>
  )
}

function OpStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/50 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function checkTone(status: string) {
  if (status === "healthy") return "border-emerald-200 bg-emerald-50/60"
  if (status === "degraded" || status === "not_configured") return "border-amber-200 bg-amber-50/60"
  if (status === "unavailable") return "border-rose-200 bg-rose-50/60"
  return "border-border bg-[color:var(--pa-bg)]/60"
}

function healthBadge(status: string) {
  if (status === "healthy") return "Traité"
  if (status === "degraded" || status === "not_configured") return "Ouvert"
  if (status === "unavailable") return "Suspendu"
  return status
}

async function stripeEvents() {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("stripe_events")
      .select("event_id, event_type, processed_at")
      .order("processed_at", { ascending: false })
      .limit(20)
    return data ?? []
  } catch {
    return []
  }
}

async function openAlerts() {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("platform_alerts").select("id, code, message").is("resolved_at", null).limit(20)
    return data ?? []
  } catch {
    return []
  }
}
