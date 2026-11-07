import Link from "next/link"
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { resolvePlatformAlert } from "@/actions/platform"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import {
  PlatformBtn,
  PlatformEmpty,
  PlatformField,
  PlatformPageHeader,
  PlatformPanel,
  PlatformSelect,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { StatusBadge } from "@/components/platform/status-badge"
import { loadOverview } from "@/lib/platform/data"
import { loadHealth, syncPlatformAlerts } from "@/lib/platform/health"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { canPlatform } from "@/lib/platform/permissions"
import { redirectIfSupportScoped } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; severity?: string; q?: string; detail?: string }>
}) {
  const admin = await requirePlatformAdmin("platform.organizations.read")
  await redirectIfSupportScoped(admin.userId)
  const params = await searchParams
  const overview = await loadOverview()
  const health = await loadHealth()
  await syncPlatformAlerts({
    deadJobs: overview?.jobsDead ?? 0,
    workersDegraded: health.some((item) => item.status === "degraded" || item.status === "unavailable"),
  })
  const client = createAdminClient()
  const { data } = await client
    .from("platform_alerts")
    .select("id, code, message, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(150)
  const canResolve = canPlatform(admin, "platform.organizations.manage")

  const statusFilter = params.status === "open" || params.status === "resolved" ? params.status : "all"
  const severityFilter = params.severity === "high" || params.severity === "medium" || params.severity === "info" ? params.severity : "all"
  const query = (params.q ?? "").trim().toLowerCase()
  const detailId = params.detail ?? ""

  const rows = (data ?? [])
    .map((alert) => ({
      ...alert,
      severity: severityFor(alert.code),
      severityKey: severityKeyFor(alert.code),
    }))
    .filter((alert) => {
      if (statusFilter === "open" && alert.resolved_at) return false
      if (statusFilter === "resolved" && !alert.resolved_at) return false
      if (severityFilter !== "all" && alert.severityKey !== severityFilter) return false
      if (query && !`${alert.code} ${alert.message}`.toLowerCase().includes(query)) return false
      return true
    })

  const openCount = (data ?? []).filter((a) => !a.resolved_at).length
  const highCount = (data ?? []).filter((a) => !a.resolved_at && severityKeyFor(a.code) === "high").length
  const mediumCount = (data ?? []).filter((a) => !a.resolved_at && severityKeyFor(a.code) === "medium").length
  const resolvedCount = (data ?? []).filter((a) => a.resolved_at).length
  const detail = rows.find((row) => row.id === detailId) ?? rows[0] ?? null
  const preserved = linkQuery(params)

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Centre d'alertes"
        description="Signaux opérationnels — pas de qualification automatique de fraude."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Alertes" }]}
        actions={
          <Link className="text-sm font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline" href="/platform/health">
            Santé système
          </Link>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Ouvertes" value={String(openCount)} icon={AlertTriangle} tone={openCount > 0 ? "warn" : "good"} />
        <MiniKpi index={1} label="Critiques" value={String(highCount)} icon={AlertOctagon} tone={highCount > 0 ? "bad" : "good"} />
        <MiniKpi index={2} label="Avertissements" value={String(mediumCount)} icon={Info} tone={mediumCount > 0 ? "warn" : "default"} />
        <MiniKpi index={3} label="Résolues" value={String(resolvedCount)} icon={CheckCircle2} tone="good" />
      </section>

      <FilterBar>
        <PlatformField name="q" defaultValue={params.q ?? ""} placeholder="Code ou message" className="max-w-xs" />
        <PlatformSelect name="status" defaultValue={statusFilter} className="max-w-[150px]">
          <option value="all">Tous les statuts</option>
          <option value="open">Ouvertes</option>
          <option value="resolved">Résolues</option>
        </PlatformSelect>
        <PlatformSelect name="severity" defaultValue={severityFilter} className="max-w-[150px]">
          <option value="all">Toutes gravités</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="info">Info</option>
        </PlatformSelect>
      </FilterBar>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {rows.length === 0 ? (
            <PlatformEmpty title="Aucune alerte" description="Aucun signal pour ces filtres." />
          ) : (
            <PlatformPanel className="overflow-hidden p-0">
              <PlatformTable minWidth="880px">
                <thead>
                  <tr>
                    {["Type", "Gravité", "Message", "Date", "Statut", "Actions"].map((heading) => (
                      <PlatformTh key={heading}>{heading}</PlatformTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((alert) => (
                    <tr key={alert.id} className="hover:bg-[color:var(--pa-bg)]/80">
                      <PlatformTd className="font-mono text-xs">{humanCode(alert.code)}</PlatformTd>
                      <PlatformTd>
                        <SeverityBadge label={alert.severity} />
                      </PlatformTd>
                      <PlatformTd className="max-w-md">{alert.message}</PlatformTd>
                      <PlatformTd className="tabular-nums text-[12px]">{alert.created_at.slice(0, 16).replace("T", " ")}</PlatformTd>
                      <PlatformTd>
                        <StatusBadge label={alert.resolved_at ? "Traité" : "Ouvert"} />
                      </PlatformTd>
                      <PlatformTd>
                        <Link
                          className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                          href={`/platform/alerts?${preserved}&detail=${alert.id}`}
                        >
                          Détail
                        </Link>
                      </PlatformTd>
                    </tr>
                  ))}
                </tbody>
              </PlatformTable>
            </PlatformPanel>
          )}
        </div>

        <div className="xl:col-span-4">
          <PlatformPanel title="Détail de l'alerte" description="Timeline et actions autorisées" className="!p-4">
            {!detail ? (
              <p className="text-sm text-muted-foreground">Sélectionnez une alerte.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge label={detail.severity} />
                  <StatusBadge label={detail.resolved_at ? "Traité" : "Ouvert"} />
                </div>
                <p className="font-semibold text-[color:var(--pa-ink)]">{humanCode(detail.code)}</p>
                <p className="text-muted-foreground">{detail.message}</p>
                <ol className="space-y-2 border-l-2 border-[color:var(--pa-primary)]/25 pl-3">
                  <li>
                    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Détectée</p>
                    <p className="tabular-nums">{detail.created_at.slice(0, 19).replace("T", " ")}</p>
                  </li>
                  <li>
                    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Recommandation</p>
                    <p>{recommendedAction(detail.code)}</p>
                  </li>
                  {detail.resolved_at ? (
                    <li>
                      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Résolue</p>
                      <p className="tabular-nums">{detail.resolved_at.slice(0, 19).replace("T", " ")}</p>
                    </li>
                  ) : null}
                </ol>
                {!detail.resolved_at && canResolve ? (
                  <form action={resolveAlertAction} className="space-y-2 border-t border-border pt-3">
                    <input type="hidden" name="alertId" value={detail.id} />
                    <PlatformField name="note" required minLength={8} placeholder="Motif de résolution (≥ 8 car.)" />
                    <PlatformBtn type="submit" className="h-9 w-full">
                      Résoudre
                    </PlatformBtn>
                  </form>
                ) : null}
              </div>
            )}
          </PlatformPanel>
        </div>
      </div>
    </div>
  )
}

async function resolveAlertAction(formData: FormData) {
  "use server"
  await resolvePlatformAlert(String(formData.get("alertId") ?? ""), String(formData.get("note") ?? ""))
}

function severityFor(code: string) {
  const key = severityKeyFor(code)
  if (key === "high") return "Haute"
  if (key === "medium") return "Moyenne"
  return "Info"
}

function severityKeyFor(code: string): "high" | "medium" | "info" {
  if (code.includes("dead") || code.includes("past_due") || code.includes("brevo")) return "high"
  if (code.includes("trial") || code.includes("stale")) return "medium"
  return "info"
}

function humanCode(code: string) {
  return code.replace(/_/g, " ")
}

function recommendedAction(code: string) {
  if (code.includes("brevo")) return "Activer SMTP Brevo / vérifier la configuration e-mail"
  if (code.includes("past_due")) return "Contacter le propriétaire / vérifier Stripe"
  if (code.includes("trial")) return "Suivre rappels J-7 / J-3 / J-1"
  if (code.includes("cron")) return "Vérifier CRON_SECRET et les déploiements"
  return "Investiguer dans Santé / Jobs"
}

function SeverityBadge({ label }: { label: string }) {
  const tone =
    label === "Haute"
      ? "bg-rose-500/12 text-rose-800"
      : label === "Moyenne"
        ? "bg-amber-500/15 text-amber-900"
        : "bg-sky-500/12 text-sky-800"
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>
}

function linkQuery(params: { status?: string; severity?: string; q?: string }) {
  const search = new URLSearchParams()
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.severity && params.severity !== "all") search.set("severity", params.severity)
  if (params.q) search.set("q", params.q)
  return search.toString()
}
