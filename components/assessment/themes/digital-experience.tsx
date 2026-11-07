import type { LandingContent } from "@/components/assessment/landing-view"
import { LandingChrome, PrimaryCta } from "./shared"

/**
 * Lot 8F — Digital Experience (final visual polish)
 * Keeps 8D/8E structure, CQ responsive, and builder customization fields.
 */
export function DigitalExperienceLanding({
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
  const accent = content.accentColor || content.primaryColor || "#6366F1"
  const bg = content.backgroundColor || "#F4F2FA"
  const highlight = content.highlightText?.trim() ?? ""
  const title = content.title
  const hasHighlight = Boolean(highlight && title.includes(highlight))
  const before = hasHighlight ? title.slice(0, title.indexOf(highlight)).trimEnd() : title
  const after = hasHighlight ? title.slice(title.indexOf(highlight) + highlight.length).trimStart() : ""
  const brand = "WOLOYEM"
  const satisfaction =
    content.demoStats?.find((item) => /satisf/i.test(item.label) || item.value.includes("%"))?.value || "98%"
  const progress =
    content.demoStats?.find((item) => /avanc|progress|projet|complete/i.test(item.label)) || content.demoStats?.[1]

  return (
    <LandingChrome
      content={content}
      className="@container w-full min-h-full min-w-0 overflow-x-clip"
      style={{
        background: `
          radial-gradient(ellipse 70% 55% at 12% 28%, #ffffff 0%, transparent 58%),
          radial-gradient(ellipse 55% 48% at 92% 12%, ${accent}28 0%, transparent 58%),
          radial-gradient(ellipse 42% 38% at 78% 88%, #C4B5FD33 0%, transparent 52%),
          radial-gradient(ellipse 30% 28% at 40% 95%, #A5B4FC18 0%, transparent 50%),
          ${bg}
        `,
      }}
    >
      <div
        data-dx-shell=""
        className="mx-auto w-full max-w-[1280px] px-[clamp(1rem,3cqw,2.5rem)] py-[clamp(1.75rem,4cqw,4rem)]"
      >
        <div
          data-dx-hero=""
          className="flex flex-col gap-10 @[48rem]:grid @[48rem]:grid-cols-2 @[48rem]:items-center @[48rem]:gap-8 @[64rem]:gap-12"
        >
          {/* Copy — unchanged hierarchy from 8D */}
          <div data-dx-copy="" className="order-1 min-w-0 @[48rem]:order-none">
            {content.eyebrow ? (
              <p
                className="inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-[clamp(0.75rem,1.6cqw,0.875rem)] font-medium shadow-[0_8px_20px_-14px_rgba(99,102,241,0.45)]"
                style={{ background: `${accent}1A`, color: accent }}
              >
                <RocketIcon className="size-3.5 shrink-0" />
                <span className="truncate">{content.eyebrow}</span>
              </p>
            ) : null}

            <h1
              className="mt-5 w-full max-w-none font-bold tracking-tight text-[#0F172A]"
              style={{
                fontSize: "clamp(1.85rem, 2.4cqw + 1rem, 3.35rem)",
                lineHeight: 1.18,
                textWrap: "balance",
              }}
            >
              {hasHighlight ? (
                <>
                  {before}{" "}
                  <span style={{ color: accent }}>{highlight}</span>
                  {after ? <> {after}</> : null}
                </>
              ) : (
                title
              )}
            </h1>

            {content.description ? (
              <p
                className="mt-5 text-[#64748B]"
                style={{
                  fontSize: "clamp(0.9375rem, 1.4cqw + 0.55rem, 1.0625rem)",
                  lineHeight: 1.65,
                  maxWidth: "36rem",
                }}
              >
                {content.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 @[28rem]:flex-row @[28rem]:flex-wrap @[28rem]:items-center">
              <div className="flex w-full flex-col gap-3 @[28rem]:w-auto @[28rem]:flex-row @[28rem]:items-center">
                {cta ? (
                  <div className="[&_a]:inline-flex [&_a]:h-12 [&_a]:w-full [&_a]:items-center [&_a]:justify-center [&_a]:rounded-full [&_a]:px-6 [&_a]:text-sm [&_a]:font-semibold @[28rem]:[&_a]:w-auto [&_button]:inline-flex [&_button]:h-12 [&_button]:w-full [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button]:px-6 [&_button]:text-sm [&_button]:font-semibold @[28rem]:[&_button]:w-auto">
                    {cta}
                  </div>
                ) : (
                  <PrimaryCta
                    content={content}
                    ctaHref={ctaHref}
                    onStart={onStart}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-[0_16px_32px_-10px_rgba(99,102,241,0.55)] transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_36px_-10px_rgba(99,102,241,0.65)] motion-reduce:transition-none @[28rem]:w-auto"
                    style={{ background: accent }}
                  />
                )}
                {content.secondaryCtaLabel ? (
                  // No dead buttons. Interactive only with onStart or a real ctaHref (not "#").
                  onStart || (ctaHref && ctaHref !== "#") ? (
                    <a
                      href={ctaHref && ctaHref !== "#" ? ctaHref : "#"}
                      onClick={
                        onStart
                          ? (event) => {
                              event.preventDefault()
                              onStart()
                            }
                          : undefined
                      }
                      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] shadow-sm transition-colors duration-200 motion-safe:hover:bg-[#F8FAFC] motion-reduce:transition-none @[28rem]:w-auto @[28rem]:justify-start @[28rem]:border-0 @[28rem]:bg-transparent @[28rem]:px-0 @[28rem]:shadow-none @[28rem]:hover:bg-transparent"
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.4)]">
                        <PlayIcon color={accent} />
                      </span>
                      {content.secondaryCtaLabel}
                    </a>
                  ) : (
                    <span className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] shadow-sm @[28rem]:w-auto @[28rem]:justify-start @[28rem]:border-0 @[28rem]:bg-transparent @[28rem]:px-0 @[28rem]:shadow-none">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.4)]">
                        <PlayIcon color={accent} />
                      </span>
                      {content.secondaryCtaLabel}
                    </span>
                  )
                ) : null}
              </div>
            </div>

            <div className="mt-10 hidden border-t border-[#E8E5F2]/80 pt-6 @[48rem]:block">
              <TrustBlock label={content.trustLabel} />
            </div>
          </div>

          {/* Visual stage */}
          <div data-dx-visual="" className="order-2 min-w-0 @[48rem]:order-none">
            {/* Desktop / tablet composition */}
            <div
              data-dx-mockup=""
              className="pointer-events-none relative mx-auto hidden aspect-[4/3.45] w-full @[48rem]:block"
              style={{ perspective: "1400px" }}
            >
              {/* Soft ground shadow */}
              <div
                className="absolute inset-x-[12%] bottom-[1%] h-12 rounded-[100%] blur-2xl"
                style={{ background: `radial-gradient(ellipse at center, ${accent}33 0%, transparent 70%)` }}
                aria-hidden
              />

              {/* Dominant browser — discreet 3D (no motion animation; static transform) */}
              <div
                className="absolute top-[3%] right-[2%] bottom-[15%] left-[12%] @[64rem]:left-[9%]"
                style={{
                  transform: "rotateY(-5deg) rotateX(2.5deg) translateZ(0)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="relative size-full rounded-[1.55rem] border border-white/90 bg-white p-3"
                  style={{
                    boxShadow: `
                      0 48px 90px -32px rgba(79,70,229,0.48),
                      0 24px 48px -28px rgba(15,23,42,0.32),
                      0 2px 0 0 rgba(255,255,255,0.9) inset,
                      -1px 0 0 0 rgba(226,232,240,0.8) inset
                    `,
                  }}
                >
                  {/* Glass highlight */}
                  <div
                    className="pointer-events-none absolute inset-x-6 top-0 h-16 rounded-t-[1.4rem] opacity-60"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, transparent 100%)" }}
                    aria-hidden
                  />
                  <BrowserChrome brand={brand} accent={accent} />
                  <div className="relative mt-2 h-[calc(100%-2.35rem)] overflow-hidden rounded-[1.05rem] bg-[#F8FAFC] ring-1 ring-[#E2E8F0]/80">
                    <BrowserHero content={content} accent={accent} satisfaction={satisfaction} />
                  </div>
                </div>
              </div>

              {/* Progress — decorative; never intercepts CTA / keyboard focus */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-[14%] left-0 z-20 w-[min(40%,12.25rem)] rounded-2xl border border-[#EEF2FF] bg-white p-3.5"
                style={{
                  transform: "rotate(-1.5deg)",
                  boxShadow: "0 22px 44px -20px rgba(15,23,42,0.38), 0 6px 14px -10px rgba(99,102,241,0.18)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A]">Projet terminé</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#64748B]">{progress?.trend || "Dashboard Design"}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[#EEF2FF] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#6366F1] uppercase">
                    Exemple
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF2FF]">
                  <div
                    className="h-full w-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${accent}bb, ${accent})` }}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs font-semibold" style={{ color: accent }}>
                  {progress?.value || "100%"}
                </p>
              </div>

              {/* Satisfaction — decorative */}
              <div
                aria-hidden
                className="pointer-events-none absolute right-[0%] bottom-[20%] z-20 hidden w-[9.75rem] rounded-2xl border border-[#EEF2FF] bg-white p-3 @[56rem]:block"
                style={{
                  transform: "rotate(2deg)",
                  boxShadow: "0 24px 48px -20px rgba(15,23,42,0.36), 0 8px 16px -12px rgba(99,102,241,0.2)",
                }}
              >
                <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">Exemple</p>
                <p className="mt-1 text-xs font-semibold text-[#0F172A]">Satisfaction</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight" style={{ color: accent }}>
                  {satisfaction}
                </p>
                <div className="mt-2 flex gap-0.5" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < 4 ? accent : "#E2E8F0" }} />
                  ))}
                </div>
              </div>

              {/* Validation tile */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-[52%] left-[0.5%] z-10 flex size-11 items-center justify-center rounded-2xl bg-white"
                style={{
                  transform: "rotate(-4deg)",
                  boxShadow: "0 16px 32px -14px rgba(15,23,42,0.34), 0 3px 0 0 #E2E8F0",
                }}
              >
                <CheckIcon />
              </div>

              {/* Plant — tucked beside mockup edge */}
              <div className="pointer-events-none absolute top-[22%] right-[-2%] z-10 hidden opacity-95 @[56rem]:block" aria-hidden>
                <PlantSvg />
              </div>

              {/* 3D tool tiles — decorative only */}
              <div aria-hidden className="pointer-events-none absolute bottom-[0.5%] left-[20%] z-30 flex items-end gap-3">
                <Tile3D tone="accent" rotate={-6} lift>
                  <PenToolIcon />
                </Tile3D>
                <Tile3D tone="light" rotate={3} lift>
                  <span className="text-lg font-bold tracking-tight">Aa</span>
                </Tile3D>
                <Tile3D tone="light" rotate={-2} lift>
                  <PaletteDots />
                </Tile3D>
              </div>
            </div>

            {/* Mobile — flat, no perspective, no absolute overlaps */}
            <div className="@[48rem]:hidden">
              <div
                className="overflow-hidden rounded-[1.35rem] border border-white bg-white p-2.5"
                style={{
                  boxShadow: "0 28px 56px -26px rgba(79,70,229,0.4), 0 12px 28px -18px rgba(15,23,42,0.28)",
                }}
              >
                <BrowserChrome brand={brand} accent={accent} compact />
                <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-[#E2E8F0]/70">
                  <BrowserHero content={content} accent={accent} satisfaction={satisfaction} compact />
                </div>
              </div>
              <div className="relative z-10 mt-3 grid grid-cols-2 gap-2.5">
                <div
                  className="rounded-2xl border border-white bg-white p-3"
                  style={{ boxShadow: "0 16px 32px -18px rgba(15,23,42,0.35)" }}
                >
                  <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">Exemple</p>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A]">Satisfaction</p>
                  <p className="text-xl font-bold" style={{ color: accent }}>
                    {satisfaction}
                  </p>
                </div>
                <div
                  className="rounded-2xl border border-white bg-white p-3"
                  style={{ boxShadow: "0 16px 32px -18px rgba(15,23,42,0.35)" }}
                >
                  <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">Exemple</p>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A]">Avancement</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEF2FF]">
                    <div className="h-full w-full rounded-full" style={{ background: accent }} />
                  </div>
                  <p className="mt-1 text-sm font-bold" style={{ color: accent }}>
                    {progress?.value || "100%"}
                  </p>
                </div>
              </div>
              <div className="mt-3.5 flex justify-center gap-3">
                <Tile3D tone="accent" rotate={-4}>
                  <PenToolIcon />
                </Tile3D>
                <Tile3D tone="light" rotate={3}>
                  <span className="text-base font-bold">Aa</span>
                </Tile3D>
                <Tile3D tone="light" rotate={-2}>
                  <PaletteDots />
                </Tile3D>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E8E5F2]/80 pt-6 @[48rem]:hidden">
          <TrustBlock label={content.trustLabel} />
        </div>

        {content.benefits.length > 0 ? (
          <ul className="mt-10 grid gap-3 border-t border-[#E8E5F2]/90 pt-8 @[40rem]:grid-cols-3">
            {content.benefits.slice(0, 3).map((benefit) => (
              <li
                key={benefit.title}
                className="rounded-2xl bg-white/80 px-4 py-3.5 backdrop-blur-[2px]"
                style={{ boxShadow: "0 14px 28px -20px rgba(15,23,42,0.35)" }}
              >
                <p className="text-sm font-semibold text-[#0F172A]">{benefit.title}</p>
                {benefit.description ? <p className="mt-1 text-sm leading-6 text-[#64748B]">{benefit.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </LandingChrome>
  )
}

function TrustBlock({ label }: { label?: string }) {
  return (
    <>
      <p className="text-xs font-medium text-[#64748B]">{label || "Exemples de partenaires (personnalisables)"}</p>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-2.5" aria-hidden>
        {["Alpha", "Nova", "Orbit", "Pulse"].map((name) => (
          <span key={name} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#64748B]">
            <span className="inline-flex size-6 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-[#475569] shadow-[0_4px_10px_-4px_rgba(15,23,42,0.25)] ring-1 ring-[#E2E8F0]">
              {name.slice(0, 1)}
            </span>
            {name}
          </span>
        ))}
      </div>
    </>
  )
}

function BrowserChrome({ brand, accent, compact }: { brand: string; accent: string; compact?: boolean }) {
  return (
    <div className={`relative z-[1] flex items-center gap-2 rounded-t-xl bg-[#F1F5F9]/95 px-2.5 ${compact ? "py-1.5" : "py-2"}`}>
      <div className="flex gap-1">
        <span className="size-2 rounded-full bg-[#FCA5A5] shadow-[inset_0_-0.5px_0_rgba(0,0,0,0.12)]" />
        <span className="size-2 rounded-full bg-[#FDE68A] shadow-[inset_0_-0.5px_0_rgba(0,0,0,0.12)]" />
        <span className="size-2 rounded-full bg-[#86EFAC] shadow-[inset_0_-0.5px_0_rgba(0,0,0,0.12)]" />
      </div>
      <span className="truncate text-[10px] font-bold tracking-wide uppercase" style={{ color: accent }}>
        {brand}
      </span>
      {!compact ? (
        <nav className="ml-auto hidden items-center gap-2.5 text-[9px] font-medium text-[#64748B] @[40rem]:flex" aria-hidden>
          <span>Accueil</span>
          <span>Services</span>
          <span>Blog</span>
        </nav>
      ) : null}
    </div>
  )
}

function BrowserHero({
  content,
  accent,
  satisfaction,
  compact,
}: {
  content: LandingContent
  accent: string
  satisfaction: string
  compact?: boolean
}) {
  return (
    <div className={`grid h-full ${compact ? "grid-cols-1" : "grid-cols-[0.88fr_1.12fr]"}`}>
      <div className={`relative z-[1] flex flex-col justify-center bg-gradient-to-br from-white to-[#F8FAFC] ${compact ? "gap-2 p-3.5" : "gap-2.5 p-3.5 md:p-4"}`}>
        <span
          className="inline-flex w-fit rounded-full px-2 py-0.5 text-[8px] font-semibold tracking-wide uppercase"
          style={{ background: `${accent}14`, color: accent }}
        >
          Studio créatif
        </span>
        <p className={`font-bold tracking-tight text-[#0F172A] ${compact ? "text-[13px] leading-snug" : "text-[12px] leading-snug md:text-[14px]"}`}>
          Construire des marques à l&apos;ère <span style={{ color: accent }}>digitale</span>
        </p>
        <p className={`leading-relaxed text-[#64748B] ${compact ? "text-[9px]" : "text-[9px] md:text-[10px]"}`}>
          Identité visuelle, expérience produit et croissance — démonstration.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex w-fit rounded-full px-2.5 py-1 text-[9px] font-semibold text-white"
            style={{ background: accent, boxShadow: `0 8px 16px -8px ${accent}` }}
          >
            Explorer →
          </span>
          {!compact ? (
            <span className="hidden text-[9px] font-medium text-[#94A3B8] md:inline">Voir le portfolio</span>
          ) : null}
        </div>
        {!compact ? (
          <div className="mt-1 hidden gap-1.5 md:flex" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1 w-5 rounded-full" style={{ background: i === 0 ? accent : "#E2E8F0" }} />
            ))}
          </div>
        ) : null}
      </div>
      <div className={`relative ${compact ? "min-h-[9.5rem]" : "min-h-0"}`}>
        {content.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.heroImageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <ArchitectureDemo />
        )}
        <div
          className="absolute top-2 right-2 rounded-xl bg-white/95 px-2 py-1.5 backdrop-blur-sm"
          style={{ boxShadow: "0 10px 22px -12px rgba(15,23,42,0.45)" }}
        >
          <p className="text-[7px] font-semibold tracking-wide text-[#94A3B8] uppercase">Exemple</p>
          <p className="text-[10px] font-bold text-[#0F172A]">{satisfaction} satisfaction</p>
        </div>
      </div>
    </div>
  )
}

/** Demo architectural visual — illustrative only, replaced by heroImageUrl when set. */
function ArchitectureDemo() {
  const windows = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 5; col++) {
      const lit = (row + col) % 3 !== 0
      windows.push(
        <g key={`${row}-${col}`}>
          <rect
            x={98 + col * 22}
            y={76 + row * 18}
            width={18}
            height={12}
            rx="1.2"
            fill={lit ? "#E0F2FE" : "#F1F5F9"}
            stroke="#94A3B8"
            strokeOpacity="0.35"
            strokeWidth="0.5"
          />
          {/* glass reflection */}
          <path
            d={`M${99.5 + col * 22} ${77.5 + row * 18}h4v10h-4z`}
            fill="#FFFFFF"
            opacity={lit ? 0.45 : 0.2}
          />
        </g>,
      )
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 320 280" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="dx-sky" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="35%" stopColor="#7DD3FC" />
            <stop offset="70%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="dx-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="dx-facade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="dx-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="dx-plaza" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.05" />
          </linearGradient>
          <filter id="dx-soft" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.22" />
          </filter>
          <linearGradient id="dx-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="320" height="280" fill="url(#dx-sky)" />
        {/* Soft clouds */}
        <ellipse cx="52" cy="48" rx="34" ry="12" fill="#FFFFFF" opacity="0.35" />
        <ellipse cx="78" cy="44" rx="22" ry="10" fill="#FFFFFF" opacity="0.28" />
        <ellipse cx="260" cy="36" rx="40" ry="14" fill="#FFFFFF" opacity="0.32" />
        <ellipse cx="285" cy="42" rx="24" ry="10" fill="#FFFFFF" opacity="0.22" />

        {/* Far skyline */}
        <g opacity="0.28">
          <rect x="8" y="128" width="22" height="152" fill="#F0F9FF" />
          <rect x="34" y="108" width="18" height="172" fill="#E0F2FE" />
          <rect x="56" y="140" width="14" height="140" fill="#BAE6FD" />
          <rect x="268" y="118" width="20" height="162" fill="#E0F2FE" />
          <rect x="292" y="136" width="16" height="144" fill="#F0F9FF" />
        </g>

        {/* Plaza */}
        <ellipse cx="168" cy="254" rx="130" ry="18" fill="url(#dx-plaza)" />
        <path d="M28 248h264" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.5" />

        {/* Left pavilion */}
        <g filter="url(#dx-soft)">
          <rect x="42" y="162" width="52" height="86" rx="3" fill="#F8FAFC" />
          <rect x="42" y="162" width="52" height="8" rx="2" fill="#FFFFFF" />
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => (
              <rect
                key={`p-${r}-${c}`}
                x={48 + c * 20}
                y={176 + r * 18}
                width={16}
                height={12}
                rx="1"
                fill={c === r % 2 ? "#BAE6FD" : "#E0F2FE"}
                stroke="#94A3B8"
                strokeOpacity="0.25"
                strokeWidth="0.4"
              />
            )),
          )}
        </g>

        {/* Main tower */}
        <g filter="url(#dx-soft)">
          <path d="M84 248V68c0-5 4-9 9-9h126c5 0 9 4 9 9v180H84Z" fill="url(#dx-facade)" />
          {/* Right depth face */}
          <path d="M228 59h22l14 16v173h-36V59Z" fill="url(#dx-side)" />
          {/* Roof cap */}
          <path d="M93 59h135l14 0-8 12H93V59Z" fill="#FFFFFF" />
          <rect x="93" y="59" width="135" height="4" fill="url(#dx-shine)" />

          {/* Vertical mullions hint */}
          <path d="M140 72v168M182 72v168" stroke="#CBD5E1" strokeWidth="0.8" opacity="0.5" />

          {windows}

          {/* Balcony bands */}
          <rect x="96" y="138" width="124" height="3" rx="1" fill="#CBD5E1" opacity="0.55" />
          <rect x="96" y="192" width="124" height="3" rx="1" fill="#CBD5E1" opacity="0.55" />

          {/* Entrance canopy + doors */}
          <rect x="132" y="208" width="52" height="6" rx="1" fill="#64748B" opacity="0.35" />
          <rect x="138" y="214" width="40" height="34" rx="2" fill="#475569" />
          <rect x="142" y="218" width="32" height="30" rx="1.5" fill="url(#dx-glass)" />
          <rect x="157" y="218" width="2" height="30" fill="#64748B" opacity="0.5" />
          {/* Facade shine sweep */}
          <path d="M100 70l28 178h10L110 70Z" fill="url(#dx-shine)" opacity="0.35" />
        </g>

        {/* Right low annex */}
        <g filter="url(#dx-soft)" opacity="0.95">
          <rect x="246" y="188" width="36" height="60" rx="2" fill="#F1F5F9" />
          <rect x="250" y="194" width="12" height="10" rx="1" fill="#BAE6FD" />
          <rect x="266" y="194" width="12" height="10" rx="1" fill="#E0F2FE" />
          <rect x="250" y="210" width="12" height="10" rx="1" fill="#E0F2FE" />
          <rect x="266" y="210" width="12" height="10" rx="1" fill="#BAE6FD" />
        </g>

        {/* Landscaping */}
        <ellipse cx="58" cy="246" rx="16" ry="6" fill="#15803D" opacity="0.35" />
        <ellipse cx="66" cy="236" rx="11" ry="14" fill="#22C55E" opacity="0.75" />
        <ellipse cx="50" cy="238" rx="9" ry="12" fill="#4ADE80" opacity="0.7" />
        <ellipse cx="250" cy="246" rx="18" ry="6" fill="#15803D" opacity="0.3" />
        <ellipse cx="258" cy="234" rx="12" ry="14" fill="#22C55E" opacity="0.7" />
        <ellipse cx="244" cy="236" rx="8" ry="11" fill="#86EFAC" opacity="0.65" />
      </svg>
    </div>
  )
}

