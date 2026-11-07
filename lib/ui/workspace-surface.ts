/** Shared workspace surface classes — Lot 16B/16C design system. */
export const WS_PANEL = "ws-panel"
export const WS_ENTER = "ws-enter"
export const WS_PANEL_ENTER = "ws-panel ws-enter"

/** Icon chip used on KPI / section headers. */
export const WS_ICON_CHIP =
  "flex shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-300)]"

export const WS_LINK =
  "font-semibold text-[color:var(--brand-500)] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"

export const WS_FOCUS =
  "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"

/** Lot 16I — re-export motion tokens for workspace consumers. */
export {
  MOTION_CARD_LIFT,
  MOTION_COLOR,
  MOTION_DURATION,
  MOTION_ENTER,
  MOTION_INTERACTIVE,
  MOTION_PRESS,
} from "@/lib/ui/motion"
