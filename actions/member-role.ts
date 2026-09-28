"use server"

import { revalidatePath } from "next/cache"
import { membershipRoleForInvite } from "@/lib/auth/first-access"
import { canChangeMemberRole, memberRoleAuditEntry, normalizeAccessRole, type AssignableMemberRole } from "@/lib/auth/permissions"
import { getUser } from "@/lib/auth/session"
import { ensureMembership } from "@/lib/data/membership"
import { createAdminClient } from "@/lib/supabase/admin"

const FAIL = { error: "Impossible de modifier le rôle de ce membre." } as const
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function changeMemberRole(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const membership = await ensureMembership()
  const user = await getUser()
  if (!membership || !user) return FAIL
  const targetUserId = String(formData.get("userId") ?? "")
  const nextRole = String(formData.get("role") ?? "")
  if (!USER_ID.test(targetUserId)) return FAIL

  const admin = createAdminClient()
  const { data: target } = await admin
    .from("organization_members")
    .select("user_id, organization_id, role, access_role")
    .eq("user_id", targetUserId)
    .eq("organization_id", membership.organization.id)
    .maybeSingle()
  if (!target) return FAIL

  const currentRole = normalizeAccessRole(target.access_role || target.role)
  if (!canChangeMemberRole({
    callerRole: membership.role,
    targetRole: currentRole,
    nextRole,
    sameOrganization: target.organization_id === membership.organization.id,
  })) return FAIL

  const columns = membershipRoleForInvite(nextRole)
  if (!columns) return FAIL

  const { data: updated, error } = await admin
    .from("organization_members")
    .update({ role: columns.role, access_role: columns.accessRole as AssignableMemberRole })
    .eq("user_id", targetUserId)
    .eq("organization_id", membership.organization.id)
    .neq("role", "owner")
    .neq("access_role", "owner")
    .select("access_role")
  if (error || updated?.[0]?.access_role !== columns.accessRole) return FAIL

  const audit = memberRoleAuditEntry({
    organizationId: membership.organization.id,
    actorUserId: user.id,
    targetUserId,
    oldRole: currentRole,
    newRole: columns.accessRole,
  })
  const { error: auditError } = await admin.from("audit_logs").insert(audit)
  if (auditError) return FAIL

  revalidatePath("/dashboard/settings/team")
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}
