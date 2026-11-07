import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { LoginForm } from "@/components/auth/auth-forms"
import { AuthStage } from "@/components/auth/auth-stage"
import { ScoreMotionShowcase } from "@/components/auth/score-motion-showcase"
import { isSupabaseConfigured, safeNextPath } from "@/lib/env"

export const metadata = { title: "Connexion", robots: { index: false, follow: false } }

const errors: Record<string, string> = {
  config: "Ajoutez les variables Supabase dans .env.local, puis appliquez la migration SQL.",
  invite: "Ce compte n'est pas membre de WOLOYEM. Le premier compte devient propriétaire. Les suivants ont besoin d'une invitation.",
  auth: "Le lien de connexion n'est plus valable. Demandez-en un nouveau.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const next = safeNextPath(params.next)
  const message = params.error ? errors[params.error] : null
  const signupHref = next.startsWith("/invite/") ? `/signup?next=${encodeURIComponent(next)}` : "/signup"

  return (
    <AuthStage
      mobileMotion={
        <div className="-mx-5 bg-[linear-gradient(135deg,#071039_0%,#1A3BB0_48%,#2E5DE6_100%)] px-5 py-5 sm:-mx-8 sm:px-8 sm:py-6">
          <ScoreMotionShowcase compact />
        </div>
      }
      footer={
        <p className="text-center text-[14px] text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href={signupHref}
            className="font-semibold text-[#071039] underline-offset-4 transition-colors hover:text-[#2E5DE6] hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none dark:text-[#AFC5F8] dark:hover:text-white"
          >
            Créer un accès
          </Link>
        </p>
      }
    >
      <div className="flex items-center">
        <Logo />
      </div>

      <h1 className="mt-6 text-[2rem] leading-[1.2] font-semibold tracking-tight text-[#071039] sm:mt-7 sm:text-[2.15rem] dark:text-[#F5F7FA]">
        Heureux de vous retrouver.
      </h1>
      <p className="mt-2.5 max-w-[38ch] text-[15px] leading-relaxed font-normal text-[#5E6D7E] dark:text-[#A8B4C0]">
        Connectez-vous pour retrouver vos scorecards, vos leads et vos analyses.
      </p>

      {message ? (
        <p className="mt-5 rounded-xl border border-border bg-muted/70 px-4 py-3 text-sm text-foreground" role="alert">
          {message}
        </p>
      ) : null}

      <div className="mt-7 sm:mt-8">
        <LoginForm next={next} configured={isSupabaseConfigured()} />
      </div>
    </AuthStage>
  )
}
