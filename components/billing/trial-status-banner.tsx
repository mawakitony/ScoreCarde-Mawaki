import Link from "next/link"
import { formatTrialDaysLabel } from "@/lib/billing/workspace-access-policy"
import { WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function TrialStatusBanner({
  daysRemaining,
  trialEndLabel,
}: {
  daysRemaining: number
  trialEndLabel: string
}) {
  const urgent = daysRemaining <= 3
  return (
    <section
      role="status"
      aria-live="polite"
      data-testid="trial-status-banner"
      className={cn(
        WS_PANEL,
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5",
        urgent
          ? "border-amber-500/35 bg-amber-500/8"
          : "border-[color:var(--brand-500)]/25 bg-[color:var(--brand-500)]/6",
      )}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{formatTrialDaysLabel(daysRemaining)}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Votre essai WOLOYEM Score se termine le {trialEndLabel}. Aucune carte bancaire n&apos;est requise
          pendant l&apos;essai.
        </p>
      </div>
      <Link
        href="/dashboard/settings/billing"
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-[13px] font-semibold",
          "bg-[color:var(--brand-950)] text-white hover:opacity-92",
          "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
        )}
      >
        Voir la facturation
      </Link>
    </section>
  )
}
