import { LOT19M_DATASET, lot19mDatasetSummary } from "@/lib/ai/fabric-prototype/eval/lot19m-dataset"
import { LOT19M_VALIDATOR_IDS } from "@/lib/ai/fabric-prototype/eval/lot19m-validators"
import { GROQ_GPT_OSS_120B_USD_PER_MTOK } from "@/lib/ai/fabric-prototype/eval/cost-model"
import { getFabricPattern, listFabricPatterns } from "@/lib/ai/fabric-prototype/registry"
import { getLiveGateStatus, readProviderConfig } from "@/lib/ai/fabric-prototype/eval/live-gate"
import { existsSync } from "node:fs"

/**
 * LOT 19M — targeted LIVE retest preparation (draft 1.3.1, plan 1.3.3, analyze 1.3.0).
 * This module PREPARES the campaign. Prior LOT authorizations do NOT extend here.
 * Fresh chat authorization + FABRIC_EVAL_CONFIRM_19M required before any Groq call.
 */
export const LOT19M_CONFIRM_VALUE = "I_AUTHORIZE_LOT19M_LIVE"

export const LOT19M_OUTPUT_DIR = "tmp/lot19m-live"

export const LOT19M_CAMPAIGN = {
  id: "lot19m-targeted-retest",
  status: "PREPARED_NOT_RUN" as const,
  requiresNewAuthorization: true,
  confirmEnvKey: "FABRIC_EVAL_CONFIRM_19M",
  confirmValue: LOT19M_CONFIRM_VALUE,
  provider: "groq",
  model: "openai/gpt-oss-120b",
  versionsRequired: {
    generate_scorecard_draft: "1.3.1",
    analyze_scorecard_results: "1.3.0",
    generate_action_plan: "1.3.3",
  },
  maxHttpAttempts: 12,
  maxEstimatedUsd: 0.02,
  projectedUsdPerScenario: 0.0025,
  scenarioCount: 8,
  minSpacingMs: 4_000,
  tpmLimit: 8_000,
  backoff: {
    maxAttempts: 2,
    baseDelayMs: 1_000,
    maxDelayMs: 15_000,
  },
  outputDir: LOT19M_OUTPUT_DIR,
  scenarioIds: LOT19M_DATASET.map((s) => s.id),
  pricingSnapshot: GROQ_GPT_OSS_120B_USD_PER_MTOK,
  rationale: [
    "LOT 19T: draft 1.3.1 + plan 1.3.3 (pas de clipString silencieux sur champs critiques) ; analyse 1.3.0.",
    "Retest ciblé 8 scénarios / plafond 12 HTTP / $0.02 estimé.",
    "HUMAN REVIEW reste PENDING.",
  ],
} as const

export function resolveLot19mScenarios() {
  return LOT19M_DATASET
}

export function assertLot19mNotAutoRun(flag?: string) {
  if (flag === LOT19M_CONFIRM_VALUE) return
  throw new Error(
    `LOT 19M LIVE bloquée: autorisation explicite requise (${LOT19M_CONFIRM_VALUE} via FABRIC_EVAL_CONFIRM_19M). Prior LIVE flags/env do NOT authorize this campaign.`,
  )
}

/** Budget ceilings must be positive and match LOT 19M contract before LIVE. */
export function assertLot19mBudgetValid() {
  if (LOT19M_CAMPAIGN.maxHttpAttempts !== 12) {
    throw new Error(`LOT 19M HTTP ceiling invalid: expected 12, got ${LOT19M_CAMPAIGN.maxHttpAttempts}`)
  }
  if (LOT19M_CAMPAIGN.maxEstimatedUsd !== 0.02) {
    throw new Error(`LOT 19M USD ceiling invalid: expected 0.02, got ${LOT19M_CAMPAIGN.maxEstimatedUsd}`)
  }
  if (LOT19M_CAMPAIGN.projectedUsdPerScenario <= 0) {
    throw new Error("LOT 19M projectedUsdPerScenario must be > 0 (refuse unbounded cost).")
  }
  if (LOT19M_CAMPAIGN.scenarioCount !== 8) {
    throw new Error(`LOT 19M scenarioCount invalid: expected 8, got ${LOT19M_CAMPAIGN.scenarioCount}`)
  }
}

/**
 * Full LIVE readiness for the npm script path.
 * Env confirm alone is never human chat authorization — caller must still have chat auth.
 */
export function assertLot19mLiveScriptReady(opts: {
  executeLiveFlag: boolean
  confirmEnvValue?: string
}) {
  if (!opts.executeLiveFlag) {
    throw new Error("LOT 19M LIVE refused: missing --execute-live (env alone is not enough).")
  }
  assertLot19mNotAutoRun(opts.confirmEnvValue)
  assertLot19mBudgetValid()
  const gate = getLiveGateStatus()
  if (!gate.canRunLive) {
    throw new Error(`LOT 19M LIVE refused: ${gate.blockers.join("; ")}`)
  }
}

