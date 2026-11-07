import Link from "next/link"
import { notFound } from "next/navigation"
import { Download, FileText } from "lucide-react"
import { ReportActions } from "@/components/reports/report-actions"
import { ReportView } from "@/components/reports/report-view"
import { canEdit, requireUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { adminDto, type AdminReport } from "@/lib/reports/dto"
import { presentReport } from "@/lib/reports/present"
import { createClient } from "@/lib/supabase/server"
import { WS_FOCUS, WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Rapports", robots: { index: false, follow: false } }

export default async function LeadReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireUser()
  const membership = await ensureMembership()
  if (!membership) return null
  const supabase = await createClient()
  const selected = await supabase
    .from("leads")
    .select("id, session_id, status, source")
    .eq("id", id)
    .eq("organization_id", membership.organization.id)
    .is("deleted_at", null)
    .maybeSingle()
  const lead =
    selected.error?.code === "42703"
      ? (
          await supabase
            .from("leads")
            .select("id, session_id, status, source")
            .eq("id", id)
            .eq("organization_id", membership.organization.id)
            .maybeSingle()
        ).data
      : selected.data
  if (!lead) notFound()
  const { data: reports, error } = await supabase
    .from("assessment_reports")
    .select(
      "id, version, status, ai_status, download_count, report_type, created_at, snapshot, ai_output, session_id",
    )
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false })
  const { data: shares } = await supabase
    .from("report_shares")
    .select("id, report_id, expires_at, revoked_at")
    .eq("organization_id", membership.organization.id)

  const list = reports ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className={cn(WS_PANEL, "p-5 md:p-6")}>
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", WS_LINK)}
        >
          ← Lead
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-11 rounded-2xl")}>
            <FileText className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
              Rapports
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {list.length} rapport{list.length > 1 ? "s" : ""} · exports et aperçus autorisés
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <p className={cn(WS_PANEL, "px-5 py-4 text-sm text-muted-foreground")} role="alert">
          Les rapports ne sont pas encore disponibles.
        </p>
      ) : null}

      {!error && list.length === 0 ? (
        <div className={cn(WS_PANEL, "px-5 py-12 text-center")}>
          <span className={cn(WS_ICON_CHIP, "mx-auto size-12 rounded-2xl")}>
            <FileText className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">Aucun rapport</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Un rapport apparaît après une évaluation terminée. Vous pouvez aussi le régénérer depuis
            la fiche du lead.
          </p>
          <Link className={cn("mt-4 inline-block text-[13px]", WS_LINK)} href={`/dashboard/leads/${lead.id}`}>
            Retour au lead
          </Link>
        </div>
      ) : null}

      {list.length > 0 ? (
        <ul className={cn(WS_PANEL, "divide-y divide-border overflow-hidden")}>
          {list.map((report) => (
            <li
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-[13px]"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  v{report.version} · {report.report_type}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {report.status} · IA {report.ai_status} · {report.download_count} téléchargements
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {report.status === "ready" ? (
                  <a
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-semibold",
                      "hover:bg-muted/60",
                      WS_FOCUS,
                    )}
                    href={`/api/reports/${report.id}/download`}
                  >
                    <Download className="size-3.5" aria-hidden />
                    PDF
                  </a>
                ) : null}
                {canEdit(membership.role) ? (
                  <ReportActions
                    reportId={report.id}
                    sessionId={report.session_id}
                    shares={(shares ?? []).filter((share) => share.report_id === report.id)}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {list
        .filter((report) => report.report_type === "participant")
        .slice(0, 1)
        .map((report) => {
          const presented = presentReport(report.snapshot, report.ai_output, true)
          return presented ? (
            <div key={report.id} className={cn(WS_PANEL, "overflow-hidden p-1 md:p-2")}>
              <ReportView report={presented} />
            </div>
          ) : null
        })}

      {list
        .filter((report) => report.report_type === "admin")
        .slice(0, 1)
        .map((report) => {
          const base = presentReport(report.snapshot, report.ai_output, true)
          if (!base) return null
          const raw =
            report.snapshot && typeof report.snapshot === "object"
              ? (report.snapshot as Partial<AdminReport>)
              : {}
          const internal = adminDto({
            ...base,
            internal: true,
            leadStatus: raw.leadStatus ?? null,
            temperature: raw.temperature ?? null,
            quality: raw.quality ?? null,
            source: raw.source ?? null,
            campaign: raw.campaign ?? null,
            email: raw.email ?? null,
            phone: raw.phone ?? null,
            notes: Array.isArray(raw.notes) ? raw.notes : [],
            answers: Array.isArray(raw.answers) ? raw.answers : [],
          })
          return <AdminPreview key={report.id} report={internal} />
        })}
    </div>
  )
}

function AdminPreview({ report }: { report: AdminReport }) {
  return (
    <section className={cn(WS_PANEL, "p-5 md:p-6")}>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
        Interne
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {report.scorecardTitle}
      </h2>
      <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
        <div className="rounded-xl bg-muted/30 px-3 py-2">
          Statut <span className="font-medium">{report.leadStatus ?? "—"}</span>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2">
          Température <span className="font-medium">{report.temperature ?? "—"}</span>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2">
          Qualité <span className="font-medium">{report.quality ?? "—"}</span>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2">
          Source <span className="font-medium">{report.source ?? "—"}</span>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2 sm:col-span-2">
          Campagne <span className="font-medium">{report.campaign ?? "—"}</span>
        </div>
      </dl>
      {report.answers.length > 0 ? (
        <ul className="mt-4 space-y-2 text-[13px]">
          {report.answers.map((answer) => (
            <li key={answer.question} className="rounded-xl border border-border/70 px-3 py-2">
              <span className="font-medium text-foreground">{answer.question}</span>
              <span className="text-muted-foreground"> · {answer.answer}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {report.notes.length > 0 ? (
        <ul className="mt-4 space-y-1 text-[13px] text-muted-foreground">
          {report.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
