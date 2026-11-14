import { redirect } from "next/navigation"
import { Logo } from "@/components/brand/logo"
import { AuthStage } from "@/components/auth/auth-stage"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { ScoreMotionShowcase } from "@/components/auth/score-motion-showcase"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Nouveau mot de passe", robots: { index: false, follow: false } }

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/forgot-password?error=expired")

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const mfaRequired = aal.data?.currentLevel !== "aal2" && aal.data?.nextLevel === "aal2"

  return (
    <AuthStage
      mobileMotion={
        <div className="-mx-5 bg-[linear-gradient(135deg,#071039_0%,#1A3BB0_48%,#2E5DE6_100%)] px-5 py-5 sm:-mx-8 sm:px-8 sm:py-6">
          <ScoreMotionShowcase compact />
        </div>
      }
    >
      <div className="flex items-center">
        <Logo />
      </div>

      <h1 className="mt-6 text-[2rem] leading-[1.2] font-semibold tracking-tight text-[#071039] sm:mt-7 sm:text-[2.15rem] dark:text-[#F5F7FA]">
        Nouveau mot de passe
      </h1>
      <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed font-normal text-[#5E6D7E] dark:text-[#A8B4C0]">
        Choisissez un mot de passe solide pour sécuriser votre accès WOLOYEM Score.
      </p>

      <div className="mt-7 sm:mt-8">
        <ResetPasswordForm mfaRequiredInitially={Boolean(mfaRequired)} />
      </div>
    </AuthStage>
  )
}
