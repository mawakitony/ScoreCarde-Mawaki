import { NextResponse } from "next/server"
import { canEdit, getUser } from "@/lib/auth/session"
import { loadVisitorSession } from "@/lib/assessment/store"
import { ensureMembership } from "@/lib/data/membership"
import { sendStoredPdf } from "@/lib/reports/file"
import { reportAccess } from "@/lib/reports/dto"
import { safeReportPath } from "@/lib/security/limits"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
  const { data: report } = await admin.from("assessment_reports").select("id, organization_id, session_id, scorecard_id, report_type, status, storage_path, snapshot").eq("id", id).maybeSingle()
  if (!report || report.status !== "ready" || !report.storage_path || !safeReportPath(report.organization_id, report.storage_path)) return NextResponse.json({ error: "not_ready" }, { status: 404 })
  const stored = { ...report, storage_path: report.storage_path }

  const slug = new URL(request.url).searchParams.get("slug") ?? ""
  const loaded = slug ? await loadVisitorSession(slug) : null
  const sameSession = Boolean(loaded && !("error" in loaded) && loaded.session.id === report.session_id)
  const user = await getUser()
  const membership = user ? await ensureMembership() : null
  const access = reportAccess({
    reportType: report.report_type,
    reportOrganizationId: report.organization_id,
    viewerOrganizationId: membership?.organization.id ?? null,
    sameSession,
    editor: membership ? canEdit(membership.role) : false,
  })
  if (access === "denied") return NextResponse.json({ error: "not_found" }, { status: 404 })
  return sendStoredPdf(stored, access === "admin")
}
