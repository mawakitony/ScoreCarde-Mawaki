import { CheckCircle2, Flame, MousePointerClick, Target, Users, type LucideIcon } from "lucide-react"
import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { WS_ENTER, WS_ICON_CHIP, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

const ICONS = {
  users: Users,
  target: Target,
  check: CheckCircle2,
  flame: Flame,
  cta: MousePointerClick,
} as const

export type KpiIconName = keyof typeof ICONS

/** Server-safe KPI card — icons by name, no function props across the RSC boundary. */
export function KpiCard({
  label,
  value,
  numericValue,
  numberFormat = "integer",
  hint,
  icon,
  sparkline,
  index = 0,
  tooltip,
}: {
  label: string
  value: string
  /** When set, animates once from 0 → value on mount. */
  numericValue?: number
  numberFormat?: "integer" | "plain"
  hint: string
  icon: KpiIconName
  sparkline?: number[]
  index?: number
  tooltip?: string
}) {
  const Icon: LucideIcon = ICONS[icon]
  const tone = hint.startsWith("+")
    ? "text-[color:var(--brand-500)]"
    : hint.startsWith("-")
      ? "text-[#9C3B3B] dark:text-[#E57373]"
      : "text-muted-foreground"

  const max = sparkline && sparkline.length > 1 ? Math.max(...sparkline, 1) : 1
  const sparkW = Math.max((sparkline?.length ?? 1) - 1, 1) * 10
  const hasSpark = Boolean(sparkline && sparkline.length > 1)

  return (
    <article
      className={cn(
        WS_PANEL,
        WS_ENTER,
        "group relative flex min-h-[7.75rem] flex-col overflow-hidden p-4 md:min-h-[8.25rem]",
        "motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-safe:hover:-translate-y-0.5 hover:border-[color:var(--brand-500)]/30",
        "hover:shadow-[0_16px_40px_-28px_rgba(7,16,57,0.4)] dark:hover:border-[color:var(--brand-500)]/35",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      title={tooltip}
      aria-label={tooltip ? `${label}. ${tooltip}` : label}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</p>
        <span className={cn(WS_ICON_CHIP, "size-9 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105")}>
          <Icon className="size-4" strokeWidth={2} aria-hidden />
        </span>
      </div>
      <p className="mt-2.5 text-[28px] leading-none font-semibold tracking-tight text-foreground tabular-nums md:text-[30px]">
        {numericValue !== undefined && Number.isFinite(numericValue) ? (
          <AnimatedNumber value={numericValue} format={numberFormat} />
        ) : (
          value
        )}
      </p>
      <p className={cn("mt-1.5 min-h-[1.1rem] text-[12px] leading-snug", tone)}>{hint}</p>
      {hasSpark ? (
        <svg
          viewBox={`0 0 ${sparkW} 28`}
          className="mt-auto h-7 w-full pt-2 text-[color:var(--brand-500)]"
          aria-hidden
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={(sparkline ?? []).map((point, i) => `${i * 10},${26 - (point / max) * 22}`).join(" ")}
          />
        </svg>
      ) : (
        <div className="mt-auto flex h-7 items-end pt-2" aria-hidden>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}
    </article>
  )
}
