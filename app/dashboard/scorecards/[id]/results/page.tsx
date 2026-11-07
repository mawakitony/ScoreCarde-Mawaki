import Link from "next/link"
import { notFound } from "next/navigation"
import { ListChecks } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ensureMembership } from "@/lib/data/membership"
import { getScorecard } from "@/lib/data/scorecards"
import { Button } from "@/components/ui/button"
import { WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Résultats" }

export default async function ScorecardResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await ensureMembership()
  if (!membership) return null
  const scorecard = await getScorecard(membership.organization.id, id)
  if (!scorecard) notFound()

  return (
    <div className="space-y-4">
      <header className={cn(WS_PANEL, "p-5 md:p-6")}>
        <Link href={`/dashboard/scorecards/${scorecard.id}`} className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", WS_LINK)}>
          ← {scorecard.name}
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-11 rounded-2xl")}>
            <ListChecks className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
              Résultats
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Réponses individuelles et scores par participant.
            </p>
          </div>
        </div>
      </header>
      <div className={cn(WS_PANEL, "p-5 md:p-6")}>
        <EmptyState
          title="Aucun résultat individuel"
          description="Les réponses, scores par catégorie et la timeline de chaque participant seront consultables ici après l'expérience publique."
        />
        <Button asChild variant="outline" className="mt-4 h-10 rounded-xl">
          <Link href={`/dashboard/scorecards/${scorecard.id}`}>Retour à la fiche</Link>
        </Button>
      </div>
    </div>
  )
}
