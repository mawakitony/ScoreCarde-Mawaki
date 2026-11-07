import type { LandingContent } from "@/components/assessment/landing-view"
import { LandingChrome, PrimaryCta, StatMiniCard } from "./shared"

export function AnalyticsCloudLanding({
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
  const accent = content.accentColor || content.primaryColor || "#2563EB"
  const bg = content.backgroundColor || "#F7F9FC"
  const stats = (content.demoStats?.length ? content.demoStats : null) ?? [
        { label: "Exemple · Commentaires", value: "9 873", trend: "↑ 2,1 %", tone: "blue" as const },
        { label: "Exemple · Likes", value: "15,9k", trend: "↑ 2,1 %", tone: "red" as const },
        { label: "Exemple · Abonnés", value: "1 863", trend: "↑ 2,1 %", tone: "purple" as const },
        { label: "Exemple · Gains", value: "2 938", tone: "green" as const },
        { label: "Exemple · Portée", value: "389,65k", tone: "orange" as const },
        { label: "Exemple · Reach", value: "256,18k", trend: "↑ 2,1 %", tone: "orange" as const },
      ]

  return (
    <LandingChrome
      content={content}
      className="min-h-full overflow-hidden"
      style={{ background: `radial-gradient(circle at 12% 88%, #FDBA7422, transparent 35%), radial-gradient(circle at 90% 10%, #C4B5FD22, transparent 30%), ${bg}` }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16">
        <div>
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-[#142033] md:text-5xl">{content.title}</h1>
          {content.description ? <p className="mt-5 max-w-md text-sm leading-7 text-[#5E6D7E]">{content.description}</p> : null}
          <div className="mt-8">
            <PrimaryCta
              content={content}
              ctaHref={ctaHref}
              onStart={onStart}
              cta={cta}
              className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-white"
              style={{ background: accent }}
            />
          </div>
          <p className="mt-4 text-xs text-[#94A3B8]">Les chiffres ci-contre sont des exemples décoratifs, pas des métriques ScoreApp.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 rounded-2xl border border-[#E7E9EE] bg-white p-4 shadow-[0_18px_40px_-24px_rgba(20,32,51,0.45)] sm:col-span-2">
            <p className="text-xs font-semibold text-[#5E6D7E]">Exemple · Followers Stats</p>
            <div className="mt-4 flex h-24 items-end gap-1.5">
              {[40, 65, 35, 80, 55, 90, 48, 72, 60, 85].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%`, background: accent }} />
              ))}
            </div>
          </div>
          {stats.map((stat) => (
            <StatMiniCard key={`${stat.label}-${stat.value}`} stat={stat} />
          ))}
        </div>
      </div>
    </LandingChrome>
  )
}
