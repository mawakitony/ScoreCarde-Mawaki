import { can } from "@/lib/auth/permissions"

export type InviteRole = "admin" | "editor" | "analyst" | "viewer"

export type InvitationStatus = "valid" | "expired" | "used" | "invalid"

export type InvitationFacts = {
  email: string
  role: string
  acceptedAt: string | null
  expiresAt: string
  organizationId: string
  organizationName: string
  inviterName?: string | null
}

export type InvitationView =
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "used" }
  | {
      status: "valid"
      email: string
      organizationId: string
      organizationName: string
      role: InviteRole
      roleLabel: string
      maskedEmail: string
      inviterName: string | null
    }

export function inviteTokenFromPath(path: string) {
  const match = path.match(/^\/invite\/([A-Za-z0-9_-]{20,})$/)
  return match?.[1] ?? null
}

export function inviteReturnPath(token: string) {
  return `/invite/${token}`
}

export function maskEmail(email: string) {
  const [local, domain] = email.trim().toLowerCase().split("@")
  if (!local || !domain || domain.includes("@")) return ""
  return `${local.slice(0, 1)}***@${domain}`
}

export function inviteRoleLabel(role: string) {
  if (role === "admin" || role === "editor" || role === "analyst" || role === "viewer") return role[0].toUpperCase() + role.slice(1)
  return null
}

export function classifyInvitation(row: InvitationFacts | null, now = Date.now()): InvitationView {
  if (!row) return { status: "invalid" }
  const roleLabel = inviteRoleLabel(row.role)
  if (!roleLabel || !row.email.includes("@")) return { status: "invalid" }
  if (row.acceptedAt) return { status: "used" }
  const expires = new Date(row.expiresAt).getTime()
  if (!Number.isFinite(expires) || expires <= now) return { status: "expired" }
  const inviterName = row.inviterName?.trim() || null
  return {
    status: "valid",
    email: row.email.trim().toLowerCase(),
    organizationId: row.organizationId,
    organizationName: row.organizationName.trim() || "cette organisation",
    role: row.role as InviteRole,
    roleLabel,
    maskedEmail: maskEmail(row.email),
    inviterName,
  }
}

export function emailsMatch(invitedEmail: string, currentEmail: string | null | undefined) {
  if (!currentEmail) return false
  return invitedEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()
}

export function keepsAuthenticatedInviteSession(input: { nextPath: string; invitationStatus: InvitationStatus }) {
  return inviteTokenFromPath(input.nextPath) !== null && input.invitationStatus === "valid"
}

export function accountEntry(input: { nextPath: string; invitationStatus: InvitationStatus; hasMembership: boolean }) {
  const invite = keepsAuthenticatedInviteSession(input)
  if (input.hasMembership) {
    return {
      destination: invite ? input.nextPath : "/dashboard",
      createOrganization: false,
      signOut: false,
    }
  }
  if (invite) {
    return { destination: input.nextPath, createOrganization: false, signOut: false }
  }
  return { destination: "/login", createOrganization: false, signOut: true }
}

export function mapAcceptError(message: string): "quota" | "tenant" | "email" | "invalid" {
  const normalized = message.toLowerCase()
  if (normalized.includes("limite")) return "quota"
  if (normalized.includes("appartient")) return "tenant"
  if (normalized.includes("correspond")) return "email"
  return "invalid"
}

export function acceptanceDecision(input: {
  status: InvitationStatus
  emailMatches: boolean
  alreadyInOtherOrganization: boolean
  memberCount: number
  memberLimit: number | null
}) {
  if (input.status !== "valid") return { ok: false as const, reason: input.status, createMembership: false, markAccepted: false }
  if (!input.emailMatches) return { ok: false as const, reason: "email" as const, createMembership: false, markAccepted: false }
  if (input.alreadyInOtherOrganization) return { ok: false as const, reason: "tenant" as const, createMembership: false, markAccepted: false }
  if (input.memberLimit !== null && input.memberCount >= input.memberLimit) {
    return { ok: false as const, reason: "quota" as const, createMembership: false, markAccepted: false }
  }
  return { ok: true as const, reason: null, createMembership: true, markAccepted: true }
}

export function roleAccess(role: string) {
  return {
    dashboard: role === "owner" || role === "admin" || role === "editor" || role === "analyst" || role === "viewer" || role === "member",
    read: can({ role }, "lead.read") && can({ role }, "report.read") && can({ role }, "analytics.read"),
    invite: can({ role }, "team.manage"),
    billingView: can({ role }, "billing.view"),
    billingManage: can({ role }, "billing.manage"),
    scorecardEdit: can({ role }, "scorecard.edit"),
    leadRead: can({ role }, "lead.read"),
    leadExport: can({ role }, "lead.export"),
    team: can({ role }, "team.manage"),
    integrations: can({ role }, "integration.manage"),
    transferOwnership: can({ role }, "ownership.transfer"),
    deleteOrganization: can({ role }, "organization.delete"),
  }
}
