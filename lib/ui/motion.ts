/**
 * Lot 16I — shared motion tokens.
 * Prefer transform/opacity. Pair with `motion-safe:` / `prefers-reduced-motion`.
 */

export const MOTION_EASE_OUT = "ease-[cubic-bezier(0.22,1,0.36,1)]" as const
export const MOTION_EASE_STANDARD = "ease-[cubic-bezier(0.2,0.8,0.2,1)]" as const

/** Tailwind duration utilities aligned to the global CSS motion scale. */
export const MOTION_DURATION = {
  /** Immediate feedback — 100ms */
  instant: "duration-100",
  /** Hover / focus — 150ms */
  fast: "duration-150",
  /** Controls, menus — 200ms */
  normal: "duration-200",
  /** Panels / sidebar — ~280–300ms */
  panel: "duration-300",
} as const

/** Discrete press feedback for buttons and interactive chips. */
export const MOTION_PRESS = "motion-safe:active:scale-[0.98]" as const

/** Standard interactive surface (color + elevation, no layout shift). */
export const MOTION_INTERACTIVE = [
  "motion-safe:transition-[transform,box-shadow,border-color,background-color,color,opacity]",
  MOTION_DURATION.normal,
  MOTION_EASE_OUT,
].join(" ")

/** Interactive card lift — only for clickable / navigable cards. */
export const MOTION_CARD_LIFT = [
  MOTION_INTERACTIVE,
  "motion-safe:hover:-translate-y-0.5",
].join(" ")

/** Color-only hover (rows, nav links) — avoids fake clickability. */
export const MOTION_COLOR = [
  "transition-colors",
  MOTION_DURATION.fast,
  MOTION_EASE_OUT,
].join(" ")

/** Panel / page enter animation class (see globals.css `.ws-enter`). */
export const MOTION_ENTER = "ws-enter" as const

export function scrollBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth"
}

/** Cap staggered delays so long lists stay calm. */
export function enterDelayMs(index: number, stepMs = 40, cap = 6): number {
  return Math.min(Math.max(index, 0), cap) * stepMs
}

export function shouldStagger(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion
}
