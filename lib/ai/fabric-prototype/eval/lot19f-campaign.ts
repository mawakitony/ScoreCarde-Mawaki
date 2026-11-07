import { LOT19F_DATASET, lot19fDatasetSummary } from "@/lib/ai/fabric-prototype/eval/lot19f-dataset"
import { GROQ_GPT_OSS_120B_USD_PER_MTOK } from "@/lib/ai/fabric-prototype/eval/cost-model"
import { getFabricPattern } from "@/lib/ai/fabric-prototype/registry"

/**
 * LOT 19F — targeted LIVE retest for generate_action_plan v1.2.1.
 * This module PREPARES the campaign. Prior LOT authorizations do NOT extend here.
 * Fresh chat authorization + FABRIC_EVAL_CONFIRM_19F required before any Groq call.
 */
export const LOT19F_CONFIRM_VALUE = "I_AUTHORIZE_LOT19F_LIVE"

export const LOT19F_OUTPUT_DIR = "tmp/lot19f-plan-live"

export const LOT19F_CAMPAIGN = {
  id: "lot19f-action-plan-retest",
  status: "PREPARED_NOT_RUN" as const,
  requiresNewAuthorization: true,
  confirmEnvKey: "FABRIC_EVAL_CONFIRM_19F",
  confirmValue: LOT19F_CONFIRM_VALUE,
  provider: "groq",
  model: "openai/gpt-oss-120b",
  patternId: "generate_action_plan" as const,
  patternVersionRequired: "1.2.1",
  maxHttpAttempts: 6,
  scenarioCount: 4,
  minSpacingMs: 4_000,
  tpmLimit: 8_000,
  backoff: {
    maxAttempts: 2,
    baseDelayMs: 1_000,
    maxDelayMs: 15_000,
  },
  outputDir: LOT19F_OUTPUT_DIR,
  scenarioIds: LOT19F_DATASET.map((s) => s.id),
  pricingSnapshot: GROQ_GPT_OSS_120B_USD_PER_MTOK,
  rationale: [
    "LOT 19D/E: qualité plan non mesurée (429 TPM / plafond HTTP).",
    "Optimisations 19E: max_tokens, spacing TPM, Retry-After jusqu'à 60s.",
    "Retest isolé 4 scénarios / max 6 HTTP pour juger la qualité métier.",
  ],
} as const

export function resolveLot19fScenarios() {
  return LOT19F_DATASET
}

export function assertLot19fNotAutoRun(flag?: string) {
  if (flag === LOT19F_CONFIRM_VALUE) return
  throw new Error(
    `LOT 19F LIVE bloquée: nouvelle autorisation explicite requise (${LOT19F_CONFIRM_VALUE} via FABRIC_EVAL_CONFIRM_19F).`,
  )
}

export function estimateLot19fCostUsd() {
  return {
    lowUsd: 0.001,
    highUsd: 0.008,
    note: "4 scénarios plan, plafond 6 HTTP, tarifs Groq gpt-oss-120b ($0.15/M in, $0.60/M out).",
  }
}

export function lot19fPreflightSnapshot() {
  const pattern = getFabricPattern("generate_action_plan")
  return {
    campaignId: LOT19F_CAMPAIGN.id,
    status: LOT19F_CAMPAIGN.status,
    dataset: lot19fDatasetSummary(),
    patternVersion: pattern?.version ?? null,
    patternAtRequiredVersion: pattern?.version === LOT19F_CAMPAIGN.patternVersionRequired,
    maxHttpAttempts: LOT19F_CAMPAIGN.maxHttpAttempts,
    minSpacingMs: LOT19F_CAMPAIGN.minSpacingMs,
    tpmLimit: LOT19F_CAMPAIGN.tpmLimit,
    costCeiling: estimateLot19fCostUsd(),
    pricing: LOT19F_CAMPAIGN.pricingSnapshot,
    outputDir: LOT19F_CAMPAIGN.outputDir,
    authorization: {
      required: true,
      env: LOT19F_CAMPAIGN.confirmEnvKey,
      value: LOT19F_CAMPAIGN.confirmValue,
      alsoRequires: [
        "Autorisation humaine explicite dans le chat pour LOT 19F LIVE",
        "FABRIC_PROTOTYPE_ENABLED=1",
        "FABRIC_PROTOTYPE_LIVE=1",
        "FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM",
        "AI_PROVIDER=groq",
        "AI_MODEL=openai/gpt-oss-120b",
        "AI_API_KEY + AI_BASE_URL",
      ],
      note: "Ce module / prompt de préparation NE consomme PAS d'appels Groq à lui seul.",
    },
  }
}
