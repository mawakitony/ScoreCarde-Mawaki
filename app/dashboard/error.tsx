"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export default function DashboardError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className={cn(WS_PANEL, "p-8")}>
      <span className={cn(WS_ICON_CHIP, "size-12 rounded-2xl")}>
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        Impossible de charger cette page
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">Réessayez dans quelques instants.</p>
      <Button className="mt-6 h-10 rounded-xl" onClick={reset}>
        <RefreshCw className="size-4" aria-hidden />
        Réessayer
      </Button>
    </div>
  )
}
