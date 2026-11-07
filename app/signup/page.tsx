import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { SignupForm } from "@/components/auth/auth-forms"
import { AuthStage } from "@/components/auth/auth-stage"
import { ScoreMotionShowcase } from "@/components/auth/score-motion-showcase"
import { loadInvitePreview } from "@/lib/auth/invite-lookup"
import { inviteTokenFromPath } from "@/lib/auth/invitation-flow"
import { isSupabaseConfigured, safeNextPath } from "@/lib/env"

export const metadata = { title: "Essayer gratuitement", robots: { index: false, follow: false } }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next)
  const token = inviteTokenFromPath(next)
  const preview = token ? await loadInvitePreview(token) : null
  const invited = preview?.status === "valid" ? preview : null
  const loginHref = invited ? `/login?next=${encodeURIComponent(next)}` : "/login"

  return (
    <AuthStage
      mobileMotion={
        <div className="-mx-5 bg-[linear-gradient(135deg,#071039_0%,#1A3BB0_48%,#2E5DE6_100%)] px-5 py-5 sm:-mx-8 sm:px-8 sm:py-6">
          <ScoreMotionShowcase compact />
        </div>
      }
      footer={
        <p className="text-center text-[14px] text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            href={loginHref}
            className="font-semibold text-[#071039] underline-offset-4 transition-colors hover:text-[#2E5DE6] hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none dark:text-[#AFC5F8] dark:hover:text-white"
          >
            Se connecter
          </Link>
        </p>
      }
    >
      <div className="flex items-center">
        <Logo />
      </div>

      <h1 className="mt-6 text-[2rem] leading-[1.2] font-semibold tracking-tight text-[#071039] sm:mt-7 sm:text-[2.15rem] dark:text-[#F5F7FA]">
        {invited ? "Rejoindre l’équipe" : "Essayer gratuitement"}
      </h1>
      <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed font-normal text-[#5E6D7E] dark:text-[#A8B4C0]">
        {invited
          ? `Créez votre compte pour rejoindre ${invited.organizationName}.`
          : "Créez votre compte, confirmez votre e-mail, puis créez l’organisation de votre entreprise. 14 jours d’essai sans carte bancaire. Les collaborateurs rejoignent via invitation — un seul abonnement couvre l’organisation."}
      </p>

      <div className="mt-7 sm:mt-8">
        <SignupForm configured={isSupabaseConfigured()} next={next} defaultEmail={invited?.email} />
      </div>
    </AuthStage>
  )
}
