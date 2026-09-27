import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { SignupForm } from "@/components/auth/auth-forms"
import { loadInvitePreview } from "@/lib/auth/invite-lookup"
import { inviteTokenFromPath } from "@/lib/auth/invitation-flow"
import { isSupabaseConfigured, safeNextPath } from "@/lib/env"

export const metadata = { title: "Créer un accès", robots: { index: false, follow: false } }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next)
  const token = inviteTokenFromPath(next)
  const preview = token ? await loadInvitePreview(token) : null
  const invited = preview?.status === "valid" ? preview : null
  const loginHref = invited ? `/login?next=${encodeURIComponent(next)}` : "/login"

  return (
    <div className="flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <Logo />
        <h1 className="font-display mt-10 text-4xl">Créer un accès</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {invited
            ? `Créez votre compte pour rejoindre ${invited.organizationName}.`
            : "Le premier compte devient propriétaire de l'organisation WOLOYEM. Les comptes suivants doivent être invités."}
        </p>
        <div className="mt-8">
          <SignupForm configured={isSupabaseConfigured()} next={next} defaultEmail={invited?.email} />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href={loginHref} className="text-foreground underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
