import { cn } from "@/lib/utils"

/**
 * Isolates ScoreApp / theme previews from the dashboard Light/Dark preference.
 * CSS variables reset to the light brand surface; `dark:` utilities are excluded via globals.css.
 */
export function ScoreAppSurface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("scoreapp-surface", className)} data-scoreapp-surface="">
      {children}
    </div>
  )
}
