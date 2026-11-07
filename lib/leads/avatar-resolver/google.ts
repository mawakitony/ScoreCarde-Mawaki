import { googlePeopleConfigured, type LeadAvatarEnv } from "./config"
import { isSafeAvatarUrl } from "./url"
import { AvatarResolveStatus, type AvatarFetch, type AvatarProviderResult } from "./types"

export type GoogleAvatarDeps = {
  env?: LeadAvatarEnv
  fetchFn?: AvatarFetch
  accessToken?: string | null
}

/**
 * Google People API — photos only from contacts/directory the OAuth subject may read.
 * Does NOT look up arbitrary Gmail addresses. No scraping.
 *
 * Intended call (when configured + sync enabled):
 * GET people.googleapis.com/v1/people:searchContacts?query={email}&readMask=emailAddresses,photos
 * Scope: contacts.readonly (and optionally directory.readonly for Workspace).
 */
export async function resolveGoogleAvatar(
  email: string | null | undefined,
  deps: GoogleAvatarDeps = {},
): Promise<AvatarProviderResult> {
  const env = deps.env ?? process.env
  if (!googlePeopleConfigured(env) && !deps.accessToken?.trim()) {
    return { status: AvatarResolveStatus.NOT_CONFIGURED, source: "google", url: null, reason: "google_not_configured" }
  }

  const address = email?.trim().toLowerCase()
  if (!address || !address.includes("@")) {
    return { status: AvatarResolveStatus.NOT_FOUND, source: "google", url: null, reason: "no_email" }
  }

  const token = deps.accessToken?.trim() || env.GOOGLE_PEOPLE_ACCESS_TOKEN?.trim()
  if (!token) {
    return { status: AvatarResolveStatus.NOT_AUTHORIZED, source: "google", url: null, reason: "missing_token" }
  }

  const fetchFn = deps.fetchFn ?? fetch
  const endpoint = new URL("https://people.googleapis.com/v1/people:searchContacts")
  endpoint.searchParams.set("query", address)
  endpoint.searchParams.set("readMask", "emailAddresses,photos")
  endpoint.searchParams.set("pageSize", "10")
  endpoint.searchParams.set("sources", "READ_SOURCE_TYPE_CONTACT")

  try {
    const response = await fetchFn(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })

    if (response.status === 401 || response.status === 403) {
      return { status: AvatarResolveStatus.NOT_AUTHORIZED, source: "google", url: null, reason: `http_${response.status}` }
    }
    if (response.status === 404) {
      return { status: AvatarResolveStatus.NOT_FOUND, source: "google", url: null, reason: "http_404" }
    }
    if (!response.ok) {
      return { status: AvatarResolveStatus.ERROR, source: "google", url: null, reason: `http_${response.status}` }
    }

    const body = (await response.json()) as {
      results?: Array<{
        person?: {
          emailAddresses?: Array<{ value?: string }>
          photos?: Array<{ url?: string; default?: boolean }>
        }
      }>
    }

    const match = (body.results ?? []).find((row) =>
      (row.person?.emailAddresses ?? []).some((item) => item.value?.trim().toLowerCase() === address),
    )
    const photo = match?.person?.photos?.find((item) => item.url && !item.default) ?? match?.person?.photos?.[0]
    const url = photo?.url?.trim()
    if (!url || !isSafeAvatarUrl(url)) {
      return { status: AvatarResolveStatus.NOT_FOUND, source: "google", url: null, reason: "no_photo_in_contacts" }
    }
    return { status: AvatarResolveStatus.AVAILABLE, source: "google", url, reason: "google_contact_photo" }
  } catch {
    return { status: AvatarResolveStatus.ERROR, source: "google", url: null, reason: "network_error" }
  }
}
