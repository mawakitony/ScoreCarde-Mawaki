import type { EmailTemplate } from "@/lib/email/templates"

/** Sent in the same request after enqueue; others wait for the daily cron. */
export const URGENT_EMAIL_TEMPLATES = ["first_access", "support_notice"] as const satisfies readonly EmailTemplate[]

export type UrgentEmailTemplate = (typeof URGENT_EMAIL_TEMPLATES)[number]

export function isUrgentEmailTemplate(template: string): template is UrgentEmailTemplate {
  return (URGENT_EMAIL_TEMPLATES as readonly string[]).includes(template)
}
