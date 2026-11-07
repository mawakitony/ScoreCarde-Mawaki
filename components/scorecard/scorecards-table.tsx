"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Copy,
  Eye,
  FileQuestion,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Share2,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { deleteScorecard, duplicateScorecard, setScorecardStatus } from "@/actions/scorecards"
import { StatusBadge } from "@/components/scorecard/status-badge"
import { ShareScorecardDialog } from "@/components/scorecard/share-scorecard"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getAppUrl } from "@/lib/env"
import { formatDate, formatNumber, formatPercent } from "@/lib/format"
import { WS_ENTER, WS_FOCUS, WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"
import type { ScorecardListItem } from "@/lib/data/scorecards"
import type { ScorecardStatus } from "@/types/database"

const STATUS_FILTERS: { id: "all" | ScorecardStatus; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "published", label: "Publiées" },
  { id: "draft", label: "Brouillons" },
  { id: "paused", label: "En pause" },
  { id: "archived", label: "Archivées" },
]

export function ScorecardsTable({ items }: { items: ScorecardListItem[] }) {
  const [statusFilter, setStatusFilter] = useState<"all" | ScorecardStatus>("all")
  const filtered = useMemo(
    () => (statusFilter === "all" ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  )

  return (
    <div className="space-y-4 p-4 md:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par statut">
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.id
          const count =
            filter.id === "all" ? items.length : items.filter((item) => item.status === filter.id).length
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors",
                WS_FOCUS,
                active
                  ? "border-[color:var(--brand-500)]/40 bg-[color:var(--brand-500)]/10 text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {filter.label}
              <span className="tabular-nums text-[11px] opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[13px] text-muted-foreground">
          Aucune scorecard pour ce statut.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => (
            <li key={item.id} className={WS_ENTER} style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
              <ScorecardCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ScorecardCard({ item }: { item: ScorecardListItem }) {
  return (
    <article
      className={cn(
        WS_PANEL,
        "group flex h-full flex-col p-4 transition-[transform,border-color,box-shadow] duration-200",
        "motion-safe:hover:-translate-y-0.5 hover:border-[color:var(--brand-500)]/30",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
          <FileQuestion className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/dashboard/scorecards/${item.id}`}
                className="block truncate text-[14px] font-semibold text-foreground hover:text-[color:var(--brand-500)]"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">/s/{item.slug}</p>
            </div>
            <ScorecardActions item={item} />
          </div>
          <div className="mt-2.5">
            <StatusBadge status={item.status} />
          </div>
        </div>
      </div>

      {item.description ? (
        <p className="mt-3 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{item.description}</p>
      ) : (
        <p className="mt-3 text-[13px] text-muted-foreground/70 italic">Aucune description</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
        <Metric icon={Users} label="Participants" value={formatNumber(item.participants)} />
        <Metric icon={BarChart3} label="Conversion" value={formatPercent(item.conversionRate)} />
        <Metric label="Résultats" value={formatNumber(item.results)} />
        <Metric label="Créée" value={formatDate(item.created_at)} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button asChild size="sm" className="h-8 rounded-lg text-[12px]">
          <Link href={`/dashboard/scorecards/${item.id}/builder`}>
            <Pencil className="size-3.5" aria-hidden />
            Builder
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-[12px]">
          <Link href={`/dashboard/scorecards/${item.id}`}>Ouvrir</Link>
        </Button>
      </div>
    </article>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Users
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <dt className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {Icon ? <Icon className="size-3 opacity-70" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

function ScorecardActions({ item }: { item: ScorecardListItem }) {
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const paused = item.status === "paused" || item.status === "archived"
  const previewUrl = `${getAppUrl()}/s/${item.slug}?preview=1`

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg"
            aria-label={`Actions pour ${item.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl border-border shadow-[var(--shadow-panel)]">
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/scorecards/${item.id}/builder`)}>
            <Pencil className="size-4" /> Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}>
            <Eye className="size-4" /> Aperçu
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/scorecards/${item.id}/results`)}>
            <BarChart3 className="size-4" /> Résultats
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/scorecards/${item.id}/analytics`)}>
            <BarChart3 className="size-4" /> Analytics
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void duplicateScorecard(item.id).then((result) => {
                if (result.error) toast.error(result.error)
                else {
                  toast.success("Scorecard dupliquée.")
                  router.refresh()
                }
              })
            }}
          >
            <Copy className="size-4" /> Dupliquer
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShareOpen(true)}>
            <Share2 className="size-4" /> Partager
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void setScorecardStatus(item.id, paused ? "published" : "paused").then((result) => {
                if (result.error) toast.error(result.error)
                else {
                  toast.success(paused ? "Scorecard réactivée." : "Scorecard mise en pause.")
                  router.refresh()
                }
              })
            }}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {paused ? "Réactiver" : "Mettre en pause"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setOpen(true)}>
            <Trash2 className="size-4" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareScorecardDialog
        scorecardId={item.id}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onReturnFocus={() => triggerRef.current?.focus()}
      />

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette scorecard ?</AlertDialogTitle>
            <AlertDialogDescription>
              {item.name} et ses questions, résultats et pages associés seront supprimés. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                void deleteScorecard(item.id)
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** Kept for any external imports expecting the clear-search helper link style. */
export const scorecardsClearSearchClass = WS_LINK
