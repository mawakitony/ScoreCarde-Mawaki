import Link from "next/link"
import { Building2, UserRound, Users } from "lucide-react"
import { InviteForm, ProfileForm, RemoveMemberButton } from "@/components/settings/settings-forms"
import { canEdit, requireUser } from "@/lib/auth/session"
import { ensureMembership, listMembers } from "@/lib/data/membership"
import { WS_ICON_CHIP, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

export const metadata = { title: "Réglages" }

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  editor: "Éditeur",
  analyst: "Analyste",
  viewer: "Lecteur",
  member: "Membre",
}

export default async function SettingsPage() {
  const user = await requireUser()
  const membership = await ensureMembership()
  if (!membership) return null
  const members = await listMembers(membership.organization.id)
  const editor = canEdit(membership.role)

  return (
    <div className="space-y-4">
      <section className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={cn(WS_ICON_CHIP, "size-9")}>
              <UserRound className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Profil</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link href="/dashboard/settings/profile" className={cn("text-[13px]", WS_LINK)}>
            Ouvrir le profil
          </Link>
        </div>
        <div className="mt-5">
          <ProfileForm
            fullName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : ""}
          />
        </div>
      </section>

      <section className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={cn(WS_ICON_CHIP, "size-9")}>
              <Building2 className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Organisation</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{membership.organization.name}</p>
            </div>
          </div>
          <Link href="/dashboard/settings/organization" className={cn("text-[13px]", WS_LINK)}>
            Modifier
          </Link>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/30 px-3 py-2.5">
            <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Nom</dt>
            <dd className="mt-1 text-[13px] font-medium text-foreground">{membership.organization.name}</dd>
          </div>
          <div className="rounded-xl bg-muted/30 px-3 py-2.5">
            <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Adresse interne
            </dt>
            <dd className="mt-1 text-[13px] font-medium text-foreground">{membership.organization.slug}</dd>
          </div>
          <div className="rounded-xl bg-muted/30 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Votre rôle
            </dt>
            <dd className="mt-1 text-[13px] font-medium text-foreground">{roleLabels[membership.role]}</dd>
          </div>
        </dl>
      </section>

      <section className={cn(WS_PANEL, "p-5 md:p-6")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={cn(WS_ICON_CHIP, "size-9")}>
              <Users className="size-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Membres</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {members.length} membre{members.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings/team" className={cn("text-[13px]", WS_LINK)}>
            Gérer l&apos;équipe
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-border">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-3 text-[13px]">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{member.fullName || "Membre"}</p>
                <p className="truncate text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                  {roleLabels[member.role]}
                </span>
                {editor && member.role !== "owner" && member.userId !== user.id ? (
                  <RemoveMemberButton userId={member.userId} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {editor ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-[13px] text-muted-foreground">
              La personne doit déjà avoir créé un compte. Le rôle propriétaire reste unique.
            </p>
            <InviteForm />
          </div>
        ) : null}
      </section>
    </div>
  )
}
