import "server-only"

import { NextResponse } from "next/server"
import { pdfFilename } from "@/lib/reports/dto"
import { presentReport } from "@/lib/reports/present"
import { createAdminClient } from "@/lib/supabase/admin"

type ReadyReport = {
  id: string
  organization_id: string
  storage_path: string
  snapshot: unknown
}

export async function sendStoredPdf(report: ReadyReport, internal: boolean) {
  const admin = createAdminClient()
  const file = await admin.storage.from("assessment-reports").download(report.storage_path)
  if (file.error || !file.data) return NextResponse.json({ error: "missing" }, { status: 404 })
  const { data: current } = await admin.from("assessment_reports").select("download_count").eq("id", report.id).maybeSingle()
  await admin.from("assessment_reports").update({ download_count: (current?.download_count ?? 0) + 1 }).eq("id", report.id)
  await admin.from("report_events").insert({ organization_id: report.organization_id, report_id: report.id, event_type: "report.downloaded" })
  const presented = presentReport(report.snapshot, null, false)
  const filename = pdfFilename(presented?.scorecardTitle ?? "Assessment", internal)
  const bytes = Buffer.from(await file.data.arrayBuffer())
  return new NextResponse(bytes, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, max-age=60",
    },
  })
}
