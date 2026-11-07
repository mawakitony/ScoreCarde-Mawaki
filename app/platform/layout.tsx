import { redirect } from "next/navigation"
import { PlatformShell } from "@/components/platform/shell"
import { isPlatformAdmin } from "@/lib/platform/auth"
import { readSupportSession } from "@/lib/platform/data"
import { platformEnvironment } from "@/lib/platform/ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Platform Admin", robots: { index: false, follow: false } }

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Membership check only — MFA is enforced per-page via requirePlatformAdmin
  // so /platform/security/mfa remains reachable for enrollment.
  const admin = await isPlatformAdmin()
  if (!admin) redirect("/dashboard")
  const support = await readSupportSession(admin.userId)
  const env = platformEnvironment()
  return (
    <PlatformShell
      admin={admin}
      supportName={support?.organization.name ?? null}
      supportOrgId={support?.organization.id ?? null}
      env={env}
    >
      {children}
    </PlatformShell>
  )
}
