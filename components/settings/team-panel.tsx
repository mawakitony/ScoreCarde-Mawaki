"use client"

import { useState } from "react"
import { cancelInvitation, grantFirstAccess, resendFirstAccess } from "@/actions/first-access"
import { inviteMember, transferOwnership } from "@/actions/organization"
import { firstAccessShareMessage, whatsAppShareUrl } from "@/lib/auth/first-access-share"
import { inviteRoleLabel } from "@/lib/auth/invitation-flow"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type PendingInvite = {
  id: string
  email: string
  role: string
  status: "Invité" | "Accès non activé" | "Expiré"
  kind: "link" | "first_access_code"
  issuedLabel: string | null
  expiresLabel: string | null
}

type RevealedAccess = {
  email: string
  role: string
  code: string
  hours: number
  link: string
  organizationName: string
}

export function TeamPanel({
  canTransfer,
  members,
  invitations,
}: {
  canTransfer: boolean
  members: { userId: string; role: string }[]
  invitations: PendingInvite[]
}) {
  const [inviteSent, setInviteSent] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [copied, setCopied] = useState("")
  const [access, setAccess] = useState<RevealedAccess | null>(null)

  function closeAccess() {
    setAccess(null)
    setCopied("")
  }

  async function invite(formData: FormData) {
    const result = await inviteMember(formData)
    setError("error" in result ? result.error ?? "" : "")
    setInviteSent(!("error" in result))
  }

  async function grant(formData: FormData) {
    const result = await grantFirstAccess(formData)
    if ("error" in result) {
      setError(result.error ?? "")
      return
    }
    setError("")
    setCopied("")
    setAccess(result)
  }

  async function resend(formData: FormData) {
    const result = await resendFirstAccess(formData)
    if ("error" in result) {
      setError(result.error ?? "")
      return
    }
    setError("")
    setNotice("")
    setCopied("")
    setAccess(result)
  }

  async function cancel(formData: FormData) {
    const result = await cancelInvitation(formData)
    setError("error" in result ? result.error ?? "" : "")
    setNotice("error" in result ? "" : "Invitation annulée.")
  }

  async function copy(value: string, kind: "code" | "message") {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
    } catch {
      setCopied("failed")
    }
  }

  const roleLabel = access ? inviteRoleLabel(access.role) ?? access.role : ""
  const message = access
    ? firstAccessShareMessage({
      organizationName: access.organizationName,
      roleLabel,
      code: access.code,
      appUrl: access.link.replace(/\/first-access$/, ""),
      hours: access.hours,
    })
    : ""

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
        <h2 className="text-base font-semibold text-foreground">Ajouter un membre</h2>
        <form action={grant} className="flex flex-wrap gap-2">
          <input name="email" type="email" required placeholder="Adresse email" aria-label="Adresse email" className="h-10 rounded-xl border border-border bg-card px-3 text-sm" />
          <select name="role" aria-label="Rôle" className="h-10 rounded-xl border border-border bg-card px-3 text-sm" defaultValue="editor">
            <option value="admin">Administrateur</option>
            <option value="editor">Éditeur</option>
            <option value="analyst">Analyste</option>
            <option value="viewer">Lecteur</option>
          </select>
          <button className="h-10 rounded-full bg-[#071039] px-4 text-sm font-semibold text-white" type="submit">Envoyer l&apos;accès</button>
        </form>
      </section>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
        <h2 className="text-base font-semibold text-foreground">Invitation classique</h2>
        <form action={invite} className="flex flex-wrap gap-2">
          <input name="email" type="email" required placeholder="Adresse email" aria-label="Adresse email" className="h-10 rounded-xl border border-border bg-card px-3 text-sm" />
          <select name="role" aria-label="Rôle" className="h-10 rounded-xl border border-border bg-card px-3 text-sm" defaultValue="editor">
            <option value="admin">Administrateur</option>
            <option value="editor">Éditeur</option>
            <option value="analyst">Analyste</option>
            <option value="viewer">Lecteur</option>
          </select>
          <button className="h-10 rounded-full border border-border px-4 text-sm font-semibold text-foreground" type="submit">Inviter</button>
        </form>
        {inviteSent ? <p className="text-sm text-[#2E5DE6]">Invitation envoyée.</p> : null}
      </section>
      {error ? <p className="text-sm">{error}</p> : null}
      {notice ? <p className="text-sm">{notice}</p> : null}
      {invitations.length ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)]">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span>{invitation.email}</span>
              <span>{invitation.role}</span>
              <span>{invitation.status}</span>
              {invitation.issuedLabel ? <span>{invitation.issuedLabel}</span> : null}
              {invitation.expiresLabel ? <span>{invitation.expiresLabel}</span> : null}
              <span className="flex gap-3">
                {invitation.kind === "first_access_code" ? (
                  <form action={resend}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <button className="underline" type="submit">Régénérer le code</button>
                  </form>
                ) : null}
                <form action={cancel}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <button className="underline" type="submit">Annuler l&apos;invitation</button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {canTransfer ? members.filter((member) => member.role !== "owner").map((member) => (
        <form key={member.userId} action={async () => { await transferOwnership(member.userId) }}>
          <button className="text-sm underline" type="submit">Transférer la propriété à {member.role}</button>
        </form>
      )) : null}
      <Dialog open={Boolean(access)} onOpenChange={(open) => { if (!open) closeAccess() }}>
        {access ? (
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Accès créé</DialogTitle>
              <DialogDescription>{access.email} · {roleLabel}</DialogDescription>
            </DialogHeader>
            <p className="text-sm">Code de première connexion</p>
            <p className="font-mono text-2xl tracking-[0.2em]">{access.code}</p>
            <p className="text-sm">Expire dans {access.hours === 1 ? "1 heure" : `${access.hours} heures`}</p>
            <p className="text-sm break-all">{access.link}</p>
            <div className="flex flex-wrap gap-2">
              <button className="h-11 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground" type="button" onClick={() => copy(access.code, "code")}>Copier le code</button>
              <button className="h-11 rounded-xl border px-4 text-sm" type="button" onClick={() => copy(message, "message")}>Copier le message</button>
              <a className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-border px-4 text-sm font-semibold" href={whatsAppShareUrl(message)} target="_blank" rel="noopener noreferrer">Partager via WhatsApp</a>
              <button className="h-11 rounded-xl border px-4 text-sm" type="button" onClick={closeAccess}>Fermer</button>
            </div>
            {copied === "code" ? <p className="text-sm">Code copié.</p> : null}
            {copied === "message" ? <p className="text-sm">Message copié.</p> : null}
            {copied === "failed" ? <p className="text-sm">La copie a échoué.</p> : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
