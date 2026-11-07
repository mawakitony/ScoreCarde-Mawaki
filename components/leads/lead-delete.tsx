"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteLeads } from "@/actions/leads"
import { leadDeleteCopy } from "@/lib/leads/removal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function LeadDeleteDialog({
  ids,
  open,
  onOpenChange,
  onDone,
}: {
  ids: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone?: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const copy = leadDeleteCopy(ids.length)

  async function confirm(formData: FormData) {
    setPending(true)
    const result = await deleteLeads(formData.getAll("leadId").map(String))
    setPending(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    setError("")
    onOpenChange(false)
    onDone?.()
    if (onDone) router.refresh()
    else router.push("/dashboard/leads")
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setError(""); onOpenChange(next) }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        <form action={confirm} className="space-y-3">
          {ids.map((id) => <input key={id} type="hidden" name="leadId" value={id} />)}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className="h-11 rounded-[var(--radius-control)] border border-border px-4 text-sm font-semibold" type="button" onClick={() => onOpenChange(false)}>Annuler</button>
            <button className="h-11 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" type="submit" disabled={pending || ids.length === 0}>Supprimer définitivement</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LeadDeleteButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="text-sm text-destructive underline" type="button" onClick={() => setOpen(true)}>Supprimer le lead</button>
      <LeadDeleteDialog ids={[leadId]} open={open} onOpenChange={setOpen} />
    </>
  )
}
