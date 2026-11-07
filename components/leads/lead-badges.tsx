import { Flame, Snowflake, Thermometer } from "lucide-react"
import { cn } from "@/lib/utils"

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  nurturing: "Nurturing",
  converted: "Converti",
  lost: "Perdu",
}

export const LEAD_TEMPERATURE_LABELS: Record<string, string> = {
  cold: "Froid",
  warm: "Tiède",
  hot: "Chaud",
}

const statusStyles: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  contacted:
    "bg-[color:var(--brand-950)]/10 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-950)]/25 dark:text-[color:var(--brand-500)]",
  qualified:
    "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-500)] ring-1 ring-[color:var(--brand-500)]/20",
  nurturing:
    "bg-[color:var(--brand-300)]/15 text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] ring-1 ring-[color:var(--brand-300)]/25",
  converted:
    "bg-[color:var(--brand-500)]/18 text-[color:var(--brand-950)] ring-1 ring-[color:var(--brand-500)]/25 dark:text-[color:var(--brand-500)]",
  lost: "bg-destructive/10 text-destructive ring-1 ring-destructive/15",
}

const temperatureStyles: Record<string, string> = {
  hot: "bg-destructive/10 text-destructive ring-1 ring-destructive/15",
  warm:
    "bg-[color:var(--brand-300)]/15 text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] ring-1 ring-[color:var(--brand-300)]/25",
  cold:
    "bg-[color:var(--brand-950)]/10 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]",
}

export function LeadStatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        statusStyles[value] ?? "bg-muted text-muted-foreground",
      )}
    >
      {LEAD_STATUS_LABELS[value] ?? value}
    </span>
  )
}

export function LeadTemperatureBadge({ value }: { value: string }) {
  const Icon = value === "hot" ? Flame : value === "warm" ? Thermometer : Snowflake
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        temperatureStyles[value] ?? "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {LEAD_TEMPERATURE_LABELS[value] ?? value}
    </span>
  )
}

export function LeadScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-[13px] text-muted-foreground">—</span>
  }
  const rounded = Math.round(score)
  const tone =
    rounded >= 70
      ? "text-[color:var(--brand-500)]"
      : rounded >= 40
        ? "text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]"
        : "text-muted-foreground"
  return (
    <span className={cn("text-[13px] font-semibold tabular-nums", tone)}>
      {rounded}&nbsp;%
    </span>
  )
}
