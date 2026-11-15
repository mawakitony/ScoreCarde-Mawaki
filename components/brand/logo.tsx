import { cn } from "@/lib/utils"

export const MAWAKI_TAGLINE = "SCORECARDS · PILOTAGE"

type LogoVariant = "light" | "dark"

function ScoreO({ color, className }: { color: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("inline-block align-[-0.12em]", className)}
      aria-hidden
      style={{ width: "0.92em", height: "0.92em" }}
    >
      <circle cx="12" cy="12" r="8.2" fill="none" stroke={color} strokeWidth="2.4" />
      <circle cx="12" cy="12" r="2.35" fill={color} />
      <line x1="3.2" y1="12" x2="20.8" y2="12" stroke={color} strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  )
}

function Wordmark({ variant, withTagline }: { variant: LogoVariant; withTagline: boolean }) {
  const mawaki = variant === "light" ? "var(--mawaki-navy)" : "#ffffff"
  const score = variant === "light" ? "var(--mawaki-score-light)" : "var(--mawaki-score-dark)"
  const tagline = variant === "light" ? "var(--mawaki-tagline-light)" : "var(--mawaki-tagline-dark)"

  return (
    <span className="inline-flex flex-col items-start gap-1 font-[family-name:var(--font-montserrat)]">
      <span className="inline-flex items-baseline text-[1.05rem] leading-none font-bold tracking-[-0.02em] lowercase sm:text-[1.15rem]">
        <span style={{ color: mawaki }}>mawaki&nbsp;</span>
        <span className="inline-flex items-baseline font-semibold" style={{ color: score }}>
          <span>sc</span>
          <ScoreO color={score} />
          <span>re</span>
        </span>
      </span>
      {withTagline ? (
        <span
          className="text-[0.58rem] font-semibold tracking-[0.22em] uppercase"
          style={{ color: tagline }}
        >
          {MAWAKI_TAGLINE}
        </span>
      ) : null}
    </span>
  )
}

/** App mark for compact chrome (sidebar collapsed, favicon-like). */
export function MawakiMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex size-9 items-center justify-center", className)} aria-label="Mawaki Score">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--mawaki-navy)" />
        <circle cx="16" cy="16" r="9.2" fill="none" stroke="#454b62" strokeWidth="2" />
        <circle
          cx="16"
          cy="16"
          r="9.2"
          fill="none"
          stroke="var(--mawaki-score-dark)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="48 20"
          transform="rotate(-90 16 16)"
        />
        <path
          d="M10.2 21.2 13.6 10.4h2.1L19.1 21.2h-2l-.7-2.2h-3.5l-.7 2.2h-2Zm3.1-3.7h2.5l-1.2-3.7h-.1l-1.2 3.7Z"
          fill="#ffffff"
        />
      </svg>
    </span>
  )
}

/**
 * Official wordmark: « mawaki score » (special ring « o ») + optional tagline.
 * Without `variant`, follows app Light/Dark via CSS. Forced variant for navy panels.
 */
export function Logo({
  variant,
  withTagline = false,
  className = "",
  /** @deprecated use variant — ink ≈ light bg, light ≈ dark bg */
  tone,
}: {
  variant?: LogoVariant
  withTagline?: boolean
  className?: string
  tone?: "ink" | "light"
}) {
  const resolved: LogoVariant | "auto" =
    variant ?? (tone === "light" ? "dark" : tone === "ink" ? "light" : "auto")

  if (resolved === "auto") {
    return (
      <span className={cn("inline-flex", className)} aria-label="Mawaki Score">
        <span className="dark:hidden">
          <Wordmark variant="light" withTagline={withTagline} />
        </span>
        <span className="hidden dark:inline-flex">
          <Wordmark variant="dark" withTagline={withTagline} />
        </span>
      </span>
    )
  }

  return (
    <span className={cn("inline-flex", className)} aria-label="Mawaki Score">
      <Wordmark variant={resolved} withTagline={withTagline} />
    </span>
  )
}
