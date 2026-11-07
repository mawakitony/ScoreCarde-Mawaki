/** Explicit resolution outcomes — never invent a photo. */
export const AvatarResolveStatus = {
  AVAILABLE: "AVAILABLE",
  NOT_FOUND: "NOT_FOUND",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  ERROR: "ERROR",
} as const

export type AvatarResolveStatus = (typeof AvatarResolveStatus)[keyof typeof AvatarResolveStatus]

export type AvatarSource =
  | "stored"
  | "google"
  | "microsoft"
  | "approved"
  | "initials"

export type AvatarProviderResult = {
  status: AvatarResolveStatus
  source: AvatarSource
  url?: string | null
  /** Short machine reason, never tokens or PII dumps. */
  reason?: string
}

export type LeadAvatarInput = {
  organizationId: string
  leadId: string
  email?: string | null
  name?: string | null
  /** Already authorized CRM photo URL (never a company logo). */
  storedUrl?: string | null
}

export type ResolvedLeadAvatar = AvatarProviderResult & {
  leadId: string
  organizationId: string
  fromCache: boolean
}

export type AvatarCacheEntry = {
  organizationId: string
  leadId: string
  emailKey: string
  status: AvatarResolveStatus
  source: AvatarSource
  url: string | null
  checkedAt: number
  expiresAt: number
}

export type AvatarFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
