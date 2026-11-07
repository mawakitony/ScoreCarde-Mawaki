import Link from "next/link"
import { FileQuestion, LayoutTemplate, Search } from "lucide-react"
import { CreateScorecardDialog } from "@/components/scorecard/create-scorecard-dialog"
import { ScorecardsTable } from "@/components/scorecard/scorecards-table"
import { can } from "@/lib/auth/permissions"
import { ensureMembership } from "@/lib/data/membership"
import { listScorecards } from "@/lib/data/scorecards"
import { WS_ENTER, WS_FOCUS, WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Scorecards" }

export default async function ScorecardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const membership = await ensureMembership()
  if (!membership) return null

  const { scorecards, error } = await listScorecards(membership.organization.id, params.q)
  const count = scorecards.length
  const canCreate = can({ role: membership.role }, "scorecard.edit")

  return (
    <div className={cn(WS_PANEL, "overflow-hidden")}>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
            <FileQuestion className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
              Scorecards
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {count} scorecard{count > 1 ? "s" : ""}
              {params.q ? ` · Résultats pour « ${params.q} »` : " · Bibliothèque de questionnaires"}
            </p>
          </div>
        </div>
        {canCreate ? <CreateScorecardDialog /> : null}
      </div>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 md:flex-row md:items-center md:px-5">
        <form action="/dashboard/scorecards" className="relative w-full md:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Rechercher une scorecard"
            aria-label="Rechercher une scorecard"
            className={cn(
              "h-9 w-full rounded-xl border border-border bg-background pr-3 pl-9 text-[13px] outline-none",
              "transition-[border-color,box-shadow] focus:border-[color:var(--brand-500)] focus:ring-2 focus:ring-[color:var(--brand-500)]/25",
            )}
          />
        </form>
        {params.q ? (
          <Link href="/dashboard/scorecards" className={cn("text-[12px]", WS_LINK)}>
            Effacer la recherche
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="px-5 py-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {scorecards.length === 0 && !error ? (
        <div className={cn(WS_ENTER, "px-4 py-12 text-center md:px-5")}>
          <span className={cn(WS_ICON_CHIP, "mx-auto size-12 rounded-2xl")}>
            <LayoutTemplate className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">
            {params.q ? "Aucun résultat" : "Aucune scorecard"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {params.q ? "Essayez un autre nom." : "Créez une scorecard ou partez d'un modèle WOLOYEM."}
          </p>
          {!params.q ? (
            <Link
              className={cn(
                "mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[color:var(--brand-950)] px-4 text-sm font-semibold text-white",
                "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
                WS_FOCUS,
              )}
              href="/dashboard/templates"
            >
              <LayoutTemplate className="size-4" aria-hidden />
              Partir d&apos;un modèle
            </Link>
          ) : null}
        </div>
      ) : (
        <ScorecardsTable items={scorecards} />
      )}
    </div>
  )
}
