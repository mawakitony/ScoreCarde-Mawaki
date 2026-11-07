import { microsoftGraphConfigured, type LeadAvatarEnv } from "./config"
import { AvatarResolveStatus, type AvatarFetch, type AvatarProviderResult } from "./types"

export type MicrosoftAvatarDeps = {
  env?: LeadAvatarEnv
  fetchFn?: AvatarFetch
  accessToken?: string | null
  /**
   * When true, treat the email as a tenant UPN eligible for /users/{upn}/photo/$value.
   * External consumer Outlook/Hotmail addresses are not tenant users.
   */
  sameTenant?: boolean
}

/**
 * Microsoft Graph profile photos — only for users visible in the connected tenant
 * (or org contacts with Contacts.Read). Consumer Outlook.com / Hotmail are typically
 * inaccessible by email alone.
 *
 * GET https://graph.microsoft.com/v1.0/users/{upn}/photo/$value
 * Least privilege: ProfilePhoto.Read.All (application) or equivalent delegated.
 */
export async function resolveMicrosoftAvatar(
  email: string | null | undefined,
  deps: MicrosoftAvatarDeps = {},
): Promise<AvatarProviderResult> {
  const env = deps.env ?? process.env
  if (!microsoftGraphConfigured(env) && !deps.accessToken?.trim()) {
    return { status: AvatarResolveStatus.NOT_CONFIGURED, source: "microsoft", url: null, reason: "microsoft_not_configured" }
  }

  const address = email?.trim().toLowerCase()
  if (!address || !address.includes("@")) {
    return { status: AvatarResolveStatus.NOT_FOUND, source: "microsoft", url: null, reason: "no_email" }
  }

  if (deps.sameTenant === false) {
    return {
      status: AvatarResolveStatus.NOT_AUTHORIZED,
      source: "microsoft",
      url: null,
      reason: "external_user_inaccessible",
    }
  }

  const token = deps.accessToken?.trim() || env.MICROSOFT_GRAPH_ACCESS_TOKEN?.trim()
  if (!token) {
    return { status: AvatarResolveStatus.NOT_AUTHORIZED, source: "microsoft", url: null, reason: "missing_token" }
  }

  const fetchFn = deps.fetchFn ?? fetch
  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(address)}/photo/$value`

  try {
    const response = await fetchFn(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "image/*" },
    })

    if (response.status === 401 || response.status === 403) {
      return { status: AvatarResolveStatus.NOT_AUTHORIZED, source: "microsoft", url: null, reason: `http_${response.status}` }
    }
    if (response.status === 404) {
      return { status: AvatarResolveStatus.NOT_FOUND, source: "microsoft", url: null, reason: "http_404" }
    }
    if (!response.ok) {
      return { status: AvatarResolveStatus.ERROR, source: "microsoft", url: null, reason: `http_${response.status}` }
    }

    // Binary photo — callers that persist should upload to org storage.
    // For resolve path we accept a Location header or content-type image with a safe public URL header.
    const location = response.headers.get("x-avatar-public-url") || response.headers.get("location")
    if (location?.startsWith("https://")) {
      return { status: AvatarResolveStatus.AVAILABLE, source: "microsoft", url: location, reason: "microsoft_graph_photo" }
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.startsWith("image/")) {
      // Photo bytes available but no durable public URL yet — treat as found-but-unhosted.
      return {
        status: AvatarResolveStatus.NOT_AUTHORIZED,
        source: "microsoft",
        url: null,
        reason: "photo_bytes_without_storage",
      }
    }

    return { status: AvatarResolveStatus.NOT_FOUND, source: "microsoft", url: null, reason: "no_photo" }
  } catch {
    return { status: AvatarResolveStatus.ERROR, source: "microsoft", url: null, reason: "network_error" }
  }
}
