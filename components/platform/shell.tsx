"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useSyncExternalStore } from "react"
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { endSupportSession } from "@/actions/platform"
import type { PlatformAdmin } from "@/lib/platform/auth"
import { isPlatformNavActive, platformNavForRole, PLATFORM_NAV_GROUPS } from "@/lib/platform/nav"
import { platformEnvironment } from "@/lib/platform/ui"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function EnvBadge({ code, label, tone }: ReturnType<typeof platformEnvironment>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
        tone === "amber" && "bg-amber-500/20 text-amber-200",
        tone === "rose" && "bg-rose-500/20 text-rose-100",
        tone === "sky" && "bg-sky-500/20 text-sky-100",
        tone === "zinc" && "bg-white/10 text-white/80",
      )}
      title={code === "STAGING" ? "Données de staging — pas la production" : undefined}
    >
      {label}
    </span>
  )
}

function Nav({
  role,
  collapsed,
  onNavigate,
}: {
  role: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const groups = platformNavForRole(role)
  return (
    <nav className="flex w-full flex-col gap-5" aria-label="Navigation plateforme">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          {!collapsed ? (
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
              {group.label}
            </p>
          ) : (
            <div className="mx-auto mb-1 h-px w-6 bg-white/15" aria-hidden />
          )}
          {group.items.map((item) => {
            const active = isPlatformNavActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium",
                  "transition-[background-color,color,box-shadow] duration-200 ease-out",
                  "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-white/12 text-white shadow-[inset_3px_0_0_0_#2563EB,inset_-3px_0_0_0_#2563EB]"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active && "text-[#60A5FA]")} strokeWidth={2} aria-hidden />
                {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      ))}
      {!collapsed ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mt-1 px-3 text-sm text-white/50 underline-offset-2 hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          Retour à WOLOYEM Score
        </Link>
      ) : null}
    </nav>
  )
}

const SIDEBAR_KEY = "pa-sidebar-collapsed"
const sidebarListeners = new Set<() => void>()

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  sidebarListeners.add(onStoreChange)
  return () => {
    sidebarListeners.delete(onStoreChange)
  }
}

function getSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "1"
  } catch {
    return false
  }
}

function writeSidebarCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0")
  } catch {
    /* ignore */
  }
  for (const listener of sidebarListeners) listener()
}

function breadcrumbLabel(pathname: string) {
  if (pathname === "/platform") return "Vue d'ensemble"
  for (const group of PLATFORM_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href !== "/platform" && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        if (pathname.startsWith("/platform/organizations/") && pathname !== "/platform/organizations") {
          return "Détail entreprise"
        }
        return item.label
      }
    }
  }
  return "Platform Admin"
}

