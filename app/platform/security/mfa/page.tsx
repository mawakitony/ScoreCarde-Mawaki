import { requirePlatformAdmin } from "@/lib/platform/auth"
import { platformMfaStatus } from "@/lib/platform/mfa"
import { PlatformMfaClient } from "@/components/platform/mfa-client"

export default async function PlatformMfaPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  await requirePlatformAdmin(undefined, { requireMfa: false })
  const status = await platformMfaStatus()
  const { step } = await searchParams
  if (status.ok) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl bg-white p-6">
        <h1 className="font-display text-3xl">MFA plateforme</h1>
        <p className="text-sm">Votre session est en AAL2. Accès Platform Admin autorisé.</p>
        <a className="inline-block underline" href="/platform">Continuer vers la vue d&apos;ensemble</a>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-3xl bg-white p-6">
      <h1 className="font-display text-3xl">Sécurité plateforme — MFA</h1>
      <p className="text-sm text-[#5e6d7e]">
        Les administrateurs plateforme doivent activer une application d&apos;authentification (TOTP).
        Aucune autorisation par simple adresse e-mail.
      </p>
      <PlatformMfaClient initialStep={step === "verify" || status.reason === "aal2_required" ? "verify" : "enroll"} />
    </div>
  )
}
