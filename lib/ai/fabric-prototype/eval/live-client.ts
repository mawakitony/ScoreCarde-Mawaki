import { assertEvalLiveAuthorized } from "@/lib/ai/fabric-prototype/eval/live-gate"
import {
  classifyProviderError,
  computeBackoffMs,
  computeTpmSpacingMs,
  DEFAULT_BACKOFF,
  sleep,
  type BackoffOptions,
  type ProviderErrorKind,
} from "@/lib/ai/fabric-prototype/eval/retry"
import type { LlmMessage } from "@/lib/ai/fabric-prototype/types"

export type LiveUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number
}

export type LiveCallResult = {
  content: string
  usage: LiveUsage
  model: string
  latencyMs: number
  attempts: number
  lastErrorKind?: ProviderErrorKind
}

type LiveClientState = {
  /** Every HTTP attempt counts toward the campaign ceiling. */
  calls: number
  promptTokens: number
  completionTokens: number
  cachedTokens: number
  maxCalls: number
  retries: number
  /** Cumulative backoff / Retry-After waits (ms). */
  retryWaitMs: number
  /** Cumulative inter-call spacing waits (ms). */
  spacingWaitMs: number
  /** Cumulative HTTP round-trip time excluding waits (ms). */
  providerLatencyMs: number
  lastErrorKind?: ProviderErrorKind
}

export type LiveClientOptions = {
  maxCalls?: number
  /** Minimum delay between successful logical requests (not retries). */
  minSpacingMs?: number
  /** Org TPM budget used for adaptive spacing (Groq gpt-oss-120b on_demand ≈ 8000). */
  tpmLimit?: number
  backoff?: BackoffOptions
  /**
   * Called immediately before each HTTP attempt is counted/emitted.
   * Throw to refuse the attempt (e.g. projected USD breach). Must not perform I/O.
   */
  beforeAttempt?: () => void
}

/**
 * Eval-only Groq client. Does not touch production Assistant tools/writes.
 * Hard-stops at maxCalls. Each retry attempt increments `calls`.
 */
