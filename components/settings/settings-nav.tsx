"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Building2,
  CreditCard,
  FileBarChart,
  Globe2,
  LayoutDashboard,
  Plug,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react"
import { WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const links: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/dashboard/settings", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/settings/profile", label: "Profil", icon: UserRound },
  { href: "/dashboard/settings/organization", label: "Organisation", icon: Building2 },
  { href: "/dashboard/settings/team", label: "Équipe", icon: Users },
  { href: "/dashboard/settings/billing", label: "Facturation", icon: CreditCard },
  { href: "/dashboard/settings/domains", label: "Domaines", icon: Globe2 },
  { href: "/dashboard/settings/integrations", label: "Intégrations", icon: Plug },
  { href: "/dashboard/settings/reports", label: "Rapports", icon: FileBarChart },
  { href: "/dashboard/settings/ai", label: "IA", icon: Sparkles },
  { href: "/dashboard/settings/activity", label: "Journal d'activité", icon: Activity },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Sections des paramètres"
      className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`)
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
              WS_FOCUS,
              active
                ? "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-950)] shadow-[inset_3px_0_0_0_var(--brand-500)] dark:text-[color:var(--brand-500)]"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
