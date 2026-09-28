import { TeamMemberList } from "@/components/settings/team-member-list"
import { TeamPanel } from "@/components/settings/team-panel"
import { accessIssuedAt, firstAccessHours, pendingInvitationStatus } from "@/lib/auth/first-access"
import { inviteRoleLabel } from "@/lib/auth/invitation-flow"
import { can } from "@/lib/auth/permissions"
import { requireUser } from "@/lib/auth/session"
import { ensureMembership, listMembers } from "@/lib/data/membership"
import { formatDateTime } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Équipe" }

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>
}) {
  const params = await searchParams
  const highlightId = typeof params.member === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.member)
    ? params.member
    : null
  const user = await requireUser()
  const membership = await ensureMembership()
  if (!membership || !can({ role: membership.role }, "team.manage")) return <p>Permission refusée.</p>
  const members = await listMembers(membership.organization.id)
  const supabase = await createClient()
  const pending = await supabase
    .from("organization_invitations")
    .select("id, email, role, invitation_type, accepted_at, expires_at, first_access_expires_at, cancelled_at")
    .eq("organization_id", membership.organization.id)
    .is("accepted_at", null)
  const legacy = pending.error
    ? await supabase
      .from("organization_invitations")
      .select("id, email, role, accepted_at, expires_at")
      .eq("organization_id", membership.organization.id)
      .is("accepted_at", null)
    : null
  const rows = pending.error
    ? (legacy?.data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      invitationType: "link" as const,
      expiresAt: row.expires_at,
      firstAccessExpiresAt: null,
      acceptedAt: row.accepted_at,
      cancelledAt: null,
    }))
    : (pending.data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      invitationType: row.invitation_type,
      expiresAt: row.expires_at,
      firstAccessExpiresAt: row.first_access_expires_at,
      acceptedAt: row.accepted_at,
      cancelledAt: row.cancelled_at,
    }))
  const hours = firstAccessHours(process.env.FIRST_ACCESS_CODE_HOURS)
  const invitations = rows.flatMap((row) => {
    const status = pendingInvitationStatus({
      type: row.invitationType,
      expiresAt: row.expiresAt,
      firstAccessExpiresAt: row.firstAccessExpiresAt,
      acceptedAt: row.acceptedAt,
      cancelledAt: row.cancelledAt,
    })
    if (!status) return []
    const firstAccess = row.invitationType === "first_access_code"
    const expiry = firstAccess ? row.firstAccessExpiresAt || row.expiresAt : null
    const issuedAt = expiry ? accessIssuedAt(expiry, hours) : null
    return [{
      id: row.id,
      email: row.email,
      role: inviteRoleLabel(row.role) ?? row.role,
      status,
      kind: firstAccess ? "first_access_code" as const : "link" as const,
      issuedLabel: issuedAt ? `Code généré le ${formatDateTime(issuedAt)}` : null,
      expiresLabel: expiry ? `Expire le ${formatDateTime(expiry)}` : null,
    }]
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl">Équipe</h1>
      <TeamMemberList
        canChangeRoles={membership.role === "owner"}
        currentUserId={user.id}
        highlightId={highlightId}
        members={members.map((member) => ({
          userId: member.userId,
          role: member.role,
          fullName: member.fullName,
          email: member.email,
        }))}
      />
      <TeamPanel
        canTransfer={can({ role: membership.role }, "ownership.transfer")}
        members={members.map((member) => ({ userId: member.userId, role: member.role }))}
        invitations={invitations}
      />
    </div>
  )
}
