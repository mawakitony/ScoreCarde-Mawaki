import type { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Building2,
  CalendarDays,
  FileText,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Target,
  UserRound,
} from "lucide-react"
import { ConversionForm } from "@/components/leads/conversion-form"
import { LeadAvatar } from "@/components/leads/lead-avatar"
import {
  LeadScoreBadge,
  LeadStatusBadge,
  LeadTemperatureBadge,
} from "@/components/leads/lead-badges"
import { LeadDeleteButton } from "@/components/leads/lead-delete"
import { LeadEditor } from "@/components/leads/lead-editor"
import { LeadRowActions } from "@/components/leads/lead-row-actions"
import { can } from "@/lib/auth/permissions"
import { canEdit } from "@/lib/auth/session"
import { loadLeadFacets } from "@/lib/data/crm"
import { ensureMembership } from "@/lib/data/membership"
import { getLeadDetail } from "@/lib/data/leads"
import { countryName } from "@/lib/geo/countries"
import { formatDate, formatDateTime, formatPercent } from "@/lib/format"
import { displayAvatarUrl } from "@/lib/leads/avatar-resolver"
import { WS_FOCUS, WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Lead", robots: { index: false, follow: false } }

const qualityLabel = { low: "Faible", medium: "Moyenne", high: "Élevée" }

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const membership = await ensureMembership()
  const [lead, facets] = await Promise.all([getLeadDetail(id), loadLeadFacets()])
  if (!lead) notFound()
  const editor = membership ? canEdit(membership.role) : false
  const person = lead.person
  const leadName = [person?.first_name, person?.last_name].filter(Boolean).join(" ")
  const avatarUrl = membership?.organization.id
    ? await displayAvatarUrl({
        organizationId: membership.organization.id,
        leadId: lead.id,
        email: person?.email,
        name: leadName,
        storedUrl: null,
      })
    : null

  return (
    <div className="space-y-4">
      <header className={cn(WS_PANEL, "p-5 md:p-6")}>
        <Link
          href="/dashboard/leads"
          className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", WS_LINK)}
        >
          ← Leads
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <LeadAvatar
              name={leadName}
              email={person?.email}
              src={avatarUrl}
              id={lead.id}
              size="xl"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[1.35rem] font-semibold tracking-tight text-foreground md:text-[1.5rem]">
                {leadName || "Lead"}
              </h1>
              <p className="mt-1 truncate text-[13px] text-muted-foreground">
                {person?.email || person?.phone || "—"}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <LeadStatusBadge value={lead.status} />
                <LeadTemperatureBadge value={lead.temperature} />
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                  <Gauge className="size-3" aria-hidden />
                  <LeadScoreBadge score={lead.score} />
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LeadRowActions
              leadId={lead.id}
              name={leadName || "Lead"}
              email={person?.email}
              phone={person?.phone}
              whatsapp={person?.whatsapp}
            />
            <Link
              href={`/dashboard/leads/${lead.id}/reports`}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-[12px] font-semibold",
                "hover:bg-muted/60",
                WS_FOCUS,
              )}
            >
              <FileText className="size-3.5" aria-hidden />
              Rapports
            </Link>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <article className={cn(WS_PANEL, "p-5")}>
            <div className="flex items-center gap-2">
              <span className={cn(WS_ICON_CHIP, "size-8")}>
                <UserRound className="size-4" aria-hidden />
              </span>
              <h2 className="text-base font-semibold text-foreground">Informations</h2>
            </div>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              <InfoItem icon={Mail} label="Email" value={person?.email} />
              <InfoItem icon={Phone} label="Téléphone" value={person?.phone} />
              <InfoItem
                icon={MapPin}
                label="Pays"
                value={person?.country ? countryName(person.country) : null}
              />
              <InfoItem icon={Phone} label="WhatsApp" value={person?.whatsapp} />
              <InfoItem icon={Building2} label="Entreprise" value={person?.company} />
              <InfoItem icon={UserRound} label="Fonction" value={person?.job_title} />
              <InfoItem icon={MapPin} label="Ville" value={person?.city} />
              <InfoItem label="Complétude" value={formatPercent(lead.completeness)} />
              <InfoItem
                label="Qualité du lead"
                value={`${qualityLabel[lead.qualityBand]} · ${formatPercent(lead.quality)}`}
              />
            </dl>
            <p className="mt-3 text-[12px] text-muted-foreground">
              La qualité du lead est distincte du score d&apos;évaluation.
            </p>
          </article>

          <article className={cn(WS_PANEL, "p-5")}>
            <div className="flex items-center gap-2">
              <span className={cn(WS_ICON_CHIP, "size-8")}>
                <Target className="size-4" aria-hidden />
              </span>
              <h2 className="text-base font-semibold text-foreground">Résultat</h2>
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
              {lead.score === null ? "—" : formatPercent(lead.score)}
            </p>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {lead.range?.title || lead.range?.label || "Résultat non calculé"}
            </p>
            {lead.categories.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {lead.categories.map((category) => (
                  <li
                    key={category.name}
                    className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-[13px]"
                  >
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatPercent(category.percent)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <section className={cn(WS_PANEL, "p-5")}>
            <div className="flex items-center gap-2">
              <span className={cn(WS_ICON_CHIP, "size-8")}>
                <FileText className="size-4" aria-hidden />
              </span>
              <h2 className="text-base font-semibold text-foreground">Réponses</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {lead.answers.length === 0 ? (
                <li className="text-[13px] text-muted-foreground">Aucune réponse enregistrée.</li>
              ) : null}
              {lead.answers.map((answer, index) => (
                <li key={answer.title} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                    Question {index + 1}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-foreground">{answer.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {answer.labels.join(", ") || "—"}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className={cn(WS_PANEL, "p-5")}>
            <h2 className="text-base font-semibold text-foreground">Notes</h2>
            <ul className="mt-3 space-y-3 text-[13px]">
              {lead.notes.length === 0 ? (
                <li className="text-muted-foreground">Aucune note interne.</li>
              ) : null}
              {lead.notes.map((note) => (
                <li key={note.id} className="rounded-xl bg-muted/30 p-3">
                  <p className="whitespace-pre-wrap text-foreground">{note.content}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatDateTime(note.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <article className={cn(WS_PANEL, "p-5")}>
            <div className="flex items-center gap-2">
              <span className={cn(WS_ICON_CHIP, "size-8")}>
                <CalendarDays className="size-4" aria-hidden />
              </span>
              <h2 className="text-base font-semibold text-foreground">Historique</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {lead.timeline.length === 0 ? (
                <li className="text-[13px] text-muted-foreground">Aucune activité.</li>
              ) : null}
              {lead.timeline.map((item) => (
                <li
                  key={`${item.at}-${item.label}`}
                  className="border-l-2 border-[color:var(--brand-500)]/30 pl-3"
                >
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(item.at)}</p>
                  <p className="text-[13px] text-foreground">{item.label}</p>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          <section className={cn(WS_PANEL, "p-5")}>
            <h2 className="text-base font-semibold text-foreground">Actions</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <Item label="Statut" value={<LeadStatusBadge value={lead.status} />} />
              <Item label="Température" value={<LeadTemperatureBadge value={lead.temperature} />} />
              <Item
                label="Score"
                value={lead.score === null ? "—" : formatPercent(lead.score)}
              />
              <Item label="Scorecard" value={lead.scorecard} />
              <Item label="Date" value={formatDate(lead.createdAt)} />
            </dl>
            <div className="mt-4 space-y-4">
              <LeadEditor
                leadId={lead.id}
                status={lead.status}
                tags={lead.tags}
                catalog={facets.tags}
                canEdit={editor}
              />
              {membership && can({ role: membership.role }, "lead.edit") ? (
                <LeadDeleteButton leadId={lead.id} />
              ) : null}
              {editor ? <ConversionForm leadId={lead.id} /> : null}
            </div>
          </section>
          <article className={cn(WS_PANEL, "p-5 text-[13px]")}>
            <h2 className="text-base font-semibold text-foreground">Origine</h2>
            <dl className="mt-3 space-y-1.5">
              <Item label="Source" value={lead.utm?.utm_source || lead.source} />
              <Item label="Medium" value={lead.utm?.utm_medium} />
              <Item label="Campaign" value={lead.utm?.utm_campaign} />
              <Item label="Content" value={lead.utm?.utm_content} />
              <Item label="Term" value={lead.utm?.utm_term} />
              <Item label="Referrer" value={lead.referrer} />
            </dl>
          </article>
        </aside>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | null | undefined
  icon?: typeof Mail
}) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {Icon ? <Icon className="size-3 opacity-70" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="mt-1 truncate text-[13px] font-medium text-foreground">{value || "—"}</dd>
    </div>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value || "—"}</dd>
    </div>
  )
}
