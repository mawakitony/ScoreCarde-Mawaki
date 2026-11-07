import { LOT19D_DATASET, lot19dDatasetSummary } from "@/lib/ai/fabric-prototype/eval/lot19d-dataset"
import { GROQ_GPT_OSS_120B_USD_PER_MTOK, LIVE_BUDGET_DEFAULTS } from "@/lib/ai/fabric-prototype/eval/cost-model"
import { listFabricPatterns } from "@/lib/ai/fabric-prototype/registry"

/**
 * LOT 19D — controlled qualitative LIVE campaign plan.
 * DO NOT execute without a fresh explicit human authorization.
 * Prior LOT authorizations (19A / 19B / 19C) do NOT extend here.
 */
export const LOT19D_CONFIRM_VALUE = "I_AUTHORIZE_LOT19D_LIVE"

export const LOT19D_OUTPUT_DIR = "tmp/lot19d-live"

export const LOT19D_CAMPAIGN = {
  id: "lot19d-qualitative-live",
  status: "PREPARED_NOT_RUN" as const,
  requiresNewAuthorization: true,
  confirmEnvKey: "FABRIC_EVAL_CONFIRM_19D",
  confirmValue: LOT19D_CONFIRM_VALUE,
  provider: "groq",
  model: "openai/gpt-oss-120b",
  /** Hard ceiling: every HTTP attempt (including retries) counts. */
  maxHttpAttempts: 16,
  scenarioCount: 12,
  minSpacingMs: 600,
  backoff: {
    maxAttempts: 3,
    baseDelayMs: 700,
    maxDelayMs: 10_000,
  },
  patternVersionRequired: "1.2.0",
  outputDir: LOT19D_OUTPUT_DIR,
  measures: [
    "zod_validation",
    "scoring_integrity",
    "latency_total",
    "latency_provider",
    "retry_wait",
    "tokens",
    "cost",
    "validated_output_persistence",
    "human_qualitative_rubric",
  ],
  pricingSnapshot: GROQ_GPT_OSS_120B_USD_PER_MTOK,
  budgetDefaults: LIVE_BUDGET_DEFAULTS,
  scenarioIds: LOT19D_DATASET.map((s) => s.id),
} as const

/** Rough upper-bound cost from 19B observed ~$0.0005–0.001 / useful call × ≤16 attempts. */
export function estimateLot19dCostCeilingUsd(): { lowUsd: number; highUsd: number; note: string } {
  return {
    lowUsd: 0.004,
    highUsd: 0.02,
    note:
      "Estimation prudente à partir des tarifs Groq gpt-oss-120b ($0.15/M in, $0.60/M out) et des volumes 19B (~5–8k completion tokens / 7–10 appels utiles). Plafond 16 HTTP attempts.",
  }
}

export function resolveLot19dScenarios() {
  return LOT19D_DATASET
}

export function assertLot19dNotAutoRun(flag?: string) {
  if (flag === LOT19D_CONFIRM_VALUE) return
  throw new Error(
    `LOT 19D LIVE bloquée: nouvelle autorisation explicite requise (${LOT19D_CONFIRM_VALUE} via FABRIC_EVAL_CONFIRM_19D).`,
  )
}

export function lot19dPreflightSnapshot() {
  const patterns = listFabricPatterns()
  const versions = Object.fromEntries(patterns.map((p) => [p.id, p.version]))
  const allV12 = patterns.every((p) => p.version === LOT19D_CAMPAIGN.patternVersionRequired)
  return {
    campaignId: LOT19D_CAMPAIGN.id,
    status: LOT19D_CAMPAIGN.status,
    dataset: lot19dDatasetSummary(),
    patternVersions: versions,
    patternsAtRequiredVersion: allV12,
    maxHttpAttempts: LOT19D_CAMPAIGN.maxHttpAttempts,
    costCeiling: estimateLot19dCostCeilingUsd(),
    pricing: LOT19D_CAMPAIGN.pricingSnapshot,
    outputDir: LOT19D_CAMPAIGN.outputDir,
    authorization: {
      required: true,
      env: LOT19D_CAMPAIGN.confirmEnvKey,
      value: LOT19D_CAMPAIGN.confirmValue,
      alsoRequires: [
        "FABRIC_PROTOTYPE_ENABLED=1",
        "FABRIC_PROTOTYPE_LIVE=1",
        "FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM",
        "AI_PROVIDER=groq",
        "AI_MODEL=openai/gpt-oss-120b",
        "AI_API_KEY + AI_BASE_URL",
        "Autorisation humaine explicite dans le chat",
      ],
    },
  }
}
