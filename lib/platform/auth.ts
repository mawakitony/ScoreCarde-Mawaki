import "server-only"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/session"
import { platformMfaStatus } from "@/lib/platform/mfa"
import { canPlatform, normalizePlatformRole, type PlatformPermission, type PlatformRole } from "@/lib/platform/permissions"
import { createAdminClient } from "@/lib/supabase/admin"

export type PlatformAdmin = { userId: string; role: PlatformRole; email: string | null }

export async function isPlatformAdmin() {
  const user = await getUser()
  if (!user) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from("platform_admins").select("user_id, role").eq("user_id", user.id).maybeSingle()
    if (error || !data) return null
    return { userId: user.id, role: normalizePlatformRole(data.role), email: user.email ?? null } satisfies PlatformAdmin
  } catch {
    return null
  }
}

/**
 * Server-side gate for /platform.
 * Authorization = row in platform_admins (never email allowlist).
 * MFA AAL2 required unless explicitly skipped (enrollment page only).
 */
export async function requirePlatformAdmin(permission?: PlatformPermission, options?: { requireMfa?: boolean }) {
  const admin = await isPlatformAdmin()
  if (!admin || (permission && !canPlatform(admin, permission))) redirect("/dashboard")

  if (options?.requireMfa !== false) {
    const mfa = await platformMfaStatus()
    if (!mfa.ok) redirect(mfa.redirectTo)
  }

  return admin
}
