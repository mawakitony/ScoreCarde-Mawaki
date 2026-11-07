"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { createScorecardFromVisualTheme } from "@/actions/scorecards"
import { ScaledThemeFrame } from "@/components/templates/scaled-theme-frame"
import type { VisualThemeDefinition } from "@/lib/scorecard-themes/types"
import { WS_ENTER, WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

const DESIGN_WIDTH = 1280
const DESIGN_HEIGHT = 820

export function VisualTemplateCard({
  theme,
  canCreate,
  index = 0,
}: {
  theme: VisualThemeDefinition
  canCreate: boolean
  index?: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function useTheme() {
    if (!canCreate || pending) return
    startTransition(() => {
      void createScorecardFromVisualTheme(theme.id).then((result) => {
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success("Modèle appliqué — ouverture du builder.")
        if (result.id) router.push(`/dashboard/scorecards/${result.id}/builder?step=landing`)
      })
    })
  }

  return (
    <article
      className={cn(
        WS_ENTER,
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-[color:var(--surface-elevated)] shadow-[var(--shadow-panel)]",
        "motion-safe:transition-[transform,border-color,box-shadow] motion-safe:duration-200",
        "motion-safe:hover:-translate-y-0.5 hover:border-[color:var(--brand-500)]/30",
      )}
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
    >
      <Link
        href={`/dashboard/templates/preview/${theme.id}`}
        className={cn(
          "relative block aspect-[16/11] w-full overflow-hidden border-b border-border text-left",
          "min-h-[240px] sm:min-h-[280px] md:min-h-[320px]",
          WS_FOCUS,
        )}
        style={{ backgroundColor: theme.backgroundColor }}
        aria-label={`Prévisualiser ${theme.name}`}
      >
        <ScaledThemeFrame
          themeId={theme.id}
          title={`Miniature ${theme.name}`}
          designWidth={DESIGN_WIDTH}
          designHeight={DESIGN_HEIGHT}
          backgroundColor={theme.backgroundColor}
          className="pointer-events-none absolute inset-0 motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.02]"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-3 py-3 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:opacity-100">
          <Eye className="size-3.5" aria-hidden />
          Prévisualiser
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
            {theme.category}
          </p>
          <span
            className="mt-0.5 size-2.5 shrink-0 rounded-full ring-2 ring-border"
            style={{ backgroundColor: theme.accentColor }}
            aria-hidden
          />
        </div>
        <h2 className="mt-2 text-[1.15rem] font-semibold tracking-tight text-foreground">{theme.name}</h2>
        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">{theme.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/templates/preview/${theme.id}`}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3.5 text-[12px] font-semibold text-foreground",
              "hover:bg-muted/60",
              WS_FOCUS,
            )}
          >
            <Eye className="size-3.5" aria-hidden />
            Prévisualiser
          </Link>
          <Link
            href={`/theme-preview/${theme.id}`}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3.5 text-[12px] font-semibold text-foreground",
              "hover:bg-muted/60",
              WS_FOCUS,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Page complète
          </Link>
          <button
            type="button"
            disabled={!canCreate || pending}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl bg-[color:var(--brand-950)] px-3.5 text-[12px] font-semibold text-white",
              "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
              WS_FOCUS,
              (!canCreate || pending) && "opacity-50",
            )}
            onClick={useTheme}
          >
            {pending ? "Création…" : "Utiliser ce modèle"}
            {!pending ? <ArrowRight className="size-3.5" aria-hidden /> : null}
          </button>
        </div>
      </div>
    </article>
  )
}
