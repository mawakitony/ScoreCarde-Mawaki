import { Skeleton } from "@/components/ui/skeleton"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      <div className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </div>
      <div className={cn(WS_PANEL, "overflow-hidden")}>
        <div className="flex gap-2 border-b border-border px-5 py-3.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-border">
              <Skeleton className="h-56 w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28 rounded-xl" />
                  <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
