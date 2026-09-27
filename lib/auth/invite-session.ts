import "server-only"

import { inviteTokenFromPath, keepsAuthenticatedInviteSession } from "@/lib/auth/invitation-flow"
import { loadInvitePreview } from "@/lib/auth/invite-lookup"

export async function invitationKeepsSession(nextPath: string) {
  const token = inviteTokenFromPath(nextPath)
  if (!token) return false
  const preview = await loadInvitePreview(token)
  return keepsAuthenticatedInviteSession({ nextPath, invitationStatus: preview.status })
}
