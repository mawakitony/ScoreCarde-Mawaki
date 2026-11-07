import { Skeleton } from "@/components/ui/skeleton"

export default function ScorecardDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-5 w-40" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}
