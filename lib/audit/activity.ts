import { can } from "@/lib/auth/permissions"

const ROLES = new Set(["owner", "admin", "editor", "analyst", "viewer", "member"])
const PLANS = new Set(["free", "starter", "pro", "business", "enterprise", "internal"])
const ALLOWED = new Set([
  "role",
  "old_role",
  "new_role",
  "plan",
  "status",
  "slug",
  "scorecard_name",
  "tool",
  "resource_type",
  "resource_id",
  "affected_count",
])

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  analyst: "Analyst",
  viewer: "Viewer",
  member: "Membre",
}

export const ACTIVITY_ACTIONS = [
  "organization.created",
  "ownership.transferred",
  "member.invited",
  "member.accepted",
  "member.invitation_cancelled",
  "member.first_access",
  "member.first_access_regenerated",
  "member.role_changed",
  "lead.deleted",
  "lead.restored",
  "lead.anonymized",
  "scorecard.published",
  "subscription.created",
  "subscription.upgraded",
  "subscription.downgraded",
  "subscription.changed",
  "subscription.canceled",
  "payment.failed",
  "support_session.started",
  "support_session.ended",
  "support_session.expired",
  "organization.suspended",
  "organization.unsuspended",
  "domain.checked",
  "entitlement.updated",
  "job.retried",
  "ai.action_executed",
] as const

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]

const ACTION_LABELS: Record<string, string> = {
  "organization.created": "a créé l'organisation",
  "ownership.transferred": "a transféré la propriété",
  "member.invited": "a invité un membre",
  "member.accepted": "a rejoint l'organisation",
  "member.invitation_cancelled": "a annulé une invitation",
  "member.first_access": "a préparé un accès de première connexion",
  "member.first_access_regenerated": "a régénéré un code de première connexion",
  "member.role_changed": "a modifié le rôle d'un membre",
  "lead.deleted": "a supprimé un lead",
  "lead.restored": "a restauré un lead",
  "lead.anonymized": "a anonymisé un lead",
  "scorecard.published": "a publié une scorecard",
  "subscription.created": "a modifié un abonnement",
  "subscription.upgraded": "a modifié un abonnement",
  "subscription.downgraded": "a modifié un abonnement",
  "subscription.changed": "a modifié un abonnement",
  "subscription.canceled": "a modifié un abonnement",
  "payment.failed": "a enregistré un échec de paiement",
  "support_session.started": "a ouvert une session support",
  "support_session.ended": "a fermé une session support",
  "support_session.expired": "a laissé expirer une session support",
  "organization.suspended": "a suspendu l'organisation",
  "organization.unsuspended": "a réactivé l'organisation",
  "domain.checked": "a vérifié un domaine",
  "entitlement.updated": "a modifié un droit d'accès",
  "job.retried": "a relancé un traitement",
  "ai.action_executed": "a exécuté une action via l'Assistant IA",
}

export function canViewActivity(role: string) {
  return can({ role }, "team.manage")
}

export function isActivityAction(value: string): value is ActivityAction {
  return (ACTIVITY_ACTIONS as readonly string[]).includes(value)
}

export function safePersonName(value: string | null | undefined) {
  const name = value?.replace(/\s+/g, " ").trim() ?? ""
  if (!name || name.includes("@") || name.length > 80) return null
  return name
}

export function safeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {}
  const safe: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (!ALLOWED.has(key) || typeof value !== "string") continue
    const text = value.trim()
    if (!text || text.length > 120 || /[@\r\n]/.test(text) || /token|password|secret|code/i.test(text)) continue
    if ((key === "role" || key === "old_role" || key === "new_role") && !ROLES.has(text)) continue
    if (key === "plan" && !PLANS.has(text)) continue
    if (key === "status" && !/^[a-z_]{2,32}$/.test(text)) continue
    if (key === "slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)) continue
    if (key === "tool" && !/^[a-z_]{2,64}$/.test(text)) continue
    if (key === "resource_type" && !/^[a-z_]{2,40}$/.test(text)) continue
    if (key === "resource_id" && !/^[0-9a-f-]{36}$/i.test(text)) continue
    if (key === "affected_count" && !/^\d{1,4}$/.test(text)) continue
    safe[key] = text
  }
  return safe
}

function roleLabel(value: string | undefined) {
  if (!value) return null
  return ROLE_LABELS[value] ?? null
}

export function presentActivity(input: {
  action: string
  metadata: unknown
  actorName: string | null
  memberNames: Record<string, string>
}) {
  const safe = safeMetadata(input.metadata)
  const actor = safePersonName(input.actorName) ?? "Système"
  const label = ACTION_LABELS[input.action] ?? "a effectué une action"
  const targetId = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
    ? (input.metadata as Record<string, unknown>).target_user_id
    : null
  const targetName = typeof targetId === "string" ? safePersonName(input.memberNames[targetId]) : null
  const resource = input.action === "scorecard.published"
    ? safe.scorecard_name ?? "Scorecard"
    : input.action === "member.role_changed"
      ? targetName ?? "Membre"
      : input.action.startsWith("lead.")
        ? "Lead"
        : input.action.startsWith("member.")
          ? "Membre"
          : input.action === "ai.action_executed"
            ? safe.tool ?? "Assistant IA"
            : input.action.startsWith("subscription.") || input.action === "payment.failed"
              ? "Abonnement"
              : "Organisation"
  const details = [
    input.action === "member.role_changed" && roleLabel(safe.old_role) && roleLabel(safe.new_role) ? `${roleLabel(safe.old_role)} → ${roleLabel(safe.new_role)}` : null,
    input.action === "member.invited" || input.action === "member.first_access" || input.action === "member.first_access_regenerated" ? roleLabel(safe.role) : null,
    input.action.startsWith("subscription.") ? safe.plan ?? null : null,
  ].filter((item): item is string => Boolean(item)).join(" · ")
  return {
    actor,
    action: `${actor} ${label}`,
    resource,
    details,
  }
}
