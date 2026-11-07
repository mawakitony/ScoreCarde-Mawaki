import "server-only"

import { loadEntitlements } from "@/lib/billing/account"
import type { AccessState } from "@/lib/billing/entitlements"
import { activeSuspension } from "@/lib/platform/data"
import {
  TRIAL_EXPIRED_MESSAGE,
  WORKSPACE_LOCKED_ACTION_ERROR,
  isWorkspaceLocked,
} from "@/lib/billing/workspace-access-policy"

export {
  BILLING_UNLOCKED_PATH_PREFIXES,
  TRIAL_EXPIRED_MESSAGE,
  WORKSPACE_LOCKED_ACTION_ERROR,
  formatTrialDaysLabel,
  isBillingExemptPath,
  isTrialActiveAt,
  isWorkspaceLocked,
  isWorkspaceOperational,
  trialDaysRemaining,
} from "@/lib/billing/workspace-access-policy"

export type WorkspaceAccessDecision = {
  locked: boolean
  access: AccessState
  reason: "ok" | "platform_suspension" | "billing_restricted" | "billing_suspended"
  message: string | null
}

export async function evaluateWorkspaceAccess(organizationId: string): Promise<WorkspaceAccessDecision> {
  if (await activeSuspension(organizationId)) {
    return {
      locked: true,
      access: "suspended",
      reason: "platform_suspension",
      message: "Espace temporairement indisponible. Vos données sont conservées.",
    }
  }
  const entitlements = await loadEntitlements(organizationId)
  if (entitlements.access === "restricted") {
    return {
      locked: true,
      access: "restricted",
      reason: "billing_restricted",
      message: TRIAL_EXPIRED_MESSAGE,
    }
  }
  if (isWorkspaceLocked(entitlements.access)) {
    return {
      locked: true,
      access: entitlements.access,
      reason: "billing_suspended",
      message: TRIAL_EXPIRED_MESSAGE,
    }
  }
  return {
    locked: false,
    access: entitlements.access,
    reason: "ok",
    message: null,
  }
}

/**
 * Server Actions / API mutative guard. Soft-UI blocking alone is insufficient.
 * Returns `null` when access is allowed; otherwise `{ error }`.
 */
export async function requireWorkspaceAccess(
  organizationId: string,
): Promise<{ error: string } | null> {
  const decision = await evaluateWorkspaceAccess(organizationId)
  if (!decision.locked) return null
  if (decision.reason === "platform_suspension") {
    return { error: decision.message ?? "Espace indisponible." }
  }
  return { error: WORKSPACE_LOCKED_ACTION_ERROR }
}
