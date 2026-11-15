import "server-only"

import { openSecretValue } from "@/lib/auth/first-access"
import { getEmailProvider, isEmailProviderConfigured, sendTransactionalEmail } from "@/lib/email/provider"
import {
  evaluateEmailQuota,
  minuteWindowStartIso,
  readEmailRateLimits,
  utcDayStartIso,
  type EmailRateLimits,
} from "@/lib/email/rate-limit"
import {
  FIRST_ACCESS_OBSOLETE_USED,
  invitationIdFromFirstAccessIdempotencyKey,
  isFirstAccessInvitationUsed,
} from "@/lib/email/first-access-job"
import { nextEmailAttempt, renderEmail, type EmailTemplate } from "@/lib/email/templates"
import { isUrgentEmailTemplate } from "@/lib/email/urgent"
import { recordHeartbeat } from "@/lib/platform/heartbeat"
import { log } from "@/lib/observability/logger"
import { deriveAppSecret, isIntegrationsSecretError } from "@/lib/security/app-secret"
import { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = ReturnType<typeof createAdminClient>

type EmailJobRow = {
  id: string
  template: string
  recipient: string
  recipient_hash: string
  locale: string
  payload: unknown
  attempts: number
  idempotency_key?: string | null
}

type QuotaCounters = { sentToday: number; sentLastMinute: number }

export async function processEmailJobs() {
  const admin = createAdminClient()
  const provider = getEmailProvider()
  const limits = readEmailRateLimits()
  const now = new Date().toISOString()
  const { data } = await admin
    .from("email_jobs")
    .select("id, template, recipient, recipient_hash, locale, payload, attempts, idempotency_key")
    .eq("status", "pending")
    .lte("next_run_at", now)
    .order("next_run_at")
    .limit(20)

  let sent = 0
  const counters: QuotaCounters = {
    sentToday: await countSentSince(admin, utcDayStartIso()),
    sentLastMinute: await countSentSince(admin, minuteWindowStartIso()),
  }

  for (const job of data ?? []) {
    const result = await processOneEmailJob(admin, job, { limits, counters, provider })
    if (result === "sent") sent += 1
  }

  await recordHeartbeat("email_worker")
  return { sent }
}

/**
 * Immediate send for urgent templates right after enqueue.
 * On any failure / rate-limit / missing provider → leave job pending for cron.
 */
export async function tryFlushUrgentEmailJob(input: {
  organizationId: string
  idempotencyKey: string
  template: string
}) {
  if (!isUrgentEmailTemplate(input.template)) return { flushed: false as const, reason: "not_urgent" as const }

  const admin = createAdminClient()
  const { data: job } = await admin
    .from("email_jobs")
    .select("id, template, recipient, recipient_hash, locale, payload, attempts, idempotency_key")
    .eq("organization_id", input.organizationId)
    .eq("idempotency_key", input.idempotencyKey)
    .eq("status", "pending")
    .maybeSingle()

  if (!job) return { flushed: false as const, reason: "not_pending" as const }

  const limits = readEmailRateLimits()
  const counters: QuotaCounters = {
    sentToday: await countSentSince(admin, utcDayStartIso()),
    sentLastMinute: await countSentSince(admin, minuteWindowStartIso()),
  }
  const result = await processOneEmailJob(admin, job, {
    limits,
    counters,
    provider: getEmailProvider(),
  })
  return { flushed: result === "sent", reason: result }
}

async function processOneEmailJob(
  admin: AdminClient,
  job: EmailJobRow,
  ctx: { limits: EmailRateLimits; counters: QuotaCounters; provider: string },
): Promise<"sent" | "deferred" | "retry" | "dead" | "skipped"> {
  if (job.template === "first_access") {
    const obsolete = await retireFirstAccessIfInvitationUsed(admin, job)
    if (obsolete) return "dead"
  }

  const quota = evaluateEmailQuota({
    sentToday: ctx.counters.sentToday,
    sentLastMinute: ctx.counters.sentLastMinute,
    limits: ctx.limits,
  })
  if (!quota.ok) {
    await admin
      .from("email_jobs")
      .update({
        status: "pending",
        next_run_at: new Date(Date.now() + quota.retryAfterMs).toISOString(),
        last_error: quota.reason,
      })
      .eq("id", job.id)
      .eq("status", "pending")
    log("info", "email.rate_limited", {
      reason: quota.reason,
      template: job.template,
      recipient_hash: job.recipient_hash,
      provider: ctx.provider,
    })
    return "deferred"
  }

  const claimed = await admin
    .from("email_jobs")
    .update({ status: "processing", attempts: job.attempts + 1 })
    .eq("id", job.id)
    .eq("status", "pending")
    .select("id")
  if (!claimed.data?.length) return "skipped"

  let payload: Record<string, string> | null
  try {
    payload = unsealRecord(record(job.payload))
  } catch (error) {
    if (isIntegrationsSecretError(error)) {
      await admin
        .from("email_jobs")
        .update({
          status: "pending",
          next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          last_error: error.code,
        })
        .eq("id", job.id)
      log("error", "email.integrations_secret", { code: error.code, template: job.template })
      return "deferred"
    }
    throw error
  }

  if (!payload || (job.template === "first_access" && !payload.accessCode)) {
    const next = nextEmailAttempt(job.attempts)
    await admin
      .from("email_jobs")
      .update({
        status: next.status === "dead" ? "dead" : "pending",
        next_run_at: next.nextRunAt ?? new Date().toISOString(),
        last_error: "payload_unavailable",
      })
      .eq("id", job.id)
    log("warn", "email.retry", { template: job.template, recipient_hash: job.recipient_hash, status: next.status })
    return next.status === "dead" ? "dead" : "retry"
  }

  if (!isEmailProviderConfigured()) {
    await admin
      .from("email_jobs")
      .update({
        status: "pending",
        next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        last_error: "not_configured",
      })
      .eq("id", job.id)
    return "deferred"
  }

  const message = renderEmail({ template: job.template as EmailTemplate, locale: job.locale, payload })
  const result = await sendTransactionalEmail({
    to: job.recipient,
    subject: message.subject,
    text: message.text,
  })

  if (result.configured && result.ok) {
    await admin
      .from("email_jobs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: result.messageId,
        last_error: null,
      })
      .eq("id", job.id)
    log("info", "email.sent", {
      template: job.template,
      recipient_hash: job.recipient_hash,
      provider: result.provider,
    })
    ctx.counters.sentToday += 1
    ctx.counters.sentLastMinute += 1
    return "sent"
  }

  const failure = result.configured ? result.failure : "not_configured"
  if (result.configured && result.brevoInactive) {
    await admin
      .from("email_jobs")
      .update({
        status: "dead",
        next_run_at: new Date().toISOString(),
        last_error: failure,
      })
      .eq("id", job.id)
    const open = await admin
      .from("platform_alerts")
      .select("id")
      .eq("code", "brevo_smtp_inactive")
      .is("resolved_at", null)
      .maybeSingle()
    if (!open.data) {
      await admin.from("platform_alerts").insert({
        code: "brevo_smtp_inactive",
        message: "Brevo SMTP transactionnel non activé — e-mails bloqués.",
      })
    }
    log("warn", "email.blocked_brevo_inactive", {
      template: job.template,
      recipient_hash: job.recipient_hash,
    })
    return "dead"
  }

  if (result.configured && result.disposition === "pending") {
    await admin
      .from("email_jobs")
      .update({
        status: "pending",
        next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        last_error: failure,
      })
      .eq("id", job.id)
    log("warn", "email.deferred", {
      template: job.template,
      recipient_hash: job.recipient_hash,
      failure,
      provider: ctx.provider,
    })
    return "deferred"
  }

  if (result.configured && result.disposition === "dead") {
    await admin
      .from("email_jobs")
      .update({
        status: "dead",
        next_run_at: new Date().toISOString(),
        last_error: failure,
      })
      .eq("id", job.id)
    log("warn", "email.dead", {
      template: job.template,
      recipient_hash: job.recipient_hash,
      failure,
      provider: ctx.provider,
    })
    return "dead"
  }

  const next = nextEmailAttempt(job.attempts)
  await admin
    .from("email_jobs")
    .update({
      status: next.status === "dead" ? "dead" : "pending",
      next_run_at: next.nextRunAt ?? new Date().toISOString(),
      last_error: failure,
    })
    .eq("id", job.id)
  log("warn", "email.retry", {
    template: job.template,
    recipient_hash: job.recipient_hash,
    status: next.status,
    provider: ctx.provider,
    provider_status: result.configured ? result.status : null,
    provider_code: result.configured ? result.code : null,
  })
  return next.status === "dead" ? "dead" : "retry"
}

