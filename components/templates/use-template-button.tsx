"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { createScorecardFromTemplate } from "@/actions/scorecards"
import { Button } from "@/components/ui/button"
import { WS_FOCUS } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export function UseTemplateButton({ templateId, disabled }: { templateId: string; disabled: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      className={cn(
        "h-9 rounded-xl bg-[color:var(--brand-950)] text-white",
        "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
        WS_FOCUS,
      )}
      disabled={disabled || pending}
      onClick={() => {
        if (pending) return
        startTransition(() => {
          void createScorecardFromTemplate(templateId).then((result) => {
            if (result.error) {
              toast.error(result.error)
              return
            }
            toast.success("Brouillon créé — ouverture du builder.")
            if (result.id) router.push(`/dashboard/scorecards/${result.id}/builder`)
          })
        })
      }}
    >
      {pending ? (
        "Création…"
      ) : (
        <>
          Créer à partir de ce modèle
          <ArrowRight className="size-3.5" aria-hidden />
        </>
      )}
    </Button>
  )
}
