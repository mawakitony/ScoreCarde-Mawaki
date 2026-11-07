import { LOT19A_DATASET, type EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"
import { scoreDeterministic, type DeterministicScorecard } from "@/lib/ai/fabric-prototype/eval/deterministic-scorer"
import { createBudgetTracker } from "@/lib/ai/fabric-prototype/eval/budget"
import { emptyPendingReview, type QualitativeReview } from "@/lib/ai/fabric-prototype/eval/quality-rubric"
import { assertEvalLiveAuthorized, getLiveGateStatus, readProviderConfig } from "@/lib/ai/fabric-prototype/eval/live-gate"
import { estimateCostUsd, GROQ_GPT_OSS_120B_USD_PER_MTOK } from "@/lib/ai/fabric-prototype/eval/cost-model"
import { ASSISTANT_BENCHMARK_STATUS } from "@/lib/ai/fabric-prototype/eval/assistant-baseline"
import { assertCampaignLiveLocks } from "@/lib/ai/fabric-prototype/eval/campaign-live-locks"
import { createLot19aLiveClient, didInvokeLlm } from "@/lib/ai/fabric-prototype/eval/live-client"
import { createMockLlmAdapter, createLiveLlmAdapter } from "@/lib/ai/fabric-prototype/llm-adapter"
import { getFabricPattern } from "@/lib/ai/fabric-prototype/registry"
import { runFabricPattern } from "@/lib/ai/fabric-prototype/runner"
import type { FabricLlmAdapter, FabricPatternId } from "@/lib/ai/fabric-prototype/types"

export type EvalMode = "mock" | "live"

export type ScenarioEvalResult = {
  scenario: Pick<EvalScenario, "id" | "patternId" | "name" | "expectations">
  deterministic: DeterministicScorecard
  qualitative: QualitativeReview
  errorCode?: string
  errorMessage?: string
  invokedLlm: boolean
  httpAttempts?: number
  /** Pattern package version at run time (e.g. 1.2.0). */
  patternVersion?: string
  /** Synthetic scenario input (fictional only). */
  syntheticInput?: unknown
  model?: string
  providerLatencyMs?: number
  retryWaitMs?: number
  spacingWaitMs?: number
  /** Approximate local validation / runner overhead (total − provider − waits). */
  validationMs?: number
  /**
   * Validated pattern output when runOk — persisted so LOT 19C+ qualitative
   * review does not depend on reconstructing LIVE text.
   */
  validatedOutput?: unknown
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cachedTokens: number
  }
}

export type EvalRunReport = {
  mode: EvalMode
  startedAt: string
  finishedAt: string
  provider: ReturnType<typeof readProviderConfig>
  liveGate: ReturnType<typeof getLiveGateStatus>
  scenarioCount: number
  results: ScenarioEvalResult[]
  summary: {
    deterministicPass: number
    deterministicFail: number
    rejectedAsExpected: number
    scoringIntegrityPass: number
    scoringIntegrityFail: number
    avgLatencyMs: number
    maxLatencyMs: number
    actualLlmCalls: number
    retryAttempts: number
    promptTokens: number
    completionTokens: number
    cachedTokens: number
    estimatedCostUsd: number | null
    costNote: string
    lastProviderErrorKind?: string
  }
  budget: ReturnType<typeof createBudgetTracker>["state"]
  assistantBenchmark: typeof ASSISTANT_BENCHMARK_STATUS & { status: "NOT RUN" | "RUN" }
  integrationDecision: Record<
    FabricPatternId,
    "READY FOR INTEGRATION" | "NEEDS IMPROVEMENT" | "NOT RECOMMENDED" | "NOT EVALUATED"
  >
  pricingSnapshot?: typeof GROQ_GPT_OSS_120B_USD_PER_MTOK
  campaignId?: string
}

