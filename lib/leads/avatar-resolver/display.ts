import { resolveLeadAvatar } from "./resolve"

/**
 * Enrich CRM rows with avatar URLs from authorized/cached sources only.
 * Does not enable production sync or call Google/Microsoft.
 */
export async function displayAvatarUrl(input: {
  organizationId: string
  leadId: string
  email?: string | null
  name?: string | null
  storedUrl?: string | null
}) {
  const resolved = await resolveLeadAvatar(
    {
      organizationId: input.organizationId,
      leadId: input.leadId,
      email: input.email,
      name: input.name,
      storedUrl: input.storedUrl,
    },
    { forceSync: false, env: { LEAD_AVATAR_SYNC_ENABLED: "0" } },
  )
  return resolved.status === "AVAILABLE" ? resolved.url ?? null : null
}
