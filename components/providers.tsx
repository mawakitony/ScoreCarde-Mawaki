"use client"

import { ThemeProvider } from "next-themes"
import { usePathname } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { forceLightPath } from "@/lib/theme/paths"

function ThemedProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const forcedTheme = forceLightPath(pathname) ? "light" : undefined

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme={forcedTheme}
      storageKey="woloyem-theme"
      disableTransitionOnChange
    >
      <TooltipProvider>
        {children}
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemedProviders>{children}</ThemedProviders>
}
