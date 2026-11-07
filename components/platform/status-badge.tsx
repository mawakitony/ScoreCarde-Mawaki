import { cn } from "@/lib/utils"

const TONES: Record<string, string> = {
  // French (preferred)
  Essai: "bg-sky-500/12 text-sky-800",
  Actif: "bg-emerald-500/12 text-emerald-800",
  "En retard": "bg-amber-500/15 text-amber-900",
  "En retard (grâce)": "bg-amber-500/15 text-amber-900",
  Annulé: "bg-zinc-500/12 text-zinc-700",
  Impayé: "bg-rose-500/12 text-rose-800",
  Incomplet: "bg-zinc-500/12 text-zinc-700",
  "En pause": "bg-zinc-500/12 text-zinc-700",
  Suspendu: "bg-rose-500/12 text-rose-800",
  "Expiré / restreint": "bg-rose-500/12 text-rose-800",
  Ouvert: "bg-amber-500/15 text-amber-900",
  Traité: "bg-emerald-500/12 text-emerald-800",
  Désactivé: "bg-zinc-500/12 text-zinc-700",
  // Legacy English keys (audit / older rows)
  TRIALING: "bg-sky-500/12 text-sky-800",
  ACTIVE: "bg-emerald-500/12 text-emerald-800",
  PAST_DUE: "bg-amber-500/15 text-amber-900",
  "PAST_DUE (grâce)": "bg-amber-500/15 text-amber-900",
  CANCELED: "bg-zinc-500/12 text-zinc-700",
  SUSPENDED: "bg-rose-500/12 text-rose-800",
  "EXPIRED / RESTRICTED": "bg-rose-500/12 text-rose-800",
  OWNER: "bg-[color:var(--pa-primary)]/12 text-[color:var(--pa-primary)]",
  ADMIN: "bg-sky-500/12 text-sky-800",
  EDITOR: "bg-violet-500/12 text-violet-800",
  ANALYST: "bg-teal-500/12 text-teal-800",
  VIEWER: "bg-zinc-500/12 text-zinc-700",
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        TONES[label] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}
