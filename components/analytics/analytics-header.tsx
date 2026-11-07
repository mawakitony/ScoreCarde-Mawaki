"use client"

import { useEffect, useId, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Info, RefreshCw, RotateCcw } from "lucide-react"
import { PeriodFilter } from "@/components/dashboard/period-filter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AnalyticsHeader({
  range,
  from,
  to,
  scorecardId,
  scorecards,
}: {
  range: string
  from: string
  to: string
  scorecardId: string | null
  scorecards: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const infoId = useId()
  const infoRef = useRef<HTMLDivElement>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const filtersDirty = Boolean(scorecardId) || range !== "30d"

  function setScorecard(id: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (!id) next.delete("scorecard")
    else next.set("scorecard", id)
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function resetFilters() {
    router.push(`${pathname}?range=30d`)
  }

  function refresh() {
    setRefreshing(true)
    router.refresh()
  }

  useEffect(() => {
    if (!refreshing) return
    const timer = window.setTimeout(() => setRefreshing(false), 900)
    return () => window.clearTimeout(timer)
  }, [refreshing, searchParams])

  useEffect(() => {
    if (!infoOpen) return
    function onPointerDown(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setInfoOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setInfoOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [infoOpen])

  return (
    <header className="ws-panel ws-enter px-4 py-3 md:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0">
            <h1 className="text-[1.5rem] font-semibold tracking-tight text-[color:var(--brand-950)] md:text-[1.75rem] dark:text-foreground">
              Analytics & Rapports
            </h1>
            <p className="mt-0.5 max-w-xl text-[12px] leading-snug text-muted-foreground md:text-[13px]">
              Performances, résultats et opportunités sur la période.
            </p>
          </div>
          <div className="relative shrink-0 pt-0.5" ref={infoRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/40"
              aria-expanded={infoOpen}
              aria-controls={infoId}
              aria-label="Informations sur les filtres Analytics"
              onClick={() => setInfoOpen((open) => !open)}
            >
              <Info className="size-4" />
            </Button>
            {infoOpen ? (
              <div
                id={infoId}
                role="note"
                className="absolute top-9 right-0 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-[12px] leading-relaxed text-popover-foreground shadow-[var(--shadow-panel)]"
              >
                <p>
                  Période et scorecard filtrent les KPI, le parcours, les résultats et le classement.
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  Les conversions CRM et les métriques de rapports restent au niveau organisation. L’export PDF n’est
                  pas disponible sur cette page.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-[9.5rem] flex-1 items-center gap-2 text-[12px] font-medium text-muted-foreground sm:flex-none">
            <span className="sr-only sm:not-sr-only">Scorecard</span>
            <select
              className={cn(
                "h-8 w-full min-w-[10rem] rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-foreground sm:w-[12rem]",
                "transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
              )}
              value={scorecardId ?? ""}
              onChange={(event) => setScorecard(event.target.value)}
              aria-label="Filtrer par scorecard"
            >
              <option value="">Toutes</option>
              {scorecards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </label>

          {filtersDirty ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-2.5 text-[12px] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35"
              onClick={resetFilters}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-2.5 text-[12px] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35"
            onClick={refresh}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <PeriodFilter range={range} from={from} to={to} compact />
      </div>
    </header>
  )
}
