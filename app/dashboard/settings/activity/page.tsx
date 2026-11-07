import { canViewActivity, isActivityAction, presentActivity, safePersonName } from "@/lib/audit/activity"
import { listActivity } from "@/lib/data/activity"
import { ensureMembership, listMembers } from "@/lib/data/membership"
import { requireUser } from "@/lib/auth/session"
import { formatDateTime } from "@/lib/format"

export const metadata = { title: "Journal d'activité" }

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "scorecard.published", label: "Publication de scorecard" },
  { value: "member.invited", label: "Invitation" },
  { value: "member.role_changed", label: "Changement de rôle" },
  { value: "member.first_access_regenerated", label: "Code de première connexion" },
  { value: "lead.deleted", label: "Suppression de lead" },
  { value: "lead.restored", label: "Restauration de lead" },
  { value: "lead.anonymized", label: "Anonymisation de lead" },
  { value: "ownership.transferred", label: "Transfert de propriété" },
  { value: "subscription.changed", label: "Abonnement" },
]

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireUser()
  const membership = await ensureMembership()
  if (!membership || !canViewActivity(membership.role)) {
    return <p className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">Vous n&apos;avez pas l&apos;autorisation de consulter le journal d&apos;activité.</p>
  }
  const params = await searchParams
  const actorParam = text(params.actor)
  const actionParam = text(params.action)
  const from = text(params.from)
  const to = text(params.to)
  const members = await listMembers(membership.organization.id)
  const memberNames = Object.fromEntries(members.flatMap((member) => {
    const name = safePersonName(member.fullName)
    return name ? [[member.userId, name]] : []
  }))
  const actorId = actorParam && memberNames[actorParam] ? actorParam : null
  const action = actionParam && isActivityAction(actionParam) ? actionParam : null
  const loaded = await listActivity({ actorId, action, from, to })
  const rows = loaded.rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    ...presentActivity({
      action: row.action,
      metadata: row.metadata,
      actorName: row.actorId ? memberNames[row.actorId] ?? null : null,
      memberNames,
    }),
  }))

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] md:p-6">
        <h2 className="text-base font-semibold text-foreground">Journal d&apos;activité</h2>
        <p className="mt-1 text-sm text-muted-foreground">{membership.organization.name}</p>
        <form action="/dashboard/settings/activity" className="mt-5 flex flex-wrap gap-2">
          <select name="actor" defaultValue={actorId ?? ""} aria-label="Acteur" className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
            <option value="">Tous les acteurs</option>
            {Object.entries(memberNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select name="action" defaultValue={action ?? ""} aria-label="Type d'action" className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
            <option value="">Toutes les actions</option>
            {ACTION_FILTERS.filter((item) => isActivityAction(item.value)).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <input name="from" type="date" defaultValue={from ?? ""} aria-label="Du" className="h-10 rounded-xl border border-border bg-card px-3 text-sm" />
          <input name="to" type="date" defaultValue={to ?? ""} aria-label="Au" className="h-10 rounded-xl border border-border bg-card px-3 text-sm" />
          <button className="h-10 rounded-xl bg-[color:var(--brand-950)] px-4 text-sm font-semibold text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]" type="submit">Filtrer</button>
        </form>
      </section>
      {loaded.error ? <p className="text-sm text-destructive">{loaded.error}</p> : null}
      {rows.length === 0 && !loaded.error ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">Aucune activité sur cette période.</p> : null}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-border bg-card p-4 text-sm shadow-[var(--shadow-panel)]">
            <p className="font-medium text-foreground">{row.action}</p>
            <p className="mt-1">{row.resource}</p>
            {row.details ? <p className="text-muted-foreground">{row.details}</p> : null}
            <p className="mt-2 text-muted-foreground">{row.actor} · {formatDateTime(row.createdAt)}</p>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-panel)] md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              {["Acteur", "Action", "Ressource", "Détails", "Date"].map((label) => <th key={label} className="px-4 py-3 text-xs font-medium">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-4 py-4">{row.actor}</td>
                <td className="px-4 py-4">{row.action}</td>
                <td className="px-4 py-4">{row.resource}</td>
                <td className="px-4 py-4">{row.details || "—"}</td>
                <td className="px-4 py-4 text-muted-foreground">{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function text(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = raw?.trim() ?? ""
  return trimmed.length > 0 ? trimmed.slice(0, 80) : null
}
