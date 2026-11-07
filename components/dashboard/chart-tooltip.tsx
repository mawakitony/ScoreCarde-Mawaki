"use client"

import { formatNumber } from "@/lib/format"

type PayloadItem = {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

/** Elegant Recharts tooltip — Light/Dark via CSS tokens. */
export function PremiumChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: PayloadItem[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-[var(--shadow-panel)]">
      {label !== undefined && label !== "" ? (
        <p className="text-[12px] font-semibold text-muted-foreground">{String(label)}</p>
      ) : null}
      <ul className="mt-1.5 space-y-1">
        {payload.map((item) => {
          const raw = typeof item.value === "number" ? item.value : Number(item.value)
          const display = Number.isFinite(raw) ? formatNumber(raw) : String(item.value ?? "—")
          return (
            <li key={String(item.dataKey ?? item.name)} className="flex items-center gap-2 text-[13px]">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: item.color || "var(--foreground)" }}
                aria-hidden
              />
              <span className="text-muted-foreground">{item.name ?? item.dataKey}</span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">{display}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
