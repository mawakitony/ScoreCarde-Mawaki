"use client"

import Link from "next/link"
import { ChevronRight, Files } from "lucide-react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { scorecardBarPercent, scorecardNameIsDuplicate } from "@/lib/dashboard/scorecard-bars"
import { competitionRanks, scorecardDetailHref } from "@/lib/dashboard/scorecard-links"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Overview } from "@/lib/validators/scorecard"

/** Premium ranking list for top_scorecards — links to /dashboard/scorecards/[id]. */
export function TopScorecardsCard({ data }: { data: Overview }) {
  const reduced = usePrefersReducedMotion()
  const rows = data.top_scorecards
  const names = rows.map((row) => row.name)
  const max = Math.max(...rows.map((row) => row.leads), 0)
  const ranks = competitionRanks(rows.map((row) => row.leads))

  return (
    <section className="ws-panel ws-enter p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]">Top scorecards</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Classement par volume de leads sur la période</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
          <Files className="size-5" aria-hidden />
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-center text-[13px] text-muted-foreground">Aucune scorecard sur la période.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {rows.map((scorecard, index) => {
            const href = scorecardDetailHref(scorecard.id)
            const width = scorecardBarPercent(scorecard.leads, max)
            const duplicate = scorecardNameIsDuplicate(scorecard.name, names)
            const rank = ranks[index] ?? index + 1
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums",
                    rank === 1
                      ? "bg-[color:var(--brand-300)]/20 text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-foreground">{scorecard.name}</span>
                    {duplicate ? (
                      <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
                        {scorecard.id.slice(0, 8)}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-muted">
                    {width > 0 ? (
                      <span
                        className={cn(
                          "block h-full rounded-full bg-[color:var(--brand-500)]",
                          !reduced && "transition-[width] duration-500 ease-out",
                        )}
                        style={{ width: `${width}%` }}
                      />
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[14px] font-semibold tabular-nums text-foreground">
                    {formatNumber(scorecard.leads)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">leads</span>
                </span>
                {href ? (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden
                  />
                ) : null}
              </>
            )

            if (!href) {
              return (
                <li
                  key={scorecard.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5"
                >
                  {content}
                </li>
              )
            }

            return (
              <li key={scorecard.id}>
                <Link
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200",
                    "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                  )}
                  aria-label={`Ouvrir la scorecard ${scorecard.name}`}
                >
                  {content}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
