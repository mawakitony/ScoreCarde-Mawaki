import { resolveApprovedHostAvatar, resolveAuthorizedAvatar } from "./authorized"
import { getCachedAvatar, setCachedAvatar } from "./cache"
import {
  approvedAvatarHosts,
  leadAvatarCacheTtlMs,
  leadAvatarSyncEnabled,
  type LeadAvatarEnv,
} from "./config"
import { getAvatarFallback } from "./fallback"
import { resolveGoogleAvatar, type GoogleAvatarDeps } from "./google"
import { resolveMicrosoftAvatar, type MicrosoftAvatarDeps } from "./microsoft"
import {
  AvatarResolveStatus,
  type AvatarProviderResult,
  type LeadAvatarInput,
  type ResolvedLeadAvatar,
} from "./types"

export type ResolveLeadAvatarOptions = {
  env?: LeadAvatarEnv
  now?: number
  /** Force sync even when env flag is off — tests only. */
  forceSync?: boolean
  google?: GoogleAvatarDeps
  microsoft?: MicrosoftAvatarDeps
  /** Pre-resolved approved-provider URL for this lead (explicit allowlist only). */
  approvedUrl?: string | null
}

function cacheable(result: AvatarProviderResult) {
  return (
    result.status === AvatarResolveStatus.AVAILABLE ||
    result.status === AvatarResolveStatus.NOT_FOUND ||
    result.status === AvatarResolveStatus.NOT_AUTHORIZED
  )
}

function toResolved(
  input: LeadAvatarInput,
  result: AvatarProviderResult,
  fromCache: boolean,
): ResolvedLeadAvatar {
  return {
    ...result,
    leadId: input.leadId,
    organizationId: input.organizationId,
    fromCache,
  }
}

/**
 * Multi-source lead avatar resolver.
 * Priority: stored → Google → Microsoft → approved host → initials.
 * Never blocks CRM display; external sync stays off until configured + enabled.
 */
export async function resolveLeadAvatar(
  input: LeadAvatarInput,
  options: ResolveLeadAvatarOptions = {},
): Promise<ResolvedLeadAvatar> {
  const env = options.env ?? process.env
  const now = options.now ?? Date.now()
  const emailKey = (input.email?.trim() || input.leadId).toLowerCase()

  const cached = getCachedAvatar(input.organizationId, emailKey, now)
  if (cached) {
    return toResolved(
      input,
      {
        status: cached.status,
        source: cached.source,
        url: cached.url,
        reason: "cache_hit",
      },
      true,
    )
  }

  const stored = resolveAuthorizedAvatar(input.storedUrl)
  if (stored.status === AvatarResolveStatus.AVAILABLE) {
    remember(input, emailKey, stored, now, env)
    return toResolved(input, stored, false)
  }

  const sync = options.forceSync === true || leadAvatarSyncEnabled(env)
  if (sync) {
    const google = await resolveGoogleAvatar(input.email, { ...options.google, env })
    if (google.status === AvatarResolveStatus.AVAILABLE) {
      remember(input, emailKey, google, now, env)
      return toResolved(input, google, false)
    }

    const microsoft = await resolveMicrosoftAvatar(input.email, { ...options.microsoft, env })
    if (microsoft.status === AvatarResolveStatus.AVAILABLE) {
      remember(input, emailKey, microsoft, now, env)
      return toResolved(input, microsoft, false)
    }

    const approved = resolveApprovedHostAvatar(options.approvedUrl, approvedAvatarHosts(env))
    if (approved.status === AvatarResolveStatus.AVAILABLE) {
      remember(input, emailKey, approved, now, env)
      return toResolved(input, approved, false)
    }

    // Cache negative outcomes from sync attempts (not NOT_CONFIGURED) to protect quotas.
    const negative = [google, microsoft].find(
      (item) =>
        item.status === AvatarResolveStatus.NOT_FOUND ||
        item.status === AvatarResolveStatus.NOT_AUTHORIZED ||
        item.status === AvatarResolveStatus.ERROR,
    )
    if (negative && cacheable(negative)) {
      remember(input, emailKey, negative, now, env)
    }
  }

  const fallback = getAvatarFallback()
  return toResolved(input, fallback, false)
}

function remember(
  input: LeadAvatarInput,
  emailKey: string,
  result: AvatarProviderResult,
  now: number,
  env: LeadAvatarEnv,
) {
  if (!cacheable(result)) return
  setCachedAvatar({
    organizationId: input.organizationId,
    leadId: input.leadId,
    emailKey,
    status: result.status,
    source: result.source,
    url: result.url ?? null,
    checkedAt: now,
    expiresAt: now + leadAvatarCacheTtlMs(env),
  })
}
