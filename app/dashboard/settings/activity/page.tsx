import Link from "next/link"
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
    return <p>Vous n&apos;avez pas l&apos;autorisation de consulter le journal d&apos;activité.</p>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{membership.organization.name}</p>
        <h1 className="font-display text-4xl">Journal d&apos;activité</h1>
        <p className="mt-3 text-sm">
          <Link href="/dashboard/settings" className="underline">Réglages</Link>
        </p>
      </div>
      <form action="/dashboard/settings/activity" className="flex flex-wrap gap-2">
        <select name="actor" defaultValue={actorId ?? ""} aria-label="Acteur" className="h-11 rounded-xl border bg-card px-3 text-sm">
          <option value="">Tous les acteurs</option>
          {Object.entries(memberNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select name="action" defaultValue={action ?? ""} aria-label="Type d'action" className="h-11 rounded-xl border bg-card px-3 text-sm">
          <option value="">Toutes les actions</option>
          {ACTION_FILTERS.filter((item) => isActivityAction(item.value)).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <input name="from" type="date" defaultValue={from ?? ""} aria-label="Du" className="h-11 rounded-xl border bg-card px-3 text-sm" />
        <input name="to" type="date" defaultValue={to ?? ""} aria-label="Au" className="h-11 rounded-xl border bg-card px-3 text-sm" />
        <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee]" type="submit">Filtrer</button>
      </form>
      {loaded.error ? <p className="text-sm">{loaded.error}</p> : null}
      {rows.length === 0 && !loaded.error ? <p className="rounded-2xl border border-dashed p-8 text-sm">Aucune activité sur cette période.</p> : null}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border bg-card p-4 text-sm">
            <p className="font-medium">{row.action}</p>
            <p className="mt-1">{row.resource}</p>
            {row.details ? <p className="text-muted-foreground">{row.details}</p> : null}
            <p className="mt-2 text-muted-foreground">{row.actor} · {formatDateTime(row.createdAt)}</p>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {["Acteur", "Action", "Ressource", "Détails", "Date"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-3">{row.actor}</td>
                <td className="px-3 py-3">{row.action}</td>
                <td className="px-3 py-3">{row.resource}</td>
                <td className="px-3 py-3">{row.details || "—"}</td>
                <td className="px-3 py-3">{formatDateTime(row.createdAt)}</td>
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
