import { headers } from "next/headers"
import { endSupportSession } from "@/actions/platform"
import { WorkspaceLockScreen } from "@/components/billing/workspace-lock-screen"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { requireUser } from "@/lib/auth/session"
import { evaluateWorkspaceAccess, isBillingExemptPath } from "@/lib/billing/workspace-access"
import { ensureMembership } from "@/lib/data/membership"
import { isPlatformAdmin } from "@/lib/platform/auth"
import { activeSuspension, readSupportSession } from "@/lib/platform/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/actions/auth"
import { Button } from "@/components/ui/button"

async function MaintenanceBanner() {
  const message = await maintenanceMessage()
  if (!message) return null
  return <p className="mb-4 rounded-xl border px-4 py-3 text-sm">{message}</p>
}

async function maintenanceMessage() {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("platform_settings").select("maintenance_message").eq("id", 1).maybeSingle()
    return data?.maintenance_message ?? null
  } catch {
    return null
  }
}

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const membership = await ensureMembership()

  if (!membership) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-4xl">Créer votre espace</h1>
        <p className="mt-3 text-muted-foreground">
          {user.email} n&apos;appartient encore à aucune organisation. Créez la vôtre, ou acceptez une invitation.
        </p>
        <a href="/onboarding" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#071039] px-4 text-sm text-[#f7f4ee]">Créer une organisation</a>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline">
            Se déconnecter
          </Button>
        </form>
      </div>
    )
  }

  const suspension = await activeSuspension(membership.organization.id)
  if (suspension) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-4xl">Espace temporairement indisponible</h1>
        <p className="mt-3 text-muted-foreground">Vos données sont conservées. Réessayez plus tard.</p>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline">
            Se déconnecter
          </Button>
        </form>
      </div>
    )
  }

  const headerStore = await headers()
  const pathname = headerStore.get("x-pathname") ?? "/dashboard"
  const workspaceAccess = await evaluateWorkspaceAccess(membership.organization.id)
  const billingExempt = isBillingExemptPath(pathname)

  if (workspaceAccess.locked && workspaceAccess.reason !== "platform_suspension" && !billingExempt) {
    return (
      <WorkspaceLockScreen
        message={workspaceAccess.message ?? undefined}
        showBillingCta={workspaceAccess.reason === "billing_restricted" || workspaceAccess.reason === "billing_suspended"}
      />
    )
  }

  const platform = await isPlatformAdmin()
  const support = platform ? await readSupportSession(platform.userId) : null
  const supabase = await createClient()
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, read_at, created_at")
    .eq("organization_id", membership.organization.id)
    .order("created_at", { ascending: false })
    .limit(8)

  return (
    <DashboardShell
      email={user.email ?? ""}
      fullName={typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null}
      organizationName={membership.organization.name}
      isPlatformAdmin={Boolean(platform)}
      notifications={(notifications ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        createdAt: item.created_at,
        read: Boolean(item.read_at),
      }))}
    >
      {support ? (
        <form
          action={endSupportSession}
          className="mb-4 flex flex-col gap-3 rounded-xl bg-[#1A3BB0] px-4 py-3 text-sm text-[#f7f4ee] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <strong>Session support active — consultation Platform Admin uniquement</strong>
            <p className="text-xs font-normal text-[#f7f4ee]/90">
              Ce dashboard affiche toujours <em>votre</em> organisation ({membership.organization.name}). Les données de «{" "}
              {support.organization.name} » ne sont pas chargées ici — ouvrez la fiche Platform Admin.
            </p>
            <a
              href={`/platform/organizations/${support.organization.id}`}
              className="inline-flex text-xs font-semibold underline underline-offset-2 hover:opacity-90"
            >
              Ouvrir la fiche {support.organization.name}
            </a>
          </div>
          <button type="submit" className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25">
            Quitter le mode support
          </button>
        </form>
      ) : null}
      {platform ? (
        <a
          href="/platform"
          className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--brand-950)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Ouvrir WOLOYEM Platform Admin
        </a>
      ) : null}
      <MaintenanceBanner />
      {workspaceAccess.locked && billingExempt ? (
        <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Votre espace métier est en pause. Activez un abonnement pour retrouver scorecards, leads et rapports.
        </p>
      ) : null}
      {children}
    </DashboardShell>
  )
}
