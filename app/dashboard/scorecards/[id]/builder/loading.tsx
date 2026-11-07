import { Skeleton } from "@/components/ui/skeleton"

export default function BuilderLoading() {
  return (
    <div className="-mx-4 -my-5 flex min-h-[calc(100dvh-3.75rem)] flex-col bg-background md:-mx-6 md:-my-6">
      <div className="border-b border-border bg-card px-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid flex-1 gap-3 p-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-[32rem] rounded-2xl" />
      </div>
    </div>
  )
}
