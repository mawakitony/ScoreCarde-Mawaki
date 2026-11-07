import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function UndeterminedPriceBanner({
  count,
  href = "/platform/subscriptions?price=unknown",
  className,
}: {
  count: number
  href?: string
  className?: string
}) {
  if (count <= 0) return null
  return (
    <div
      className={cn(
        WS_PANEL,
        "flex flex-wrap items-center justify-between gap-3 border-amber-200/80 bg-amber-50/70 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-amber-950">
            {count} abonnement{count > 1 ? "s" : ""} sans prix connu
          </p>
          <p className="text-[12px] text-amber-900/80">
            Exclus du MRR calculable — jamais comptés comme 0 $.
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
      >
        Voir la liste
      </Link>
    </div>
  )
}
