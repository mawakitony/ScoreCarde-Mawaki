export { resolveAuthorizedAvatar, resolveApprovedHostAvatar } from "./authorized"
export {
  approvedAvatarHosts,
  googlePeopleConfigured,
  leadAvatarCacheTtlMs,
  leadAvatarSyncEnabled,
  microsoftGraphConfigured,
} from "./config"
export { avatarCacheKey, avatarCacheSize, clearAvatarCache, getCachedAvatar, setCachedAvatar } from "./cache"
export { getAvatarFallback } from "./fallback"
export { resolveGoogleAvatar } from "./google"
export { resolveMicrosoftAvatar } from "./microsoft"
export { displayAvatarUrl } from "./display"
export { resolveLeadAvatar } from "./resolve"
export { avatarUrlIssue, isSafeAvatarUrl } from "./url"
export { AvatarResolveStatus } from "./types"
export type {
  AvatarCacheEntry,
  AvatarFetch,
  AvatarProviderResult,
  AvatarResolveStatus as AvatarResolveStatusType,
  AvatarSource,
  LeadAvatarInput,
  ResolvedLeadAvatar,
} from "./types"
