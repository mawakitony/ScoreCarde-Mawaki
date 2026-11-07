import { webhookUrlIssue } from "@/lib/integrations/ssrf"

const BLOCKED_SCHEMES = new Set(["file:", "ftp:", "javascript:", "data:"])

/**
 * Validate an avatar image URL before using it in the CRM.
 * HTTPS only in production; no private hosts; no credentialed URLs.
 */
export function avatarUrlIssue(raw: string, options?: { production?: boolean; approvedHosts?: string[] }) {
  const value = raw?.trim()
  if (!value) return "URL vide."
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return "URL invalide."
  }
  if (BLOCKED_SCHEMES.has(url.protocol)) return "Schéma refusé."
  const ssrf = webhookUrlIssue(value, { production: options?.production ?? process.env.NODE_ENV === "production" })
  if (ssrf) return ssrf
  const hosts = options?.approvedHosts
  if (hosts && hosts.length > 0) {
    const host = url.hostname.toLowerCase()
    if (!hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
      return "Hôte non approuvé."
    }
  }
  return null
}

export function isSafeAvatarUrl(raw: string, options?: { production?: boolean; approvedHosts?: string[] }) {
  return avatarUrlIssue(raw, options) === null
}
