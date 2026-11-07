import type { LandingContent } from "@/components/assessment/landing-view"
import type { ThemeStatCard } from "@/lib/scorecard-themes/types"

export function HighlightTitle({
  title,
  highlight,
  className,
  highlightClassName,
}: {
  title: string
  highlight?: string
  className?: string
  highlightClassName?: string
}) {
  if (!highlight?.trim() || !title.includes(highlight)) {
    return <h1 className={className}>{title}</h1>
  }
  const index = title.indexOf(highlight)
  return (
    <h1 className={className}>
      {title.slice(0, index)}
      <span className={highlightClassName}>{highlight}</span>
      {title.slice(index + highlight.length)}
    </h1>
  )
}

export function ExampleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#5E6D7E] uppercase">
      {children}
    </span>
  )
}

export function StatMiniCard({ stat }: { stat: ThemeStatCard }) {
  const tones: Record<NonNullable<ThemeStatCard["tone"]>, string> = {
    blue: "text-[#2563EB]",
    red: "text-[#EF4444]",
    purple: "text-[#7C3AED]",
    orange: "text-[#F97316]",
    green: "text-[#22C55E]",
    teal: "text-[#2F6F73]",
  }
  return (
    <div className="rounded-2xl border border-[#E7E9EE] bg-white p-3 shadow-[0_18px_40px_-24px_rgba(20,32,51,0.45)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[#5E6D7E]">{stat.label}</p>
        <ExampleBadge>Exemple</ExampleBadge>
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${tones[stat.tone ?? "blue"]}`}>{stat.value}</p>
      {stat.trend ? <p className="mt-1 text-xs font-medium text-[#22C55E]">{stat.trend}</p> : null}
    </div>
  )
}

export function TrustPlaceholders({ label }: { label?: string }) {
  const names = ["Alpha", "Nova", "Orbit", "Pulse"]
  return (
    <div className="flex flex-wrap items-center gap-4 opacity-70">
      {label ? <p className="w-full text-xs text-[#5E6D7E] sm:w-auto">{label}</p> : null}
      {names.map((name) => (
        <span key={name} className="text-sm font-semibold tracking-wide text-[#94A3B8]">
          {name}
        </span>
      ))}
    </div>
  )
}

export function LandingChrome({
  content,
  children,
  className,
  style,
}: {
  content: LandingContent
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div data-landing-chrome="" className={className} style={style}>
      {content.previewBanner ? (
        <p className="mx-auto mb-4 max-w-6xl rounded-xl bg-[#f3e6c4] px-4 py-2 text-sm text-[#142033]">
          Aperçu privé. Cette scorecard n&apos;est pas publique.
        </p>
      ) : null}
      {children}
      {content.showPrivacy && content.privacyText ? (
        <p className="mx-auto mt-8 max-w-6xl px-5 text-sm text-[#5E6D7E] md:px-8">{content.privacyText}</p>
      ) : null}
      {content.poweredBy !== false ? (
        <p className="mx-auto mt-6 max-w-6xl px-5 pb-8 text-xs tracking-wide text-[#8a7340] uppercase md:px-8">
          Powered by WOLOYEM Score
        </p>
      ) : null}
    </div>
  )
}

export function PrimaryCta({
  content,
  ctaHref,
  onStart,
  cta,
  className,
  style,
}: {
  content: LandingContent
  ctaHref?: string
  onStart?: () => void
  cta?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  if (cta) return <>{cta}</>
  if (onStart) {
    return (
      <button type="button" onClick={onStart} className={className} style={style}>
        {content.ctaLabel || "Commencer"}
      </button>
    )
  }
  return (
    <a href={ctaHref || "#"} className={className} style={style}>
      {content.ctaLabel || "Commencer"}
    </a>
  )
}
