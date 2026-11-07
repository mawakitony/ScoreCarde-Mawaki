"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, RotateCcw, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { restorePublishedDraft, undoDraft } from "@/actions/release"
import { PublishDialog } from "@/components/scorecard-builder/publish-dialog"
import { SaveIndicator } from "@/components/scorecard-builder/save-status"
import { StatusBadge } from "@/components/scorecard/status-badge"
import { Button } from "@/components/ui/button"
import type { BuilderStepId } from "@/lib/constants"
import { WS_FOCUS, WS_LINK } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"
import type { SaveState } from "@/types/builder"
import type { ScorecardStatus } from "@/types/database"

export function BuilderHeader({
  name,
  status,
  save,
  scorecardId,
  publishedAt,
  unpublished,
  canUndo,
  onPreview,
  onFix,
}: {
  name: string
  status: ScorecardStatus
  save: SaveState
  scorecardId: string
  publishedAt: string | null
  unpublished: boolean
  canUndo: boolean
  onPreview: () => void
  onFix: (step: BuilderStepId) => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const publishedLabel = publishedAt
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(publishedAt))
    : null

  async function undo() {
    setPending(true)
    const result = await undoDraft(scorecardId)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    refreshFromServer(router)
  }

  async function restore() {
    setPending(true)
    const result = await restorePublishedDraft(scorecardId)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Brouillon rétabli sur la version publiée.")
    refreshFromServer(router)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-md md:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link href="/dashboard/scorecards" className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", WS_LINK)}>
            ← Scorecards
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[1.125rem] font-semibold tracking-tight text-foreground md:text-[1.25rem]">
              {name}
            </h1>
            <StatusBadge status={status} />
            {unpublished ? (
              <span className="rounded-full bg-destructive/12 px-2.5 py-1 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20">
                Modifications non publiées
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1">
            <SaveIndicator state={save} />
            {publishedLabel ? (
              <p className="text-[12px] text-muted-foreground">Dernière publication : {publishedLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-9 rounded-xl", WS_FOCUS)}
            disabled={pending || !canUndo}
            onClick={() => void undo()}
          >
            <Undo2 className="size-3.5" aria-hidden />
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-9 rounded-xl", WS_FOCUS)}
            disabled={pending || !publishedAt}
            onClick={() => void restore()}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Restaurer
          </Button>
          <Button type="button" variant="outline" size="sm" className={cn("h-9 rounded-xl", WS_FOCUS)} onClick={onPreview}>
            <Eye className="size-3.5" aria-hidden />
            Aperçu
          </Button>
          <PublishDialog scorecardId={scorecardId} onFix={onFix} />
        </div>
      </div>
    </header>
  )
}

function refreshFromServer(router: { refresh: () => void }) {
  const url = new URL(window.location.href)
  url.searchParams.set("sync", "1")
  window.history.replaceState(null, "", `${url.pathname}${url.search}`)
  router.refresh()
}
