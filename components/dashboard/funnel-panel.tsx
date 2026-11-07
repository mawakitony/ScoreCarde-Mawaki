"use client"

import { Funnel } from "lucide-react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { scorecardBarPercent } from "@/lib/dashboard/scorecard-bars"
import { formatNumber, formatPercent } from "@/lib/format"
import { funnelRates } from "@/lib/leads/metrics"
import { WS_ENTER, WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

type FunnelCounts = {
  started: number
  captured: number
  completed: number
  viewed: number
  cta_clicks: number
}

const STEP_LABELS = ["Démarrées", "Capturées", "Terminées", "Résultats vus", "Clics CTA"] as const

/** Premium funnel for commercial period counters — presentation only. */
export function FunnelPanel({ counts }: { counts: FunnelCounts }) {
  const reduced = usePrefersReducedMotion()
  const values = [counts.started, counts.captured, counts.completed, counts.viewed, counts.cta_clicks]
  const rates = funnelRates(values)
  const max = Math.max(...values, 0)
  const totalStarted = counts.started
  const overall =
    totalStarted > 0 ? funnelRates([totalStarted, counts.cta_clicks])[1]?.rate ?? null : null
  const empty = max <= 0

  return (
    <section className={cn(WS_PANEL, WS_ENTER, "p-4 md:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]">
            Indicateurs de parcours
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Compteurs réels — pas un funnel strict (vues et CTA peuvent se répéter)
          </p>
        </div>
        <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
          <Funnel className="size-5" aria-hidden />
        </span>
      </div>

      {empty ? (
        <p className="mt-8 text-center text-[13px] text-muted-foreground">Aucune activité sur la période.</p>
      ) : (
        <>
          <ol className="mt-5 space-y-2">
            {rates.map((step, index) => {
              const width = scorecardBarPercent(step.count, max)
              const label = STEP_LABELS[index]!
              return (
                <li key={label}>
                  <div
                    className={cn(
                      "rounded-xl px-2 py-2.5 transition-colors duration-200",
                      "hover:bg-muted/55 focus-within:bg-muted/55",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-semibold tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] font-medium text-foreground">{label}</span>
                          <span className="shrink-0 text-[14px] font-semibold tabular-nums text-foreground">
                            {formatNumber(step.count)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                          {width > 0 ? (
                            <div
                              className={cn(
                                "h-full rounded-full bg-[color:var(--brand-500)]",
                                !reduced && "transition-[width] duration-500 ease-out",
                              )}
                              style={{ width: `${width}%` }}
                            />
                          ) : null}
                        </div>
                        {step.rate !== null ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatPercent(step.rate)} de l’étape précédente
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-muted-foreground">Étape de référence</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          {overall !== null ? (
            <p className="mt-4 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Démarrées → CTA :{" "}
              <span className="font-semibold tabular-nums text-foreground">{formatPercent(overall)}</span>
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
