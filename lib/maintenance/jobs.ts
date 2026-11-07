import "server-only"

import { processEmailJobs } from "@/lib/email/worker"
import { GRACE_PERIOD_DAYS } from "@/lib/billing/plans"
import { enqueueOwnerBillingEmail, enqueueTrialReminders } from "@/lib/platform/reminders"
import { recordHeartbeat } from "@/lib/platform/heartbeat"
import { createAdminClient } from "@/lib/supabase/admin"

export async function runMaintenance() {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  await admin.from("organization_invitations").delete().is("accepted_at", null).lt("expires_at", now)
  const abandonDays = Number(process.env.ASSESSMENT_ABANDON_AFTER_DAYS ?? 7)
  if (Number.isFinite(abandonDays) && abandonDays > 0) {
    const cutoff = new Date(Date.now() - abandonDays * 24 * 60 * 60 * 1000).toISOString()
    await admin.from("assessment_sessions").update({ status: "abandoned" }).in("status", ["started", "in_progress"]).lt("last_activity_at", cutoff)
  }
  await admin.from("assessment_sessions").update({ status: "abandoned" }).in("status", ["started", "in_progress"]).lt("expires_at", now)
  await admin.from("email_jobs").update({ status: "pending" }).eq("status", "processing").lt("next_run_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
  await processEmailJobs()
  await enqueueTrialReminders()
  await enqueueGraceEndingNotices(admin)
  const retention = Number(process.env.REPORT_RETENTION_DAYS ?? 0)
  if (Number.isFinite(retention) && retention > 0) await expireReports(admin, retention)
  await recordHeartbeat("maintenance_worker")
}

async function enqueueGraceEndingNotices(admin: ReturnType<typeof createAdminClient>) {
  const graceMs = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  const endingSoon = new Date(Date.now() - graceMs + 24 * 60 * 60 * 1000).toISOString()
  const endingPassed = new Date(Date.now() - graceMs).toISOString()
  const { data } = await admin
    .from("subscriptions")
    .select("organization_id, past_due_at")
    .eq("status", "past_due")
    .not("past_due_at", "is", null)
    .lte("past_due_at", endingSoon)
    .gt("past_due_at", endingPassed)
    .limit(50)
  for (const row of data ?? []) {
    if (!row.past_due_at) continue
    await enqueueOwnerBillingEmail({
      organizationId: row.organization_id,
      template: "grace_ending",
      idempotencyKey: `grace_ending:${row.organization_id}:${row.past_due_at.slice(0, 10)}`,
    })
  }
}

async function expireReports(admin: ReturnType<typeof createAdminClient>, days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin.from("assessment_reports").select("id, organization_id, storage_path").lt("created_at", cutoff).not("storage_path", "is", null).limit(50)
  for (const report of data ?? []) {
    if (!report.storage_path?.startsWith(`${report.organization_id}/`)) continue
    await admin.storage.from("assessment-reports").remove([report.storage_path])
    await admin.from("assessment_reports").update({ storage_path: null }).eq("id", report.id).eq("organization_id", report.organization_id)
  }
}
