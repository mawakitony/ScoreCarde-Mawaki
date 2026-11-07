import type { LandingContent } from "@/components/assessment/landing-view"
import { LandingChrome, PrimaryCta } from "./shared"

const DEMO_COURIER = "/themes/express-delivery/courier-demo.jpg"

/**
 * Lot 10 — Express Delivery (premium redesign)
 * Light agency-style hero: copy left, courier + yellow stripes right, floating service cards.
 * Isolated from dashboard dark mode via hardcoded brand colors + ScoreAppSurface.
 */
export function ExpressDeliveryLanding({
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
  const accent = content.accentColor || content.secondaryColor || "#FFCC00"
  const bg = content.backgroundColor || "#FFFEFA"
  const heroSrc = content.heroImageUrl?.trim() || DEMO_COURIER
  const isDemoHero = !content.heroImageUrl?.trim()
  const benefits = content.benefits.slice(0, 3)
  const secondaryInteractive = Boolean(onStart || (ctaHref && ctaHref !== "#"))

  return (
    <LandingChrome
      content={content}
      className="@container w-full min-h-full min-w-0 overflow-x-clip text-[#111111]"
      style={{ background: bg }}
    >
      <div
        data-ed-shell=""
        className="mx-auto w-full max-w-[1280px] px-[clamp(1rem,3.2cqw,2.75rem)] py-[clamp(1.5rem,3.5cqw,3.75rem)]"
      >
        <div
          data-ed-hero=""
          className="flex flex-col gap-10 @[48rem]:grid @[48rem]:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] @[48rem]:items-center @[48rem]:gap-8 @[64rem]:gap-12"
        >
          {/* ——— Copy ——— */}
          <div data-ed-copy="" className="order-1 min-w-0 @[48rem]:order-none">
            {content.eyebrow ? (
              <p
                className="text-[clamp(0.7rem,1.35cqw,0.8125rem)] font-semibold tracking-[0.22em] text-[#64748B] uppercase"
                style={{ textWrap: "balance" }}
              >
                {content.eyebrow}
              </p>
            ) : null}

            <h1
              className="mt-4 font-black tracking-[-0.04em] text-[#0A0A0A] uppercase"
              style={{
                fontSize: "clamp(2rem, 3.6cqw + 0.85rem, 4.15rem)",
                lineHeight: 0.98,
                textWrap: "balance",
              }}
            >
              {content.title}
            </h1>

            {content.description ? (
              <p
                className="mt-5 max-w-[28rem] text-[#5B6573]"
                style={{
                  fontSize: "clamp(0.9375rem, 1.2cqw + 0.55rem, 1.0625rem)",
                  lineHeight: 1.65,
                }}
              >
                {content.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 @[28rem]:flex-row @[28rem]:flex-wrap @[28rem]:items-center">
              {cta ? (
                <div className="[&_a]:inline-flex [&_a]:h-12 [&_a]:w-full [&_a]:items-center [&_a]:justify-center [&_a]:rounded-full [&_a]:px-7 [&_a]:text-sm [&_a]:font-bold @[28rem]:[&_a]:w-auto [&_button]:inline-flex [&_button]:h-12 [&_button]:w-full [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button]:px-7 [&_button]:text-sm [&_button]:font-bold @[28rem]:[&_button]:w-auto">
                  {cta}
                </div>
              ) : (
                <PrimaryCta
                  content={content}
                  ctaHref={ctaHref}
                  onStart={onStart}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full px-7 text-sm font-bold text-[#111111] shadow-[0_14px_28px_-12px_rgba(255,204,0,0.85)] transition-[transform,box-shadow,filter] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-[0.97] motion-safe:hover:shadow-[0_18px_34px_-12px_rgba(255,204,0,0.95)] motion-reduce:transition-none @[28rem]:w-auto"
                  style={{ background: accent }}
                />
              )}

              {content.secondaryCtaLabel ? (
                secondaryInteractive ? (
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
                    className="inline-flex h-12 w-full items-center justify-center gap-2 px-1 text-sm font-semibold text-[#111111] transition-colors duration-200 hover:text-[#334155] @[28rem]:w-auto @[28rem]:justify-start"
                  >
                    {content.secondaryCtaLabel}
                    <ArrowIcon />
                  </a>
                ) : (
                  <span className="inline-flex h-12 w-full items-center justify-center gap-2 px-1 text-sm font-semibold text-[#111111] @[28rem]:w-auto @[28rem]:justify-start">
                    {content.secondaryCtaLabel}
                    <ArrowIcon />
                  </span>
                )
              ) : null}
            </div>

            {/* Benefits under copy on desktop; after visual on mobile via order */}
            {benefits.length > 0 ? (
              <ul
                data-ed-benefits=""
                className="mt-10 hidden gap-5 border-t border-[#E8ECF1] pt-7 @[48rem]:grid @[48rem]:grid-cols-3"
              >
                {benefits.map((benefit, index) => (
                  <BenefitItem key={benefit.title || index} benefit={benefit} index={index} accent={accent} />
                ))}
              </ul>
            ) : null}
          </div>

          {/* ——— Visual stage ——— */}
          <div data-ed-visual="" className="order-2 min-w-0 @[48rem]:order-none">
            <div
              data-ed-stage=""
              className="relative mx-auto aspect-[4/4.35] w-full max-w-[34rem] @[48rem]:max-w-none @[64rem]:aspect-[4/4.1]"
            >
              {/* Yellow rounded stripes — behind courier */}
              <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
                <YellowStripes accent={accent} />
              </div>

              {/* Soft ground glow */}
              <div
                className="pointer-events-none absolute inset-x-[18%] bottom-[4%] z-[1] h-10 rounded-[100%] blur-2xl"
                style={{ background: `radial-gradient(ellipse at center, ${accent}55 0%, transparent 70%)` }}
                aria-hidden
              />

              {/* Courier */}
              <div className="absolute inset-x-[8%] bottom-[2%] top-[6%] z-10 flex items-end justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroSrc}
                  alt={isDemoHero ? "Livreur express (démonstration)" : ""}
                  className={
                    isDemoHero
                      ? "max-h-full w-auto max-w-[min(100%,22rem)] object-contain object-bottom mix-blend-multiply drop-shadow-[0_28px_48px_rgba(15,23,42,0.2)] @[48rem]:max-w-[min(100%,26rem)] @[64rem]:max-w-[min(100%,28rem)]"
                      : "max-h-full w-auto max-w-[min(100%,22rem)] object-contain object-bottom drop-shadow-[0_28px_48px_rgba(15,23,42,0.28)] @[48rem]:max-w-[min(100%,26rem)] @[64rem]:max-w-[min(100%,28rem)]"
                  }
                  data-ed-courier=""
                />
              </div>

              {/* Floating service cards */}
              <FloatingCard
                className="absolute top-[10%] left-0 z-20 w-[min(44%,9.75rem)] -rotate-3 @[48rem]:left-[-2%] @[48rem]:w-[10.25rem]"
                title="Livraison rapide"
                caption="Départs express"
                icon={<BoltIcon color={accent} />}
              />
              <FloatingCard
                className="absolute top-[28%] right-0 z-20 w-[min(46%,10.25rem)] rotate-2 @[48rem]:right-[-2%] @[48rem]:w-[10.75rem]"
                title="Suivi de colis"
                caption="Statut en direct"
                icon={<TrackIcon color={accent} />}
              />
              <FloatingCard
                className="absolute bottom-[18%] left-[2%] z-20 w-[min(48%,10.5rem)] rotate-[-2deg] @[48rem]:bottom-[16%] @[48rem]:left-[-1%] @[48rem]:w-[11rem]"
                title="Livraison sécurisée"
                caption="Chaîne protégée"
                icon={<ShieldIcon color={accent} />}
              />
            </div>
          </div>

          {/* Benefits mobile / stacked */}
          {benefits.length > 0 ? (
            <ul
              data-ed-benefits-mobile=""
              className="order-3 grid gap-4 border-t border-[#E8ECF1] pt-6 sm:grid-cols-3 @[48rem]:hidden"
            >
              {benefits.map((benefit, index) => (
                <BenefitItem key={`m-${benefit.title || index}`} benefit={benefit} index={index} accent={accent} />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </LandingChrome>
  )
}

function BenefitItem({
  benefit,
  index,
  accent,
}: {
  benefit: LandingContent["benefits"][number]
  index: number
  accent: string
}) {
  return (
    <li className="min-w-0">
      <span
        className="mb-2.5 inline-flex size-9 items-center justify-center rounded-xl"
        style={{ background: `${accent}33` }}
      >
        <BenefitIcon name={benefit.icon} index={index} />
      </span>
      <p className="text-sm font-bold tracking-tight text-[#111111]">{benefit.title}</p>
      {benefit.description ? (
        <p className="mt-1 text-xs leading-5 text-[#64748B]">{benefit.description}</p>
      ) : null}
    </li>
  )
}

function FloatingCard({
  className,
  title,
  caption,
  icon,
}: {
  className?: string
  title: string
  caption: string
  icon: React.ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] backdrop-blur-[2px] ${className ?? ""}`}
      data-ed-float=""
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF7D6]">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold tracking-tight text-[#111111]">{title}</span>
          <span className="mt-0.5 block text-[10px] text-[#64748B]">{caption}</span>
        </span>
      </div>
    </div>
  )
}

function YellowStripes({ accent }: { accent: string }) {
  const stripes = [
    { top: "12%", width: "78%", height: "1.15rem", right: "0%", opacity: 0.95 },
    { top: "24%", width: "92%", height: "1.65rem", right: "-4%", opacity: 1 },
    { top: "38%", width: "70%", height: "1.05rem", right: "6%", opacity: 0.9 },
    { top: "50%", width: "88%", height: "1.9rem", right: "-2%", opacity: 1 },
    { top: "64%", width: "62%", height: "0.95rem", right: "10%", opacity: 0.88 },
    { top: "74%", width: "84%", height: "1.4rem", right: "0%", opacity: 0.95 },
  ]
  return (
    <>
      {stripes.map((stripe, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            top: stripe.top,
            right: stripe.right,
            width: stripe.width,
            height: stripe.height,
            background: accent,
            opacity: stripe.opacity,
            boxShadow: `0 10px 24px -16px ${accent}`,
          }}
        />
      ))}
      {/* Soft yellow wash behind figure */}
      <div
        className="absolute top-[8%] right-[-6%] h-[78%] w-[72%] rounded-[46%]"
        style={{
          background: `linear-gradient(145deg, ${accent}55 0%, ${accent}22 48%, transparent 78%)`,
        }}
      />
    </>
  )
}

function BenefitIcon({ name, index }: { name?: string; index: number }) {
  const key = (name || "").toLowerCase()
  if (key.includes("clock") || key.includes("time") || index === 1) return <BoltIcon color="#111111" />
  if (key.includes("shield") || key.includes("lock") || index === 2) return <ShieldIcon color="#111111" />
  return <UserIcon color="#111111" />
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" fill={color} />
    </svg>
  )
}

function TrackIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
      <rect x="4" y="3.5" width="16" height="17" rx="3" stroke={color} strokeWidth="1.7" />
      <path d="M8 8.5h8M8 12.5h8M8 16.5h5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17" cy="16.5" r="1.4" fill={color} />
    </svg>
  )
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
      <path
        d="M12 3 5 6v5.2c0 4.2 2.7 7.9 7 9.3 4.3-1.4 7-5.1 7-9.3V6l-7-3Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m9.2 12.1 1.9 1.9 3.7-3.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke={color} strokeWidth="1.7" />
      <path d="M5.5 18.5c1.4-2.6 3.7-4 6.5-4s5.1 1.4 6.5 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
