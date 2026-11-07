import type { AccessState } from "@/lib/billing/entitlements"

/** Display labels aligned with existing subscription + access states — no invented statuses. */
export function subscriptionStatusLabel(status: string) {
  switch (status) {
    case "trialing":
      return "Essai"
    case "active":
      return "Actif"
    case "past_due":
      return "En retard"
    case "canceled":
      return "Annulé"
    case "unpaid":
      return "Impayé"
    case "incomplete":
      return "Incomplet"
    case "paused":
      return "En pause"
    default:
      return status
  }
}

export function accessStateLabel(access: AccessState | string, suspended: boolean) {
  if (suspended) return "Suspendu"
  switch (access) {
    case "active":
      return "Actif"
    case "grace_period":
      return "En retard (grâce)"
    case "restricted":
      return "Expiré / restreint"
    case "suspended":
      return "Suspendu"
    default:
      return String(access)
  }
}

export function daysRemaining(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null
  const at = new Date(iso).getTime()
  if (!Number.isFinite(at)) return null
  return Math.ceil((at - now) / (24 * 60 * 60 * 1000))
}
