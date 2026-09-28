"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { anonymizeLead, restoreLead } from "@/actions/leads"
import { leadAnonymizeCopy } from "@/lib/leads/removal"
import { formatDateTime } from "@/lib/format"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const statusLabel: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  nurturing: "Nurturing",
  converted: "Converti",
  lost: "Perdu",
}

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

  if (error) return <p className="rounded-2xl border bg-card px-5 py-4 text-sm">{error}</p>

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-destructive" role="alert">{message}</p> : null}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-sm">La corbeille est vide.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <article key={row.id} className="rounded-2xl border bg-card p-4 text-sm">
                <p className="font-medium">{row.name}</p>
                <p className="mt-1 text-muted-foreground">{row.email || "—"}</p>
                <p className="mt-2">{row.scorecard || "—"}</p>
                <p>{statusLabel[row.status] ?? row.status}</p>
                <p className="text-muted-foreground">{formatDateTime(row.deletedAt)}</p>
                {canManage ? <TrashActions row={row} pending={pending === row.id} onRestore={restore} onAnonymize={() => { setMessage(""); setTarget(row) }} /> : null}
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {["Nom", "Email", "Scorecard", "Statut", "Supprimé le"].map((label) => (
                    <th key={label} className="px-3 py-3 font-medium">{label}</th>
                  ))}
                  {canManage ? <th className="px-3 py-3"><span className="sr-only">Actions</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-3">{row.name}</td>
                    <td className="px-3 py-3">{row.email || "—"}</td>
                    <td className="px-3 py-3">{row.scorecard || "—"}</td>
                    <td className="px-3 py-3">{statusLabel[row.status] ?? row.status}</td>
                    <td className="px-3 py-3">{formatDateTime(row.deletedAt)}</td>
                    {canManage ? (
                      <td className="px-3 py-3">
                        <TrashActions row={row} pending={pending === row.id} onRestore={restore} onAnonymize={() => { setMessage(""); setTarget(row) }} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) { setTarget(null); setMessage("") } }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.body}</DialogDescription>
          </DialogHeader>
          <form action={confirmAnonymize} className="space-y-3">
            <input key={target?.id ?? "none"} type="hidden" name="leadId" defaultValue={target?.id ?? ""} />
            {message && target ? <p className="text-sm text-destructive">{message}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button className="h-11 rounded-xl border px-4 text-sm" type="button" onClick={() => setTarget(null)}>Annuler</button>
              <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee] disabled:opacity-50" type="submit" disabled={pending === target?.id || !target}>Anonymiser définitivement</button>
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
        <button className="underline disabled:opacity-50" type="submit" disabled={pending}>Restaurer</button>
      </form>
      <button className="text-destructive underline disabled:opacity-50" type="button" disabled={pending} onClick={onAnonymize}>Anonymiser définitivement</button>
    </div>
  )
}
