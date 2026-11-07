import {
  BarChart3,
  BookOpen,
  Files,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact: boolean
}

export type DashboardNavGroup = {
  id: string
  label: string
  items: DashboardNavItem[]
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    id: "main",
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/scorecards", label: "Scorecards", icon: Files, exact: false },
      { href: "/dashboard/leads", label: "Leads", icon: Users, exact: false },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, exact: false },
    ],
  },
  {
    id: "tools",
    label: "Outils",
    items: [
      { href: "/dashboard/templates", label: "Modèles", icon: LayoutTemplate, exact: false },
      { href: "/dashboard/assistant", label: "Assistant IA", icon: Sparkles, exact: false },
      { href: "/dashboard/guide", label: "Guide", icon: BookOpen, exact: false },
    ],
  },
  {
    id: "account",
    label: "Compte",
    items: [{ href: "/dashboard/settings", label: "Paramètres", icon: Settings, exact: false }],
  },
]

export const DASHBOARD_NAV: DashboardNavItem[] = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items)

export function isNavActive(pathname: string, item: Pick<DashboardNavItem, "href" | "exact">) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

export function resolveDashboardChrome(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/dashboard") {
    return { title: "Dashboard", subtitle: "Vue d’ensemble de votre acquisition et de vos évaluations." }
  }
  if (pathname.startsWith("/dashboard/scorecards")) {
    return { title: "Scorecards", subtitle: "Créez, publiez et itérez vos évaluations." }
  }
  if (pathname.startsWith("/dashboard/leads")) {
    return { title: "Leads", subtitle: "Suivez et qualifiez les participants capturés." }
  }
  if (pathname.startsWith("/dashboard/analytics")) {
    return { title: "Analytics", subtitle: "Analysez la performance sur la période choisie." }
  }
  if (pathname.startsWith("/dashboard/templates")) {
    return { title: "Modèles", subtitle: "Partez d’un thème prêt à personnaliser." }
  }
  if (pathname.startsWith("/dashboard/assistant")) {
    return { title: "Assistant IA", subtitle: "Construisez plus vite avec un copilote guidé." }
  }
  if (pathname.startsWith("/dashboard/guide")) {
    return { title: "Guide", subtitle: "Documentation produit pour votre équipe." }
  }
  if (pathname.startsWith("/dashboard/settings")) {
    return { title: "Paramètres", subtitle: "Organisation, équipe, facturation et intégrations." }
  }
  return { title: "WOLOYEM Score", subtitle: "Espace de travail" }
}
