import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AmbientHalo } from "@/components/dashboard/ambient-halo"
import { WS_ENTER, WS_FOCUS, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function WelcomeBanner({
  name,
  organizationName,
  periodLabel,
  primaryHref,
  primaryLabel,
  welcomeFlash,
}: {
  name: string | null
  organizationName: string
  periodLabel: string
  primaryHref: string
  primaryLabel: string
  welcomeFlash?: boolean
}) {
  const greeting = name?.trim() ? `Bonjour, ${name.trim().split(/\s+/)[0]}` : "Bienvenue"
  return (
    <section className={cn(WS_PANEL, WS_ENTER, "relative overflow-hidden p-5 md:p-6")}>
      <AmbientHalo />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
            {organizationName}
          </p>
          <h1 className="mt-1.5 text-[26px] leading-tight font-semibold tracking-tight text-foreground md:text-[30px]">
            {greeting}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {welcomeFlash
              ? `Votre accès à ${organizationName} est prêt. Voici les indicateurs de ${periodLabel}.`
              : `Indicateurs réels pour ${periodLabel}. Toutes les métriques ci-dessous respectent ce filtre.`}
          </p>
        </div>
        <Link
          href={primaryHref}
          className={cn(
            "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-semibold",
            "bg-[color:var(--brand-950)] text-white transition-[transform,background-color,opacity] duration-200",
            "hover:opacity-92 active:scale-[0.98]",
            "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
            WS_FOCUS,
          )}
        >
          {primaryLabel}
          <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
      <span
        aria-hidden
        className="dash-breath pointer-events-none absolute bottom-4 left-6 size-2 rounded-full bg-[color:var(--brand-300)]/75"
      />
    </section>
  )
}
