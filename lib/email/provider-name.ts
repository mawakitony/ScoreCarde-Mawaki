export type EmailProviderName = "smtp" | "brevo"

/** Default is smtp (Gmail path). Set EMAIL_PROVIDER=brevo to keep API Brevo. */
export function getEmailProvider(env: NodeJS.ProcessEnv = process.env): EmailProviderName {
  const raw = (env.EMAIL_PROVIDER || "smtp").trim().toLowerCase()
  return raw === "brevo" ? "brevo" : "smtp"
}
