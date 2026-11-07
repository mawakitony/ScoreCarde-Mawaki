import { isFabricPrototypeEnabled, isFabricPrototypeLiveAllowed } from "@/lib/ai/fabric-prototype/flags"
import { LIVE_BUDGET_DEFAULTS } from "@/lib/ai/fabric-prototype/eval/cost-model"

/**
 * Triple lock for paid calls:
 * 1. FABRIC_PROTOTYPE_ENABLED=1
 * 2. FABRIC_PROTOTYPE_LIVE=1
 * 3. FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM  (human confirmation string)
 *
 * This prompt / lot text is NEVER sufficient authorization.
 */
export const LIVE_CONFIRM_VALUE = "I_AUTHORIZE_LIVE_LLM"

export type LiveGateStatus = {
  enabled: boolean
  liveAllowed: boolean
  confirmOk: boolean
  providerConfigured: boolean
  providerId: string
  model: string
  canRunLive: boolean
  blockers: string[]
  budget: typeof LIVE_BUDGET_DEFAULTS
}

export function readProviderConfig() {
  const key = Boolean(process.env.AI_API_KEY)
  const providerId = process.env.AI_PROVIDER || "unconfigured"
  const model = process.env.AI_MODEL || "default"
  const baseUrlConfigured = Boolean(process.env.AI_BASE_URL)
  return {
    providerConfigured: key && baseUrlConfigured && Boolean(process.env.AI_PROVIDER),
    providerId,
    model,
    baseUrlConfigured,
    keyConfigured: key,
  }
}

export function getLiveGateStatus(): LiveGateStatus {
  const provider = readProviderConfig()
  const enabled = isFabricPrototypeEnabled()
  const liveAllowed = isFabricPrototypeLiveAllowed()
  const confirmOk = process.env.FABRIC_EVAL_CONFIRM === LIVE_CONFIRM_VALUE
  const blockers: string[] = []
  if (!enabled) blockers.push("FABRIC_PROTOTYPE_ENABLED≠1")
  if (!liveAllowed) blockers.push("FABRIC_PROTOTYPE_LIVE≠1 (or ENABLED off)")
  if (!confirmOk) blockers.push(`FABRIC_EVAL_CONFIRM≠${LIVE_CONFIRM_VALUE}`)
  if (!provider.providerConfigured) blockers.push("AI provider incomplete (AI_API_KEY / AI_PROVIDER / AI_BASE_URL)")

  return {
    enabled,
    liveAllowed,
    confirmOk,
    providerConfigured: provider.providerConfigured,
    providerId: provider.providerId,
    model: provider.model,
    canRunLive: blockers.length === 0,
    blockers,
    budget: LIVE_BUDGET_DEFAULTS,
  }
}

export function assertEvalLiveAuthorized() {
  const status = getLiveGateStatus()
  if (!status.canRunLive) {
    throw new Error(`LIVE LLM eval blocked: ${status.blockers.join("; ")}`)
  }
  return status
}
