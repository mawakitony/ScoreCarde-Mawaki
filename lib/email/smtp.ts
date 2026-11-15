import nodemailer, { type Transporter } from "nodemailer"
import { classifySmtpError } from "@/lib/email/smtp-error"

export type SmtpSendInput = { to: string; subject: string; text: string }

export type SmtpSendResult =
  | { configured: false }
  | { configured: true; ok: true; messageId: string | null }
  | {
      configured: true
      ok: false
      failure: string
      code: string
      disposition: "pending" | "dead" | "retry"
    }

export function isSmtpConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(
    env.SMTP_HOST?.trim() &&
      env.SMTP_PORT?.trim() &&
      env.SMTP_USER?.trim() &&
      env.SMTP_PASSWORD?.trim() &&
      env.EMAIL_FROM?.trim(),
  )
}

export function createSmtpTransport(env: NodeJS.ProcessEnv = process.env): Transporter | null {
  if (!isSmtpConfigured(env)) return null
  const port = Number(env.SMTP_PORT)
  if (!Number.isFinite(port) || port <= 0) return null
  const secure = port === 465
  return nodemailer.createTransport({
    host: env.SMTP_HOST!.trim(),
    port,
    secure,
    auth: {
      user: env.SMTP_USER!.trim(),
      pass: env.SMTP_PASSWORD!.trim(),
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  })
}

export async function sendSmtpEmail(
  input: SmtpSendInput,
  options?: { transport?: Transporter | null; env?: NodeJS.ProcessEnv },
): Promise<SmtpSendResult> {
  const env = options?.env ?? process.env
  if (!isSmtpConfigured(env)) return { configured: false }
  const transport = options?.transport === undefined ? createSmtpTransport(env) : options.transport
  if (!transport) return { configured: false }

  const fromEmail = env.EMAIL_FROM!.trim()
  const fromName = env.EMAIL_FROM_NAME?.trim() || "Mawaki Score"
  try {
    const info = await transport.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
    })
    const messageId = typeof info.messageId === "string" ? info.messageId : null
    return { configured: true, ok: true, messageId }
  } catch (error) {
    const classified = classifySmtpError(error)
    return {
      configured: true,
      ok: false,
      failure: classified.text,
      code: classified.code,
      disposition: classified.disposition,
    }
  }
}
