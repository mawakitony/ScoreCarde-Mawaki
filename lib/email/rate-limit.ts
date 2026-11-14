export type EmailRateLimits = {
  daily: number
  perMinute: number
}

const DEFAULT_DAILY = 400
const DEFAULT_PER_MINUTE = 5

export function parseEmailDailyLimit(env: NodeJS.ProcessEnv = process.env): number {
  return positiveInt(env.EMAIL_DAILY_LIMIT, DEFAULT_DAILY)
}

export function parseEmailRatePerMinute(env: NodeJS.ProcessEnv = process.env): number {
  return positiveInt(env.EMAIL_RATE_PER_MINUTE, DEFAULT_PER_MINUTE)
}

export function readEmailRateLimits(env: NodeJS.ProcessEnv = process.env): EmailRateLimits {
  return {
    daily: parseEmailDailyLimit(env),
    perMinute: parseEmailRatePerMinute(env),
  }
}

/** Start of current UTC day (ISO). */
export function utcDayStartIso(now = Date.now()): string {
  const d = new Date(now)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()
}

export function minuteWindowStartIso(now = Date.now()): string {
  return new Date(now - 60_000).toISOString()
}

/**
 * Decide whether another send is allowed.
 * Over daily or per-minute quota → defer (pending), never fail.
 */
export function evaluateEmailQuota(input: {
  sentToday: number
  sentLastMinute: number
  limits: EmailRateLimits
}): { ok: true } | { ok: false; reason: "rate_limited_daily" | "rate_limited_minute"; retryAfterMs: number } {
  if (input.sentToday >= input.limits.daily) {
    const now = Date.now()
    const tomorrow = Date.parse(utcDayStartIso(now)) + 86_400_000
    return { ok: false, reason: "rate_limited_daily", retryAfterMs: Math.max(60_000, tomorrow - now) }
  }
  if (input.sentLastMinute >= input.limits.perMinute) {
    return { ok: false, reason: "rate_limited_minute", retryAfterMs: 60_000 }
  }
  return { ok: true }
}

function positiveInt(raw: string | undefined, fallback: number) {
  if (raw === undefined || String(raw).trim() === "") return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.floor(n)
}
