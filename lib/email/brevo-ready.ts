/** Env configured — does not prove Brevo SMTP platform is activated. */
export function isBrevoTransactionalConfigured() {
  return Boolean(process.env.BREVO_API_KEY?.trim() && process.env.BREVO_SENDER_EMAIL?.trim())
}

export function isBrevoActivationFailure(message: string | null | undefined) {
  if (!message) return false
  return /not yet activated|smtp account is not yet activated|sending platform is currently disabled/i.test(message)
}
