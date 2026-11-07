import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border",
        "bg-[color:var(--surface)]/70 px-6 py-10 text-center",
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[color:var(--brand-950)]/8 text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
