"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const options = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "custom", label: "Période" },
] as const

export function PeriodFilter({
  range,
  from,
  to,
  compact = false,
}: {
  range: string
  from: string
  to: string
  /** Dense layout for dashboard header — hides the long help line. */
  compact?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const showReset = range !== "30d"

  function push(next: URLSearchParams) {
    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function select(id: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.set("range", id)
    if (id !== "custom") {
      next.delete("from")
      next.delete("to")
    }
    next.delete("welcome")
    push(next)
  }

  function reset() {
    const next = new URLSearchParams()
    next.set("range", "30d")
    push(next)
  }

  function applyCustom(formData: FormData) {
    const next = new URLSearchParams()
    next.set("range", "custom")
    next.set("from", String(formData.get("from") ?? from))
    next.set("to", String(formData.get("to") ?? to))
    push(next)
  }

  return (
    <div
      className={cn("flex flex-col", compact ? "gap-2" : "gap-3.5")}
      role="group"
      aria-label="Filtre de période"
    >
      <div
        className={cn(
          "inline-flex max-w-full flex-wrap items-center rounded-xl border border-border bg-muted/50",
          compact ? "gap-1 p-1" : "gap-1.5 rounded-2xl p-1.5 sm:gap-2",
        )}
      >
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={range === option.id ? "default" : "ghost"}
            className={cn(
              "rounded-lg px-2.5 text-[12px] font-semibold transition-[transform,background-color,box-shadow,color] duration-200 sm:px-3 sm:text-[13px]",
              compact ? "h-8" : "h-9 rounded-xl sm:px-3.5 sm:text-[14px]",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35",
              range === option.id
                ? "bg-card text-foreground shadow-sm ring-1 ring-[color:var(--brand-500)]/35"
                : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
            )}
            aria-pressed={range === option.id}
            onClick={() => select(option.id)}
          >
            {option.label}
          </Button>
        ))}
        {showReset ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "rounded-lg px-2.5 text-[12px] font-medium text-muted-foreground sm:text-[13px]",
              compact ? "h-8" : "h-9 rounded-xl px-3 sm:text-[14px]",
            )}
            onClick={reset}
            aria-label="Réinitialiser la période à 30 jours"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        ) : null}
      </div>
      {range === "custom" ? (
        <form action={applyCustom} className={cn("flex flex-wrap items-center", compact ? "gap-2" : "gap-2.5")}>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className={cn(
              "rounded-xl border border-border bg-card px-3 text-[13px] transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
              compact ? "h-8" : "h-10 text-[14px]",
            )}
            aria-label="Date de début"
          />
          <input
            type="date"
            name="to"
            defaultValue={to}
            className={cn(
              "rounded-xl border border-border bg-card px-3 text-[13px] transition-colors",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
              compact ? "h-8" : "h-10 text-[14px]",
            )}
            aria-label="Date de fin"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className={cn("rounded-xl px-3 text-[13px]", compact ? "h-8" : "h-10 px-4 text-[14px]")}
          >
            Appliquer
          </Button>
        </form>
      ) : null}
      {!compact ? (
        <p className="text-[13px] leading-snug text-muted-foreground">
          Ce filtre s’applique à tous les KPI, graphiques et listes de cette page. Les filtres CRM (source, pays,
          statut) restent sur la page Leads.
        </p>
      ) : null}
    </div>
  )
}
