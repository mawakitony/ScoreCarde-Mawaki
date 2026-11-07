"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const options = [
  { value: "light" as const, label: "Light", Icon: Sun },
  { value: "dark" as const, label: "Dark", Icon: Moon },
]

function subscribe() {
  return () => {}
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const active = (mounted ? resolvedTheme ?? theme : "light") === "dark" ? "dark" : "light"

  return (
    <div
      role="group"
      aria-label="Thème d'affichage"
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-border bg-muted/70 p-0.5",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const selected = active === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            aria-label={value === "light" ? "Activer le thème clair" : "Activer le thème sombre"}
            disabled={!mounted}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out",
              "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/40 focus-visible:outline-none",
              "sm:px-3 sm:text-[13px]",
              selected
                ? "bg-[color:var(--surface)] text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden min-[380px]:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
