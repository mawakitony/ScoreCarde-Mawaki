"use client"

import { useState } from "react"
import { ChartPie } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { chartPieColors } from "@/components/dashboard/chart-theme"
import { PremiumChartTooltip } from "@/components/dashboard/chart-tooltip"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { withDisplayResultLabels } from "@/lib/dashboard/result-labels"
import { share } from "@/lib/leads/metrics"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Overview } from "@/lib/validators/scorecard"

/** Premium donut for result_distribution — presentation only. */
export function ResultDistributionCard({ data }: { data: Overview }) {
  const reduced = usePrefersReducedMotion()
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const rows = withDisplayResultLabels(data.result_distribution)
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <section className="ws-panel ws-enter p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]">
            Répartition des résultats
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Catégories issues des évaluations terminées</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
          <ChartPie className="size-5" aria-hidden />
        </span>
      </div>

      {rows.length === 0 || total === 0 ? (
        <p className="mt-8 text-center text-[13px] text-muted-foreground">Pas encore de répartition sur la période.</p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-4">
          <div className="relative h-52 w-full max-w-[220px] shrink-0 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={activeIndex === undefined ? 82 : 86}
                  paddingAngle={rows.length > 1 ? 3 : 0}
                  isAnimationActive={!reduced}
                  animationDuration={500}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {rows.map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={chartPieColors[index % chartPieColors.length]}
                      stroke="var(--card)"
                      strokeWidth={2}
                      className="outline-none transition-opacity duration-200 motion-reduce:transition-none"
                      style={{
                        opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.4,
                        transform: activeIndex === index ? "scale(1.03)" : undefined,
                        transformOrigin: "center",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PremiumChartTooltip />} animationDuration={reduced ? 0 : 140} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Résultats</p>
              <p className="text-[28px] font-semibold tabular-nums text-foreground">{formatNumber(total)}</p>
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 space-y-2">
            {rows.map((row, index) => {
              const percent = share(row.count, total)
              const active = activeIndex === index
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-200",
                      "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                      active ? "bg-muted/80" : "hover:bg-muted/50",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(undefined)}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: chartPieColors[index % chartPieColors.length] }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{row.label}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">{formatNumber(row.count)}</span>
                    <span className="w-12 shrink-0 text-right text-[13px] font-semibold tabular-nums text-foreground">
                      {percent} %
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
