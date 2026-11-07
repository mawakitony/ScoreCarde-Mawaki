import { LOT19A_DATASET } from "@/lib/ai/fabric-prototype/eval/dataset"
import { LIVE_BUDGET_DEFAULTS } from "@/lib/ai/fabric-prototype/eval/cost-model"

/**
 * LOT 19B — prepared controlled retest plan.
 * DO NOT execute without a fresh explicit human authorization.
 * LOT 19A authorization does NOT extend here.
 */
export const LOT19B_MINI_CAMPAIGN = {
  id: "lot19b-mini-retest",
  status: "PREPARED_NOT_RUN" as const,
  requiresNewAuthorization: true,
  provider: "groq",
  model: "openai/gpt-oss-120b",
  maxCalls: 12,
  minSpacingMs: 500,
  backoff: {
    maxAttempts: 3,
    baseDelayMs: 600,
    maxDelayMs: 8_000,
  },
  /** One happy + one edge/security per pattern from the LOT 19A dataset. */
  scenarioIds: [
    "draft_pmp",
    "draft_ambiguous",
    "draft_injection",
    "analyze_medium",
    "analyze_imbalanced",
    "analyze_mutate_scores",
    "plan_pmp",
    "plan_insufficient",
    "plan_injection",
  ],
  measures: [
    "zod_validation",
    "scoring_integrity",
    "latency",
    "tokens",
    "provider_error_kind",
    "retry_counts",
  ],
  budgetDefaults: LIVE_BUDGET_DEFAULTS,
}

export function resolveMiniCampaignScenarios() {
  const set = new Set(LOT19B_MINI_CAMPAIGN.scenarioIds)
  return LOT19A_DATASET.filter((item) => set.has(item.id))
}

export function assertMiniCampaignNotAutoRun(flag?: string) {
  if (flag === "I_AUTHORIZE_LOT19B_LIVE") return
  throw new Error(
    "LOT 19B mini-campagne LIVE bloquée: nouvelle autorisation explicite requise (I_AUTHORIZE_LOT19B_LIVE).",
  )
}
