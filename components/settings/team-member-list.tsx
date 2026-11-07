"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { changeMemberRole } from "@/actions/member-role"
import { inviteRoleLabel } from "@/lib/auth/invitation-flow"
import { ASSIGNABLE_MEMBER_ROLES } from "@/lib/auth/permissions"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ListedMember = {
  userId: string
  role: string
  fullName: string | null
  email: string | null
}

function displayRole(role: string) {
  if (role === "owner") return "Owner"
  if (role === "member") return "Member"
  return inviteRoleLabel(role) ?? role
}

export function TeamMemberList({
  members,
  canChangeRoles,
  currentUserId,
  highlightId = null,
}: {
  members: ListedMember[]
  canChangeRoles: boolean
  currentUserId: string
  highlightId?: string | null
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nextRole, setNextRole] = useState("viewer")
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const editing = members.find((member) => member.userId === editingId) ?? null

  useEffect(() => {
    if (!highlightId) return
    document.getElementById(`member-${highlightId}`)?.scrollIntoView({ block: "center" })
  }, [highlightId])

  function open(member: ListedMember) {
    setEditingId(member.userId)
    setNextRole(member.role)
    setError("")
    setNotice("")
  }

  function close() {
    setEditingId(null)
    setError("")
  }

  async function save(formData: FormData) {
    setPending(true)
    const result = await changeMemberRole(formData)
    setPending(false)
    if ("error" in result) {
      setNotice("")
      setError("Impossible de modifier le rôle de ce membre.")
      return
    }
    setError("")
    setNotice("Rôle mis à jour")
    setEditingId(null)
    router.refresh()
  }

  const currentLabel = editing ? displayRole(editing.role) : ""
  const nextLabel = displayRole(nextRole)

  return (
    <div className="space-y-3">
      {notice ? <p className="text-sm" role="status">{notice}</p> : null}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)]">
        {members.map((member) => {
          const name = member.fullName || member.email || "Membre"
          return (
            <li
              key={member.userId}
              id={`member-${member.userId}`}
              data-highlighted={highlightId === member.userId ? "true" : "false"}
              className={highlightId === member.userId
                ? "flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm ring-2 ring-[#071039]"
                : "flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"}
            >
              <span>
                {name} {member.userId === currentUserId ? "(vous)" : ""}
                {member.fullName && member.email ? <span className="mt-1 block text-muted-foreground">{member.email}</span> : null}
              </span>
              <span>{displayRole(member.role)}</span>
              <span>Actif</span>
              {canChangeRoles && member.role !== "owner" ? (
                <button className="underline" type="button" onClick={() => open(member)}>Modifier le rôle</button>
              ) : null}
            </li>
          )
        })}
      </ul>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) close() }}>
        {editing ? (
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Modifier le rôle</DialogTitle>
              <DialogDescription>{editing.fullName || editing.email || "Membre"}</DialogDescription>
            </DialogHeader>
            <form action={save} className="space-y-3">
              <input type="hidden" name="userId" value={editing.userId} />
              <select
                name="role"
                aria-label="Nouveau rôle"
                className="h-11 w-full rounded-[var(--radius-control)] border border-border bg-card px-3"
                value={nextRole}
                onChange={(event) => setNextRole(event.target.value)}
              >
                {ASSIGNABLE_MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>{displayRole(role)}</option>
                ))}
              </select>
              <p className="text-sm">Le rôle de ce membre passera de {currentLabel} à {nextLabel}.</p>
              {error ? <p className="text-sm">{error}</p> : null}
              <button className="h-11 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" type="submit" disabled={pending || nextRole === editing.role}>Enregistrer</button>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
