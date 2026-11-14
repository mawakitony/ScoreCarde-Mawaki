import { ALLOWED_SUPABASE_HOST, ALLOWED_SUPABASE_REF, isAllowedSupabaseUrl, supabaseHostFromUrl } from "@/lib/env/allowed-supabase"

export type ActiveDatabaseLabel = "STAGING" | "OTHER" | "MISSING"

/** Public host/ref only — never returns secrets. */
export function activeDatabaseLabel(
  url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): ActiveDatabaseLabel {
  if (!url?.trim()) return "MISSING"
  if (isAllowedSupabaseUrl(url)) return "STAGING"
  return "OTHER"
}

export function activeDatabaseHost(url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  return supabaseHostFromUrl(url) || null
}

/** Dev banner copy — always describes the only allowed base. */
export function activeDatabaseBannerText() {
  return `BASE ACTIVE : STAGING · ${ALLOWED_SUPABASE_HOST}`
}

export function allowedSupabaseRef() {
  return ALLOWED_SUPABASE_REF
}
