import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS } from "@/lib/constants"
import type { ScorecardStatus } from "@/types/database"
import { cn } from "@/lib/utils"

const styles: Record<ScorecardStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published:
    "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-500)] ring-1 ring-[color:var(--brand-500)]/20",
  paused: "bg-[color:var(--brand-300)]/15 text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] ring-1 ring-[color:var(--brand-300)]/25",
  archived: "bg-destructive/10 text-destructive ring-1 ring-destructive/15",
}

export function StatusBadge({ status }: { status: ScorecardStatus }) {
  return (
    <Badge variant="secondary" className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
