import Link from "next/link"
import { CheckCircle2, CircleDashed, Loader2, Skull, XCircle } from "lucide-react"
import { retryPlatformJob } from "@/actions/platform"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
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
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { canPlatform } from "@/lib/platform/permissions"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

const JOB_STATUSES = ["pending", "processing", "completed", "failed", "dead"] as const

export default async function PlatformJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>
}) {
  const admin = await requirePlatformAdmin("platform.jobs.read")
  const supportScope = await getActiveSupportScope(admin.userId)
  const params = await searchParams
  const status = JOB_STATUSES.find((item) => item === params.status)
  const sourceFilter = params.source ?? ""
  const client = createAdminClient()
  const orgId = supportScope?.organizationId

  let reports = client
    .from("report_jobs")
    .select("id, organization_id, kind, status, attempts, next_run_at, last_error, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  let integrations = client
    .from("integration_jobs")
    .select("id, organization_id, kind, status, attempts, next_run_at, last_error, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  if (orgId) {
    reports = reports.eq("organization_id", orgId)
    integrations = integrations.eq("organization_id", orgId)
  }
  if (status && status !== "dead") {
    reports = reports.eq("status", status)
    integrations = integrations.eq("status", status)
  }
  if (status === "dead") reports = reports.eq("status", "dead")

  let deliveries = client
    .from("webhook_deliveries")
    .select("id, organization_id, event_type, status, attempt, response_excerpt, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  let automations = client
    .from("automation_runs")
    .select("id, organization_id, status, error, started_at")
    .order("started_at", { ascending: false })
    .limit(50)
  if (orgId) {
    deliveries = deliveries.eq("organization_id", orgId)
    automations = automations.eq("organization_id", orgId)
  }
  if (status === "completed") deliveries = deliveries.eq("status", "delivered")
  else if (status === "dead") deliveries = deliveries.eq("status", "dead")
  else if (status) deliveries = deliveries.eq("status", status)
  if (status === "failed" || status === "completed") {
    automations = automations.eq("status", status === "completed" ? "completed" : "failed")
  }

  const [reportRows, integrationRows, deliveryRows, automationRows] = await Promise.all([
    reports,
    status === "dead" ? Promise.resolve({ data: [] }) : integrations,
    status === "completed" || status === "dead" || status === "pending" || status === "processing" || status === "failed" || !status
      ? deliveries
      : Promise.resolve({ data: [] }),
    status === "pending" || status === "processing" || status === "dead" ? Promise.resolve({ data: [] }) : automations,
  ])

  let jobs = [
    ...(reportRows.data ?? []).map((row) => ({
      id: row.id,
      source: "report" as const,
      kind: row.kind,
      status: row.status,
      attempts: row.attempts,
      error: row.last_error,
      created: row.created_at,
      orgId: row.organization_id,
      retry: row.status === "failed" || row.status === "dead" ? ("report" as const) : null,
    })),
    ...(integrationRows.data ?? []).map((row) => ({
      id: row.id,
      source: "integration" as const,
      kind: row.kind,
      status: row.status,
      attempts: row.attempts,
      error: row.last_error,
      created: row.created_at,
      orgId: row.organization_id,
      retry: row.status === "failed" ? ("integration" as const) : null,
    })),
    ...(deliveryRows.data ?? []).map((row) => ({
      id: row.id,
      source: "webhook" as const,
      kind: row.event_type,
      status: row.status,
      attempts: row.attempt,
      error: row.response_excerpt,
      created: row.created_at,
      orgId: row.organization_id,
      retry: null,
    })),
    ...(automationRows.data ?? []).map((row) => ({
      id: row.id,
      source: "automation" as const,
      kind: "automation",
      status: row.status,
      attempts: 1,
      error: row.error,
      created: row.started_at,
      orgId: row.organization_id,
      retry: null,
    })),
  ]
  if (sourceFilter) jobs = jobs.filter((job) => job.source === sourceFilter)

  const canRetry = canPlatform(admin, "platform.jobs.retry")
  const pending = jobs.filter((j) => j.status === "pending" || j.status === "queued").length
  const processing = jobs.filter((j) => j.status === "processing" || j.status === "running").length
  const completed = jobs.filter((j) => j.status === "completed" || j.status === "delivered" || j.status === "success").length
  const failed = jobs.filter((j) => j.status === "failed").length
  const dead = jobs.filter((j) => j.status === "dead").length

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Jobs"
        description="Files report, intégration, webhook et automatisation — relance uniquement si autorisée."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Jobs" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <MiniKpi index={0} label="En attente" value={String(pending)} icon={CircleDashed} tone={pending > 0 ? "warn" : "default"} />
        <MiniKpi index={1} label="En cours" value={String(processing)} icon={Loader2} />
        <MiniKpi index={2} label="Réussis" value={String(completed)} icon={CheckCircle2} tone="good" />
        <MiniKpi index={3} label="Échoués" value={String(failed)} icon={XCircle} tone={failed > 0 ? "bad" : "good"} />
        <MiniKpi index={4} label="Dead" value={String(dead)} icon={Skull} tone={dead > 0 ? "bad" : "good"} />
      </section>

      <FilterBar submitLabel="Appliquer">
        <PlatformSelect name="status" defaultValue={status ?? ""} className="max-w-[160px]">
          <option value="">Tous les statuts</option>
          {JOB_STATUSES.map((item) => (
            <option key={item} value={item}>
              {jobStatusLabel(item)}
            </option>
          ))}
        </PlatformSelect>
        <PlatformSelect name="source" defaultValue={sourceFilter} className="max-w-[160px]">
          <option value="">Toutes les sources</option>
          <option value="report">Rapports</option>
          <option value="integration">Intégrations</option>
          <option value="webhook">Webhooks</option>
          <option value="automation">Automatisations</option>
        </PlatformSelect>
      </FilterBar>

      {jobs.length === 0 ? (
        <PlatformEmpty title="Aucun job" description="Aucun traitement pour ces filtres." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="960px">
            <thead>
              <tr>
                {["Source", "Type", "Statut", "Essais", "Erreur", "Créé", "Actions"].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={`${job.source}-${job.id}`} className="hover:bg-[color:var(--pa-bg)]/80">
                  <PlatformTd className="capitalize">{job.source}</PlatformTd>
                  <PlatformTd className="font-mono text-xs">{job.kind}</PlatformTd>
                  <PlatformTd>
                    <StatusBadge label={jobStatusBadge(job.status)} />
                  </PlatformTd>
                  <PlatformTd className="tabular-nums">{job.attempts}</PlatformTd>
                  <PlatformTd className="max-w-xs truncate text-xs text-muted-foreground">
                    <span title={job.error ?? undefined}>{job.error?.slice(0, 120) ?? "—"}</span>
                  </PlatformTd>
                  <PlatformTd className="tabular-nums text-[12px]">{job.created?.slice(0, 16).replace("T", " ") ?? "—"}</PlatformTd>
                  <PlatformTd>
                    <div className="flex flex-col gap-1">
                      {job.orgId ? (
                        <Link className="text-[12px] font-semibold text-[color:var(--pa-primary)] hover:underline" href={`/platform/organizations/${job.orgId}`}>
                          Org.
                        </Link>
                      ) : null}
                      {canRetry && job.retry ? (
                        <form action={retry.bind(null, job.retry, job.id)}>
                          <button className="text-[12px] font-semibold text-amber-700 underline-offset-2 hover:underline" type="submit">
                            Relancer
                          </button>
                        </form>
                      ) : null}
                    </div>
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

async function retry(kind: "integration" | "report", jobId: string) {
  "use server"
  await retryPlatformJob(kind, jobId)
}

function jobStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "En attente"
    case "processing":
      return "En cours"
    case "completed":
      return "Réussi"
    case "failed":
      return "Échoué"
    case "dead":
      return "Dead"
    default:
      return status
  }
}

function jobStatusBadge(status: string) {
  if (status === "completed" || status === "delivered" || status === "success") return "Traité"
  if (status === "pending" || status === "processing" || status === "queued" || status === "running") return "Ouvert"
  if (status === "failed") return "En retard"
  if (status === "dead") return "Suspendu"
  return status
}
