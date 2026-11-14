/**
 * Classify Supabase API key *formats* without logging values.
 * New keys (`sb_publishable_` / `sb_secret_`) are not JWTs.
 */
export type SupabaseKeyFormat =
  | "sb_publishable"
  | "sb_secret"
  | "sb_temp"
  | "sb_other"
  | "legacy_jwt"
  | "missing"
  | "unknown"

export function classifySupabaseKey(value: string | undefined | null): SupabaseKeyFormat {
  const key = value?.trim() ?? ""
  if (!key) return "missing"
  if (key.startsWith("sb_publishable_")) return "sb_publishable"
  if (key.startsWith("sb_secret_")) return "sb_secret"
  if (key.startsWith("sb_temp_")) return "sb_temp"
  if (key.startsWith("sb_")) return "sb_other"
  // Legacy anon / service_role JWTs are three base64url segments.
  const parts = key.split(".")
  if (parts.length === 3 && parts.every((p) => p.length > 0)) return "legacy_jwt"
  return "unknown"
}

/** True for elevated backend keys (legacy service_role JWT or sb_secret_). */
export function isElevatedSupabaseKey(value: string | undefined | null) {
  const kind = classifySupabaseKey(value)
  return kind === "sb_secret" || kind === "legacy_jwt"
}

/** True for public client keys (legacy anon JWT or sb_publishable_). */
export function isPublicSupabaseKey(value: string | undefined | null) {
  const kind = classifySupabaseKey(value)
  return kind === "sb_publishable" || kind === "legacy_jwt"
}
