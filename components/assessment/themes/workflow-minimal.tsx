import type { LandingContent } from "@/components/assessment/landing-view"
import { LandingChrome, PrimaryCta } from "./shared"

export function WorkflowMinimalLanding({
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
  const accent = content.accentColor || content.primaryColor || "#111111"
  const bg = content.backgroundColor || "#FFFFFF"

  return (
    <LandingChrome content={content} className="min-h-full" style={{ background: bg }}>
      <div className="relative mx-auto max-w-4xl px-5 py-16 text-center md:px-8 md:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-10 left-[8%] flex size-16 items-center justify-center rounded-[1.4rem] bg-[#3B82F6] text-2xl text-white shadow-[0_20px_40px_-16px_rgba(59,130,246,0.7)]">✳</div>
          <div className="absolute top-24 right-[10%] flex size-16 items-center justify-center rounded-[1.4rem] bg-[#F3F4F6] text-2xl shadow-[0_20px_40px_-16px_rgba(20,32,51,0.35)]">✕</div>
          <div className="absolute bottom-36 left-[12%] flex size-16 items-center justify-center rounded-[1.4rem] bg-[#2F6F73] text-2xl text-white shadow-[0_20px_40px_-16px_rgba(47,111,115,0.55)]">🌿</div>
          <div className="absolute right-[14%] bottom-40 flex size-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-[#FB7185] to-[#F97316] text-2xl text-white shadow-[0_20px_40px_-16px_rgba(249,115,22,0.55)]">✦</div>
        </div>

        {content.eyebrow ? <p className="text-sm text-[#6B7280]">{content.eyebrow}</p> : null}
        <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight text-[#111111] md:text-6xl">{content.title}</h1>
        {content.description ? <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#6B7280]">{content.description}</p> : null}
        <div className="mt-8 flex justify-center">
          <PrimaryCta
            content={content}
            ctaHref={ctaHref}
            onStart={onStart}
            cta={cta}
            className="inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold text-white shadow-[0_18px_36px_-16px_rgba(0,0,0,0.55)]"
            style={{ background: accent }}
          />
        </div>

        {content.benefits.length ? (
          <div className="mt-20 grid gap-6 border-t border-[#E5E7EB] pt-10 text-left sm:grid-cols-3 sm:divide-x sm:divide-[#E5E7EB]">
            {content.benefits.slice(0, 3).map((benefit) => (
              <div key={benefit.title} className="px-2 text-center sm:px-6">
                <p className="text-base font-bold text-[#111111]">{benefit.title}</p>
                {benefit.description ? <p className="mt-2 text-sm leading-6 text-[#6B7280]">{benefit.description}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </LandingChrome>
  )
}
