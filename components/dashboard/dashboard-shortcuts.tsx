import Link from "next/link"
import { ArrowUpRight, BarChart3, Files, LayoutTemplate, Users } from "lucide-react"
import type { DashboardShortcut } from "@/lib/dashboard/shortcuts"
import { WS_ENTER, WS_FOCUS, WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

const icons = {
  "create-scorecard": Files,
  leads: Users,
  analytics: BarChart3,
  templates: LayoutTemplate,
} as const

export function DashboardShortcuts({ items }: { items: DashboardShortcut[] }) {
  if (items.length === 0) return null
  return (
    <section className={WS_ENTER} style={{ animationDelay: "120ms" }}>
      <h2 className="text-[16px] font-semibold tracking-tight text-foreground md:text-[17px]">Raccourcis</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[item.id as keyof typeof icons] ?? ArrowUpRight
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                WS_PANEL,
                "group flex items-start gap-3.5 p-4",
                "motion-safe:transition-[transform,border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-safe:hover:-translate-y-0.5 hover:border-[color:var(--brand-500)]/30",
                WS_FOCUS,
              )}
              style={{ animationDelay: `${140 + index * 40}ms` }}
            >
              <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[14px] font-semibold text-foreground">
                  {item.label}
                  <ArrowUpRight
                    className="size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{item.description}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
