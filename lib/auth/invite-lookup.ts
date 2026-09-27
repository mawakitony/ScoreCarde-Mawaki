import "server-only"

import { classifyInvitation, type InvitationFacts } from "@/lib/auth/invitation-flow"
import { hashInviteToken } from "@/lib/auth/invitations"
import { createAdminClient } from "@/lib/supabase/admin"

export async function loadInvitePreview(token: string) {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(token)) return { status: "invalid" as const }
  const admin = createAdminClient()
  const hash = hashInviteToken(token)
  const full = await admin
    .from("organization_invitations")
    .select("email, role, accepted_at, expires_at, organization_id, invited_by, cancelled_at")
    .eq("token_hash", hash)
    .maybeSingle()
  const data = full.error && /cancelled_at|schema cache|column/i.test(full.error.message)
    ? (await admin.from("organization_invitations").select("email, role, accepted_at, expires_at, organization_id, invited_by").eq("token_hash", hash).maybeSingle()).data
    : full.data
  if (full.error && !data) return { status: "invalid" as const }
  if (!data || ("cancelled_at" in data && data.cancelled_at)) return { status: "invalid" as const }
  const [{ data: organization }, { data: inviter }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", data.organization_id).maybeSingle(),
    data.invited_by
      ? admin.from("profiles").select("full_name").eq("id", data.invited_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const facts: InvitationFacts = {
    email: data.email,
    role: data.role,
    acceptedAt: data.accepted_at,
    expiresAt: data.expires_at,
    organizationId: data.organization_id,
    organizationName: organization?.name ?? "",
    inviterName: inviter?.full_name ?? null,
  }
  return classifyInvitation(facts)
}
