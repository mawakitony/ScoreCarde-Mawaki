import Link from "next/link"
import { notFound } from "next/navigation"
import { BarChart3, Pencil, Settings2 } from "lucide-react"
import { ShareScorecardButton } from "@/components/scorecard/share-scorecard"
import { ScorecardForm } from "@/components/scorecard/scorecard-form"
import { StatusBadge } from "@/components/scorecard/status-badge"
import { Button } from "@/components/ui/button"
import { loadScorecardShare } from "@/actions/share"
import { updateScorecard } from "@/actions/scorecards"
import { can } from "@/lib/auth/permissions"
import { ensureMembership } from "@/lib/data/membership"
import { getScorecard } from "@/lib/data/scorecards"
import { formatDate } from "@/lib/format"
import { toScorecardFormValues } from "@/lib/scorecard/values"
import { WS_FOCUS, WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await ensureMembership()
  const scorecard = membership ? await getScorecard(membership.organization.id, id) : null
  return { title: scorecard?.name ?? "Scorecard" }
}

export default async function ScorecardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await ensureMembership()
  if (!membership) return null
  const scorecard = await getScorecard(membership.organization.id, id)
  if (!scorecard) notFound()
  const editor = can({ role: membership.role }, "scorecard.edit")
  const share = await loadScorecardShare(scorecard.id)

  return (
    <div className="space-y-4">
      <header className={cn(WS_PANEL, "p-5 md:p-6")}>
        <Link href="/dashboard/scorecards" className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", WS_LINK)}>
          ← Scorecards
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={cn(WS_ICON_CHIP, "size-11 rounded-2xl")}>
              <Settings2 className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
                {scorecard.name}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px] text-muted-foreground">
                <StatusBadge status={scorecard.status} />
                <span>Créée le {formatDate(scorecard.created_at)}</span>
                {share.ok && share.shareable ? <span className="break-all">{share.url}</span> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareScorecardButton scorecardId={scorecard.id} />
            <Button asChild className={cn("h-10 rounded-xl", WS_FOCUS)} variant="outline">
              <Link href={`/dashboard/scorecards/${scorecard.id}/analytics`}>
                <BarChart3 className="size-4" aria-hidden />
                Analytics
              </Link>
            </Button>
            <Button
              asChild
              className={cn(
                "h-10 rounded-xl bg-[color:var(--brand-950)] text-white",
                "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
                WS_FOCUS,
              )}
            >
              <Link href={`/dashboard/scorecards/${scorecard.id}/builder`}>
                <Pencil className="size-4" aria-hidden />
                Ouvrir le builder
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {editor ? (
        <div className={cn(WS_PANEL, "p-5 md:p-6")}>
          <h2 className="text-base font-semibold text-foreground">Paramètres</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Identité, statut et métadonnées de la scorecard.
          </p>
          <div className="mt-5">
            <ScorecardForm
              defaultValues={toScorecardFormValues(scorecard)}
              organizationId={membership.organization.id}
              scorecardId={scorecard.id}
              submitLabel="Enregistrer"
              onSubmit={updateScorecard.bind(null, scorecard.id)}
            />
          </div>
        </div>
      ) : (
        <p className={cn(WS_PANEL, "p-5 text-sm text-muted-foreground md:p-6")}>
          Votre rôle permet de consulter cette scorecard, pas de la modifier.
        </p>
      )}
    </div>
  )
}
