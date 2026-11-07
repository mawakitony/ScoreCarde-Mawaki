import { Skeleton } from "@/components/ui/skeleton"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export default function LeadsLoading() {
  return (
    <div className={cn(WS_PANEL, "overflow-hidden")}>
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Skeleton className="size-10 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="border-b border-border px-5 py-3.5">
        <Skeleton className="h-9 w-full max-w-sm rounded-xl" />
      </div>
      <div className="flex gap-2 overflow-hidden border-b border-border px-5 py-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="space-y-0 p-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="hidden h-6 w-16 rounded-full md:block" />
            <Skeleton className="hidden h-6 w-20 rounded-full lg:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
