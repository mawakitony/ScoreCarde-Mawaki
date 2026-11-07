import type { Permission } from "@/lib/auth/permissions"
import { can } from "@/lib/auth/permissions"

export type DashboardShortcut = {
  id: string
  href: string
  label: string
  description: string
  permission?: Permission
}

const SHORTCUTS: DashboardShortcut[] = [
  {
    id: "create-scorecard",
    href: "/dashboard/scorecards",
    label: "Créer une scorecard",
    description: "Ouvrir le catalogue et démarrer une évaluation",
    permission: "scorecard.edit",
  },
  {
    id: "leads",
    href: "/dashboard/leads",
    label: "Consulter les leads",
    description: "CRM et qualification des participants",
    permission: "lead.read",
  },
  {
    id: "analytics",
    href: "/dashboard/analytics",
    label: "Ouvrir Analytics",
    description: "Indicateurs détaillés de la période",
    permission: "analytics.read",
  },
  {
    id: "templates",
    href: "/dashboard/templates",
    label: "Explorer les modèles",
    description: "Thèmes prêts à personnaliser",
  },
]

/** Shortcuts visible for a role — omit anything the user cannot open meaningfully. */
export function dashboardShortcutsForRole(role: string | null | undefined): DashboardShortcut[] {
  return SHORTCUTS.filter((item) => {
    if (!item.permission) return true
    if (!role) return false
    return can({ role }, item.permission)
  })
}
