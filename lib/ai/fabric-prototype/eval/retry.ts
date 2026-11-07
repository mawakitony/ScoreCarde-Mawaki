export type ProviderErrorKind =
  | "http_429"
  | "http_5xx"
  | "timeout"
  | "network"
  | "empty_content"
  | "invalid_response"
  | "http_other"
  | "unknown"

export type ClassifiedProviderError = {
  kind: ProviderErrorKind
  retryable: boolean
  status?: number
  message: string
  retryAfterMs?: number
}

export function classifyProviderError(error: unknown): ClassifiedProviderError {
  const message = error instanceof Error ? error.message : String(error)
  const statusMatch = message.match(/HTTP\s+(\d{3})/i)
  const status = statusMatch ? Number(statusMatch[1]) : undefined

  if (/AbortError|timeout|TimeoutError|signal timed out/i.test(message)) {
    return { kind: "timeout", retryable: true, message: message.slice(0, 400) }
  }
  if (/fetch failed|ECONNRESET|ENOTFOUND|network/i.test(message)) {
    return { kind: "network", retryable: true, message: message.slice(0, 400) }
  }
  if (/empty content/i.test(message)) {
    return { kind: "empty_content", retryable: true, message: message.slice(0, 400) }
  }
  if (status === 429) {
    const retryAfter = message.match(/retry-after[=:\s]+(\d+)/i)
    const tryAgain = message.match(/try again in\s+([\d.]+)\s*s/i)
    const retryAfterMs = retryAfter
      ? Number(retryAfter[1]) * 1000
      : tryAgain
        ? Math.ceil(Number(tryAgain[1]) * 1000)
        : undefined
    return {
      kind: "http_429",
      retryable: true,
      status,
      message: message.slice(0, 400),
      retryAfterMs,
    }
  }
  if (status && status >= 500 && status <= 599) {
    return { kind: "http_5xx", retryable: true, status, message: message.slice(0, 400) }
  }
  if (status) {
    return { kind: "http_other", retryable: false, status, message: message.slice(0, 400) }
  }
  return { kind: "unknown", retryable: false, message: message.slice(0, 400) }
}

export type BackoffOptions = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitterRatio?: number
}

export const DEFAULT_BACKOFF: BackoffOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  jitterRatio: 0.25,
}

/** Absolute safety cap when honoring provider Retry-After (TPM recovery). */
export const MAX_RETRY_AFTER_MS = 60_000

/**
 * Exponential backoff with jitter. attempt is 1-based index of the failed try.
 * For explicit Retry-After (429 TPM), honor the provider delay up to MAX_RETRY_AFTER_MS
 * even when above opts.maxDelayMs — early retries waste HTTP budget.
 */
export function computeBackoffMs(attempt: number, opts: BackoffOptions = DEFAULT_BACKOFF, retryAfterMs?: number) {
  if (retryAfterMs != null && Number.isFinite(retryAfterMs) && retryAfterMs > 0) {
    return Math.min(MAX_RETRY_AFTER_MS, Math.max(opts.baseDelayMs, retryAfterMs))
  }
  const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** (attempt - 1))
  const jitter = exp * (opts.jitterRatio ?? 0.25) * Math.random()
  return Math.min(opts.maxDelayMs, Math.round(exp + jitter))
}

/** Minimum wait before next logical call given last call token usage and TPM budget. */
export function computeTpmSpacingMs(lastCallTokens: number, tpmLimit = 8_000, safetyMs = 1_500): number {
  if (!Number.isFinite(lastCallTokens) || lastCallTokens <= 0) return 0
  if (!Number.isFinite(tpmLimit) || tpmLimit <= 0) return 0
  return Math.ceil((lastCallTokens / tpmLimit) * 60_000) + safetyMs
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
