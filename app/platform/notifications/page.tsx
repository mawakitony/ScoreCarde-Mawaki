import Link from "next/link"
import { AlertTriangle, Clock3, Mail, Send } from "lucide-react"
import { EmailJobsChartView } from "@/components/platform/email-jobs-chart"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
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
import { StatusBadge } from "@/components/platform/status-badge"
import { isBrevoTransactionalConfigured } from "@/lib/email/brevo-ready"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { maskEmail, pageWindow } from "@/lib/platform/rules"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { createAdminClient } from "@/lib/supabase/admin"

const PAGE = 40
const STATUSES = ["pending", "processing", "sent", "failed", "dead"] as const
type JobStatus = (typeof STATUSES)[number]

export default async function PlatformNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string; template?: string }>
}) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const window = pageWindow(Number(params.page ?? 1), PAGE)
  const admin = createAdminClient()
  const statusFilter = STATUSES.includes(params.status as JobStatus) ? (params.status as JobStatus) : null
  const query = (params.q ?? "").replace(/[%_,]/g, "").trim()
  const templateFilter = (params.template ?? "").trim()
  const brevoReady = isBrevoTransactionalConfigured()
  const snapshot = Date.parse(new Date().toISOString())
  const sinceIso = new Date(snapshot - 30 * 864e5).toISOString()
  const orgId = supportScope?.organizationId

  const scope = <T extends { eq: (col: string, val: string) => T }>(q: T) =>
    orgId ? q.eq("organization_id", orgId) : q

  const [
    { count: sentCount },
    { count: pendingCount },
    { count: failedCount },
    { count: deadCount },
    { data: seriesRows },
  ] = await Promise.all([
    scope(admin.from("email_jobs").select("id", { count: "exact", head: true }).eq("status", "sent")),
    scope(admin.from("email_jobs").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"])),
    scope(admin.from("email_jobs").select("id", { count: "exact", head: true }).eq("status", "failed")),
    scope(admin.from("email_jobs").select("id", { count: "exact", head: true }).eq("status", "dead")),
    scope(admin.from("email_jobs").select("created_at, status").gte("created_at", sinceIso).limit(3000)),
  ])

  let request = admin
    .from("email_jobs")
    .select("id, template, recipient, status, attempts, last_error, created_at, sent_at, organization_id", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
  if (orgId) request = request.eq("organization_id", orgId)
  if (statusFilter) request = request.eq("status", statusFilter)
  if (templateFilter) request = request.eq("template", templateFilter)
  if (query.includes("@")) request = request.ilike("recipient", `%${query}%`)
  const { data, count } = await request.range(window.from, window.to)

  const orgIds = [...new Set((data ?? []).map((row) => row.organization_id).filter(Boolean))] as string[]
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] }

  const chart = buildEmailSeries(seriesRows ?? [], snapshot)
  const preserved = linkQuery(params)

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Notifications"
        description={`File email_jobs (Brevo). Configurée : ${brevoReady ? "oui" : "non"}. Aucun envoi inventé.`}
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Notifications" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Envoyés" value={String(sentCount ?? 0)} icon={Send} tone="good" hint="Stock total" />
        <MiniKpi
          index={1}
          label="En attente"
          value={String(pendingCount ?? 0)}
          icon={Clock3}
          tone={(pendingCount ?? 0) > 0 ? "warn" : "default"}
        />
        <MiniKpi
          index={2}
          label="Échoués"
          value={String(failedCount ?? 0)}
          icon={AlertTriangle}
          tone={(failedCount ?? 0) > 0 ? "bad" : "good"}
        />
        <MiniKpi
          index={3}
          label="Dead"
          value={String(deadCount ?? 0)}
          icon={Mail}
          tone={(deadCount ?? 0) > 0 ? "bad" : "good"}
          hint="File morte"
        />
      </section>

      <section className={`${WS_PANEL} p-3.5`}>
        <h3 className="text-[14px] font-semibold text-[color:var(--pa-ink)]">Évolution des e-mails (30 j)</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Créations de jobs — données réelles email_jobs</p>
        {chart.every((row) => row.total === 0) ? (
          <div className="mt-3">
            <PlatformEmpty title="Données insuffisantes" description="Aucun job e-mail sur les 30 derniers jours." />
          </div>
        ) : (
          <div className="mt-2.5 h-[240px]">
            <EmailJobsChartView data={chart} />
          </div>
        )}
      </section>

      <FilterBar>
        <PlatformField name="q" defaultValue={query} placeholder="Destinataire (e-mail)" className="max-w-xs" />
        <PlatformSelect name="status" defaultValue={statusFilter ?? ""} className="max-w-[160px]">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="sent">Envoyé</option>
          <option value="failed">Échoué</option>
          <option value="dead">Dead</option>
        </PlatformSelect>
        <PlatformField name="template" defaultValue={templateFilter} placeholder="Template" className="max-w-[180px]" />
      </FilterBar>

      {(data ?? []).length === 0 ? (
        <PlatformEmpty title="Aucune notification" description="Aucun job pour ces filtres." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="980px">
            <thead>
              <tr>
                {["Template", "Destinataire", "Organisation", "Statut", "Essais", "Erreur", "Créé", "Envoyé"].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((job) => (
                <tr key={job.id} className="hover:bg-[color:var(--pa-bg)]/80">
                  <PlatformTd className="font-mono text-xs">{job.template}</PlatformTd>
                  <PlatformTd>{maskEmail(job.recipient)}</PlatformTd>
                  <PlatformTd>
                    {job.organization_id ? (
                      <Link
                        className="font-medium text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                        href={`/platform/organizations/${job.organization_id}`}
                      >
                        {orgs?.find((o) => o.id === job.organization_id)?.name ?? job.organization_id.slice(0, 8)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={emailStatusLabel(job.status)} />
                  </PlatformTd>
                  <PlatformTd className="tabular-nums">{job.attempts}</PlatformTd>
                  <PlatformTd className="max-w-xs truncate text-xs text-muted-foreground">
                    <span title={job.last_error ?? undefined}>{job.last_error ?? "—"}</span>
                  </PlatformTd>
                  <PlatformTd className="tabular-nums text-[12px]">{job.created_at.slice(0, 16).replace("T", " ")}</PlatformTd>
                  <PlatformTd className="tabular-nums text-[12px]">{job.sent_at?.slice(0, 16).replace("T", " ") ?? "—"}</PlatformTd>
                </tr>
              ))}
            </tbody>
          </PlatformTable>
        </PlatformPanel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {count ?? 0} jobs · page {window.page}
        </p>
        <div className="flex gap-3">
          {window.page > 1 ? (
            <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/notifications?${preserved}&page=${window.page - 1}`}>
              Précédent
            </Link>
          ) : null}
          {(count ?? 0) > window.page * PAGE ? (
            <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/notifications?${preserved}&page=${window.page + 1}`}>
              Suivant
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function emailStatusLabel(status: string) {
  switch (status) {
    case "sent":
      return "Traité"
    case "pending":
    case "processing":
      return "Ouvert"
    case "failed":
      return "En retard"
    case "dead":
      return "Suspendu"
    default:
      return status
  }
}

function buildEmailSeries(rows: { created_at: string; status: string }[], snapshot: number) {
  const map = new Map<string, { key: string; label: string; total: number; sent: number; failed: number }>()
  for (let i = 29; i >= 0; i--) {
    const day = new Date(snapshot - i * 864e5).toISOString().slice(0, 10)
    map.set(day, { key: day, label: day.slice(5), total: 0, sent: 0, failed: 0 })
  }
  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    const bucket = map.get(day)
    if (!bucket) continue
    bucket.total += 1
    if (row.status === "sent") bucket.sent += 1
    if (row.status === "failed" || row.status === "dead") bucket.failed += 1
  }
  return [...map.values()]
}

function linkQuery(params: { status?: string; q?: string; template?: string }) {
  const search = new URLSearchParams()
  if (params.status) search.set("status", params.status)
  if (params.q) search.set("q", params.q)
  if (params.template) search.set("template", params.template)
  return search.toString()
}
