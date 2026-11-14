/**
 * Only allowed Supabase project for this repo (local, e2e, Preview, Production).
 * Single source for Node .mjs scripts and TypeScript (`allowed-supabase.ts`).
 * Change deliberately on LIVE cutover.
 */

export const ALLOWED_SUPABASE_REF = "hznmtadobqfhumezdgbh"

export const ALLOWED_SUPABASE_HOST = `${ALLOWED_SUPABASE_REF}.supabase.co`

export const ALLOWED_SUPABASE_URL = `https://${ALLOWED_SUPABASE_HOST}`

export function supabaseHostFromUrl(url) {
  try {
    return new URL(String(url ?? "").trim()).host
  } catch {
    return ""
  }
}

export function supabaseRefFromUrl(url) {
  const host = supabaseHostFromUrl(url)
  const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i)
  return match?.[1] ?? ""
}

export function isAllowedSupabaseUrl(url) {
  return supabaseRefFromUrl(url) === ALLOWED_SUPABASE_REF
}

export function assertAllowedSupabaseUrl(url, label = "NEXT_PUBLIC_SUPABASE_URL") {
  const trimmed = String(url ?? "").trim()
  if (!trimmed) {
    const error = new Error(`${label} is missing (required ref ${ALLOWED_SUPABASE_REF})`)
    error.code = "DISALLOWED_SUPABASE_REF"
    throw error
  }
  const ref = supabaseRefFromUrl(trimmed)
  if (ref !== ALLOWED_SUPABASE_REF) {
    const error = new Error(`${label} ref "${ref || "invalid"}" is not allowed (required ${ALLOWED_SUPABASE_REF})`)
    error.code = "DISALLOWED_SUPABASE_REF"
    throw error
  }
  return ref
}

/** App URL + any set E2E_* Supabase URLs must be the allowed ref. */
export function assertAllowedSupabaseEnv(env = process.env) {
  const appUrl = env.NEXT_PUBLIC_SUPABASE_URL !== undefined ? env.NEXT_PUBLIC_SUPABASE_URL : env.SUPABASE_URL
  assertAllowedSupabaseUrl(appUrl, "NEXT_PUBLIC_SUPABASE_URL")
  if (env.E2E_SUPABASE_URL?.trim()) {
    assertAllowedSupabaseUrl(env.E2E_SUPABASE_URL, "E2E_SUPABASE_URL")
  }
  if (env.E2E_PROTECT_SUPABASE_URL?.trim()) {
    assertAllowedSupabaseUrl(env.E2E_PROTECT_SUPABASE_URL, "E2E_PROTECT_SUPABASE_URL")
  }
}

export function isDisallowedSupabaseError(error) {
  return Boolean(error && typeof error === "object" && error.code === "DISALLOWED_SUPABASE_REF")
}
