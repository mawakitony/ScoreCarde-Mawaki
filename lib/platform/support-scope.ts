import "server-only"

import { redirect } from "next/navigation"
import { readSupportSession } from "@/lib/platform/data"

export type ActiveSupportScope = {
  sessionId: string
  organizationId: string
  organizationName: string
  organizationSlug: string
}

/** Active support session for a platform admin, or null. */
export async function getActiveSupportScope(platformAdminUserId: string): Promise<ActiveSupportScope | null> {
  const session = await readSupportSession(platformAdminUserId)
  if (!session) return null
  return {
    sessionId: session.id,
    organizationId: session.organization_id,
    organizationName: session.organization.name,
    organizationSlug: session.organization.slug,
  }
}

/**
 * Park-wide views (overview, health, alerts, cross-tenant aggregates) are forbidden
 * while a support session is open — redirect to the scoped organization fiche.
 */
export async function redirectIfSupportScoped(platformAdminUserId: string) {
  const scope = await getActiveSupportScope(platformAdminUserId)
  if (scope) redirect(`/platform/organizations/${scope.organizationId}`)
  return null
}

/** @deprecated Prefer redirectIfSupportScoped — same behavior. */
export async function redirectOverviewIfSupportScoped(platformAdminUserId: string) {
  return redirectIfSupportScoped(platformAdminUserId)
}

export { constrainOrgIds } from "@/lib/platform/rules"
