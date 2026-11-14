export type SmtpFailureCode =
  | "smtp_auth_rejected"
  | "smtp_quota_exceeded"
  | "smtp_invalid_recipient"
  | "smtp_error"

export type SmtpFailureClass = {
  code: SmtpFailureCode
  /** Quota / rate → keep pending; invalid recipient → dead; auth → retry then dead. */
  disposition: "pending" | "dead" | "retry"
  text: string
}

export function classifySmtpError(error: unknown): SmtpFailureClass {
  const raw = errorMessage(error)
  const responseCode = smtpResponseCode(error)
  const lower = raw.toLowerCase()

  if (
    responseCode === 535 ||
    responseCode === 534 ||
    /eauth|invalid login|authentication failed|username and password not accepted|5\.7\.8|badcredentials/i.test(
      lower,
    )
  ) {
    return {
      code: "smtp_auth_rejected",
      disposition: "retry",
      text: "smtp_auth_rejected",
    }
  }

  if (
    responseCode === 421 ||
    responseCode === 450 ||
    responseCode === 451 ||
    /quota|rate limit|too many|daily.*limit|user.*sending.*limits|try again later|4\.2\.1|5\.4\.5/i.test(lower)
  ) {
    return {
      code: "smtp_quota_exceeded",
      disposition: "pending",
      text: "smtp_quota_exceeded",
    }
  }

  if (
    responseCode === 550 ||
    responseCode === 551 ||
    responseCode === 553 ||
    /recipient.*rejected|user unknown|mailbox unavailable|invalid.*recipient|no such user|5\.1\.1|address rejected/i.test(
      lower,
    )
  ) {
    return {
      code: "smtp_invalid_recipient",
      disposition: "dead",
      text: "smtp_invalid_recipient",
    }
  }

  return {
    code: "smtp_error",
    disposition: "retry",
    text: `smtp_error:${sanitizeSnippet(raw)}`,
  }
}

function errorMessage(error: unknown) {
  if (!error) return ""
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message ?? "")
  }
  return String(error)
}

function smtpResponseCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null
  const row = error as { responseCode?: unknown; code?: unknown }
  if (typeof row.responseCode === "number" && Number.isFinite(row.responseCode)) return row.responseCode
  if (typeof row.code === "number" && Number.isFinite(row.code)) return row.code
  if (typeof row.code === "string" && /^\d{3}$/.test(row.code)) return Number(row.code)
  return null
}

function sanitizeSnippet(value: string) {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(pass(word)?|pwd|secret|token|bearer)\b\s*[:=]?\s*\S+/gi, "$1 [redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}
