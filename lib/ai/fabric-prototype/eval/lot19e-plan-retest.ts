import { LOT19D_DATASET } from "@/lib/ai/fabric-prototype/eval/lot19d-dataset"
import { GROQ_GPT_OSS_120B_USD_PER_MTOK } from "@/lib/ai/fabric-prototype/eval/cost-model"

/**
 * LOT 19E — prepared targeted LIVE retest for generate_action_plan only.
 * DO NOT execute without a fresh explicit human authorization.
 * LOT 19D authorization does NOT extend here.
 */
export const LOT19E_PLAN_CONFIRM_VALUE = "I_AUTHORIZE_LOT19E_PLAN_LIVE"

export const LOT19E_PLAN_RETEST = {
  id: "lot19e-plan-retest",
  status: "PREPARED_NOT_RUN" as const,
  requiresNewAuthorization: true,
  confirmEnvKey: "FABRIC_EVAL_CONFIRM_19E",
  confirmValue: LOT19E_PLAN_CONFIRM_VALUE,
  provider: "groq",
  model: "openai/gpt-oss-120b",
  patternId: "generate_action_plan" as const,
  patternVersionRequired: "1.2.1",
  /** Plan-only: 4 scenarios, tight HTTP ceiling. */
  maxHttpAttempts: 6,
  scenarioCount: 4,
  /** Higher base spacing + TPM adaptive spacing in live-client. */
  minSpacingMs: 4_000,
  tpmLimit: 8_000,
  backoff: {
    maxAttempts: 2,
    baseDelayMs: 1_000,
    maxDelayMs: 15_000,
  },
  outputDir: "tmp/lot19e-plan-live",
  scenarioIds: [
    "d19d_plan_skills",
    "d19d_plan_pmo",
    "d19d_plan_digital",
    "d19d_plan_competing",
  ],
  pricingSnapshot: GROQ_GPT_OSS_120B_USD_PER_MTOK,
  rationale: [
    "LOT 19D: 0 sortie plan utile (1× 429 sans retry budget + 3 NOT RUN).",
    "Cause dominante: TPM 8000 + retries drafts/analyze ayant consommé le plafond 16.",
    "Retest isolé pour mesurer la qualité métier du Pattern plan v1.2.1.",
  ],
} as const

export function resolveLot19ePlanScenarios() {
  const set = new Set<string>(LOT19E_PLAN_RETEST.scenarioIds)
  return LOT19D_DATASET.filter((item) => set.has(item.id))
}

export function assertLot19ePlanNotAutoRun(flag?: string) {
  if (flag === LOT19E_PLAN_CONFIRM_VALUE) return
  throw new Error(
    `LOT 19E plan retest LIVE bloqué: nouvelle autorisation explicite requise (${LOT19E_PLAN_CONFIRM_VALUE} via FABRIC_EVAL_CONFIRM_19E).`,
  )
}

export function estimateLot19ePlanCostUsd() {
  return {
    lowUsd: 0.001,
    highUsd: 0.008,
    note: "4 scénarios plan, plafond 6 HTTP, tarifs Groq gpt-oss-120b.",
  }
}
