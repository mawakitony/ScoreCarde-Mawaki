import type { AvatarCacheEntry } from "./types"

/** In-memory cache only — no DB write until migration is authorized. */
const store = new Map<string, AvatarCacheEntry>()

export function avatarCacheKey(organizationId: string, emailOrLeadId: string) {
  return `${organizationId}:${emailOrLeadId.trim().toLowerCase()}`
}

export function getCachedAvatar(organizationId: string, emailOrLeadId: string, now = Date.now()) {
  const key = avatarCacheKey(organizationId, emailOrLeadId)
  const entry = store.get(key)
  if (!entry) return null
  if (entry.organizationId !== organizationId) return null
  if (entry.expiresAt <= now) {
    store.delete(key)
    return null
  }
  return entry
}

export function setCachedAvatar(entry: AvatarCacheEntry) {
  const key = avatarCacheKey(entry.organizationId, entry.emailKey)
  store.set(key, entry)
}

export function clearAvatarCache() {
  store.clear()
}

export function avatarCacheSize() {
  return store.size
}