export function createLot19aLiveClient(options?: LiveClientOptions) {
  const gate = assertEvalLiveAuthorized()
  const key = process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL?.replace(/\/+$/, "")
  const provider = (process.env.AI_PROVIDER || "").toLowerCase()
  const model = process.env.AI_MODEL || ""
  const backoff = options?.backoff ?? DEFAULT_BACKOFF
  const minSpacingMs = options?.minSpacingMs ?? 400
  const tpmLimit = options?.tpmLimit ?? 8_000
  const beforeAttempt = options?.beforeAttempt

  if (provider !== "groq") {
    throw new Error(`LIVE eval requires AI_PROVIDER=groq (got ${provider || "empty"}).`)
  }
  if (model !== "openai/gpt-oss-120b") {
    throw new Error(`LIVE eval requires AI_MODEL=openai/gpt-oss-120b (got ${model || "empty"}).`)
  }
  if (!key || !baseUrl) throw new Error("AI_API_KEY / AI_BASE_URL missing.")

  const url = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`
  const state: LiveClientState = {
    calls: 0,
    promptTokens: 0,
    completionTokens: 0,
    cachedTokens: 0,
    maxCalls: options?.maxCalls ?? gate.budget.maxCalls,
    retries: 0,
    retryWaitMs: 0,
    spacingWaitMs: 0,
    providerLatencyMs: 0,
  }
  let lastLogicalCallAt = 0
  let lastCallTokens = 0

  async function singleAttempt(
    messages: LlmMessage[],
    timeoutMs: number,
    maxTokens?: number,
  ): Promise<LiveCallResult> {
    if (state.calls >= state.maxCalls) {
      throw new Error(`LIVE call ceiling reached (${state.maxCalls}). Stopping.`)
    }
    // Refuse before counting/emitting when campaign budget projection says stop.
    beforeAttempt?.()
    // Count BEFORE fetch so timeouts / 429 / network errors consume budget.
    state.calls += 1
    const started = Date.now()
    const hasJsonKeyword = messages.some((message) => /\bjson\b/i.test(message.content))
    const payloadMessages = hasJsonKeyword
      ? messages
      : [...messages, { role: "system" as const, content: "Respond with a valid JSON object only." }]

    const requestPayload: Record<string, unknown> = {
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: payloadMessages,
    }
    if (typeof maxTokens === "number" && maxTokens > 0) {
      requestPayload.max_tokens = maxTokens
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })
    } catch (error) {
      const classified = classifyProviderError(error)
      state.lastErrorKind = classified.kind
      const err = new Error(classified.message)
      ;(err as Error & { classified?: typeof classified }).classified = classified
      throw err
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      const retryAfterHeader = response.headers.get("retry-after")
      const retryAfterMs = retryAfterHeader && /^\d+$/.test(retryAfterHeader)
        ? Number(retryAfterHeader) * 1000
        : undefined
      const classified = classifyProviderError(
        new Error(
          `Groq HTTP ${response.status}: ${errorText.slice(0, 240)}${retryAfterMs ? ` retry-after=${retryAfterHeader}` : ""}`,
        ),
      )
      if (retryAfterMs) classified.retryAfterMs = retryAfterMs
      state.lastErrorKind = classified.kind
      const err = new Error(classified.message)
      ;(err as Error & { classified?: typeof classified }).classified = classified
      throw err
    }

    const responseBody = (await response.json()) as {
      choices?: { message?: { content?: string; reasoning?: string } }[]
      usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
        prompt_tokens_details?: { cached_tokens?: number }
      }
      model?: string
    }
    const message = responseBody.choices?.[0]?.message
    const content = (message?.content || message?.reasoning || "").trim()
    if (!content) {
      const classified = classifyProviderError(new Error("Groq returned empty content."))
      state.lastErrorKind = classified.kind
      const err = new Error(classified.message)
      ;(err as Error & { classified?: typeof classified }).classified = classified
      throw err
    }

    const promptTokens = responseBody.usage?.prompt_tokens ?? 0
    const completionTokens = responseBody.usage?.completion_tokens ?? 0
    const cachedTokens = responseBody.usage?.prompt_tokens_details?.cached_tokens ?? 0
    state.promptTokens += promptTokens
    state.completionTokens += completionTokens
    state.cachedTokens += cachedTokens

    const latencyMs = Date.now() - started
    state.providerLatencyMs += latencyMs
    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: responseBody.usage?.total_tokens ?? promptTokens + completionTokens,
        cachedTokens,
      },
      model: responseBody.model || model,
      latencyMs,
      attempts: 1,
    }
  }

  return {
    state,
    gate,
    model,
    async completeJson(
      messages: LlmMessage[],
      timeoutMs = 45_000,
      callOpts?: { maxTokens?: number },
    ): Promise<LiveCallResult> {
      const sinceLast = Date.now() - lastLogicalCallAt
      const tpmSpacing = lastLogicalCallAt > 0 ? computeTpmSpacingMs(lastCallTokens, tpmLimit) : 0
      const requiredGap = Math.max(minSpacingMs, tpmSpacing)
      if (lastLogicalCallAt > 0 && sinceLast < requiredGap) {
        const spacingWait = requiredGap - sinceLast
        state.spacingWaitMs += spacingWait
        await sleep(spacingWait)
      }

      let attempt = 0
      let lastKind: ProviderErrorKind | undefined
      while (attempt < backoff.maxAttempts) {
        attempt += 1
        try {
          const result = await singleAttempt(messages, timeoutMs, callOpts?.maxTokens)
          lastLogicalCallAt = Date.now()
          lastCallTokens = result.usage.promptTokens + result.usage.completionTokens
          return { ...result, attempts: attempt, lastErrorKind: lastKind }
        } catch (error) {
          const classified =
            (error as Error & { classified?: ReturnType<typeof classifyProviderError> }).classified ??
            classifyProviderError(error)
          lastKind = classified.kind
          state.lastErrorKind = classified.kind
          const canRetry = classified.retryable && attempt < backoff.maxAttempts && state.calls < state.maxCalls
          if (!canRetry) {
            throw new Error(
              `LIVE provider error after ${attempt} attempt(s) [${classified.kind}]: ${classified.message}`,
            )
          }
          state.retries += 1
          const delay = computeBackoffMs(attempt, backoff, classified.retryAfterMs)
          state.retryWaitMs += delay
          await sleep(delay)
        }
      }
      throw new Error(`LIVE provider exhausted retries [${lastKind ?? "unknown"}].`)
    },
  }
}

export function didInvokeLlm(errorCode?: string, ok?: boolean) {
  if (ok) return true
  if (!errorCode) return false
  return ["llm_error", "output_invalid", "side_effect_blocked"].includes(errorCode)
}
