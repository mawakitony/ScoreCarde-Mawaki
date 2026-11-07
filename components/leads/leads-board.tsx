"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Download, Filter, Search, SlidersHorizontal, Users } from "lucide-react"
import { assignTagToLeads, changeLeadsStatus, changeLeadStatus } from "@/actions/leads"
import {
  LEAD_STATUS_LABELS,
  LEAD_TEMPERATURE_LABELS,
  LeadScoreBadge,
  LeadStatusBadge,
  LeadTemperatureBadge,
} from "@/components/leads/lead-badges"
import { LeadAvatar } from "@/components/leads/lead-avatar"
import { LeadDeleteDialog } from "@/components/leads/lead-delete"
import { LeadRowActions } from "@/components/leads/lead-row-actions"
import { placeFilterPanel } from "@/lib/leads/filter-panel-position"
import { filtersToSearch, LEAD_SORTS, PAGE_SIZES, type LeadFilters } from "@/lib/leads/filters"
import { LEAD_STATUSES, LEAD_TEMPERATURES } from "@/lib/leads/qualification"
import { formatDate } from "@/lib/format"
import { WS_ENTER, WS_FOCUS, WS_ICON_CHIP, WS_LINK } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

type Tag = { id: string; name: string; color: string }
type Row = {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp?: string | null
  company?: string | null
  /** Authorized photo URL only — not populated without a stored CRM field. */
  avatarUrl?: string | null
  country: string | null
  score: number | null
  temperature: string
  status: string
  scorecard: string | null
  utm_source: string | null
  created_at: string
  tags: Tag[]
}

