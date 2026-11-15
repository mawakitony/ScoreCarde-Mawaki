/**
 * API-oriented Platform Admin gate: returns 401/403 instead of HTML redirects.
 * AAL2 (MFA) is mandatory for sensitive exports and mutations.
 */

export type PlatformApiAuthDenial = {
  ok: false
  status: 401 | 403
  error: "unauthenticated" | "forbidden" | "aal2_required" | "enroll_required"
}

export type PlatformApiAuthAllow = { ok: true }

/**
 * Pure decision helper (unit-tested). Maps session / role / MFA to HTTP status.
 */
export function resolvePlatformApiAuth(input: {
  hasSession: boolean
  isPlatformAdmin: boolean
  hasPermission: boolean
  aal2: boolean
  mfaEnrolled: boolean
}): PlatformApiAuthAllow | PlatformApiAuthDenial {
  if (!input.hasSession) {
    return { ok: false, status: 401, error: "unauthenticated" }
  }
  if (!input.isPlatformAdmin || !input.hasPermission) {
    return { ok: false, status: 403, error: "forbidden" }
  }
  if (!input.mfaEnrolled) {
    return { ok: false, status: 403, error: "enroll_required" }
  }
  if (!input.aal2) {
    return { ok: false, status: 403, error: "aal2_required" }
  }
  return { ok: true }
}
