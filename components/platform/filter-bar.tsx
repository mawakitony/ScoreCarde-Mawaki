import { PlatformBtn } from "@/components/platform/page-chrome"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

/** Shared filter shell for Platform Admin list pages. */
export function FilterBar({
  children,
  className,
  submitLabel = "Filtrer",
}: {
  children: React.ReactNode
  className?: string
  submitLabel?: string
}) {
  return (
    <form className={cn(WS_PANEL, "flex flex-wrap items-end gap-2 p-3.5", className)}>
      {children}
      <PlatformBtn type="submit" className="h-10">
        {submitLabel}
      </PlatformBtn>
    </form>
  )
}
