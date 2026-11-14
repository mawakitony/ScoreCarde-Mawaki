import "server-only"

import { sendBrevoEmail } from "@/lib/email/brevo"
import { isBrevoActivationFailure, isBrevoTransactionalConfigured } from "@/lib/email/brevo-ready"
import { getEmailProvider, type EmailProviderName } from "@/lib/email/provider-name"
import { isSmtpConfigured, sendSmtpEmail } from "@/lib/email/smtp"

export type { EmailProviderName }
export { getEmailProvider }

export type TransactionalSendResult =
  | { configured: false; provider: EmailProviderName }
  | {
      configured: true
      provider: EmailProviderName
      ok: true
      messageId: string | null
    }
  | {
      configured: true
      provider: EmailProviderName
      ok: false
      failure: string
      status: number | null
      code: string | null
      disposition: "pending" | "dead" | "retry"
      brevoInactive?: boolean
    }

export function isEmailProviderConfigured(env: NodeJS.ProcessEnv = process.env) {
  const provider = getEmailProvider(env)
  return provider === "smtp" ? isSmtpConfigured(env) : isBrevoTransactionalConfigured()
}

export async function sendTransactionalEmail(input: {
  to: string
  subject: string
  text: string
}): Promise<TransactionalSendResult> {
  const provider = getEmailProvider()
  if (provider === "smtp") {
    const result = await sendSmtpEmail(input)
    if (!result.configured) return { configured: false, provider }
    if (result.ok) return { configured: true, provider, ok: true, messageId: result.messageId }
    return {
      configured: true,
      provider,
      ok: false,
      failure: result.failure,
      status: null,
      code: result.code,
      disposition: result.disposition,
    }
  }

  const result = await sendBrevoEmail(input)
  if (!result.configured) return { configured: false, provider }
  if (result.ok) return { configured: true, provider, ok: true, messageId: result.messageId }
  const failure = result.failure
  return {
    configured: true,
    provider,
    ok: false,
    failure,
    status: result.status,
    code: result.code,
    disposition: isBrevoActivationFailure(failure) ? "dead" : "retry",
    brevoInactive: isBrevoActivationFailure(failure),
  }
}
