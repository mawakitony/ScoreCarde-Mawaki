/** Pure helpers for motion policy — no DOM required. */
export function shouldAnimateNumbers(prefersReducedMotion: boolean) {
  return !prefersReducedMotion
}

export function ambientMotionClass(input: {
  prefersReducedMotion: boolean
  tabHidden: boolean
}) {
  if (input.prefersReducedMotion) return "dash-motion-paused"
  if (input.tabHidden) return "dash-motion-paused"
  return ""
}
