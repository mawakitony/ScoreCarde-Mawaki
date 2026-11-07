import type { LandingContent } from "@/components/assessment/landing-view"
import { LandingChrome, PrimaryCta } from "./shared"

export function BusinessGrowthLanding({
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
  const primary = content.primaryColor || "#0F3D3E"
  const accent = content.accentColor || content.secondaryColor || "#F97316"
  const bg = content.backgroundColor || "#FDFBF9"
  const highlight = content.highlightText?.trim()
  const hasHighlight = Boolean(highlight && content.title.includes(highlight))

  return (
    <LandingChrome content={content} className="min-h-full overflow-hidden" style={{ background: bg }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="absolute top-16 left-[42%] size-3 rounded-full bg-[#CBD5E1]" />
        <span className="absolute top-28 left-[48%] size-2 rotate-45 bg-[#F97316]" />
        <span className="absolute bottom-24 left-10 size-8 rounded-full border border-[#CBD5E1]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-2 lg:items-center lg:py-16">
        <div>
          {content.eyebrow ? (
            <p className="inline-flex rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${accent}22`, color: primary }}>
              {content.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-5 text-4xl leading-[1.12] font-bold tracking-tight md:text-5xl" style={{ color: primary }}>
            {hasHighlight ? (
              <>
                {content.title.slice(0, content.title.indexOf(highlight!))}
                <span className="rounded-md px-1" style={{ background: `${accent}33`, boxShadow: `inset 0 0 0 1px ${accent}` }}>
                  {highlight}
                </span>
                {content.title.slice(content.title.indexOf(highlight!) + highlight!.length)}
              </>
            ) : (
              content.title
            )}
          </h1>
          {content.subtitle ? <p className="mt-3 text-xl font-semibold" style={{ color: primary }}>{content.subtitle}</p> : null}
          {content.description ? <p className="mt-4 max-w-md text-sm leading-7 text-[#5E6D7E]">{content.description}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PrimaryCta
              content={content}
              ctaHref={ctaHref}
              onStart={onStart}
              cta={cta}
              className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-white"
              style={{ background: primary }}
            />
            {content.secondaryCtaLabel ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: primary }}>
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow" aria-hidden>▶</span>
                {content.secondaryCtaLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative mx-auto min-h-[400px] w-full max-w-md">
          <div className="absolute top-6 right-6 h-72 w-40 rounded-[2rem]" style={{ background: `${accent}55` }} />
          <div className="absolute top-16 right-0 h-24 w-40 rounded-[2rem]" style={{ background: accent }} />
          <div className="absolute right-8 bottom-16 h-28 w-36 rounded-[2rem]" style={{ background: primary }} />
          <div className="relative z-10 flex h-full min-h-[400px] items-end justify-center">
            {content.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.heroImageUrl} alt="" className="max-h-[380px] object-contain drop-shadow-xl" />
            ) : (
              <div className="mb-4 flex h-80 w-56 items-end justify-center rounded-[2rem] bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] text-center text-sm font-medium text-[#7C2D12] shadow-xl">
                <p className="px-4 pb-8">Photo détourée · remplaçable</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </LandingChrome>
  )
}