function Tile3D({
  children,
  tone,
  rotate = 0,
  lift = false,
}: {
  children: React.ReactNode
  tone: "accent" | "light"
  rotate?: number
  lift?: boolean
}) {
  const base =
    tone === "accent"
      ? { background: "linear-gradient(145deg, #818CF8 0%, #6366F1 55%, #4F46E5 100%)", color: "#fff" }
      : { background: "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)", color: "#0F172A" }

  return (
    <div
      className={`relative flex size-12 items-center justify-center rounded-[1.15rem] @[56rem]:size-[3.35rem] ${lift ? "@[56rem]:-translate-y-1" : ""}`}
      style={{
        ...base,
        transform: `rotate(${rotate}deg)`,
        boxShadow:
          tone === "accent"
            ? "0 18px 34px -12px rgba(79,70,229,0.65), 0 6px 0 0 #4338CA, 0 1px 0 0 rgba(255,255,255,0.35) inset"
            : "0 18px 34px -14px rgba(15,23,42,0.32), 0 5px 0 0 #E2E8F0, 0 1px 0 0 rgba(255,255,255,0.9) inset",
      }}
    >
      {children}
    </div>
  )
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3c2.5 2 4 5.2 4 8.5 0 1.2-.2 2.3-.6 3.3L12 21l-3.4-6.2A9.4 9.4 0 0 1 8 11.5C8 8.2 9.5 5 12 3Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="1.4" fill="currentColor" />
    </svg>
  )
}

function PlayIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path d="M9 7.5v9l8-4.5-8-4.5Z" fill={color} />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-[#22C55E]" fill="none" aria-hidden>
      <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PenToolIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path d="M12 3v6M12 9l6 9H6l6-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" />
    </svg>
  )
}

function PaletteDots() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {["#EF4444", "#F59E0B", "#22C55E", "#3B82F6", "#A855F7", "#EC4899"].map((color) => (
        <span key={color} className="size-2 rounded-full shadow-[0_1px_1px_rgba(0,0,0,0.12)]" style={{ background: color }} />
      ))}
    </div>
  )
}

function PlantSvg() {
  return (
    <svg width="64" height="100" viewBox="0 0 64 100" fill="none" aria-hidden>
      <ellipse cx="32" cy="94" rx="18" ry="4.5" fill="#CBD5E1" opacity="0.55" />
      <path d="M20 78h24l-2.5 16H22.5L20 78Z" fill="#F8FAFC" stroke="#CBD5E1" />
      <path d="M24 78c1-4 3-6 8-6s7 2 8 6" fill="#E2E8F0" />
      <path d="M32 78C32 52 38 28 44 16" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 52c-14-4-22 10-18 22 12-2 18-12 18-22Z" fill="#22C55E" />
      <path d="M34 44c14-6 22 8 16 20-8 0-16-8-16-20Z" fill="#4ADE80" />
      <path d="M30 36c-8-10-2-22 8-24-2 10 0 18-8 24Z" fill="#86EFAC" opacity="0.9" />
      <path d="M36 30c8-8 18-4 20 6-10 2-16-2-20-6Z" fill="#16A34A" opacity="0.75" />
    </svg>
  )
}
