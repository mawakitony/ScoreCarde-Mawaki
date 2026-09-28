export type AccessRole = "owner" | "admin" | "editor" | "analyst" | "viewer" | "member"

export type Permission =
  | "scorecard.edit"
  | "scorecard.publish"
  | "billing.view"
  | "billing.manage"
  | "team.manage"
  | "ownership.transfer"
  | "organization.delete"
  | "integration.manage"
  | "lead.read"
  | "lead.edit"
  | "lead.export"
  | "report.read"
  | "analytics.read"

const ALL: Permission[] = [
  "scorecard.edit",
  "scorecard.publish",
  "billing.view",
  "billing.manage",
  "team.manage",
  "ownership.transfer",
  "organization.delete",
  "integration.manage",
  "lead.read",
  "lead.edit",
  "lead.export",
  "report.read",
  "analytics.read",
]

const ROLE_PERMISSIONS: Record<AccessRole, readonly Permission[]> = {
  owner: ALL,
  admin: ALL.filter((permission) => permission !== "ownership.transfer" && permission !== "organization.delete" && permission !== "billing.manage"),
  editor: ["scorecard.edit", "scorecard.publish", "lead.read", "report.read", "analytics.read"],
  analyst: ["lead.read", "lead.export", "report.read", "analytics.read", "billing.view"],
  viewer: ["lead.read", "report.read", "analytics.read"],
  member: ["lead.read", "report.read", "analytics.read"],
}

export function normalizeAccessRole(value: string | null | undefined): AccessRole {
  if (value === "owner" || value === "admin" || value === "editor" || value === "analyst" || value === "viewer" || value === "member") {
    return value
  }
  return "viewer"
}

export function can(actor: { role: string }, permission: Permission) {
  const role = normalizeAccessRole(actor.role)
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function canRemoveMember(input: { callerRole: string; targetRole: string; ownerCount: number }) {
  if (!can({ role: input.callerRole }, "team.manage")) return false
  if (input.targetRole === "owner" && input.ownerCount <= 1) return false
  if (input.targetRole === "owner") return can({ role: input.callerRole }, "ownership.transfer")
  if (input.targetRole === "admin" && normalizeAccessRole(input.callerRole) !== "owner") return false
  return true
}

export function rolesAfterTransfer(input: { callerId: string; targetId: string; callerRole: string }) {
  if (!can({ role: input.callerRole }, "ownership.transfer") || input.callerId === input.targetId) return null
  return { [input.targetId]: "owner", [input.callerId]: "admin" } as const
}

export const ASSIGNABLE_MEMBER_ROLES = ["admin", "editor", "analyst", "viewer"] as const

export type AssignableMemberRole = (typeof ASSIGNABLE_MEMBER_ROLES)[number]

export function isAssignableMemberRole(value: string): value is AssignableMemberRole {
  return (ASSIGNABLE_MEMBER_ROLES as readonly string[]).includes(value)
}

export function canChangeMemberRole(input: {
  callerRole: string
  targetRole: string
  nextRole: string
  sameOrganization: boolean
}) {
  if (!input.sameOrganization) return false
  if (normalizeAccessRole(input.callerRole) !== "owner") return false
  if (normalizeAccessRole(input.targetRole) === "owner") return false
  if (!isAssignableMemberRole(input.nextRole)) return false
  if (input.nextRole === normalizeAccessRole(input.targetRole)) return false
  return true
}

export function memberRoleAuditEntry(input: {
  organizationId: string
  actorUserId: string
  targetUserId: string
  oldRole: string
  newRole: string
}) {
  return {
    organization_id: input.organizationId,
    actor_id: input.actorUserId,
    action: "member.role_changed" as const,
    metadata: {
      actor_user_id: input.actorUserId,
      target_user_id: input.targetUserId,
      old_role: input.oldRole,
      new_role: input.newRole,
    },
  }
}
