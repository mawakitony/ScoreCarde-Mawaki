import Link from "next/link"
import { Eye } from "lucide-react"
import { LeadAvatar } from "@/components/leads/lead-avatar"
import { hotLeadActions } from "@/lib/dashboard/lead-links"
import { formatDate, formatPercent } from "@/lib/format"
import { countryName } from "@/lib/geo/countries"
import { cn } from "@/lib/utils"

export type HotLeadRow = {
  id: string
  name: string
  score: number | null
  scorecard?: string | null
  country?: string | null
  cta_clicked: boolean
  created_at: string
  /** Only when an authorized stored URL exists — never invent. */
  avatarUrl?: string | null
  email?: string | null
}

export function HotLeadsList({ leads }: { leads: HotLeadRow[] }) {
  if (leads.length === 0) {
    return <p className="mt-4 text-[14px] text-muted-foreground">Aucun lead chaud sur la période.</p>
  }

  return (
    <>
      <ul className="mt-3 hidden divide-y divide-border md:block">
        {leads.map((lead, index) => {
          const actions = hotLeadActions(lead)
          if (!actions.href) return null
          return (
            <li
              key={lead.id}
              className="dash-enter group relative -mx-2 grid grid-cols-[auto_minmax(0,1fr)_5.5rem_auto_auto] items-center gap-x-3.5 rounded-xl px-2 py-3.5 transition-colors duration-200 hover:bg-muted/55 lg:grid-cols-[auto_minmax(0,1fr)_5.5rem_auto_6rem_auto]"
              style={{ animationDelay: `${80 + index * 45}ms` }}
            >
              <span className="ring-offset-background rounded-full shadow-sm ring-2 ring-border/70 ring-offset-2 transition-[box-shadow,ring-color] duration-200 group-hover:ring-[color:var(--brand-500)]/40">
                <LeadAvatar name={lead.name} email={lead.email} src={lead.avatarUrl} id={lead.id} size="row" />
              </span>
              <div className="min-w-0">
                <Link
                  href={actions.href}
                  className="truncate text-[14px] font-semibold text-foreground underline-offset-2 transition-colors hover:text-[color:var(--brand-500)] hover:underline focus-visible:rounded-sm focus-visible:text-[color:var(--brand-500)] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"
                  aria-label={actions.nameLabel}
                >
                  {lead.name}
                </Link>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {lead.email || lead.scorecard || (lead.country ? countryName(lead.country) : "—")}
                </p>
              </div>
              <span className="justify-self-end rounded-lg bg-[color:var(--brand-950)]/8 px-2.5 py-1 text-[14px] font-semibold tabular-nums text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
                {lead.score === null ? "—" : formatPercent(lead.score)}
              </span>
              <TemperatureBadge />
              <span className="hidden justify-self-end text-[12px] text-muted-foreground lg:block">
                {formatDate(lead.created_at)}
              </span>
              <Link
                href={actions.href}
                aria-label={actions.eyeLabel}
                className="inline-flex size-9 items-center justify-center rounded-full border border-transparent text-muted-foreground opacity-60 transition-all duration-200 hover:border-border hover:bg-card hover:text-foreground hover:opacity-100 hover:shadow-sm focus-visible:border-border focus-visible:bg-card focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none group-hover:opacity-100"
              >
                <Eye className="size-[18px]" />
              </Link>
            </li>
          )
        })}
      </ul>

      <ul className="mt-4 grid gap-3 md:hidden">
        {leads.map((lead, index) => {
          const actions = hotLeadActions(lead)
          if (!actions.href) return null
          return (
            <li
              key={lead.id}
              className="dash-enter rounded-xl border border-border bg-card/70 p-4 transition-colors hover:bg-muted/40"
              style={{ animationDelay: `${80 + index * 45}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-full shadow-sm ring-2 ring-border/70 ring-offset-2 ring-offset-background">
                  <LeadAvatar name={lead.name} email={lead.email} src={lead.avatarUrl} id={lead.id} size="row" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={actions.href}
                        className="truncate text-[14px] font-semibold text-foreground underline-offset-2 hover:text-[color:var(--brand-500)] hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[color:var(--brand-500)]/35 focus-visible:outline-none"
                        aria-label={actions.nameLabel}
                      >
                        {lead.name}
                      </Link>
                      {lead.email ? <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{lead.email}</p> : null}
                    </div>
                    <Link
                      href={actions.href}
                      aria-label={actions.eyeLabel}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      <Eye className="size-[18px]" />
                    </Link>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="rounded-lg bg-[color:var(--brand-950)]/8 px-2 py-0.5 font-semibold tabular-nums text-[color:var(--brand-950)] dark:bg-[color:var(--brand-500)]/15 dark:text-[color:var(--brand-500)]">
                      {lead.score === null ? "—" : formatPercent(lead.score)}
                    </span>
                    <TemperatureBadge />
                    <span className="text-muted-foreground">{formatDate(lead.created_at)}</span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function TemperatureBadge() {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-wide",
        "bg-gradient-to-r from-[#F6E4E1] to-[#F8EDEA] text-[#8D3B32]",
        "dark:from-[#3A2422] dark:to-[#2E1F1E] dark:text-[#F0B4AE]",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      Chaud
    </span>
  )
}
