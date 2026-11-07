import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AnalyticsReport } from "@/components/analytics/report"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { resolveRange } from "@/lib/analytics/range"
import { getCommercialAnalytics, getQuestionStats } from "@/lib/data/crm"
import { ensureMembership } from "@/lib/data/membership"
import { getScorecard } from "@/lib/data/scorecards"
import { dropOff, share } from "@/lib/leads/metrics"
import { formatNumber, formatPercent } from "@/lib/format"

export const metadata = { title: "Analytics scorecard" }

const choiceTypes = new Set(["single_choice", "multiple_choice", "yes_no", "dropdown", "scale_5", "scale_10"])
const panel = "rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)]"

export default async function ScorecardAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const { id } = await params
  const membership = await ensureMembership()
  if (!membership) return null
  const scorecard = await getScorecard(membership.organization.id, id)
  if (!scorecard) notFound()
  const range = resolveRange(await searchParams)
  const [commercial, questions] = await Promise.all([
    getCommercialAnalytics(range, id),
    getQuestionStats(id, range),
  ])
  const stats = "data" in questions ? questions.data : null
  const flow = stats ? dropOff(stats.started, stats.questions.map((question) => ({ title: question.title, answered: question.answered }))) : null

  return (
    <div className="space-y-4">
      <header className={`${panel} p-5 md:p-6`}>
        <Link href="/dashboard/scorecards" className="text-xs font-semibold tracking-[0.14em] text-brass uppercase">
          Scorecards
        </Link>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{scorecard.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Analytics de la scorecard · période sélectionnée</p>
          </div>
          <Suspense fallback={null}>
            <PeriodFilter range={range.key} from={range.fromInput} to={range.toInput} />
          </Suspense>
        </div>
      </header>

      {"error" in commercial ? (
        <p className={`${panel} px-5 py-4 text-sm`}>{commercial.error}</p>
      ) : (
        <AnalyticsReport data={commercial.data} />
      )}

      {stats && flow ? (
        <section className="space-y-4">
          <div className={`${panel} p-5 md:p-6`}>
            <h2 className="text-base font-semibold text-foreground">Questions</h2>
            {flow.highest && flow.highest.drop > 0 ? (
              <p className="mt-3 rounded-xl bg-background px-4 py-3 text-sm text-foreground">
                Plus fort abandon : {flow.highest.from} → {flow.highest.to} ({formatPercent(flow.highest.drop)})
              </p>
            ) : null}
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              {flow.steps.map((step) => (
                <li key={step.title} className="flex justify-between gap-3">
                  <span className="truncate text-foreground">{step.title}</span>
                  <span className="shrink-0">{formatPercent(step.percent)}</span>
                </li>
              ))}
            </ol>
          </div>
          {stats.questions.map((question) => (
            <article key={question.id} className={`${panel} p-5`}>
              <h3 className="text-sm font-semibold text-foreground">{question.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{formatNumber(question.answered)} réponses</p>
              {choiceTypes.has(question.type) ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {question.options.map((option) => (
                    <li key={option.label} className="flex justify-between gap-3">
                      <span className="truncate">{option.label}</span>
                      <span className="shrink-0 text-muted-foreground">{formatPercent(share(option.count, question.answered))}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">{"error" in questions ? questions.error : ""}</p>
      )}
    </div>
  )
}
