/**
 * Lead avatar provider config.
 * Production sync stays OFF unless explicitly enabled AND credentials exist.
 * Never put secrets in NEXT_PUBLIC_* vars.
 */
export type LeadAvatarEnv = {
  LEAD_AVATAR_SYNC_ENABLED?: string
  LEAD_AVATAR_CACHE_TTL_MS?: string
  GOOGLE_OAUTH_CLIENT_ID?: string
  GOOGLE_OAUTH_CLIENT_SECRET?: string
  /** Per-org refresh token would live encrypted in DB; env is only for smoke/dev harness. */
  GOOGLE_PEOPLE_ACCESS_TOKEN?: string
  MICROSOFT_OAUTH_CLIENT_ID?: string
  MICROSOFT_OAUTH_CLIENT_SECRET?: string
  MICROSOFT_GRAPH_ACCESS_TOKEN?: string
  /** Optional allowlist of approved third-party hosts (empty = none). Comma-separated. */
  LEAD_AVATAR_APPROVED_HOSTS?: string
  [key: string]: string | undefined
}

export function leadAvatarSyncEnabled(env: LeadAvatarEnv = process.env) {
  return env.LEAD_AVATAR_SYNC_ENABLED === "1"
}

export function leadAvatarCacheTtlMs(env: LeadAvatarEnv = process.env) {
  const raw = Number(env.LEAD_AVATAR_CACHE_TTL_MS)
  if (Number.isFinite(raw) && raw >= 60_000) return Math.min(raw, 7 * 24 * 60 * 60 * 1000)
  return 24 * 60 * 60 * 1000
}

export function googlePeopleConfigured(env: LeadAvatarEnv = process.env) {
  return Boolean(env.GOOGLE_OAUTH_CLIENT_ID?.trim() && env.GOOGLE_PEOPLE_ACCESS_TOKEN?.trim())
}

export function microsoftGraphConfigured(env: LeadAvatarEnv = process.env) {
  return Boolean(env.MICROSOFT_OAUTH_CLIENT_ID?.trim() && env.MICROSOFT_GRAPH_ACCESS_TOKEN?.trim())
}

export function approvedAvatarHosts(env: LeadAvatarEnv = process.env) {
  return (env.LEAD_AVATAR_APPROVED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
}
