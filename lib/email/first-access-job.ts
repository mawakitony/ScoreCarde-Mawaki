/** Pure helpers for first_access email_jobs (no DB). */

export const FIRST_ACCESS_OBSOLETE_USED = "obsolete_invitation_used"

/** Idempotency: first_access:<invitationId>:<hashPrefix> */
export function invitationIdFromFirstAccessIdempotencyKey(key: string | null | undefined) {
  const m = String(key ?? "").match(/^first_access:([0-9a-f-]{36}):/i)
  return m?.[1] ?? null
}

export function isFirstAccessInvitationUsed(row: {
  first_access_used_at?: string | null
  accepted_at?: string | null
} | null) {
  if (!row) return false
  return Boolean(row.first_access_used_at || row.accepted_at)
}
