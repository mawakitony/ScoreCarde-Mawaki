/**
 * TypeScript façade over the shared whitelist module.
 * Source of truth for the ref: `./allowed-supabase-ref.mjs` (change deliberately on LIVE cutover).
 */
export {
  ALLOWED_SUPABASE_HOST,
  ALLOWED_SUPABASE_REF,
  ALLOWED_SUPABASE_URL,
  assertAllowedSupabaseEnv,
  assertAllowedSupabaseUrl,
  isAllowedSupabaseUrl,
  isDisallowedSupabaseError,
  supabaseHostFromUrl,
  supabaseRefFromUrl,
} from "./allowed-supabase-ref.mjs"

export class DisallowedSupabaseError extends Error {
  readonly code = "DISALLOWED_SUPABASE_REF" as const

  constructor(message: string) {
    super(message)
    this.name = "DisallowedSupabaseError"
  }
}