function summarize(
  results: ScenarioEvalResult[],
  usageTotals: {
    promptTokens: number
    completionTokens: number
    cachedTokens: number
    actualLlmCalls: number
    retryAttempts: number
    lastProviderErrorKind?: string
  },
  providerId: string,
) {
  const evaluated = results.filter((item) => item.errorCode !== "not_run")
  const deterministicPass = evaluated.filter((item) => item.deterministic.allRequiredPassed).length
  const deterministicFail = evaluated.length - deterministicPass
  const rejectedAsExpected = evaluated.filter((item) =>
    item.deterministic.checks.some((check) => check.id === "reject_expected" && check.pass),
  ).length
  const integrity = evaluated.flatMap((item) =>
    item.deterministic.checks.filter((check) => check.id === "scoring_integrity"),
  )
  const scoringIntegrityPass = integrity.filter((check) => check.pass).length
  const scoringIntegrityFail = integrity.length - scoringIntegrityPass
  const latencies = evaluated.map((item) => item.deterministic.latencyMs)
  const avgLatencyMs =
    latencies.length === 0 ? 0 : Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
  const maxLatencyMs = latencies.length === 0 ? 0 : Math.max(...latencies)
  const cost = estimateCostUsd(
    {
      inputChars: 0,
      outputChars: 0,
      estimatedInputTokens: usageTotals.promptTokens,
      estimatedOutputTokens: usageTotals.completionTokens,
      estimatedTotalTokens: usageTotals.promptTokens + usageTotals.completionTokens,
    },
    providerId,
    {
      inputTokens: usageTotals.promptTokens,
      outputTokens: usageTotals.completionTokens,
      cachedInputTokens: usageTotals.cachedTokens,
    },
  )
  return {
    deterministicPass,
    deterministicFail,
    rejectedAsExpected,
    scoringIntegrityPass,
    scoringIntegrityFail,
    avgLatencyMs,
    maxLatencyMs,
    actualLlmCalls: usageTotals.actualLlmCalls,
    retryAttempts: usageTotals.retryAttempts,
    promptTokens: usageTotals.promptTokens,
    completionTokens: usageTotals.completionTokens,
    cachedTokens: usageTotals.cachedTokens,
    estimatedCostUsd: cost.estimatedUsd,
    costNote: cost.note,
    lastProviderErrorKind: usageTotals.lastProviderErrorKind,
  }
}

function decideIntegration(mode: EvalMode, results: ScenarioEvalResult[]): EvalRunReport["integrationDecision"] {
  if (mode !== "live") {
    return {
      generate_scorecard_draft: "NOT EVALUATED",
      analyze_scorecard_results: "NOT EVALUATED",
      generate_action_plan: "NOT EVALUATED",
    }
  }
  const byPattern = (id: FabricPatternId) => results.filter((item) => item.scenario.patternId === id)
  const decide = (id: FabricPatternId) => {
    const subset = byPattern(id)
    if (subset.length === 0) return "NOT EVALUATED" as const
    const passRate = subset.filter((item) => item.deterministic.allRequiredPassed).length / subset.length
    // Never auto-READY: needs human qualitative + product sign-off beyond Zod pass rate.
    if (passRate < 0.7) return "NOT RECOMMENDED" as const
    return "NEEDS IMPROVEMENT" as const
  }
  return {
    generate_scorecard_draft: decide("generate_scorecard_draft"),
    analyze_scorecard_results: decide("analyze_scorecard_results"),
    generate_action_plan: decide("generate_action_plan"),
  }
}

export type RunEvalOptions = {
  mode?: EvalMode
  scenarioIds?: string[]
  patternId?: FabricPatternId
  /** Override default LOT19A dataset (e.g. LOT19D_DATASET). */
  scenarios?: EvalScenario[]
  campaignId?: string
  maxLiveCalls?: number
  /** Hard campaign USD ceiling (cumulative). */
  maxEstimatedUsd?: number
  /**
   * Conservative projected USD for the *next* scenario — used to refuse starting
   * a call that would likely breach maxEstimatedUsd.
   */
  projectedUsdPerScenario?: number
  minSpacingMs?: number
  tpmLimit?: number
  backoff?: {
    maxAttempts: number
    baseDelayMs: number
    maxDelayMs: number
  }
}