/** Never resend first_access when the invitation was already used — mark obsolete instead. */
async function retireFirstAccessIfInvitationUsed(admin: AdminClient, job: EmailJobRow) {
  const invitationId = invitationIdFromFirstAccessIdempotencyKey(job.idempotency_key)
  if (!invitationId) return false

  const { data: invitation } = await admin
    .from("organization_invitations")
    .select("first_access_used_at, accepted_at")
    .eq("id", invitationId)
    .maybeSingle()

  if (!isFirstAccessInvitationUsed(invitation)) return false

  await admin
    .from("email_jobs")
    .update({
      status: "dead",
      next_run_at: new Date().toISOString(),
      last_error: FIRST_ACCESS_OBSOLETE_USED,
    })
    .eq("id", job.id)
    .eq("status", "pending")

  log("info", "email.obsolete_invitation_used", {
    template: job.template,
    recipient_hash: job.recipient_hash,
  })
  return true
}

async function countSentSince(admin: AdminClient, sinceIso: string) {
  const { count } = await admin
    .from("email_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", sinceIso)
  return count ?? 0
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => (typeof item === "string" ? [[key, item]] : [])),
  )
}

function unsealRecord(payload: Record<string, string>) {
  // No service_role fallback — seal material is HKDF(INTEGRATIONS_SECRET, "first-access-seal").
  const seal = deriveAppSecret("first-access-seal")
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (!value.startsWith("enc:")) {
      next[key] = value
      continue
    }
    const opened = openSecretValue(value, seal)
    if (!opened) return null
    next[key] = opened
  }
  return next
}
