"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { createScorecardFromVisualTheme } from "@/actions/scorecards"
import { WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function UseVisualThemeButton({
  themeId,
  className,
}: {
  themeId: string
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl bg-[color:var(--brand-950)] px-3.5 text-[12px] font-semibold text-white",
        "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
        WS_FOCUS,
        pending && "opacity-50",
        className,
      )}
      onClick={() => {
        startTransition(() => {
          void createScorecardFromVisualTheme(themeId).then((result) => {
            if (result.error) {
              toast.error(result.error)
              return
            }
            toast.success("Modèle appliqué — ouverture du builder.")
            if (result.id) router.push(`/dashboard/scorecards/${result.id}/builder?step=landing`)
          })
        })
      }}
    >
      {pending ? "Création…" : "Utiliser ce modèle"}
      {!pending ? <ArrowRight className="size-3.5" aria-hidden /> : null}
    </button>
  )
}
