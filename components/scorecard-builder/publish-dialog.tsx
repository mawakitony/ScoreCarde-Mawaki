"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Rocket } from "lucide-react"
import { toast } from "sonner"
import { loadPublishReport, publishScorecard } from "@/actions/publish"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { BuilderStepId } from "@/lib/constants"
import type { PublishCheck } from "@/lib/assessment/publish"
import { WS_FOCUS, WS_LINK } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

function refreshFromServer(router: { refresh: () => void }) {
  const url = new URL(window.location.href)
  url.searchParams.set("sync", "1")
  window.history.replaceState(null, "", `${url.pathname}${url.search}`)
  router.refresh()
}

export function PublishDialog({ scorecardId, onFix }: { scorecardId: string; onFix: (step: BuilderStepId) => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState<PublishCheck[] | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)

  async function openReport() {
    setOpen(true)
    setChecks(null)
    const report = await loadPublishReport(scorecardId)
    if (report.error) {
      toast.error(report.error)
      setChecks([])
      setReady(false)
      return
    }
    setChecks(report.checks)
    setReady(report.ready)
  }

  async function publish() {
    setPending(true)
    const result = await publishScorecard(scorecardId)
    setPending(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Publiée. Le questionnaire public utilise maintenant ce contenu.")
    setOpen(false)
    refreshFromServer(router)
  }

  return (
    <>
      <Button
        type="button"
        className={cn(
          "h-9 rounded-xl bg-[color:var(--brand-950)] text-white",
          "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
          WS_FOCUS,
        )}
        onClick={() => void openReport()}
      >
        <Rocket className="size-3.5" aria-hidden />
        Publier
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {checks === null ? "Vérification" : ready ? "Prêt à publier ?" : "Publication impossible"}
            </DialogTitle>
            <DialogDescription>
              {checks === null
                ? "Contrôle du questionnaire avant publication."
                : ready
                  ? "La scorecard pourra être ouverte par les visiteurs."
                  : "Corrigez les points suivants avant la publication."}
            </DialogDescription>
          </DialogHeader>
          {checks === null ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Vérification…
            </p>
          ) : null}
          <ul className="space-y-2.5 text-sm">
            {(checks ?? []).map((check) => (
              <li
                key={check.id}
                className="rounded-xl border border-border bg-muted/30 px-3 py-2.5"
              >
                <p className="flex items-start gap-2 font-medium text-foreground">
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--brand-500)]" aria-hidden />
                  ) : (
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  )}
                  {check.label}
                </p>
                {!check.ok && check.detail ? (
                  <p className="mt-1 pl-6 text-[13px] text-destructive">{check.detail}</p>
                ) : null}
                {!check.ok ? (
                  <button
                    type="button"
                    className={cn("mt-1.5 pl-6 text-[13px]", WS_LINK)}
                    onClick={() => {
                      setOpen(false)
                      onFix(check.step)
                    }}
                  >
                    Corriger
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Fermer
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!ready || pending}
              aria-busy={pending}
              onClick={() => void publish()}
            >
              {pending ? "Publication…" : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
