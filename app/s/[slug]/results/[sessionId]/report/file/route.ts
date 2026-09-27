import { NextResponse } from "next/server"
import { loadVisitorSession } from "@/lib/assessment/store"
import { sendStoredPdf } from "@/lib/reports/file"
import { safeReportPath } from "@/lib/security/limits"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(_request: Request, context: { params: Promise<{ slug: string; sessionId: string }> }) {
  const { slug, sessionId } = await context.params
  const loaded = await loadVisitorSession(slug)
  if ("error" in loaded || loaded.session.id !== sessionId) return NextResponse.json({ error: "not_found" }, { status: 404 })
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
  const { data: report } = await admin
    .from("assessment_reports")
    .select("id, organization_id, status, storage_path, snapshot")
    .eq("session_id", sessionId)
    .eq("organization_id", loaded.scorecard.organization_id)
    .eq("report_type", "participant")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!report || report.status !== "ready" || !report.storage_path || !safeReportPath(report.organization_id, report.storage_path)) {
    return NextResponse.json({ error: "not_ready" }, { status: 404 })
  }
  return sendStoredPdf({ ...report, storage_path: report.storage_path }, false)
}
