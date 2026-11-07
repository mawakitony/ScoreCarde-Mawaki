"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { saveStatusLabel } from "@/lib/ui/feedback"
import { cn } from "@/lib/utils"
import type { SaveState } from "@/types/builder"

const SaveReporterContext = createContext<(state: SaveState) => void>(() => {})

export function SaveReporterProvider({
  report,
  children,
}: {
  report: (state: SaveState) => void
  children: React.ReactNode
}) {
  return <SaveReporterContext.Provider value={report}>{children}</SaveReporterContext.Provider>
}

export function useSaveReporter() {
  return useContext(SaveReporterContext)
}

export function SaveIndicator({ state }: { state: SaveState }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (state.status !== "saved" || !state.savedAt) return
    const timer = window.setInterval(() => setTick((value) => value + 1), 10000)
    return () => window.clearInterval(timer)
  }, [state.savedAt, state.status])

  const label = saveStatusLabel(state)
  if (!label) return null

  const Icon =
    state.status === "error" ? AlertCircle : state.status === "saving" ? Loader2 : CheckCircle2

  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
        state.status === "error" && "bg-destructive/10 text-destructive",
        state.status === "saved" && "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-500)]",
        state.status === "saving" && "bg-muted text-muted-foreground",
      )}
      aria-live="polite"
    >
      <Icon className={cn("size-3.5 shrink-0", state.status === "saving" && "animate-spin")} aria-hidden />
      {label}
    </p>
  )
}
