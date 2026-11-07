"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PLATFORM_RANGES, type PlatformRangeId } from "@/lib/platform/range"
import { cn } from "@/lib/utils"

export function PlatformRangeFilter({ basePath = "/platform" }: { basePath?: string }) {
  const params = useSearchParams()
  const current = (params.get("range") ?? "30") as PlatformRangeId

  return (
    <div
      className="inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-border/80 bg-white p-0.5 shadow-[0_1px_2px_rgba(8,20,59,0.04)]"
      role="group"
      aria-label="Période d'analyse"
    >
      {PLATFORM_RANGES.map((row) => {
        const active = current === row.id
        const href = `${basePath}?range=${row.id}`
        return (
          <Link
            key={row.id}
            href={href}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold motion-safe:transition-[background-color,color,box-shadow] motion-safe:duration-150",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none",
              active
                ? "bg-[color:var(--pa-navy)] text-white shadow-sm"
                : "text-muted-foreground hover:bg-[color:var(--pa-bg)] hover:text-[color:var(--pa-ink)]",
            )}
          >
            {row.label}
          </Link>
        )
      })}
      <Link
        href={basePath}
        className="ml-0.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:underline"
      >
        Réinit.
      </Link>
    </div>
  )
}