/** Platform admin chrome — navy sidebar, top header, env badge. */
export function PlatformShell({
  admin,
  supportName,
  supportOrgId,
  env,
  children,
}: {
  admin: PlatformAdmin
  supportName: string | null
  supportOrgId: string | null
  env: ReturnType<typeof platformEnvironment>
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const collapsed = useSyncExternalStore(subscribeSidebarCollapsed, getSidebarCollapsed, () => false)
  const isMfaGate = pathname.startsWith("/platform/security/mfa")

  function toggleCollapsed() {
    writeSidebarCollapsed(!collapsed)
  }

  const crumb = breadcrumbLabel(pathname)
  const initial = (admin.email?.[0] ?? admin.role?.[0] ?? "A").toUpperCase()

  if (isMfaGate) {
    return (
      <div className="platform-admin min-h-screen bg-[color:var(--pa-bg)] font-sans text-foreground">
        <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-10">{children}</main>
      </div>
    )
  }

  return (
    <div className="platform-admin min-h-screen bg-[color:var(--pa-bg)] font-sans text-foreground">
      {supportName && supportOrgId ? (
        <form
          action={endSupportSession}
          className="sticky top-0 z-40 flex flex-col gap-2 bg-[color:var(--pa-primary)] px-5 py-3 text-sm text-white sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-0.5">
            <strong>MODE SUPPORT — session limitée à {supportName}</strong>
            <p className="text-xs font-normal text-white/85">
              Listes et exports Platform Admin filtrés sur cette organisation. Aucune impersonation du dashboard client.
            </p>
            <Link
              href={`/platform/organizations/${supportOrgId}`}
              className="inline-flex text-xs font-semibold underline underline-offset-2 hover:opacity-90"
            >
              Ouvrir la fiche
            </Link>
          </div>
          <button
            className="shrink-0 rounded-xl bg-[color:var(--pa-navy)] px-3 py-1.5 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            type="submit"
          >
            Quitter le support
          </button>
        </form>
      ) : null}

      <div
        className={cn(
          "grid min-h-svh transition-[grid-template-columns] duration-200",
          collapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[268px_1fr]",
        )}
      >
        <aside
          className={cn(
            "hidden text-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col",
            "bg-[color:var(--pa-navy)]",
          )}
        >
          <div className={cn("flex items-center gap-3 border-b border-white/10 px-4 py-5", collapsed && "justify-center px-2")}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase">Platform Admin</p>
                <p className="truncate text-sm font-semibold text-white">WOLOYEM</p>
              </div>
            ) : null}
          </div>

          {!collapsed ? (
            <form action="/platform/organizations" className="px-3 pt-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" aria-hidden />
                <input
                  name="q"
                  placeholder="Org, domaine, cus_"
                  aria-label="Recherche globale"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/8 pr-3 pl-9 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/25"
                />
              </label>
            </form>
          ) : null}

          <div className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
            <Nav role={admin.role} collapsed={collapsed} />
          </div>

          <div className="border-t border-white/10 p-3">
            <div className={cn("mb-2 flex items-center gap-2 rounded-xl bg-white/6 px-2.5 py-2", collapsed && "justify-center")}>
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                {initial}
              </span>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{admin.role}</p>
                  <p className="truncate text-[11px] text-white/50">{admin.email ?? "admin"}</p>
                </div>
              ) : null}
            </div>
            <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
              <EnvBadge {...env} />
              <button
                type="button"
                onClick={toggleCollapsed}
                className="inline-flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                aria-label={collapsed ? "Développer la sidebar" : "Replier la sidebar"}
              >
                {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white lg:hidden focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none"
                      aria-label="Ouvrir le menu"
                    >
                      <Menu className="size-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] border-0 bg-[color:var(--pa-navy)] p-0 text-white">
                    <SheetHeader className="border-b border-white/10 px-4 py-4 text-left">
                      <SheetTitle className="text-white">Navigation</SheetTitle>
                    </SheetHeader>
                    <div className="p-3">
                      <Nav role={admin.role} onNavigate={() => setOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Platform Admin / {crumb}
                  </p>
                  <p className="truncate text-sm font-semibold text-[color:var(--pa-ink)]">{crumb}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "hidden rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide sm:inline-flex",
                    env.tone === "amber" && "bg-amber-100 text-amber-900",
                    env.tone === "rose" && "bg-rose-100 text-rose-900",
                    env.tone === "sky" && "bg-sky-100 text-sky-900",
                    env.tone === "zinc" && "bg-zinc-100 text-zinc-700",
                  )}
                >
                  {env.label}
                </span>
                <form action="/platform/organizations" className="relative hidden md:block">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input
                    name="q"
                    placeholder="Recherche…"
                    aria-label="Recherche"
                    className="h-10 w-52 rounded-xl border border-border bg-[color:var(--pa-bg)] pr-3 pl-9 text-sm outline-none focus:border-[color:var(--pa-primary)] focus:ring-2 focus:ring-[color:var(--pa-primary)]/20 lg:w-64"
                  />
                </form>
                <Link
                  href="/platform/alerts"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none"
                  aria-label="Notifications et alertes"
                >
                  <Bell className="size-4" />
                </Link>
                <Link
                  href="/platform/settings"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--pa-primary)]/35 focus-visible:outline-none"
                  aria-label="Paramètres"
                >
                  <Settings className="size-4" />
                </Link>
                <div
                  className="flex size-10 items-center justify-center rounded-full bg-[color:var(--pa-navy)] text-sm font-bold text-white"
                  title={admin.email ?? admin.role}
                >
                  {initial}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 md:px-6 md:py-5">{children}</main>
        </div>
      </div>
    </div>
  )
}
