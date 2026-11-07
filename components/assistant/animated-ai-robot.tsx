"use client"

import { cn } from "@/lib/utils"

export type AiRobotState = "idle" | "listening" | "thinking" | "responding" | "success" | "error"

const STATE_LABEL: Record<AiRobotState, string> = {
  idle: "En attente",
  listening: "À l'écoute",
  thinking: "Réfléchit",
  responding: "Répond",
  success: "Action réussie",
  error: "Erreur",
}

type Props = {
  state?: AiRobotState
  size?: "sm" | "md" | "lg"
  reducedMotion?: boolean
  className?: string
  showLabel?: boolean
}

/**
 * Decorative WOLOYEM AI robot. Animations are CSS-only (transform/opacity).
 * State changes must reflect real request outcomes — never fake SUCCESS.
 */
export function AnimatedAiRobot({
  state = "idle",
  size = "md",
  reducedMotion = false,
  className,
  showLabel = false,
}: Props) {
  const dim = size === "sm" ? 40 : size === "lg" ? 88 : 56

  return (
    <div
      className={cn("ai-robot relative inline-flex flex-col items-center", className)}
      data-state={state}
      data-reduced={reducedMotion ? "true" : "false"}
      data-testid="ai-robot"
      aria-hidden={showLabel ? undefined : true}
      role={showLabel ? "img" : undefined}
      aria-label={showLabel ? `Assistant IA — ${STATE_LABEL[state]}` : undefined}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 96 96"
        className={cn(
          "ai-robot-svg overflow-visible",
          !reducedMotion && `ai-robot--${state}`,
        )}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Antenna */}
        <g className="ai-robot-antenna origin-center">
          <line x1="48" y1="10" x2="48" y2="18" stroke="var(--brand-500)" strokeWidth="2.5" strokeLinecap="round" />
          <circle className="ai-robot-antenna-tip" cx="48" cy="8" r="3.5" fill="var(--brand-500)" />
        </g>

        {/* Halo / aura */}
        <circle
          className="ai-robot-halo"
          cx="48"
          cy="52"
          r="38"
          stroke="var(--brand-500)"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Head */}
        <g className="ai-robot-head origin-center">
          <rect
            x="22"
            y="20"
            width="52"
            height="44"
            rx="16"
            fill="var(--surface-elevated, var(--card))"
            stroke="var(--brand-500)"
            strokeWidth="2"
            strokeOpacity="0.55"
          />
          {/* Visor */}
          <rect x="28" y="32" width="40" height="18" rx="9" fill="var(--brand-950)" className="ai-robot-visor" />
          {/* Eyes */}
          <g className="ai-robot-eyes">
            <ellipse className="ai-robot-eye ai-robot-eye-l" cx="38" cy="41" rx="4.2" ry="4.5" fill="var(--brand-300)" />
            <ellipse className="ai-robot-eye ai-robot-eye-r" cx="58" cy="41" rx="4.2" ry="4.5" fill="var(--brand-300)" />
            <circle className="ai-robot-pupil" cx="38.8" cy="40.5" r="1.4" fill="white" opacity="0.9" />
            <circle className="ai-robot-pupil" cx="58.8" cy="40.5" r="1.4" fill="white" opacity="0.9" />
          </g>
          {/* Mouth / status bar */}
          <rect
            className="ai-robot-mouth"
            x="40"
            y="54"
            width="16"
            height="3.5"
            rx="1.75"
            fill="var(--brand-500)"
            opacity="0.55"
          />
        </g>

        {/* Body */}
        <g className="ai-robot-body">
          <rect
            x="32"
            y="66"
            width="32"
            height="18"
            rx="8"
            fill="var(--brand-500)"
            fillOpacity="0.14"
            stroke="var(--brand-500)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          <circle cx="48" cy="75" r="3" fill="var(--brand-500)" opacity="0.7" className="ai-robot-core" />
        </g>

        {/* Thinking particles */}
        <g className="ai-robot-particles" opacity="0">
          <circle cx="18" cy="28" r="1.8" fill="var(--brand-500)" />
          <circle cx="78" cy="34" r="1.4" fill="var(--brand-300)" />
          <circle cx="16" cy="56" r="1.2" fill="var(--brand-500)" />
          <circle cx="80" cy="58" r="1.6" fill="var(--brand-300)" />
        </g>
      </svg>

      {showLabel ? (
        <span className="mt-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {STATE_LABEL[state]}
        </span>
      ) : null}
      {reducedMotion && state === "thinking" ? (
        <span className="sr-only">L&apos;assistant réfléchit</span>
      ) : null}
    </div>
  )
}
