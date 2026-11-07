"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { anonymizeLead, restoreLead } from "@/actions/leads"
import { LEAD_STATUS_LABELS } from "@/components/leads/lead-badges"
import { leadAnonymizeCopy } from "@/lib/leads/removal"
import { formatDateTime } from "@/lib/format"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WS_ENTER, WS_ICON_CHIP, WS_LINK } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export type TrashRow = {
  id: string
  name: string
  email: string | null
  scorecard: string | null
  status: string
  deletedAt: string
}

export function LeadTrash({
  rows,
  canManage,
  error,
}: {
  rows: TrashRow[]
  canManage: boolean
  error: string | null
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [target, setTarget] = useState<TrashRow | null>(null)
  const [message, setMessage] = useState("")
  const copy = leadAnonymizeCopy()

  async function restore(formData: FormData) {
    const id = String(formData.get("leadId") ?? "")
    setPending(id)
    const result = await restoreLead(id)
    setPending(null)
    if ("error" in result) {
      setMessage(result.error)
      return
    }
    setMessage("")
    router.refresh()
  }

  async function confirmAnonymize(formData: FormData) {
    const id = String(formData.get("leadId") ?? "")
    setPending(id)
    const result = await anonymizeLead(id)
    setPending(null)
    if ("error" in result) {
      setMessage(result.error)
      return
    }
    setMessage("")
    setTarget(null)
    router.refresh()
  }

  if (error) {
    return (
      <p className="px-5 py-4 text-sm text-destructive" role="alert">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {message ? (
        <p className="px-5 py-3 text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <div className={cn(WS_ENTER, "px-4 py-12 text-center md:px-5")}>
          <span className={cn(WS_ICON_CHIP, "mx-auto size-12 rounded-2xl")}>
            <Archive className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">Corbeille vide</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Les leads supprimés apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {rows.map((row, index) => (
              <article
                key={row.id}
                className={cn(
                  WS_ENTER,
                  "rounded-2xl border border-border bg-[color:var(--surface-elevated)] p-4 text-[13px]",
                )}
                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
              >
                <p className="font-semibold text-foreground">{row.name}</p>
                <p className="mt-1 text-muted-foreground">{row.email || "—"}</p>
                <p className="mt-2 text-muted-foreground">{row.scorecard || "—"}</p>
                <p className="mt-1">{LEAD_STATUS_LABELS[row.status] ?? row.status}</p>
                <p className="text-[12px] text-muted-foreground">{formatDateTime(row.deletedAt)}</p>
                {canManage ? (
                  <TrashActions
                    row={row}
                    pending={pending === row.id}
                    onRestore={restore}
                    onAnonymize={() => {
                      setMessage("")
                      setTarget(row)
                    }}
                  />
                ) : null}
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/25">
                  {["Nom", "Email", "Scorecard", "Statut", "Supprimé le"].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                    >
                      {label}
                    </th>
                  ))}
                  {canManage ? (
                    <th className="px-3 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/35"
                  >
                    <td className="px-4 py-3.5 font-semibold text-foreground">{row.name}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{row.email || "—"}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{row.scorecard || "—"}</td>
                    <td className="px-3 py-3.5">
                      {LEAD_STATUS_LABELS[row.status] ?? row.status}
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">
                      {formatDateTime(row.deletedAt)}
                    </td>
                    {canManage ? (
                      <td className="px-3 py-3.5">
                        <TrashActions
                          row={row}
                          pending={pending === row.id}
                          onRestore={restore}
                          onAnonymize={() => {
                            setMessage("")
                            setTarget(row)
                          }}
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null)
            setMessage("")
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.body}</DialogDescription>
          </DialogHeader>
          <form action={confirmAnonymize} className="space-y-3">
            <input
              key={target?.id ?? "none"}
              type="hidden"
              name="leadId"
              defaultValue={target?.id ?? ""}
            />
            {message && target ? <p className="text-sm text-destructive">{message}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                className="h-10 rounded-xl border border-border px-4 text-[13px] font-semibold"
                type="button"
                onClick={() => setTarget(null)}
              >
                Annuler
              </button>
              <button
                className="h-10 rounded-xl bg-destructive px-4 text-[13px] font-semibold text-white disabled:opacity-50"
                type="submit"
                disabled={pending === target?.id || !target}
              >
                Anonymiser définitivement
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TrashActions({
  row,
  pending,
  onRestore,
  onAnonymize,
}: {
  row: TrashRow
  pending: boolean
  onRestore: (formData: FormData) => void
  onAnonymize: () => void
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 md:mt-0">
      <form action={onRestore}>
        <input type="hidden" name="leadId" defaultValue={row.id} />
        <button
          className={cn("text-[13px] disabled:opacity-50", WS_LINK)}
          type="submit"
          disabled={pending}
        >
          Restaurer
        </button>
      </form>
      <button
        className="text-[13px] font-semibold text-destructive underline-offset-2 hover:underline disabled:opacity-50"
        type="button"
        disabled={pending}
        onClick={onAnonymize}
      >
        Anonymiser définitivement
      </button>
    </div>
  )
}
