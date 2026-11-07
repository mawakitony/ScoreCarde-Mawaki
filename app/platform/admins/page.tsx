import Link from "next/link"
import { Shield, UserCog, Users } from "lucide-react"
import { grantPlatformAdmin, revokePlatformAdmin } from "@/actions/platform"
import { FilterBar } from "@/components/platform/filter-bar"
import { MiniKpi } from "@/components/platform/kpi-cluster"
import {
  PlatformBtn,
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
import { maskEmail } from "@/lib/platform/rules"
import { createAdminClient } from "@/lib/supabase/admin"

const ROLES = ["support", "operations", "finance", "super_admin"] as const

export default async function PlatformAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  // Hard gate — no soft-deny after a weaker permission.
  await requirePlatformAdmin("platform.admins.manage")

  const params = await searchParams
  const roleFilter = params.role ?? ""
  const admin = createAdminClient()
  let request = admin.from("platform_admins").select("user_id, role, created_at").order("created_at")
  if ((ROLES as readonly string[]).includes(roleFilter)) {
    request = request.eq("role", roleFilter as (typeof ROLES)[number])
  }
  const { data } = await request
  const userIds = (data ?? []).map((row) => row.user_id)
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] }

  const mfaByUser = await loadMfaFactorLabels(admin, userIds)

  const superCount = (data ?? []).filter((r) => r.role === "super_admin").length
  const supportCount = (data ?? []).filter((r) => r.role === "support").length

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PlatformPageHeader
        title="Administrateurs"
        description="Gestion sécurisée des accès platform_admins — MFA AAL2 et audit côté serveur."
        crumbs={[{ href: "/platform", label: "Vue d'ensemble" }, { label: "Admins" }]}
        actions={
          <Link className="text-sm font-semibold text-[color:var(--pa-primary)] underline-offset-2 hover:underline" href="/platform/security/mfa">
            Statut MFA
          </Link>
        }
      />

      <section className="grid gap-2.5 sm:grid-cols-3">
        <MiniKpi index={0} label="Administrateurs" value={String(data?.length ?? 0)} icon={Users} />
        <MiniKpi index={1} label="Super admins" value={String(superCount)} icon={Shield} tone="good" />
        <MiniKpi index={2} label="Support" value={String(supportCount)} icon={UserCog} />
      </section>

      <FilterBar>
        <PlatformSelect name="role" defaultValue={roleFilter} className="max-w-[180px]" aria-label="Filtrer par rôle">
          <option value="">Tous les rôles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </PlatformSelect>
      </FilterBar>

      {(data ?? []).length === 0 ? (
        <PlatformEmpty title="Aucun administrateur" description="Aucun compte pour ce filtre." />
      ) : (
        <PlatformPanel className="overflow-hidden p-0">
          <PlatformTable minWidth="820px">
            <thead>
              <tr>
                {["Administrateur", "Rôle", "Ajouté", "MFA", "Actions"].map((heading) => (
                  <PlatformTh key={heading}>{heading}</PlatformTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row) => {
                const profile = profiles?.find((p) => p.id === row.user_id)
                return (
                  <tr key={row.user_id} className="hover:bg-[color:var(--pa-bg)]/80">
                    <PlatformTd>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={profile?.full_name} email={profile?.email} />
                        <div>
                          <div className="font-semibold">{profile?.full_name || row.user_id.slice(0, 8)}</div>
                          <div className="text-muted-foreground">{maskEmail(profile?.email ?? null)}</div>
                        </div>
                      </div>
                    </PlatformTd>
                    <PlatformTd>
                      <StatusBadge label={adminRoleBadge(row.role)} />
                    </PlatformTd>
                    <PlatformTd className="tabular-nums">{row.created_at.slice(0, 10)}</PlatformTd>
                    <PlatformTd>
                      <span className="text-[12px] text-muted-foreground">{mfaByUser.get(row.user_id) ?? "Non vérifié"}</span>
                    </PlatformTd>
                    <PlatformTd>
                      <form action={revoke.bind(null, row.user_id)}>
                        <button
                          className="text-sm font-semibold text-rose-700 underline-offset-2 hover:underline"
                          type="submit"
                        >
                          Retirer
                        </button>
                      </form>
                    </PlatformTd>
                  </tr>
                )
              })}
            </tbody>
          </PlatformTable>
        </PlatformPanel>
      )}

      <PlatformPanel
        title="Accorder un accès"
        description="Action sensible — authentification récente et audit côté serveur. Dernier super_admin protégé."
      >
        <form action={grant} className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm sm:col-span-1">
            <span className="font-medium">E-mail</span>
            <PlatformField name="email" type="email" required placeholder="admin@exemple.com" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Rôle</span>
            <PlatformSelect name="role" required aria-label="Rôle administrateur">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </PlatformSelect>
          </label>
          <div className="flex items-end">
            <PlatformBtn type="submit" className="w-full">
              Enregistrer
            </PlatformBtn>
          </div>
        </form>
      </PlatformPanel>
    </div>
  )
}

function adminRoleBadge(role: string) {
  if (role === "super_admin") return "OWNER"
  if (role === "support") return "ADMIN"
  if (role === "operations") return "EDITOR"
  if (role === "finance") return "ANALYST"
  return role
}

/**
 * Only show a MFA label when Auth Admin API confirms a verified factor.
 * Otherwise "Non vérifié" — never claim session AAL2 for another admin.
 */
async function loadMfaFactorLabels(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>()
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data, error } = await admin.auth.admin.mfa.listFactors({ userId })
        if (error || !data) {
          labels.set(userId, "Non vérifié")
          return
        }
        const factors = data.factors ?? []
        const verified = factors.some((factor) => factor.status === "verified")
        labels.set(userId, verified ? "Facteur inscrit" : "Non vérifié")
      } catch {
        labels.set(userId, "Non vérifié")
      }
    }),
  )
  return labels
}

async function grant(formData: FormData) {
  "use server"
  await grantPlatformAdmin(String(formData.get("email") ?? ""), String(formData.get("role") ?? ""))
}

async function revoke(userId: string) {
  "use server"
  await revokePlatformAdmin(userId)
}