export function LeadsBoard({
  rows,
  total,
  filters,
  facets,
  canEdit,
  canExport,
  canDelete,
  error,
}: {
  rows: Row[]
  total: number
  filters: LeadFilters
  facets: {
    tags: Tag[]
    ranges: { id: string; label: string }[]
    countries: string[]
    sources: string[]
    campaigns: string[]
    scorecards: { id: string; name: string }[]
  }
  canEdit: boolean
  canExport: boolean
  canDelete: boolean
  error: string | null
}) {
  const router = useRouter()
  const [query, setQuery] = useState(filters.query)
  const [selected, setSelected] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null)
  const [message, setMessage] = useState("")
  const pages = Math.max(1, Math.ceil(total / filters.size))
  const exportParams = filtersToSearch({ ...filters, page: 1, ids: [] })
  const pageIds = rows.map((row) => row.id)
  const pageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const selectionLabel = `${selected.length} lead${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`
  const active = Boolean(
    filters.query ||
      filters.status ||
      filters.temperature ||
      filters.scorecardId ||
      filters.country ||
      filters.tagId ||
      filters.resultRangeId ||
      filters.scoreMin !== null ||
      filters.scoreMax !== null ||
      filters.from ||
      filters.to ||
      filters.utmSource ||
      filters.utmCampaign ||
      filters.cta,
  )

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query === filters.query) return
      push({ ...filters, query, page: 1 })
    }, 300)
    return () => clearTimeout(handle)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  function push(next: LeadFilters) {
    const params = filtersToSearch(next)
    router.push(params.size ? `/dashboard/leads?${params}` : "/dashboard/leads")
  }

  function update(partial: Partial<LeadFilters>) {
    push({ ...filters, ...partial, page: 1, ids: [] })
  }

  function selectPage(checked: boolean) {
    setSelected((current) => {
      if (!checked) return current.filter((id) => !pageIds.includes(id))
      return [...new Set([...current, ...pageIds])]
    })
  }

  async function run(action: () => Promise<{ error?: string; ok?: true }>) {
    const result = await action()
    setMessage(result.error ?? "")
    if (!result.error) {
      setSelected([])
      router.refresh()
    }
  }

  const from = total === 0 ? 0 : (filters.page - 1) * filters.size + 1
  const to = Math.min(total, filters.page * filters.size)

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 md:flex-row md:items-center md:px-5">
        <div className="relative w-full md:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un lead"
            aria-label="Rechercher un lead"
            className={cn(
              "h-9 w-full rounded-xl border border-border bg-background pr-3 pl-9 text-[13px] outline-none",
              "transition-[border-color,box-shadow] focus:border-[color:var(--brand-500)] focus:ring-2 focus:ring-[color:var(--brand-500)]/25",
            )}
          />
        </div>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {canExport ? (
            <a
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-semibold text-foreground",
                "hover:bg-muted/60",
                WS_FOCUS,
              )}
              href={`/dashboard/leads/export?${exportParams}`}
            >
              <Download className="size-3.5" aria-hidden />
              Exporter le filtre
            </a>
          ) : null}
          {canExport ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV file route
            <a
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-semibold text-foreground",
                "hover:bg-muted/60",
                WS_FOCUS,
              )}
              href="/dashboard/leads/export"
            >
              <Download className="size-3.5" aria-hidden />
              Exporter tout
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-3 md:px-5">
        <span className="mr-1 hidden shrink-0 text-muted-foreground sm:inline" aria-hidden>
          <SlidersHorizontal className="size-3.5" />
        </span>
        <FilterPill
          label="Scorecard"
          active={Boolean(filters.scorecardId)}
          summary={facets.scorecards.find((item) => item.id === filters.scorecardId)?.name}
        >
          <Select
            label="Scorecard"
            value={filters.scorecardId ?? ""}
            onChange={(value) => update({ scorecardId: value || null })}
            options={facets.scorecards.map((item) => ({ value: item.id, label: item.name }))}
          />
        </FilterPill>
        <FilterPill
          label="Statut"
          active={Boolean(filters.status)}
          summary={filters.status ? LEAD_STATUS_LABELS[filters.status] : undefined}
        >
          <Select
            label="Statut"
            value={filters.status ?? ""}
            onChange={(value) => update({ status: LEAD_STATUSES.find((item) => item === value) ?? null })}
            options={LEAD_STATUSES.map((item) => ({ value: item, label: LEAD_STATUS_LABELS[item] ?? item }))}
          />
        </FilterPill>
        <FilterPill
          label="Température"
          active={Boolean(filters.temperature)}
          summary={filters.temperature ? LEAD_TEMPERATURE_LABELS[filters.temperature] : undefined}
        >
          <Select
            label="Température"
            value={filters.temperature ?? ""}
            onChange={(value) =>
              update({ temperature: LEAD_TEMPERATURES.find((item) => item === value) ?? null })
            }
            options={LEAD_TEMPERATURES.map((item) => ({
              value: item,
              label: LEAD_TEMPERATURE_LABELS[item] ?? item,
            }))}
          />
        </FilterPill>
        <FilterPill label="Pays" active={Boolean(filters.country)} summary={filters.country ?? undefined}>
          <Select
            label="Pays"
            value={filters.country ?? ""}
            onChange={(value) => update({ country: value || null })}
            options={facets.countries.map((item) => ({ value: item, label: item }))}
          />
        </FilterPill>
        <FilterPill
          label="Tag"
          active={Boolean(filters.tagId)}
          summary={facets.tags.find((item) => item.id === filters.tagId)?.name}
        >
          <Select
            label="Tag"
            value={filters.tagId ?? ""}
            onChange={(value) => update({ tagId: value || null })}
            options={facets.tags.map((item) => ({ value: item.id, label: item.name }))}
          />
        </FilterPill>
        <FilterPill
          label="Résultat"
          active={Boolean(filters.resultRangeId)}
          summary={facets.ranges.find((item) => item.id === filters.resultRangeId)?.label}
        >
          <Select
            label="Résultat"
            value={filters.resultRangeId ?? ""}
            onChange={(value) => update({ resultRangeId: value || null })}
            options={facets.ranges.map((item) => ({ value: item.id, label: item.label }))}
          />
        </FilterPill>
        <FilterPill
          label="Source"
          active={Boolean(filters.utmSource)}
          summary={filters.utmSource ?? undefined}
        >
          <Select
            label="Source"
            value={filters.utmSource ?? ""}
            onChange={(value) => update({ utmSource: value || null })}
            options={facets.sources.map((item) => ({ value: item, label: item }))}
          />
        </FilterPill>
        <FilterPill
          label="Campagne"
          active={Boolean(filters.utmCampaign)}
          summary={filters.utmCampaign ?? undefined}
        >
          <Select
            label="Campagne"
            value={filters.utmCampaign ?? ""}
            onChange={(value) => update({ utmCampaign: value || null })}
            options={facets.campaigns.map((item) => ({ value: item, label: item }))}
          />
        </FilterPill>
        <FilterPill
          label="CTA"
          active={Boolean(filters.cta)}
          summary={filters.cta === "clicked" ? "Cliqué" : filters.cta === "not_clicked" ? "Sans clic" : undefined}
        >
          <Select
            label="CTA"
            value={filters.cta ?? ""}
            onChange={(value) =>
              update({ cta: value === "clicked" || value === "not_clicked" ? value : null })
            }
            options={[
              { value: "clicked", label: "CTA cliqué" },
              { value: "not_clicked", label: "Sans clic" },
            ]}
          />
        </FilterPill>
        <FilterPill
          label="Tri"
          active={filters.sort !== "newest"}
          summary={filters.sort !== "newest" ? filters.sort : undefined}
        >
          <Select
            label="Tri"
            value={filters.sort}
            onChange={(value) => update({ sort: LEAD_SORTS.find((item) => item === value) ?? "newest" })}
            options={[
              { value: "newest", label: "Plus récents" },
              { value: "oldest", label: "Plus anciens" },
              { value: "score_desc", label: "Score décroissant" },
              { value: "score_asc", label: "Score croissant" },
              { value: "name", label: "Nom" },
              { value: "country", label: "Pays" },
            ]}
            empty={false}
          />
        </FilterPill>
        <FilterPill label="Score" active={filters.scoreMin !== null || filters.scoreMax !== null}>
          <label className="block text-[11px] font-medium text-muted-foreground">
            Min
            <input
              defaultValue={filters.scoreMin ?? ""}
              inputMode="decimal"
              aria-label="Score minimum"
              className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px]"
              onBlur={(event) =>
                update({ scoreMin: event.target.value === "" ? null : Number(event.target.value) })
              }
            />
          </label>
          <label className="mt-2 block text-[11px] font-medium text-muted-foreground">
            Max
            <input
              defaultValue={filters.scoreMax ?? ""}
              inputMode="decimal"
              aria-label="Score maximum"
              className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px]"
              onBlur={(event) =>
                update({ scoreMax: event.target.value === "" ? null : Number(event.target.value) })
              }
            />
          </label>
        </FilterPill>
        <FilterPill label="Période" active={Boolean(filters.from || filters.to)}>
          <label className="block text-[11px] font-medium text-muted-foreground">
            Du
            <input
              type="date"
              defaultValue={filters.from ?? ""}
              aria-label="Date de début"
              className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px]"
              onChange={(event) => update({ from: event.target.value || null })}
            />
          </label>
          <label className="mt-2 block text-[11px] font-medium text-muted-foreground">
            Au
            <input
              type="date"
              defaultValue={filters.to ?? ""}
              aria-label="Date de fin"
              className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px]"
              onChange={(event) => update({ to: event.target.value || null })}
            />
          </label>
        </FilterPill>
        {active ? (
          <Link
            className={cn("inline-flex h-8 shrink-0 items-center px-2 text-[12px]", WS_LINK)}
            href="/dashboard/leads"
          >
            Effacer
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="px-5 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="px-5 py-3 text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-3 md:px-5">
          <span className="text-[13px] font-medium text-foreground">{selectionLabel}</span>
          {canExport ? (
            <a className={cn("text-[13px]", WS_LINK)} href={`/dashboard/leads/export?ids=${selected.join(",")}`}>
              Exporter la sélection
            </a>
          ) : null}
          {canEdit ? (
            <>
              <select
                aria-label="Changer le statut"
                className="h-9 rounded-xl border border-border bg-background px-2 text-[13px]"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) void run(() => changeLeadsStatus(selected, event.target.value))
                }}
              >
                <option value="">Changer le statut</option>
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <select
                aria-label="Ajouter un tag"
                className="h-9 rounded-xl border border-border bg-background px-2 text-[13px]"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) void run(() => assignTagToLeads(selected, event.target.value))
                }}
              >
                <option value="">Ajouter un tag</option>
                {facets.tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          {canDelete ? (
            <button
              className="text-[13px] font-semibold text-destructive underline-offset-2 hover:underline"
              type="button"
              onClick={() => setPendingDelete(selected)}
            >
              Supprimer la sélection
            </button>
          ) : null}
          <button
            className={cn("text-[13px]", WS_LINK)}
            type="button"
            onClick={() => setSelected([])}
          >
            Désélectionner
          </button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className={cn(WS_ENTER, "px-4 py-12 text-center md:px-5")}>
          <span className={cn(WS_ICON_CHIP, "mx-auto size-12 rounded-2xl")}>
            {active ? <Filter className="size-5" aria-hidden /> : <Users className="size-5" aria-hidden />}
          </span>
          <p className="mt-4 text-base font-semibold text-foreground">
            {active ? "Aucun résultat" : "Aucun lead"}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {active
              ? "Aucun lead ne correspond à ces filtres."
              : "Ils apparaissent ici dès qu'un participant termine une évaluation."}
          </p>
          {active ? (
            <Link className={cn("mt-4 inline-block text-[13px]", WS_LINK)} href="/dashboard/leads">
              Effacer les filtres
            </Link>
          ) : (
            <Link className={cn("mt-4 inline-block text-[13px]", WS_LINK)} href="/dashboard/scorecards">
              Ouvrir une scorecard
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {rows.map((row, index) => (
              <article
                key={row.id}
                className={cn(
                  WS_ENTER,
                  "rounded-2xl border border-border bg-[color:var(--surface-elevated)] p-4 shadow-[var(--shadow-panel)]",
                  "motion-safe:transition-[border-color,box-shadow] hover:border-[color:var(--brand-500)]/30",
                )}
                style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
              >
                <div className="flex items-start gap-3">
                  <label className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${row.name}`}
                      className="size-4 rounded border-border"
                      checked={selected.includes(row.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, row.id]
                            : current.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </label>
                  <LeadAvatar name={row.name} email={row.email} src={row.avatarUrl} id={row.id} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        className="truncate text-[14px] font-semibold text-foreground hover:text-[color:var(--brand-500)]"
                        href={`/dashboard/leads/${row.id}`}
                      >
                        {row.name || "Lead"}
                      </Link>
                      <LeadTemperatureBadge value={row.temperature} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {row.email || row.phone || "—"}
                    </p>
                    {row.company ? (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                        <Building2 className="size-3 shrink-0 opacity-70" aria-hidden />
                        {row.company}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <LeadStatusBadge value={row.status} />
                      <LeadScoreBadge score={row.score} />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {row.scorecard || "—"} · {row.utm_source || "direct"} · {formatDate(row.created_at)}
                    </p>
                    <LeadRowActions
                      className="mt-3 justify-start"
                      leadId={row.id}
                      name={row.name}
                      email={row.email}
                      phone={row.phone}
                      whatsapp={row.whatsapp}
                      canDelete={canDelete}
                      onDelete={canDelete ? () => setPendingDelete([row.id]) : undefined}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1080px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/25">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Sélectionner la page"
                      className="size-4 rounded border-border"
                      checked={pageSelected}
                      onChange={(event) => selectPage(event.target.checked)}
                    />
                  </th>
                  {[
                    "Lead",
                    "Entreprise",
                    "Pays",
                    "Score",
                    "Température",
                    "Statut",
                    "Scorecard",
                    "Source",
                    "Date",
                    "Actions",
                  ].map((label) => (
                    <th
                      key={label}
                      className={cn(
                        "px-3 py-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase",
                        label === "Actions" && "text-right",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 last:border-0 motion-safe:transition-colors hover:bg-muted/35"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${row.name}`}
                        className="size-4 rounded border-border"
                        checked={selected.includes(row.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, row.id]
                              : current.filter((id) => id !== row.id),
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <LeadAvatar
                          name={row.name}
                          email={row.email}
                          src={row.avatarUrl}
                          id={row.id}
                          size="md"
                        />
                        <div className="min-w-0">
                          <Link
                            className="block truncate font-semibold text-foreground hover:text-[color:var(--brand-500)]"
                            href={`/dashboard/leads/${row.id}`}
                          >
                            {row.name || "Lead"}
                          </Link>
                          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                            {row.email || "—"}
                          </p>
                          {row.tags.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {row.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                                  style={{ background: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle text-muted-foreground">
                      {row.company || "—"}
                    </td>
                    <td className="px-3 py-3.5 align-middle text-muted-foreground">
                      {row.country || "—"}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <LeadScoreBadge score={row.score} />
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <LeadTemperatureBadge value={row.temperature} />
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      {canEdit ? (
                        <select
                          aria-label={`Statut de ${row.name}`}
                          className="h-9 max-w-[9.5rem] rounded-xl border border-border bg-background px-2 text-[12px]"
                          value={row.status}
                          onChange={(event) =>
                            void run(() => changeLeadStatus(row.id, event.target.value))
                          }
                        >
                          {LEAD_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {LEAD_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <LeadStatusBadge value={row.status} />
                      )}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-3.5 align-middle text-muted-foreground">
                      {row.scorecard || "—"}
                    </td>
                    <td className="px-3 py-3.5 align-middle text-muted-foreground">
                      {row.utm_source || "direct"}
                    </td>
                    <td className="px-3 py-3.5 align-middle whitespace-nowrap text-muted-foreground">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <LeadRowActions
                        leadId={row.id}
                        name={row.name}
                        email={row.email}
                        phone={row.phone}
                        whatsapp={row.whatsapp}
                        canDelete={canDelete}
                        onDelete={canDelete ? () => setPendingDelete([row.id]) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13px] text-muted-foreground md:px-5">
        <label className="inline-flex items-center gap-2">
          Affichage
          <select
            aria-label="Taille de page"
            className="h-8 rounded-lg border border-border bg-background px-2 text-[12px]"
            value={filters.size}
            onChange={(event) =>
              update({ size: PAGE_SIZES.find((item) => item === Number(event.target.value)) ?? 25 })
            }
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>
            {from}–{to} sur {total}
          </span>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(
              "size-8 rounded-lg border border-border disabled:opacity-40",
              WS_FOCUS,
            )}
            disabled={filters.page <= 1}
            onClick={() => push({ ...filters, page: filters.page - 1 })}
            aria-label="Page précédente"
          >
            ‹
          </button>
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[color:var(--brand-950)] text-[12px] font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]">
            {filters.page}
          </span>
          <span className="px-1 text-[12px]">/ {pages}</span>
          <button
            type="button"
            className={cn(
              "size-8 rounded-lg border border-border disabled:opacity-40",
              WS_FOCUS,
            )}
            disabled={filters.page >= pages}
            onClick={() => push({ ...filters, page: filters.page + 1 })}
            aria-label="Page suivante"
          >
            ›
          </button>
        </div>
      </div>

      <LeadDeleteDialog
        ids={pendingDelete ?? []}
        open={Boolean(pendingDelete?.length)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onDone={() => setSelected([])}
      />
    </div>
  )
}

function FilterPill({
  label,
  active,
  summary,
  children,
}: {
  label: string
  active: boolean
  summary?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 320 })

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const place = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      const height = panelRef.current?.offsetHeight || 220
      const next = placeFilterPanel({
        button: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        panel: { width: 224, height },
      })
      setPos(next)
    }
    place()
    window.addEventListener("scroll", place, true)
    window.addEventListener("resize", place)
    return () => {
      window.removeEventListener("scroll", place, true)
      window.removeEventListener("resize", place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mousedown", onPointer)
    }
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-semibold transition-colors",
          WS_FOCUS,
          active
            ? "border-[color:var(--brand-500)]/40 bg-[color:var(--brand-500)]/12 text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]"
            : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        {active && summary ? summary : `+ ${label}`}
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={label}
              className="fixed z-50 w-56 overflow-y-auto rounded-xl border border-border bg-[color:var(--surface-elevated)] p-3 shadow-[var(--shadow-panel)]"
              style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
            >
              {children}
              <button
                type="button"
                className="mt-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  empty = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  empty?: boolean
}) {
  return (
    <select
      aria-label={label}
      className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px]"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {empty ? <option value="">Tous</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
