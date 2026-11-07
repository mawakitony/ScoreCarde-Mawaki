"use client"

import {
  Contact,
  Eye,
  FileQuestion,
  FolderTree,
  Gauge,
  ListChecks,
  PanelsTopLeft,
  Settings2,
} from "lucide-react"
import { BUILDER_STEPS, type BuilderStepId } from "@/lib/constants"
import { WS_FOCUS, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const STEP_ICONS: Record<BuilderStepId, LucideIcon> = {
  setup: Settings2,
  landing: PanelsTopLeft,
  questions: FileQuestion,
  categories: FolderTree,
  scoring: Gauge,
  lead: Contact,
  results: ListChecks,
  preview: Eye,
}

export function BuilderSidebar({
  step,
  mode,
  onMode,
  onChange,
}: {
  step: BuilderStepId
  mode: "simple" | "advanced"
  onMode: (mode: "simple" | "advanced") => void
  onChange: (step: BuilderStepId) => void
}) {
  const visible =
    mode === "simple" ? BUILDER_STEPS.filter((item) => item.id !== "categories" && item.id !== "scoring") : BUILDER_STEPS

  return (
    <aside
      className={cn(
        WS_PANEL,
        "min-w-0 max-w-full p-3 lg:sticky lg:top-[4.75rem] lg:self-start",
      )}
    >
      <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
        Studio
      </p>
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1" role="group" aria-label="Mode du builder">
        <button
          type="button"
          className={cn(
            "rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors",
            WS_FOCUS,
            mode === "simple"
              ? "bg-[color:var(--brand-950)] text-white shadow-sm dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onMode("simple")}
        >
          Simple
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors",
            WS_FOCUS,
            mode === "advanced"
              ? "bg-[color:var(--brand-950)] text-white shadow-sm dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onMode("advanced")}
        >
          Avancé
        </button>
      </div>
      <nav
        className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
        aria-label="Étapes du builder"
      >
        {visible.map((item, index) => {
          const Icon = STEP_ICONS[item.id]
          const active = step === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "step" : undefined}
              title={item.label}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium whitespace-nowrap transition-colors",
                WS_FOCUS,
                active
                  ? "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-950)] shadow-[inset_3px_0_0_0_var(--brand-500)] dark:text-[color:var(--brand-500)]"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
              onClick={() => onChange(item.id)}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums",
                  active ? "bg-[color:var(--brand-500)]/20" : "bg-muted",
                )}
              >
                {index + 1}
              </span>
              <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
