import type { LandingContent } from "@/components/assessment/landing-view"
import { LandingChrome, PrimaryCta, TrustPlaceholders } from "./shared"

export function FintechElegantLanding({
  content,
  ctaHref,
  onStart,
  cta,
}: {
  content: LandingContent
  ctaHref?: string
  onStart?: () => void
  cta?: React.ReactNode
}) {
  const accent = content.accentColor || content.primaryColor || "#FF5F00"
  const bg = content.backgroundColor || "#FFFFFF"

  return (
    <LandingChrome content={content} className="relative min-h-full overflow-hidden" style={{ background: bg }}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        {[280, 420, 560, 720].map((size) => (
          <div
            key={size}
            className="absolute rounded-full border border-[#E5E7EB]"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center md:py-28">
        {content.eyebrow ? (
          <p className="rounded-full border border-[#E7E9EE] bg-white px-4 py-2 text-xs text-[#6B7280] shadow-sm">
            {content.eyebrow}
          </p>
        ) : null}
        <h1 className="mt-8 text-4xl leading-tight font-bold tracking-tight text-[#1F2937] md:text-6xl">{content.title}</h1>
        {content.subtitle ? <p className="mt-5 text-base text-[#6B7280]">{content.subtitle}</p> : null}
        {content.description ? <p className="mt-3 max-w-xl text-sm text-[#6B7280]">{content.description}</p> : null}
        <div className="mt-10">
          <PrimaryCta
            content={content}
            ctaHref={ctaHref}
            onStart={onStart}
            cta={cta}
            className="inline-flex h-12 items-center rounded-lg px-7 text-sm font-semibold text-white"
            style={{ background: accent, boxShadow: `0 18px 40px -12px ${accent}99` }}
          />
        </div>
        {content.trustLabel ? (
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-[#6B7280]">
            <span className="size-2 rounded-full" style={{ background: accent }} />
            {content.trustLabel}
          </p>
        ) : null}
        <div className="mt-16 w-full">
          <TrustPlaceholders label="Exemples de logos (personnalisables)" />
        </div>
      </div>
    </LandingChrome>
  )
}
