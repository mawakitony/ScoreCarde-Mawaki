/**
 * Token / cost estimates for LOT 19A.
 * Do not invent precise $ amounts when the provider tariff is unconfirmed.
 */

export type TokenEstimate = {
  inputChars: number
  outputChars: number
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedTotalTokens: number
}

export type CostEstimate = {
  currency: "USD"
  /** null when tariff not confirmed in-repo */
  estimatedUsd: number | null
  note: string
}

/** Rough heuristic: ~4 chars / token for mixed FR/EN JSON. */
export function estimateTokensFromChars(inputChars: number, outputChars: number): TokenEstimate {
  const estimatedInputTokens = Math.ceil(inputChars / 4)
  const estimatedOutputTokens = Math.ceil(outputChars / 4)
  return {
    inputChars,
    outputChars,
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedTotalTokens: estimatedInputTokens + estimatedOutputTokens,
  }
}

/** Snapshot LOT 19A (Groq docs / pricing, Oct 2026): openai/gpt-oss-120b */
export const GROQ_GPT_OSS_120B_USD_PER_MTOK = {
  input: 0.15,
  output: 0.6,
  cachedInput: 0.075,
  source: "https://console.groq.com/docs/model/openai/gpt-oss-120b",
  verifiedForLot: "19A-2026-10-24",
} as const

/**
 * Cost estimate from token counts.
 * Uses published Groq gpt-oss-120b rates when provider is groq.
 */
export function estimateCostUsd(
  tokens: TokenEstimate,
  providerId: string,
  opts?: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number },
): CostEstimate {
  const inputTokens = opts?.inputTokens ?? tokens.estimatedInputTokens
  const outputTokens = opts?.outputTokens ?? tokens.estimatedOutputTokens
  const cached = opts?.cachedInputTokens ?? 0
  if (providerId.toLowerCase().includes("groq")) {
    const billableInput = Math.max(0, inputTokens - cached)
    const usd =
      (billableInput / 1_000_000) * GROQ_GPT_OSS_120B_USD_PER_MTOK.input +
      (cached / 1_000_000) * GROQ_GPT_OSS_120B_USD_PER_MTOK.cachedInput +
      (outputTokens / 1_000_000) * GROQ_GPT_OSS_120B_USD_PER_MTOK.output
    return {
      currency: "USD",
      estimatedUsd: Number(usd.toFixed(6)),
      note: `Groq openai/gpt-oss-120b @ $${GROQ_GPT_OSS_120B_USD_PER_MTOK.input}/M in + $${GROQ_GPT_OSS_120B_USD_PER_MTOK.output}/M out (${GROQ_GPT_OSS_120B_USD_PER_MTOK.source}).`,
    }
  }
  return {
    currency: "USD",
    estimatedUsd: null,
    note: "Tarif fournisseur non confirmé dans le dépôt.",
  }
}

export const LIVE_BUDGET_DEFAULTS: {
  maxCalls: number
  maxEstimatedInputTokens: number
  maxEstimatedOutputTokens: number
  maxEstimatedUsd: number
} = {
  /** One call per scenario + small buffer (30 scenarios). */
  maxCalls: 32,
  maxEstimatedInputTokens: 120_000,
  maxEstimatedOutputTokens: 80_000,
  /** Soft dollar cap placeholder — enforced only if estimatedUsd is known. */
  maxEstimatedUsd: 2,
}
