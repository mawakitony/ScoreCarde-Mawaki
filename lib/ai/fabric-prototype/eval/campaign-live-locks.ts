/**
 * Campaign-scoped LIVE locks — close harness bypasses where a dataset can be
 * run with only the generic FABRIC_EVAL_CONFIRM (without the lot-specific confirm).
 *
 * Scripts remain the primary UX gate; this is defense-in-depth inside runLot19aEvaluation.
 */
import {
  LOT19D_CAMPAIGN,
  LOT19D_CONFIRM_VALUE,
} from "@/lib/ai/fabric-prototype/eval/lot19d-campaign"
import {
  LOT19F_CAMPAIGN,
  LOT19F_CONFIRM_VALUE,
} from "@/lib/ai/fabric-prototype/eval/lot19f-campaign"
import {
  LOT19J_CAMPAIGN,
  LOT19J_CONFIRM_VALUE,
} from "@/lib/ai/fabric-prototype/eval/lot19j-campaign"
import {
  LOT19M_CAMPAIGN,
  LOT19M_CONFIRM_VALUE,
} from "@/lib/ai/fabric-prototype/eval/lot19m-campaign"

export type CampaignLiveLock = {
  id: string
  envKey: string
  value: string
  matchCampaignId: (campaignId?: string) => boolean
  matchScenarioId: (scenarioId: string) => boolean
}

export const CAMPAIGN_LIVE_LOCKS: CampaignLiveLock[] = [
  {
    id: "lot19m",
    envKey: LOT19M_CAMPAIGN.confirmEnvKey,
    value: LOT19M_CONFIRM_VALUE,
    matchCampaignId: (id) =>
      Boolean(id && (id === LOT19M_CAMPAIGN.id || id.startsWith("lot19m"))),
    matchScenarioId: (id) => id.startsWith("d19m_"),
  },
  {
    id: "lot19j",
    envKey: LOT19J_CAMPAIGN.confirmEnvKey,
    value: LOT19J_CONFIRM_VALUE,
    matchCampaignId: (id) =>
      Boolean(id && (id === LOT19J_CAMPAIGN.id || id.startsWith("lot19j"))),
    matchScenarioId: (id) => id.startsWith("d19j_"),
  },
  {
    id: "lot19f",
    envKey: LOT19F_CAMPAIGN.confirmEnvKey,
    value: LOT19F_CONFIRM_VALUE,
    matchCampaignId: (id) =>
      Boolean(id && (id === LOT19F_CAMPAIGN.id || id.startsWith("lot19f"))),
    matchScenarioId: (id) => id.startsWith("d19f_"),
  },
  {
    id: "lot19d",
    envKey: LOT19D_CAMPAIGN.confirmEnvKey,
    value: LOT19D_CONFIRM_VALUE,
    matchCampaignId: (id) =>
      Boolean(id && (id === LOT19D_CAMPAIGN.id || id.startsWith("lot19d"))),
    matchScenarioId: (id) => id.startsWith("d19d_"),
  },
]

export function resolveApplicableCampaignLocks(
  campaignId: string | undefined,
  scenarioIds: string[],
): CampaignLiveLock[] {
  return CAMPAIGN_LIVE_LOCKS.filter(
    (lock) =>
      lock.matchCampaignId(campaignId) || scenarioIds.some((id) => lock.matchScenarioId(id)),
  )
}

/**
 * Throws if LIVE is requested for a locked campaign/dataset without the lot confirm env.
 * Generic FABRIC_EVAL_CONFIRM alone is never enough for locked campaigns.
 */
export function assertCampaignLiveLocks(
  campaignId: string | undefined,
  scenarioIds: string[],
  env: NodeJS.ProcessEnv = process.env,
): void {
  const applicable = resolveApplicableCampaignLocks(campaignId, scenarioIds)
  for (const lock of applicable) {
    if (env[lock.envKey] !== lock.value) {
      throw new Error(
        `LIVE blocked for ${lock.id}: ${lock.envKey}=${lock.value} required (generic FABRIC_EVAL_CONFIRM is not sufficient).`,
      )
    }
  }
}
