"use client"

import { Bell } from "lucide-react"
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationMenu({
  unread,
  items,
}: {
  unread: number
  items: { id: string; title: string; message: string; createdAt: string; read: boolean }[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-xl"
          aria-label={unread > 0 ? `${unread} notifications non lues` : "Notifications"}
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[color:var(--brand-300)]" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl border-border bg-popover p-1.5 shadow-[var(--shadow-panel)]"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[13px] font-semibold">Notifications</span>
          {unread > 0 ? (
            <button
              type="button"
              className="text-[11px] font-medium text-[color:var(--brand-500)] underline-offset-2 hover:underline"
              onClick={() => void markAllNotificationsRead()}
            >
              Tout lire
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-[13px] text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        ) : (
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted"
                  onClick={() => void markNotificationRead(item.id)}
                >
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    {item.read ? null : (
                      <span className="size-1.5 shrink-0 rounded-full bg-[color:var(--brand-300)]" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="mt-1 block text-[12px] text-muted-foreground">{item.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
