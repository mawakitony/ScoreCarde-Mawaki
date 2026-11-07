import { AvatarResolveStatus, type AvatarProviderResult } from "./types"

/** Initials / generic icon path — never a fabricated photo. */
export function getAvatarFallback(): AvatarProviderResult {
  return {
    status: AvatarResolveStatus.NOT_FOUND,
    source: "initials",
    url: null,
    reason: "fallback_initials",
  }
}
