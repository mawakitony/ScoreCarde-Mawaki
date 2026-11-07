"use client"

import { useEffect, useRef, useState } from "react"
import { loadScorecardShare, type ScorecardShareResult } from "@/actions/share"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { scorecardQrDataUrl } from "@/lib/share/qr"

type ReadyShare = Extract<ScorecardShareResult, { ok: true; shareable: true }> & { qr: string }

export function ShareScorecardButton({ scorecardId }: { scorecardId: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button ref={triggerRef} type="button" variant="outline" className="h-10" onClick={() => setOpen(true)}>
        Partager
      </Button>
      <ShareScorecardDialog
        scorecardId={scorecardId}
        open={open}
        onOpenChange={setOpen}
        onReturnFocus={() => triggerRef.current?.focus()}
      />
    </>
  )
}

export function ShareScorecardDialog({
  scorecardId,
  open,
  onOpenChange,
  onReturnFocus,
}: {
  scorecardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onReturnFocus?: () => void
}) {
  const [state, setState] = useState<"idle" | "loading" | "blocked" | "error" | "ready">("idle")
  const [message, setMessage] = useState("")
  const [notice, setNotice] = useState("")
  const [share, setShare] = useState<ReadyShare | null>(null)
  const request = useRef(0)

  useEffect(() => {
    if (!open) return
    const current = ++request.current
    const timer = window.setTimeout(() => {
      setState("loading")
      setNotice("")
      setShare(null)
      void loadScorecardShare(scorecardId).then(async (result) => {
        if (request.current !== current) return
        if (!result.ok) {
          setMessage("Impossible de préparer le partage.")
          setState("error")
          return
        }
        if (!result.shareable) {
          setMessage(result.message)
          setState("blocked")
          return
        }
        try {
          const qr = await scorecardQrDataUrl(result.url)
          if (request.current !== current) return
          setShare({ ...result, qr })
          setState("ready")
        } catch {
          setMessage("Impossible de préparer le partage.")
          setState("error")
        }
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, scorecardId])

  function onOpen(next: boolean) {
    if (!next) {
      request.current += 1
      setState("idle")
      setShare(null)
      setNotice("")
      setMessage("")
    }
    onOpenChange(next)
  }

  async function copyLink() {
    if (!share) return
    try {
      await navigator.clipboard.writeText(share.url)
      setNotice("Lien copié")
    } catch {
      setNotice("Impossible de copier le lien.")
    }
  }

  function downloadQr() {
    if (!share) return
    const link = document.createElement("a")
    link.href = share.qr
    link.download = share.fileName
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => void onOpen(next)}>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (!onReturnFocus) return
          event.preventDefault()
          onReturnFocus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Partager cette scorecard</DialogTitle>
          <DialogDescription>
            {state === "blocked" ? message : "Lien public, QR Code, WhatsApp et email."}
          </DialogDescription>
        </DialogHeader>
        {state === "loading" || state === "idle" ? <p className="text-sm">Préparation du lien…</p> : null}
        {state === "error" ? <p className="text-sm">{message}</p> : null}
        {state === "ready" && share ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Lien public</p>
              <p data-share-url="" className="break-all text-sm text-muted-foreground">{share.url}</p>
            </div>
            <div className="grid gap-2">
              <Button type="button" className="h-11" onClick={() => void copyLink()}>Copier le lien</Button>
              <a className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-border px-3 text-sm font-semibold" href={share.whatsApp} target="_blank" rel="noopener noreferrer">Partager via WhatsApp</a>
              <a className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-border px-3 text-sm font-semibold" href={share.mailto}>Partager par email</a>
              <Button type="button" variant="outline" className="h-11" onClick={downloadQr}>Télécharger le QR Code</Button>
            </div>
            {/* The QR is a generated data URL, not a remote asset. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={share.qr} alt={`QR Code de ${share.name}`} className="mx-auto size-56 max-w-full rounded-[var(--radius-panel)] border border-border bg-card p-3 shadow-[var(--shadow-panel)]" />
            <p aria-live="polite" className="min-h-5 text-sm">{notice}</p>
          </div>
        ) : <p aria-live="polite" className="sr-only">{notice}</p>}
      </DialogContent>
    </Dialog>
  )
}
