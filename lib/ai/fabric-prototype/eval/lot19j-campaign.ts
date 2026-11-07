import { LOT19J_DATASET, lot19jDatasetSummary } from "@/lib/ai/fabric-prototype/eval/lot19j-dataset"
import { GROQ_GPT_OSS_120B_USD_PER_MTOK } from "@/lib/ai/fabric-prototype/eval/cost-model"
import { listFabricPatterns } from "@/lib/ai/fabric-prototype/registry"

/**
 * LOT 19J — controlled LIVE retest of all three Patterns at v1.3.0.
 * Prior LOT authorizations do NOT extend here.
 * Requires chat authorization (this lot) + FABRIC_EVAL_CONFIRM_19J.
 */
export const LOT19J_CONFIRM_VALUE = "I_AUTHORIZE_LOT19J_LIVE"

export const LOT19J_OUTPUT_DIR = "tmp/lot19j-live"

export const LOT19J_CAMPAIGN = {
  id: "lot19j-v130-retest",
  status: "AUTHORIZED_PENDING_RUN" as const,
  requiresNewAuthorization: true,
  confirmEnvKey: "FABRIC_EVAL_CONFIRM_19J",
  confirmValue: LOT19J_CONFIRM_VALUE,
  provider: "groq",
  model: "openai/gpt-oss-120b",
  patternVersionRequired: "1.3.0",
  maxHttpAttempts: 18,
  maxEstimatedUsd: 0.02,
  /** Conservative projected USD used to refuse starting a new scenario. */
  projectedUsdPerScenario: 0.0025,
  scenarioCount: 12,
  minSpacingMs: 4_000,
  tpmLimit: 8_000,
  backoff: {
    maxAttempts: 2,
    baseDelayMs: 1_000,
    maxDelayMs: 15_000,
  },
  outputDir: LOT19J_OUTPUT_DIR,
  scenarioIds: LOT19J_DATASET.map((s) => s.id),
  pricingSnapshot: GROQ_GPT_OSS_120B_USD_PER_MTOK,
  rationale: [
    "LOT 19I: corrections métier v1.3.0 non prouvées LIVE.",
    "Retest contrôlé 12 scénarios / plafond 18 HTTP / $0.02.",
    "HUMAN REVIEW reste PENDING après ce LOT.",
  ],
} as const

export function resolveLot19jScenarios() {
  return LOT19J_DATASET
}

export function assertLot19jNotAutoRun(flag?: string) {
  if (flag === LOT19J_CONFIRM_VALUE) return
  throw new Error(
    `LOT 19J LIVE bloquée: autorisation explicite requise (${LOT19J_CONFIRM_VALUE} via FABRIC_EVAL_CONFIRM_19J).`,
  )
}

export function estimateLot19jCostUsd() {
  return {
    lowUsd: 0.004,
    highUsd: 0.02,
    hardCeilingUsd: LOT19J_CAMPAIGN.maxEstimatedUsd,
    note: "12 scénarios, plafond 18 HTTP, tarifs Groq gpt-oss-120b ($0.15/M in, $0.60/M out).",
  }
}

export function lot19jPreflightSnapshot() {
  const listed = listFabricPatterns()
  const allAt130 = listed.every((p) => p.version === LOT19J_CAMPAIGN.patternVersionRequired)
  return {
    campaignId: LOT19J_CAMPAIGN.id,
    status: LOT19J_CAMPAIGN.status,
    dataset: lot19jDatasetSummary(),
    patterns: listed.map((p) => ({ id: p.id, version: p.version })),
    patternAtRequiredVersion: allAt130,
    maxHttpAttempts: LOT19J_CAMPAIGN.maxHttpAttempts,
    maxEstimatedUsd: LOT19J_CAMPAIGN.maxEstimatedUsd,
    minSpacingMs: LOT19J_CAMPAIGN.minSpacingMs,
    tpmLimit: LOT19J_CAMPAIGN.tpmLimit,
    costCeiling: estimateLot19jCostUsd(),
    pricing: LOT19J_CAMPAIGN.pricingSnapshot,
    outputDir: LOT19J_CAMPAIGN.outputDir,
    authorization: {
      required: true,
      env: LOT19J_CAMPAIGN.confirmEnvKey,
      value: LOT19J_CAMPAIGN.confirmValue,
      alsoRequires: [
        "Autorisation humaine explicite dans le chat pour LOT 19J LIVE",
        "FABRIC_PROTOTYPE_ENABLED=1",
        "FABRIC_PROTOTYPE_LIVE=1",
        "FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM",
        "AI_PROVIDER=groq",
        "AI_MODEL=openai/gpt-oss-120b",
        "AI_API_KEY + AI_BASE_URL",
      ],
    },
  }
}

