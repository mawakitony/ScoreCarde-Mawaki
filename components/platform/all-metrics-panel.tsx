"use client"

import Link from "next/link"
import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { MOTION_CARD_LIFT } from "@/lib/ui/motion"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export type PanelMetric = {
  label: string
  value: string
  href?: string
  tone?: "default" | "good" | "warn" | "bad"
  hint?: string
}

export function AllMetricsPanel({ metrics }: { metrics: PanelMetric[] }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className={cn(WS_PANEL, "overflow-hidden")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left motion-safe:transition-colors hover:bg-[color:var(--pa-bg)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--pa-primary)]/30"
      >
        <span>
          <span className="block text-sm font-semibold text-[color:var(--pa-ink)]">Voir tous les indicateurs</span>
          <span className="text-[12px] text-muted-foreground">Métriques secondaires — stock actuel et période</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] motion-safe:duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-2 border-t border-border/70 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Chip key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ metric }: { metric: PanelMetric }) {
  const content = (
    <div className={cn("rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/60 px-3 py-2.5", MOTION_CARD_LIFT)}>
      <p className="truncate text-[10px] font-medium text-muted-foreground">{metric.label}</p>
      <p
        className={cn(
          "mt-0.5 text-[16px] font-semibold tabular-nums",
          metric.tone === "good" && "text-emerald-700",
          metric.tone === "warn" && "text-amber-700",
          metric.tone === "bad" && "text-rose-700",
          (!metric.tone || metric.tone === "default") && "text-[color:var(--pa-ink)]",
        )}
      >
        {metric.value}
      </p>
    </div>
  )
  if (metric.href) {
    return (
      <Link
        href={metric.href}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/30"
      >
        {content}
      </Link>
    )
  }
  return content
}
