import "server-only"

import { enqueueEmail } from "@/lib/email/queue"
import { isBrevoTransactionalConfigured } from "@/lib/email/brevo-ready"
import { getAppUrl } from "@/lib/env"
import { TRIAL_REMINDER_OFFSETS } from "@/lib/platform/reminder-policy"
import { createAdminClient } from "@/lib/supabase/admin"
import type { EmailTemplate } from "@/lib/email/templates"

export { TRIAL_REMINDER_OFFSETS }

/**
 * Enqueue trial reminder ladder (J-7 / J-3 / J-1 / J-0) with per-day idempotency.
 * Skips entirely when Brevo transactional env is not configured.
 */
export async function enqueueTrialReminders(now = Date.now()) {
  if (!isBrevoTransactionalConfigured()) return { queued: 0, skipped: "brevo_not_configured" as const }

  const admin = createAdminClient()
  const billingUrl = `${getAppUrl()}/dashboard/settings/billing`
  let queued = 0

  for (const step of TRIAL_REMINDER_OFFSETS) {
    const windowStart = new Date(now + step.days * 24 * 60 * 60 * 1000)
    const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000)
    // J-0: trial_end in the past 24h through now+1d edge
    const from = step.days === 0
      ? new Date(now - 24 * 60 * 60 * 1000).toISOString()
      : windowStart.toISOString()
    const to = step.days === 0 ? new Date(now + 12 * 60 * 60 * 1000).toISOString() : windowEnd.toISOString()

    const { data } = await admin
      .from("subscriptions")
      .select("organization_id, trial_end")
      .eq("status", "trialing")
      .not("trial_end", "is", null)
      .gte("trial_end", from)
      .lt("trial_end", to)
      .limit(100)

    for (const row of data ?? []) {
      if (!row.trial_end) continue
      const ownerEmail = await ownerEmailFor(admin, row.organization_id)
      if (!ownerEmail) continue
      const { data: organization } = await admin.from("organizations").select("name, default_language").eq("id", row.organization_id).maybeSingle()
      const dayKey = row.trial_end.slice(0, 10)
      const result = await enqueueEmail({
        organizationId: row.organization_id,
        template: step.template,
        recipient: ownerEmail,
        locale: organization?.default_language === "en" ? "en" : "fr",
        idempotencyKey: `${step.template}:${row.organization_id}:${dayKey}`,
        payload: {
          organizationName: organization?.name ?? "WOLOYEM Score",
          date: dayKey,
          billingUrl,
        },
      })
      if (result.queued) queued += 1
    }
  }

  return { queued, skipped: null }
}

async function ownerEmailFor(admin: ReturnType<typeof createAdminClient>, organizationId: string) {
  const { data: owner } = await admin.from("organization_members").select("user_id").eq("organization_id", organizationId).eq("role", "owner").limit(1).maybeSingle()
  if (!owner) return null
  const { data: profile } = await admin.from("profiles").select("email").eq("id", owner.user_id).maybeSingle()
  return profile?.email ?? null
}

export async function enqueueOwnerBillingEmail(input: {
  organizationId: string
  template: EmailTemplate
  idempotencyKey: string
  extra?: Record<string, string>
}) {
  if (!isBrevoTransactionalConfigured()) return { queued: false as const, skipped: "brevo_not_configured" as const }
  const admin = createAdminClient()
  const email = await ownerEmailFor(admin, input.organizationId)
  if (!email) return { queued: false as const, skipped: "no_owner" as const }
  const { data: organization } = await admin.from("organizations").select("name, default_language").eq("id", input.organizationId).maybeSingle()
  return enqueueEmail({
    organizationId: input.organizationId,
    template: input.template,
    recipient: email,
    locale: organization?.default_language === "en" ? "en" : "fr",
    idempotencyKey: input.idempotencyKey,
    payload: {
      organizationName: organization?.name ?? "WOLOYEM Score",
      billingUrl: `${getAppUrl()}/dashboard/settings/billing`,
      ...(input.extra ?? {}),
    },
  })
}
