import type { AccessState } from "@/lib/billing/entitlements"

/** Paths reachable while the workspace is billing-locked (trial expired / unpaid). */
export const BILLING_UNLOCKED_PATH_PREFIXES = [
  "/dashboard/settings/billing",
  "/dashboard/billing",
] as const

export const TRIAL_EXPIRED_MESSAGE =
  "Votre période d'essai gratuite de 14 jours est terminée. Pour continuer à utiliser WOLOYEM Score et retrouver vos scorecards, activez votre abonnement mensuel."

export const WORKSPACE_LOCKED_ACTION_ERROR =
  "Espace bloqué : l'essai est terminé ou l'abonnement n'est plus actif. Activez un abonnement depuis Facturation."

export function isWorkspaceLocked(access: AccessState): boolean {
  return access === "restricted" || access === "suspended"
}

/** grace_period remains usable (configurable PAST_DUE grace). */
export function isWorkspaceOperational(access: AccessState): boolean {
  return access === "active" || access === "grace_period"
}

export function isBillingExemptPath(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/$/, "") || "/"
  if (path === "/dashboard/settings/billing" || path.startsWith("/dashboard/settings/billing/")) return true
  if (path === "/dashboard/billing" || path.startsWith("/dashboard/billing/")) return true
  return false
}

/**
 * Exact trial window helpers (UTC timestamps). Trial is inclusive until trialEnd ms.
 * Day 13 of a 14-day trial with trialEnd = start + 14d remains active when now < trialEnd.
 */
export function isTrialActiveAt(trialEndIso: string | null, nowMs: number): boolean {
  if (!trialEndIso) return false
  const end = Date.parse(trialEndIso)
  if (!Number.isFinite(end)) return false
  return end > nowMs
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Whole calendar days remaining before trialEnd (UTC), ceil so a partial day still counts as 1.
 * Returns 0 when expired or missing; null when not in an active trial window.
 */
export function trialDaysRemaining(trialEndIso: string | null, nowMs = Date.now()): number | null {
  if (!trialEndIso) return null
  const end = Date.parse(trialEndIso)
  if (!Number.isFinite(end)) return null
  if (end <= nowMs) return 0
  return Math.max(1, Math.ceil((end - nowMs) / DAY_MS))
}

export function formatTrialDaysLabel(days: number): string {
  if (days <= 0) return "Essai terminé"
  if (days === 1) return "1 jour d'essai restant"
  return `${days} jours d'essai restants`
}
