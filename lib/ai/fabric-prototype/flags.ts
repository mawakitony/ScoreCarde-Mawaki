/**
 * Prototype gates — both OFF by default.
 * Never enable LIVE in ordinary CI.
 */
export function isFabricPrototypeEnabled() {
  return process.env.FABRIC_PROTOTYPE_ENABLED === "1"
}

export function isFabricPrototypeLiveAllowed() {
  return isFabricPrototypeEnabled() && process.env.FABRIC_PROTOTYPE_LIVE === "1"
}

export function assertLiveAllowed() {
  if (!isFabricPrototypeLiveAllowed()) {
    throw new Error("FABRIC_PROTOTYPE_LIVE is disabled (requires FABRIC_PROTOTYPE_ENABLED=1 and FABRIC_PROTOTYPE_LIVE=1).")
  }
}
