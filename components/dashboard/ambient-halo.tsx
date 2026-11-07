"use client"

import { useEffect, useState } from "react"
import { ambientMotionClass } from "@/lib/dashboard/motion"
import { cn } from "@/lib/utils"

/** Decorative ambient motion — pauses when the tab is hidden. */
export function AmbientHalo({ className }: { className?: string }) {
  const [tabHidden, setTabHidden] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onVisibility = () => setTabHidden(document.hidden)
    const onMotion = () => setReduced(media.matches)
    onVisibility()
    onMotion()
    document.addEventListener("visibilitychange", onVisibility)
    media.addEventListener("change", onMotion)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      media.removeEventListener("change", onMotion)
    }
  }, [])

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(circle_at_center,rgb(47_111_115_/_0.14),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgb(97_178_178_/_0.16),transparent_68%)]",
        "dash-ambient-halo",
        ambientMotionClass({ prefersReducedMotion: reduced, tabHidden }),
        className,
      )}
    />
  )
}
