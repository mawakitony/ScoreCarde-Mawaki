import "server-only"

import { createClient } from "@/lib/supabase/server"

export type PlatformMfaStatus =
  | { ok: true; currentLevel: "aal2" }
  | { ok: false; reason: "unauthenticated" | "aal2_required" | "enroll_required"; redirectTo: string }

/**
 * Platform admins must use Supabase Auth MFA (AAL2).
 * Enrollment/verification lives at /platform/security/mfa — not email allowlists.
 */
export async function platformMfaStatus(): Promise<PlatformMfaStatus> {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { ok: false, reason: "unauthenticated", redirectTo: "/login?next=%2Fplatform" }

    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error || !data) {
      return { ok: false, reason: "enroll_required", redirectTo: "/platform/security/mfa" }
    }

    if (data.currentLevel === "aal2") return { ok: true, currentLevel: "aal2" }

    if (data.nextLevel === "aal2") {
      return { ok: false, reason: "aal2_required", redirectTo: "/platform/security/mfa?step=verify" }
    }

    return { ok: false, reason: "enroll_required", redirectTo: "/platform/security/mfa" }
  } catch {
    return { ok: false, reason: "enroll_required", redirectTo: "/platform/security/mfa" }
  }
}

export function platformMfaSatisfied(status: PlatformMfaStatus) {
  return status.ok
}
