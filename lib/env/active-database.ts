export type ActiveDatabaseLabel = "STAGING" | "XP" | "OTHER" | "MISSING"

const STAGING_REF = "hznmtadobqfhumezdgbh"
const XP_REF = "zkyjaslogpdujyeysjzw"

/** Public host/ref only — never returns secrets. */
export function activeDatabaseLabel(
  url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): ActiveDatabaseLabel {
  if (!url?.trim()) return "MISSING"
  try {
    const host = new URL(url).host
    if (host.startsWith(`${STAGING_REF}.`)) return "STAGING"
    if (host.startsWith(`${XP_REF}.`)) return "XP"
    return "OTHER"
  } catch {
    return "OTHER"
  }
}

export function activeDatabaseHost(url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    return new URL(url ?? "").host || null
  } catch {
    return null
  }
}
