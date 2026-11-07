import { Skeleton } from "@/components/ui/skeleton"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export default function LeadDetailLoading() {
  return (
    <div className="space-y-4">
      <div className={cn(WS_PANEL, "p-5 md:p-6")}>
        <Skeleton className="h-3 w-16" />
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="size-14 rounded-full md:size-16" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Skeleton className={cn(WS_PANEL, "h-48")} />
          <Skeleton className={cn(WS_PANEL, "h-40")} />
          <Skeleton className={cn(WS_PANEL, "h-56")} />
        </div>
        <div className="space-y-4 xl:col-span-4">
          <Skeleton className={cn(WS_PANEL, "h-64")} />
          <Skeleton className={cn(WS_PANEL, "h-40")} />
        </div>
      </div>
    </div>
  )
}
