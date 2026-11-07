import Link from "next/link"
import { TRIAL_EXPIRED_MESSAGE } from "@/lib/billing/workspace-access-policy"
import { signOut } from "@/actions/auth"
import { Button } from "@/components/ui/button"

export function WorkspaceLockScreen({
  message = TRIAL_EXPIRED_MESSAGE,
  showBillingCta = true,
}: {
  message?: string
  showBillingCta?: boolean
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-[#2E5DE6] uppercase">Abonnement requis</p>
      <h1 className="mt-3 font-display text-3xl text-[#071039] dark:text-[#F5F7FA]">Essai terminé</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{message}</p>
      {showBillingCta ? (
        <Link
          href="/dashboard/settings/billing"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#2E5DE6] px-5 text-sm font-semibold text-white hover:bg-[#1A3BB0]"
        >
          Activer mon abonnement
        </Link>
      ) : null}
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </div>
  )
}
