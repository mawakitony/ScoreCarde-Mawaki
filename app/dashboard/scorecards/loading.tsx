import { Skeleton } from "@/components/ui/skeleton"

export default function ScorecardsLoading() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <div className="border-b border-border px-5 py-4">
        <Skeleton className="h-10 max-w-sm rounded-full" />
      </div>
      <div className="space-y-0 px-5 py-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="my-3 h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
