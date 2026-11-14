/**
 * Only allowed Supabase project for this repo (local, e2e, Preview, Production).
 * Change deliberately on LIVE cutover.
 */
export const ALLOWED_SUPABASE_REF = "hznmtadobqfhumezdgbh"

export const ALLOWED_SUPABASE_HOST = `${ALLOWED_SUPABASE_REF}.supabase.co`

export const ALLOWED_SUPABASE_URL = `https://${ALLOWED_SUPABASE_HOST}`

export class DisallowedSupabaseError extends Error {
  readonly code = "DISALLOWED_SUPABASE_REF"

  constructor(message: string) {
    super(message)
    this.name = "DisallowedSupabaseError"
  }
}

export function supabaseHostFromUrl(url: string | undefined | null) {
  try {
    return new URL(String(url ?? "").trim()).host
  } catch {
    return ""
  }
}

export function supabaseRefFromUrl(url: string | undefined | null) {
  const host = supabaseHostFromUrl(url)
  const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i)
  return match?.[1] ?? ""
}

export function isAllowedSupabaseUrl(url: string | undefined | null) {
  return supabaseRefFromUrl(url) === ALLOWED_SUPABASE_REF
}

export function assertAllowedSupabaseUrl(
  url: string | undefined | null = process.env.NEXT_PUBLIC_SUPABASE_URL,
  label = "NEXT_PUBLIC_SUPABASE_URL",
) {
  const trimmed = url?.trim() ?? ""
  if (!trimmed) {
    throw new DisallowedSupabaseError(`${label} is missing (required ref ${ALLOWED_SUPABASE_REF})`)
  }
  const ref = supabaseRefFromUrl(trimmed)
  if (ref !== ALLOWED_SUPABASE_REF) {
    throw new DisallowedSupabaseError(
      `${label} ref "${ref || "invalid"}" is not allowed (required ${ALLOWED_SUPABASE_REF})`,
    )
  }
  return ref
}

/** App URL + any set E2E_* Supabase URLs must be the allowed ref. */
export function assertAllowedSupabaseEnv(env: Record<string, string | undefined> = process.env) {
  const appUrl =
    env.NEXT_PUBLIC_SUPABASE_URL !== undefined ? env.NEXT_PUBLIC_SUPABASE_URL : env.SUPABASE_URL
  assertAllowedSupabaseUrl(appUrl, "NEXT_PUBLIC_SUPABASE_URL")
  if (env.E2E_SUPABASE_URL?.trim()) {
    assertAllowedSupabaseUrl(env.E2E_SUPABASE_URL, "E2E_SUPABASE_URL")
  }
  if (env.E2E_PROTECT_SUPABASE_URL?.trim()) {
    assertAllowedSupabaseUrl(env.E2E_PROTECT_SUPABASE_URL, "E2E_PROTECT_SUPABASE_URL")
  }
}

export function isDisallowedSupabaseError(error: unknown): error is DisallowedSupabaseError {
  return error instanceof DisallowedSupabaseError
}
