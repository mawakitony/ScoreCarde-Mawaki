"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, UserRound } from "lucide-react"
import { signOut } from "@/actions/auth"
import { Logo } from "@/components/brand/logo"
import { DashboardSearch } from "@/components/dashboard/global-search"
import { NotificationMenu } from "@/components/dashboard/notification-menu"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed"
import { DASHBOARD_NAV_GROUPS, isNavActive, resolveDashboardChrome } from "@/lib/dashboard/nav"
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from "@/lib/dashboard/sidebar"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex w-full flex-col gap-4", collapsed && "items-center")} aria-label="Navigation principale">
      {DASHBOARD_NAV_GROUPS.map((group) => (
        <div key={group.id} className={cn("flex flex-col gap-0.5", collapsed && "w-full items-center")}>
          {!collapsed ? (
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : (
            <span className="sr-only">{group.label}</span>
          )}
          {group.items.map((item) => {
            const active = isNavActive(pathname, item)
            const Icon = item.icon
            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex min-h-10 items-center rounded-xl text-[14px] font-medium",
                  "transition-[background-color,color,transform,box-shadow] duration-200 ease-out",
                  "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
                  collapsed ? "size-10 justify-center self-center px-0" : "gap-3 px-3 py-2.5",
                  active
                    ? collapsed
                      ? "bg-[color:var(--brand-500)]/12 text-[color:var(--brand-950)] ring-1 ring-[color:var(--brand-500)]/45 dark:text-[color:var(--brand-500)]"
                      : "bg-[color:var(--brand-500)]/10 text-[color:var(--brand-950)] shadow-[inset_3px_0_0_0_var(--brand-500)] dark:text-[color:var(--brand-500)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-transform duration-200",
                    active && "scale-105",
                    !active && "group-hover:scale-[1.04]",
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={cn("truncate", collapsed ? "sr-only" : null)}>{item.label}</span>
              </Link>
            )

            if (!collapsed) {
              return <div key={item.href}>{link}</div>
            }

            return (
              <Tooltip key={item.href} delayDuration={80}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={10}
                  className="border border-border bg-popover px-2.5 py-1.5 text-[13px] font-medium text-popover-foreground shadow-[var(--shadow-panel)]"
                >
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function AccountChip({
  email,
  fullName,
  compact,
}: {
  email: string
  fullName: string | null
  compact?: boolean
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", compact && "justify-center")}>
      <Avatar className="size-8 ring-1 ring-border">
        <AvatarFallback className="bg-[color:var(--brand-950)] text-xs text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]">
          {initials(fullName, email)}
        </AvatarFallback>
      </Avatar>
      {!compact ? (
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium text-foreground">{fullName || "Administrateur"}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
      ) : null}
    </div>
  )
}

function CompactLogo() {
  return (
    <span className="inline-flex size-9 items-center justify-center" aria-label="WOLOYEM Score">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--brand-950)" className="dark:fill-[color:var(--brand-300)]" />
        <path
          d="M8 22.5 13.2 9h2.3L21 22.5h-2.3l-1.1-2.8h-6.1l-1.1 2.8H8Zm4.2-4.6h4.3L14.3 12.6h-.1l-2 5.3Z"
          fill="#F6F1E6"
          className="dark:fill-[#0B1220]"
        />
        <rect
          x="8"
          y="24.2"
          width="16"
          height="1.6"
          rx="0.8"
          fill="var(--brand-300)"
          className="dark:fill-[#0B1220]"
        />
      </svg>
    </span>
  )
}

export function DashboardShell({
  children,
  email,
  fullName,
  organizationName,
  notifications,
  isPlatformAdmin = false,
}: {
  children: React.ReactNode
  email: string
  fullName: string | null
  organizationName: string
  notifications: { id: string; title: string; message: string; createdAt: string; read: boolean }[]
  /** Shown only when the signed-in user has a platform_admins row on this Supabase project. */
  isPlatformAdmin?: boolean
}) {
  const pathname = usePathname()
  const chrome = resolveDashboardChrome(pathname)
  const { collapsed, toggle } = useSidebarCollapsed()
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="woloyem-workspace min-h-screen bg-background text-foreground">
        <aside
          className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:flex"
          style={{ width: sidebarWidth }}
          data-collapsed={collapsed ? "true" : "false"}
        >
          <div className={cn("flex items-center gap-2 px-3", collapsed ? "flex-col gap-3" : "justify-between")}>
            <Link
              href="/dashboard"
              className="rounded-xl focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"
            >
              {collapsed ? <CompactLogo /> : <Logo tone="ink" />}
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? "Ouvrir la barre latérale" : "Réduire la barre latérale"}
              aria-expanded={!collapsed}
              aria-controls="dashboard-sidebar-nav"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground",
                "transition-colors duration-200 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
              )}
            >
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </button>
          </div>

          {!collapsed ? (
            <p className="mt-4 truncate px-5 text-[11px] font-semibold tracking-[0.14em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
              {organizationName}
            </p>
          ) : null}

          <div
            id="dashboard-sidebar-nav"
            className={cn(
              "mt-4 min-h-0 flex-1 overflow-y-auto",
              collapsed ? "flex flex-col items-center px-1.5" : "px-3",
            )}
          >
            <NavLinks collapsed={collapsed} />
            {isPlatformAdmin ? (
              <div className={cn("mt-4", collapsed && "flex justify-center")}>
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Plateforme
                  </p>
                ) : null}
                <Link
                  href="/platform"
                  title="Platform Admin"
                  className={cn(
                    "flex min-h-10 items-center rounded-xl text-[14px] font-semibold",
                    "bg-[color:var(--brand-950)] text-white hover:opacity-95",
                    "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none",
                    collapsed ? "size-10 justify-center" : "gap-3 px-3 py-2.5",
                  )}
                >
                  <ShieldCheck className="size-[18px] shrink-0" aria-hidden />
                  <span className={cn(collapsed && "sr-only")}>Platform Admin</span>
                </Link>
              </div>
            ) : null}
          </div>

          <div className={cn("mt-3 border-t border-sidebar-border pt-3", collapsed ? "px-2" : "px-3")}>
            {collapsed ? (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div>
                    <AccountChip email={email} fullName={fullName} compact />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{fullName || email}</TooltipContent>
              </Tooltip>
            ) : (
              <AccountChip email={email} fullName={fullName} />
            )}
          </div>
        </aside>

        <div
          className="min-w-0 pl-0 motion-safe:transition-[padding] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:pl-[var(--dash-sidebar-w)]"
          style={{ ["--dash-sidebar-w" as string]: `${sidebarWidth}px` }}
        >
          <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md">
            <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 md:px-6 md:py-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl lg:hidden"
                    aria-label="Ouvrir le menu"
                  >
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex w-[min(18.5rem,100vw)] flex-col border-border bg-sidebar px-3 text-sidebar-foreground"
                >
                  <SheetHeader className="text-left">
                    <SheetTitle className="text-foreground">
                      <Logo tone="ink" />
                    </SheetTitle>
                  </SheetHeader>
                  <p className="truncate px-3 text-[11px] font-semibold tracking-[0.14em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                    {organizationName}
                  </p>
                  <div className="min-h-0 flex-1 overflow-y-auto py-2">
                    <NavLinks onNavigate={() => setMobileOpen(false)} />
                  </div>
                  <div className="border-t border-sidebar-border px-2 pt-3">
                    <AccountChip email={email} fullName={fullName} />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1 lg:max-w-sm xl:max-w-md">
                <p className="truncate text-[14px] font-semibold tracking-tight text-foreground md:text-[15px]">
                  {chrome.title}
                </p>
                <p className="hidden truncate text-[12px] text-muted-foreground sm:block">{chrome.subtitle}</p>
              </div>

              <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5 md:max-w-md md:flex-1 lg:max-w-lg">
                <DashboardSearch />
                <ThemeToggle className="shrink-0" />
                <NotificationMenu
                  unread={notifications.filter((item) => !item.read).length}
                  items={notifications}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full p-0.5 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/40 focus-visible:outline-none"
                      type="button"
                      aria-label="Menu compte"
                    >
                      <Avatar className="size-8 ring-1 ring-border">
                        <AvatarFallback className="bg-[color:var(--brand-950)] text-xs text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]">
                          {initials(fullName, email)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 rounded-xl border-border bg-popover p-1.5 shadow-[var(--shadow-panel)]"
                  >
                    <DropdownMenuLabel className="px-2 py-2 font-normal">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {fullName || "Administrateur"}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">{email}</p>
                      <p className="mt-1 truncate text-[11px] font-medium tracking-wide text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                        {organizationName}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-lg text-[13px]">
                      <Link href="/dashboard/settings/profile">
                        <UserRound className="size-4" aria-hidden />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg text-[13px]">
                      <Link href="/dashboard/settings">
                        <Settings className="size-4" aria-hidden />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="rounded-lg text-[13px]"
                      onSelect={() => void signOut()}
                    >
                      <LogOut className="size-4" aria-hidden />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="relative min-w-0 overflow-x-hidden px-4 py-5 sm:px-5 md:px-7 md:py-7">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
