import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  Globe2,
  HeartPulse,
  LayoutDashboard,
  Plug,
  ScrollText,
  Settings,
  TimerReset,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import { canPlatform, type PlatformPermission } from "@/lib/platform/permissions"

export type PlatformNavItem = { href: string; label: string; icon: LucideIcon; permission: PlatformPermission }

export const PLATFORM_NAV_GROUPS: { id: string; label: string; items: PlatformNavItem[] }[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      { href: "/platform", label: "Vue d'ensemble", icon: LayoutDashboard, permission: "platform.organizations.read" },
      { href: "/platform/organizations", label: "Entreprises", icon: Building2, permission: "platform.organizations.read" },
      { href: "/platform/subscriptions", label: "Abonnements", icon: CreditCard, permission: "platform.billing.read" },
      { href: "/platform/payments", label: "Paiements", icon: Wallet, permission: "platform.billing.read" },
      { href: "/platform/expirations", label: "Expirations", icon: TimerReset, permission: "platform.organizations.read" },
    ],
  },
  {
    id: "ops",
    label: "Opérations",
    items: [
      { href: "/platform/users", label: "Utilisateurs", icon: Users, permission: "platform.organizations.read" },
      { href: "/platform/notifications", label: "Notifications", icon: Bell, permission: "platform.organizations.read" },
      { href: "/platform/alerts", label: "Alertes", icon: AlertTriangle, permission: "platform.organizations.read" },
      { href: "/platform/usage", label: "Usage", icon: Activity, permission: "platform.organizations.read" },
      { href: "/platform/jobs", label: "Jobs", icon: Workflow, permission: "platform.jobs.read" },
      { href: "/platform/integrations", label: "Intégrations", icon: Plug, permission: "platform.jobs.read" },
      { href: "/platform/domains", label: "Domaines", icon: Globe2, permission: "platform.organizations.read" },
    ],
  },
  {
    id: "gouvernance",
    label: "Gouvernance",
    items: [
      { href: "/platform/audit", label: "Journal d'audit", icon: ScrollText, permission: "platform.audit.read" },
      { href: "/platform/health", label: "Santé système", icon: HeartPulse, permission: "platform.organizations.read" },
      { href: "/platform/settings", label: "Paramètres", icon: Settings, permission: "platform.organizations.read" },
      { href: "/platform/admins", label: "Administrateurs", icon: Users, permission: "platform.admins.manage" },
    ],
  },
]

export function isPlatformNavActive(pathname: string, href: string) {
  if (href === "/platform") return pathname === "/platform"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Nav groups filtered to the actor's RBAC permissions. */
export function platformNavForRole(role: string) {
  return PLATFORM_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canPlatform({ role }, item.permission)),
  })).filter((group) => group.items.length > 0)
}
