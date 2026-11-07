import { isSafeAvatarUrl } from "./url"
import { AvatarResolveStatus, type AvatarProviderResult } from "./types"

/**
 * Photo already stored on the lead / respondent with CRM authorization.
 * Company logos must never be passed here as a personal photo.
 */
export function resolveAuthorizedAvatar(storedUrl?: string | null): AvatarProviderResult {
  const url = storedUrl?.trim()
  if (!url) {
    return { status: AvatarResolveStatus.NOT_FOUND, source: "stored", url: null, reason: "no_stored_url" }
  }
  if (!isSafeAvatarUrl(url)) {
    return { status: AvatarResolveStatus.ERROR, source: "stored", url: null, reason: "unsafe_url" }
  }
  return { status: AvatarResolveStatus.AVAILABLE, source: "stored", url, reason: "stored_authorized" }
}

/**
 * Optional approved third-party host (explicit allowlist only).
 * Never sends emails to Gravatar/Clearbit by default.
 */
export function resolveApprovedHostAvatar(
  url: string | null | undefined,
  approvedHosts: string[],
): AvatarProviderResult {
  if (!approvedHosts.length) {
    return { status: AvatarResolveStatus.NOT_CONFIGURED, source: "approved", url: null, reason: "no_approved_hosts" }
  }
  const value = url?.trim()
  if (!value) {
    return { status: AvatarResolveStatus.NOT_FOUND, source: "approved", url: null, reason: "no_url" }
  }
  if (!isSafeAvatarUrl(value, { approvedHosts })) {
    return { status: AvatarResolveStatus.NOT_AUTHORIZED, source: "approved", url: null, reason: "host_not_approved" }
  }
  return { status: AvatarResolveStatus.AVAILABLE, source: "approved", url: value, reason: "approved_host" }
}
