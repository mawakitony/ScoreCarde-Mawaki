"use client"

import Link from "next/link"
import { Eye, Mail, MessageCircle, Phone, Trash2 } from "lucide-react"
import { WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

function ActionLink({
  href,
  label,
  children,
  external,
}: {
  href: string
  label: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground",
        "transition-colors hover:bg-muted hover:text-foreground",
        WS_FOCUS,
      )}
    >
      {children}
    </a>
  )
}

function ActionDisabled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      aria-label={`${label} (indisponible)`}
      title={`${label} — coordonnée absente`}
      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground/35"
    >
      {children}
    </span>
  )
}

/** Discrete CRM row actions — only real channels, no decorative dead buttons. */
export function LeadRowActions({
  leadId,
  name,
  email,
  phone,
  whatsapp,
  canDelete,
  onDelete,
  className,
}: {
  leadId: string
  name: string
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  canDelete?: boolean
  onDelete?: () => void
  className?: string
}) {
  const mail = email?.trim()
  const tel = phone?.trim()
  const wa = whatsapp?.trim()?.replace(/[^\d+]/g, "") || null

  return (
    <div
      className={cn("flex items-center justify-end gap-0.5", className)}
      role="group"
      aria-label={`Actions pour ${name}`}
    >
      <Link
        href={`/dashboard/leads/${leadId}`}
        aria-label={`Ouvrir la fiche de ${name}`}
        title="Ouvrir la fiche"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground",
          "transition-colors hover:bg-muted hover:text-foreground",
          WS_FOCUS,
        )}
      >
        <Eye className="size-4" />
      </Link>

      {mail ? (
        <ActionLink href={`mailto:${encodeURIComponent(mail)}`} label={`Envoyer un e-mail à ${name}`}>
          <Mail className="size-4" />
        </ActionLink>
      ) : (
        <ActionDisabled label="E-mail">
          <Mail className="size-4" />
        </ActionDisabled>
      )}

      {tel ? (
        <ActionLink href={`tel:${tel.replace(/\s+/g, "")}`} label={`Appeler ${name}`}>
          <Phone className="size-4" />
        </ActionLink>
      ) : (
        <ActionDisabled label="Téléphone">
          <Phone className="size-4" />
        </ActionDisabled>
      )}

      {wa ? (
        <ActionLink href={`https://wa.me/${wa.replace(/^\+/, "")}`} label={`WhatsApp ${name}`} external>
          <MessageCircle className="size-4" />
        </ActionLink>
      ) : (
        <ActionDisabled label="WhatsApp">
          <MessageCircle className="size-4" />
        </ActionDisabled>
      )}

      {canDelete && onDelete ? (
        <button
          type="button"
          aria-label={`Supprimer ${name}`}
          title="Supprimer"
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground",
            "transition-colors hover:bg-destructive/10 hover:text-destructive",
            WS_FOCUS,
          )}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