export function estimateLot19mCostUsd() {
  return {
    lowUsd: 0.004,
    highUsd: 0.02,
    hardCeilingUsd: LOT19M_CAMPAIGN.maxEstimatedUsd,
    note: "8 scénarios, plafond 12 HTTP, tarifs Groq gpt-oss-120b ($0.15/M in, $0.60/M out). Plafond = estimation harness, pas facture exacte.",
  }
}

export function versionsMatchRequired() {
  const required = LOT19M_CAMPAIGN.versionsRequired
  const draft = getFabricPattern("generate_scorecard_draft")
  const analyze = getFabricPattern("analyze_scorecard_results")
  const plan = getFabricPattern("generate_action_plan")
  return {
    generate_scorecard_draft: draft?.version === required.generate_scorecard_draft,
    analyze_scorecard_results: analyze?.version === required.analyze_scorecard_results,
    generate_action_plan: plan?.version === required.generate_action_plan,
    all:
      draft?.version === required.generate_scorecard_draft &&
      analyze?.version === required.analyze_scorecard_results &&
      plan?.version === required.generate_action_plan,
  }
}

/**
 * Offline preflight — never calls Groq. Does not require API key to pass.
 */
export function lot19mPreflightSnapshot(opts?: { requireKeyForLiveReadiness?: boolean }) {
  const dataset = lot19mDatasetSummary()
  const versions = versionsMatchRequired()
  const liveGate = getLiveGateStatus()
  const provider = readProviderConfig()
  const listed = listFabricPatterns()

  const blockers: string[] = []
  if (dataset.total !== 8) blockers.push(`dataset.total=${dataset.total} (expected 8)`)
  if (!dataset.uniqueIds) blockers.push("duplicate scenario ids")
  if (!versions.all) blockers.push("pattern versions mismatch vs 19M required")
  if (liveGate.enabled || liveGate.liveAllowed) {
    blockers.push("Fabric LIVE flags ON during preparation (should be OFF for prep)")
  }

  const futureLiveConditions = [
    "Autorisation chat explicite LOT 19M LIVE",
    `${LOT19M_CAMPAIGN.confirmEnvKey}=${LOT19M_CAMPAIGN.confirmValue}`,
    "FABRIC_PROTOTYPE_ENABLED=1",
    "FABRIC_PROTOTYPE_LIVE=1",
    "FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM",
    "AI_PROVIDER=groq",
    "AI_MODEL=openai/gpt-oss-120b",
    "AI_API_KEY + AI_BASE_URL configured (values never logged)",
  ]

  return {
    campaignId: LOT19M_CAMPAIGN.id,
    status: LOT19M_CAMPAIGN.status,
    offline: true,
    networkRequired: false,
    groqInvoked: false,
    dataset,
    patterns: listed.map((p) => ({ id: p.id, version: p.version })),
    versionsRequired: LOT19M_CAMPAIGN.versionsRequired,
    versionsMatch: versions,
    validators: [...LOT19M_VALIDATOR_IDS],
    budget: {
      maxHttpAttempts: LOT19M_CAMPAIGN.maxHttpAttempts,
      maxEstimatedUsd: LOT19M_CAMPAIGN.maxEstimatedUsd,
      projectedUsdPerScenario: LOT19M_CAMPAIGN.projectedUsdPerScenario,
      minSpacingMs: LOT19M_CAMPAIGN.minSpacingMs,
      tpmLimit: LOT19M_CAMPAIGN.tpmLimit,
      costCeiling: estimateLot19mCostUsd(),
    },
    outputDir: LOT19M_CAMPAIGN.outputDir,
    outputDirExists: existsSync(LOT19M_CAMPAIGN.outputDir),
    liveFlags: {
      enabled: liveGate.enabled,
      liveAllowed: liveGate.liveAllowed,
      confirmOk: liveGate.confirmOk,
      expectedOffForPrep: !liveGate.enabled && !liveGate.liveAllowed,
    },
    providerReadiness: {
      providerId: provider.providerId,
      model: provider.model,
      keyConfigured: provider.keyConfigured,
      baseUrlConfigured: provider.baseUrlConfigured,
      /** Presence only — never values. Missing key does not fail offline preflight. */
      keyMissingNotedForFutureLive: !provider.keyConfigured,
    },
    authorization: {
      required: true,
      env: LOT19M_CAMPAIGN.confirmEnvKey,
      value: LOT19M_CAMPAIGN.confirmValue,
      priorLotAuthDoesNotExtend: true,
      futureLiveConditions,
    },
    prepBlockers: blockers,
    prepOk: blockers.length === 0,
    requireKeyForLiveReadiness: opts?.requireKeyForLiveReadiness ?? false,
  }
}
