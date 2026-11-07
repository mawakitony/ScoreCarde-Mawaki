"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ORG_DETAIL_TABS, parseOrgDetailTab } from "@/lib/platform/ui"
import { cn } from "@/lib/utils"

export function OrgDetailTabs({ organizationId }: { organizationId: string }) {
  const params = useSearchParams()
  const active = parseOrgDetailTab(params.get("tab") ?? undefined)

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <nav
        aria-label="Sections entreprise"
        className="flex min-w-max gap-1 rounded-2xl border border-border bg-white p-1 shadow-[0_1px_2px_rgba(8,20,59,0.04)]"
      >
        {ORG_DETAIL_TABS.map((tab) => {
          const href = `/platform/organizations/${organizationId}?tab=${tab.id}`
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                "focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none",
                isActive
                  ? "bg-[color:var(--pa-primary)] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-[color:var(--pa-bg)] hover:text-[color:var(--pa-ink)]",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
