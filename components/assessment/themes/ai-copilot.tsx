import type { LandingContent } from "@/components/assessment/landing-view"
import { ExampleBadge, LandingChrome, PrimaryCta } from "./shared"

export function AiCopilotLanding({
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
  const accent = content.accentColor || content.primaryColor || "#7C3AED"
  const bg = content.backgroundColor || "#FFFFFF"
  const highlight = content.highlightText?.trim()
  const hasHighlight = Boolean(highlight && content.title.includes(highlight))

  return (
    <LandingChrome
      content={content}
      className="min-h-full overflow-hidden"
      style={{
        backgroundColor: bg,
        backgroundImage: "radial-gradient(#E5E7EB 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="relative mx-auto max-w-5xl px-5 py-14 text-center md:px-8 md:py-20">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          <div className="absolute top-16 left-0 w-48 -rotate-6 rounded-2xl border border-[#E7E9EE] bg-white p-3 text-left shadow-xl">
            <p className="text-xs font-semibold">Exemple · Captions</p>
            <p className="mt-2 text-[11px] leading-4 text-[#5E6D7E]">00:00:07 — texte d&apos;exemple modifiable</p>
          </div>
          <div className="absolute top-20 right-0 w-52 rotate-3 rounded-2xl border border-[#E7E9EE] bg-white p-3 text-left shadow-xl">
            <p className="text-xs font-semibold">Exemple · Calendrier</p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-8 rounded-md bg-[#F3E8FF]" />
              ))}
            </div>
          </div>
          <div className="absolute bottom-24 left-4 w-44 -rotate-3 rounded-2xl border border-[#E7E9EE] bg-white p-3 text-left shadow-xl">
            <p className="text-xs font-semibold">Exemple · Timeline</p>
            <div className="mt-2 h-2 rounded-full bg-[#EDE9FE]"><div className="h-full w-2/3 rounded-full" style={{ background: accent }} /></div>
          </div>
          <div className="absolute right-6 bottom-28 w-44 rotate-2 rounded-2xl border border-[#E7E9EE] bg-white p-3 text-left shadow-xl">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold">Upload</p><ExampleBadge>Exemple</ExampleBadge></div>
            <div className="mt-2 h-16 rounded-lg bg-[#F5F3FF]" />
          </div>
        </div>

        <h1 className="text-4xl leading-tight font-bold tracking-tight text-[#111111] md:text-6xl">
          {hasHighlight ? (
            <>
              {content.title.slice(0, content.title.indexOf(highlight!))}
              <span style={{ color: accent }}>{highlight}</span>
              {content.title.slice(content.title.indexOf(highlight!) + highlight!.length)}
            </>
          ) : (
            content.title
          )}
        </h1>
        {content.description ? <p className="mx-auto mt-5 max-w-2xl text-base text-[#4B5563]">{content.description}</p> : null}
        {content.trustLabel ? <p className="mt-4 text-sm text-[#6B7280]">{content.trustLabel}</p> : null}
        <div className="mt-8 flex justify-center">
          <PrimaryCta
            content={content}
            ctaHref={ctaHref}
            onStart={onStart}
            cta={cta}
            className="inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold text-white shadow-[0_0_0_4px_rgba(124,58,237,0.15),0_18px_40px_-16px_rgba(124,58,237,0.7)]"
            style={{ background: accent }}
          />
        </div>
        <p className="mt-3 text-xs text-[#9CA3AF]">Aucune carte bancaire requise (mention d&apos;exemple)</p>
        <div className="mt-10 flex justify-center gap-3">
          {["YT", "Tk", "Ig", "in", "X"].map((label) => (
            <span key={label} className="flex size-11 items-center justify-center rounded-xl bg-white text-xs font-bold shadow-md">
              {label}
            </span>
          ))}
        </div>
      </div>
    </LandingChrome>
  )
}
