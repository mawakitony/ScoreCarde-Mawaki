import Link from "next/link"
import { Mail, UserRound, UserCheck, Users } from "lucide-react"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import { OrgAvatar } from "@/components/platform/org-avatar"
import {
  PlatformEmpty,
  PlatformField,
  PlatformPageHeader,
  PlatformPanel,
  PlatformSelect,
  PlatformTable,
  PlatformTd,
  PlatformTh,
} from "@/components/platform/page-chrome"
import { StatusBadge } from "@/components/platform/status-badge"
import { UserAvatar } from "@/components/platform/user-avatar"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { maskEmail, pageWindow } from "@/lib/platform/rules"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

const PAGE = 40

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string; detail?: string }>
}) {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const params = await searchParams
  const window = pageWindow(Number(params.page ?? 1), PAGE)
  const query = (params.q ?? "").replace(/[%_,]/g, "").trim()
  const roleFilter = params.role?.trim() || ""
  const detailId = params.detail?.trim() || ""
  const admin = createAdminClient()

  let membersCountQ = admin.from("organization_members").select("id", { count: "exact", head: true })
  let ownersCountQ = admin.from("organization_members").select("id", { count: "exact", head: true }).eq("role", "owner")
  let invitesCountQ = admin.from("organization_invitations").select("id", { count: "exact", head: true }).is("accepted_at", null)
  if (supportScope) {
    membersCountQ = membersCountQ.eq("organization_id", supportScope.organizationId)
    ownersCountQ = ownersCountQ.eq("organization_id", supportScope.organizationId)
    invitesCountQ = invitesCountQ.eq("organization_id", supportScope.organizationId)
  }

  const [{ count: totalMembers }, { count: ownerCount }, { count: pendingInvites }] = await Promise.all([
    membersCountQ,
    ownersCountQ,
    invitesCountQ,
  ])

  let request = admin
    .from("organization_members")
    .select("id, role, access_role, created_at, user_id, organization_id", { count: "exact" })
    .order("created_at", { ascending: false })
  if (supportScope) request = request.eq("organization_id", supportScope.organizationId)
  if (roleFilter === "owner" || roleFilter === "admin" || roleFilter === "member") {
    request = request.eq("role", roleFilter)
  }
  if (query.includes("@") || query.length >= 2) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(80)
    const ids = (profiles ?? []).map((row) => row.id)
    request = request.in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
  }
  const { data: members, count } = await request.range(window.from, window.to)
  const userIds = [...new Set((members ?? []).map((row) => row.user_id))]
  const orgIds = [...new Set((members ?? []).map((row) => row.organization_id))]

  let invitesQuery = admin
    .from("organization_invitations")
    .select("email, organization_id, accepted_at, created_at, role")
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(40)
  if (supportScope) invitesQuery = invitesQuery.eq("organization_id", supportScope.organizationId)

  const [{ data: profiles }, { data: orgs }, { data: invites }] = await Promise.all([
    userIds.length ? admin.from("profiles").select("id, email, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    orgIds.length ? admin.from("organizations").select("id, name, slug").in("id", orgIds) : Promise.resolve({ data: [] }),
    invitesQuery,
  ])

  const inviteOrgIds = [...new Set((invites ?? []).map((row) => row.organization_id))]
  const { data: inviteOrgs } = inviteOrgIds.length
    ? await admin.from("organizations").select("id, name").in("id", inviteOrgIds)
    : { data: [] }

  const detailMember = detailId ? (members ?? []).find((row) => row.id === detailId) : null
  const detailProfile = detailMember ? profiles?.find((row) => row.id === detailMember.user_id) : null
  const detailOrg = detailMember ? orgs?.find((row) => row.id === detailMember.organization_id) : null
  const preserved = linkQuery(params)
  const collabCount = Math.max(0, (totalMembers ?? 0) - (ownerCount ?? 0))

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Utilisateurs"
        description="Supervision des membres — consultation uniquement, e-mails masqués, pas d'usurpation."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Utilisateurs" }]}
      />

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi index={0} label="Membres" value={String(totalMembers ?? 0)} icon={Users} hint="Stock actuel" />
        <MiniKpi index={1} label="Propriétaires" value={String(ownerCount ?? 0)} icon={UserCheck} tone="good" />
        <MiniKpi index={2} label="Collaborateurs" value={String(collabCount)} icon={UserRound} />
        <MiniKpi
          index={3}
          label="Invitations"
          value={String(pendingInvites ?? 0)}
          icon={Mail}
          tone={(pendingInvites ?? 0) > 0 ? "warn" : "default"}
          hint="En attente"
        />
      </section>

      <FilterBar>
        <PlatformField name="q" defaultValue={query} placeholder="Nom ou e-mail" className="max-w-xs" />
        <PlatformSelect name="role" defaultValue={roleFilter} className="max-w-[160px]">
          <option value="">Tous les rôles</option>
          <option value="owner">Propriétaire</option>
          <option value="admin">Admin</option>
          <option value="member">Membre</option>
        </PlatformSelect>
      </FilterBar>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          {(members ?? []).length === 0 ? (
            <PlatformEmpty title="Aucun utilisateur" description="Aucun membership pour ces filtres." />
          ) : (
            <PlatformPanel className="overflow-hidden p-0">
              <PlatformTable minWidth="920px">
                <thead>
                  <tr>
                    {["Utilisateur", "Rôle", "Accès", "Organisation", "Ajouté", "Actions"].map((heading) => (
                      <PlatformTh key={heading}>{heading}</PlatformTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(members ?? []).map((member) => {
                    const profile = profiles?.find((row) => row.id === member.user_id)
                    const org = orgs?.find((row) => row.id === member.organization_id)
                    return (
                      <tr key={member.id} className="hover:bg-[color:var(--pa-bg)]/80">
                        <PlatformTd>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={profile?.full_name} email={profile?.email} />
                            <div>
                              <div className="font-semibold text-[color:var(--pa-ink)]">{profile?.full_name || "—"}</div>
                              <div className="text-muted-foreground">{maskEmail(profile?.email ?? null)}</div>
                            </div>
                          </div>
                        </PlatformTd>
                        <PlatformTd>
                          <StatusBadge label={roleLabel(member.role)} />
                        </PlatformTd>
                        <PlatformTd>{accessLabel(member.access_role)}</PlatformTd>
                        <PlatformTd>
                          {org ? (
                            <div className="flex items-center gap-2">
                              <OrgAvatar name={org.name} size="sm" />
                              <span>{org.name}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </PlatformTd>
                        <PlatformTd className="tabular-nums">{member.created_at.slice(0, 10)}</PlatformTd>
                        <PlatformTd>
                          <div className="flex flex-col gap-1">
                            <Link
                              className="font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                              href={`/platform/users?${preserved}&detail=${member.id}`}
                            >
                              Détail
                            </Link>
                            {org ? (
                              <Link className="text-[12px] text-muted-foreground hover:underline" href={`/platform/organizations/${org.id}?tab=users`}>
                                Fiche org.
                              </Link>
                            ) : null}
                          </div>
                        </PlatformTd>
                      </tr>
                    )
                  })}
                </tbody>
              </PlatformTable>
            </PlatformPanel>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {count ?? 0} memberships · page {window.page}
            </p>
            <div className="flex gap-3">
              {window.page > 1 ? (
                <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/users?${preserved}&page=${window.page - 1}`}>
                  Précédent
                </Link>
              ) : null}
              {(count ?? 0) > window.page * PAGE ? (
                <Link className="font-semibold text-[color:var(--pa-primary)]" href={`/platform/users?${preserved}&page=${window.page + 1}`}>
                  Suivant
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <PlatformPanel title="Détail utilisateur" description="Données de membership uniquement." className="!p-4">
            {detailMember && detailProfile ? (
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-3 pb-2">
                  <UserAvatar name={detailProfile.full_name} email={detailProfile.email} />
                  <div>
                    <p className="font-semibold">{detailProfile.full_name || "—"}</p>
                    <p className="text-muted-foreground">{maskEmail(detailProfile.email)}</p>
                  </div>
                </div>
                <Info label="Rôle" value={roleLabel(detailMember.role)} />
                <Info label="Accès" value={accessLabel(detailMember.access_role)} />
                <Info label="Organisation" value={detailOrg?.name ?? "—"} />
                <Info label="Ajouté le" value={detailMember.created_at.slice(0, 10)} />
                {detailOrg ? (
                  <Link
                    className="inline-flex pt-1 font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline"
                    href={`/platform/organizations/${detailOrg.id}?tab=users`}
                  >
                    Ouvrir l&apos;organisation
                  </Link>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Sélectionnez un utilisateur dans le tableau.</p>
            )}
          </PlatformPanel>

          <PlatformPanel title="Invitations en attente" description="Non acceptées" className="!p-4">
            {(invites ?? []).length === 0 ? (
              <PlatformEmpty title="Aucune invitation" description="Pas d'invitation en attente." />
            ) : (
              <ul className="space-y-2 text-sm">
                {(invites ?? []).map((invite, index) => (
                  <li
                    key={`${invite.email}-${index}`}
                    className="rounded-xl border border-border/70 bg-[color:var(--pa-bg)]/50 px-3 py-2"
                  >
                    <p className="font-medium">{maskEmail(invite.email)}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {inviteOrgs?.find((o) => o.id === invite.organization_id)?.name ?? "—"}
                      {" · "}
                      {invite.role ?? "membre"}
                      {" · "}
                      {invite.created_at.slice(0, 10)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PlatformPanel>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-[color:var(--pa-ink)]">{value}</dd>
    </div>
  )
}

function roleLabel(role: string) {
  switch (role) {
    case "owner":
      return "OWNER"
    case "admin":
      return "ADMIN"
    case "editor":
      return "EDITOR"
    case "analyst":
      return "ANALYST"
    case "viewer":
      return "VIEWER"
    case "member":
      return "Membre"
    default:
      return role
  }
}

function accessLabel(role: string | null) {
  if (!role) return "—"
  return roleLabel(role)
}

function linkQuery(params: { q?: string; role?: string; detail?: string }) {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.role) search.set("role", params.role)
  return search.toString()
}