/**
 * Offline-safe by default (mock). Live requires triple gate + human confirm env.
 * No public HTTP route — call from scripts / tests only.
 */
export async function runLot19aEvaluation(options: RunEvalOptions = {}): Promise<EvalRunReport> {
  const mode: EvalMode = options.mode ?? "mock"
  const startedAt = new Date().toISOString()
  const liveGate = getLiveGateStatus()
  const provider = readProviderConfig()
  const budget = createBudgetTracker({
    ...liveGate.budget,
    maxCalls: options.maxLiveCalls ?? liveGate.budget.maxCalls,
    maxEstimatedUsd: options.maxEstimatedUsd ?? liveGate.budget.maxEstimatedUsd,
  })
  const projectedUsdPerScenario = options.projectedUsdPerScenario ?? 0

  let scenarios = options.scenarios ?? LOT19A_DATASET
  if (options.patternId) scenarios = scenarios.filter((item) => item.patternId === options.patternId)
  if (options.scenarioIds?.length) {
    const set = new Set(options.scenarioIds)
    scenarios = scenarios.filter((item) => set.has(item.id))
  }

  if (mode === "live" && !liveGate.canRunLive) {
    throw new Error(`Cannot run LIVE eval: ${liveGate.blockers.join("; ")}`)
  }

  // Defense-in-depth: lot-specific confirms before any live client construction.
  if (mode === "live") {
    assertCampaignLiveLocks(
      options.campaignId,
      scenarios.map((s) => s.id),
    )
  }

  let adapter: FabricLlmAdapter
  let liveClient: ReturnType<typeof createLot19aLiveClient> | null = null

  if (mode === "mock") {
    adapter = createMockLlmAdapter()
  } else {
    assertEvalLiveAuthorized()
    liveClient = createLot19aLiveClient({
      maxCalls: options.maxLiveCalls ?? 32,
      minSpacingMs: options.minSpacingMs,
      tpmLimit: options.tpmLimit,
      backoff: options.backoff
        ? { ...options.backoff, jitterRatio: 0.25 }
        : undefined,
      beforeAttempt: () => {
        if (!budget.canContinue()) {
          throw new Error(budget.state.stopReason || "Budget stopped.")
        }
        if (
          projectedUsdPerScenario > 0 &&
          budget.wouldExceedUsd(projectedUsdPerScenario)
        ) {
          budget.stop(
            `maxEstimatedUsd projected breach before HTTP (cumul=${budget.state.estimatedUsd}, next≈${projectedUsdPerScenario}, ceiling=${budget.limits.maxEstimatedUsd})`,
          )
          throw new Error(budget.state.stopReason)
        }
      },
    })
    adapter = createLiveLlmAdapter({
      completeJson: async (messages, timeoutMs, callOpts) => {
        if (!budget.canContinue()) throw new Error(budget.state.stopReason || "Budget stopped.")
        if (liveClient!.state.calls >= liveClient!.state.maxCalls) {
          throw new Error(`LIVE call ceiling reached (${liveClient!.state.maxCalls}).`)
        }
        const result = await liveClient!.completeJson(messages, timeoutMs, callOpts)
        return result.content
      },
    })
  }

  const results: ScenarioEvalResult[] = []
  let remainingNotRun: EvalScenario[] = []
  for (let index = 0; index < scenarios.length; index++) {
    const scenario = scenarios[index]!
    if (mode === "live" && liveClient && liveClient.state.calls >= liveClient.state.maxCalls) {
      budget.stop("max LLM calls reached before remaining scenarios")
      remainingNotRun = scenarios.slice(index)
      break
    }
    if (!budget.canContinue()) {
      remainingNotRun = scenarios.slice(index)
      break
    }
    if (
      mode === "live" &&
      projectedUsdPerScenario > 0 &&
      budget.wouldExceedUsd(projectedUsdPerScenario)
    ) {
      budget.stop(
        `maxEstimatedUsd projected breach (cumul=${budget.state.estimatedUsd}, next≈${projectedUsdPerScenario}, ceiling=${budget.limits.maxEstimatedUsd})`,
      )
      remainingNotRun = scenarios.slice(index)
      break
    }

    const callsBefore = liveClient?.state.calls ?? 0
    const promptBefore = liveClient?.state.promptTokens ?? 0
    const completionBefore = liveClient?.state.completionTokens ?? 0
    const cachedBefore = liveClient?.state.cachedTokens ?? 0
    const providerLatBefore = liveClient?.state.providerLatencyMs ?? 0
    const retryWaitBefore = liveClient?.state.retryWaitMs ?? 0
    const spacingWaitBefore = liveClient?.state.spacingWaitMs ?? 0

    const result = await runFabricPattern(scenario.patternId, scenario.input, {
      allowInTests: mode === "mock",
      requireEnabled: mode === "live",
      adapter,
    })
    const callsAfter = liveClient?.state.calls ?? 0
    const errorCode = result.ok ? undefined : result.error.code
    const errorMessage = result.ok ? undefined : result.error.message
    const invokedLlm =
      mode === "live"
        ? callsAfter > callsBefore
        : didInvokeLlm(errorCode, result.ok)

    const deterministic = scoreDeterministic(scenario, result)
    const usageDelta =
      mode === "live"
        ? {
            promptTokens: (liveClient?.state.promptTokens ?? 0) - promptBefore,
            completionTokens: (liveClient?.state.completionTokens ?? 0) - completionBefore,
            cachedTokens: (liveClient?.state.cachedTokens ?? 0) - cachedBefore,
          }
        : undefined
    if (invokedLlm) {
      const usageMissing =
        !usageDelta ||
        (usageDelta.promptTokens === 0 && usageDelta.completionTokens === 0)
      budget.recordCall(deterministic.tokens, provider.providerId, {
        inputTokens: usageDelta?.promptTokens,
        outputTokens: usageDelta?.completionTokens,
        cachedInputTokens: usageDelta?.cachedTokens,
        // Fail closed: HTTP without usable usage must not count as $0.
        unknownUsageFloorUsd:
          mode === "live" && usageMissing && projectedUsdPerScenario > 0
            ? projectedUsdPerScenario
            : undefined,
        requireKnownUsd: mode === "live",
      })
    }

    const pattern = getFabricPattern(scenario.patternId)
    const providerLatencyMs =
      mode === "live" ? (liveClient?.state.providerLatencyMs ?? 0) - providerLatBefore : undefined
    const retryWaitMs =
      mode === "live" ? (liveClient?.state.retryWaitMs ?? 0) - retryWaitBefore : undefined
    const spacingWaitMs =
      mode === "live" ? (liveClient?.state.spacingWaitMs ?? 0) - spacingWaitBefore : undefined
    const waitTotal = (retryWaitMs ?? 0) + (spacingWaitMs ?? 0)
    const validationMs =
      mode === "live" && providerLatencyMs !== undefined
        ? Math.max(0, deterministic.latencyMs - providerLatencyMs - waitTotal)
        : undefined

    const usage =
      mode === "live"
        ? {
            promptTokens: (liveClient?.state.promptTokens ?? 0) - promptBefore,
            completionTokens: (liveClient?.state.completionTokens ?? 0) - completionBefore,
            cachedTokens: (liveClient?.state.cachedTokens ?? 0) - cachedBefore,
            totalTokens:
              (liveClient?.state.promptTokens ?? 0) -
              promptBefore +
              ((liveClient?.state.completionTokens ?? 0) - completionBefore),
          }
        : undefined

    results.push({
      scenario: {
        id: scenario.id,
        patternId: scenario.patternId,
        name: scenario.name,
        expectations: scenario.expectations,
      },
      deterministic,
      qualitative: emptyPendingReview(scenario.id, scenario.patternId),
      errorCode,
      errorMessage,
      invokedLlm,
      httpAttempts: mode === "live" ? callsAfter - callsBefore : undefined,
      patternVersion: pattern?.version ?? result.metrics.patternVersion,
      syntheticInput: scenario.input,
      model: mode === "live" ? provider.model : "mock",
      providerLatencyMs,
      retryWaitMs,
      spacingWaitMs,
      validationMs,
      validatedOutput: result.ok ? result.data : undefined,
      usage,
    })

    // Safety stop: injection/security scenario must never succeed as a normal OK output.
    if (
      scenario.expectations.category === "security" &&
      scenario.expectations.mustReject &&
      result.ok
    ) {
      budget.stop(`security anomaly: ${scenario.id} returned ok=true`)
      remainingNotRun = scenarios.slice(index + 1)
      break
    }
  }

  for (const scenario of remainingNotRun) {
    const pattern = getFabricPattern(scenario.patternId)
    results.push({
      scenario: {
        id: scenario.id,
        patternId: scenario.patternId,
        name: scenario.name,
        expectations: scenario.expectations,
      },
      deterministic: {
        scenarioId: scenario.id,
        patternId: scenario.patternId,
        runOk: false,
        checks: [],
        passCount: 0,
        failCount: 0,
        allRequiredPassed: false,
        latencyMs: 0,
        tokens: {
          inputChars: 0,
          outputChars: 0,
          estimatedInputTokens: 0,
          estimatedOutputTokens: 0,
          estimatedTotalTokens: 0,
        },
        note: "deterministic_only",
      },
      qualitative: emptyPendingReview(scenario.id, scenario.patternId),
      errorCode: "not_run",
      errorMessage: budget.state.stopReason ?? "NOT RUN — ceiling reached",
      invokedLlm: false,
      httpAttempts: 0,
      patternVersion: pattern?.version,
      syntheticInput: scenario.input,
      model: mode === "live" ? provider.model : "mock",
    })
  }

  const usageTotals = {
    actualLlmCalls: liveClient?.state.calls ?? results.filter((item) => item.invokedLlm).length,
    retryAttempts: liveClient?.state.retries ?? 0,
    promptTokens: liveClient?.state.promptTokens ?? 0,
    completionTokens: liveClient?.state.completionTokens ?? 0,
    cachedTokens: liveClient?.state.cachedTokens ?? 0,
    lastProviderErrorKind: liveClient?.state.lastErrorKind,
  }

  const finishedAt = new Date().toISOString()
  return {
    mode,
    startedAt,
    finishedAt,
    provider,
    liveGate: getLiveGateStatus(),
    scenarioCount: results.length,
    results,
    summary: summarize(results, usageTotals, provider.providerId),
    budget: budget.state,
    assistantBenchmark: {
      ...ASSISTANT_BENCHMARK_STATUS,
      status: "NOT RUN",
      reasonIfNotRun:
        "Budget campagne limité — benchmark Assistant non exécuté pour respecter le plafond d'appels.",
    },
    integrationDecision: decideIntegration(mode, results),
    pricingSnapshot: mode === "live" ? GROQ_GPT_OSS_120B_USD_PER_MTOK : undefined,
    campaignId: options.campaignId ?? (options.scenarioIds ? "filtered" : undefined),
  }
}

export function preflightDiagnostic() {
  const provider = readProviderConfig()
  const liveGate = getLiveGateStatus()
  const costNote = estimateCostUsd(
    { inputChars: 0, outputChars: 0, estimatedInputTokens: 0, estimatedOutputTokens: 0, estimatedTotalTokens: 0 },
    provider.providerId,
  )
  return {
    fabricEngineIsolated: true,
    noPublicRoute: true,
    flagsDefaultOff: !liveGate.enabled && !liveGate.liveAllowed,
    provider,
    liveGate,
    costNote,
    pricingSnapshot: GROQ_GPT_OSS_120B_USD_PER_MTOK,
    dataset: {
      total: LOT19A_DATASET.length,
      perPattern: 10,
    },
    authorizationRequired: true,
    message:
      "Aucun appel LLM réel ne doit être lancé sans FABRIC_PROTOTYPE_ENABLED=1, FABRIC_PROTOTYPE_LIVE=1 et FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM plus autorisation humaine explicite.",
  }
}
