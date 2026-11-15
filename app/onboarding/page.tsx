import { redirect } from "next/navigation"
import { Building2 } from "lucide-react"
import { AuthStage } from "@/components/auth/auth-stage"
import { Logo } from "@/components/brand/logo"
import { OrgOnboardingForm } from "@/components/onboarding/org-onboarding-form"
import { requireUser } from "@/lib/auth/session"
import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/plans"
import { getMembership } from "@/lib/data/membership"
import { signupCountryChoices } from "@/lib/onboarding/country-defaults"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata = { title: "Créer une organisation" }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await requireUser()
  const membership = await getMembership()
  if (membership) redirect("/dashboard")
  const params = await searchParams
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("country_code")
    .eq("id", user.id)
    .maybeSingle()
  const countries = signupCountryChoices()
  const defaultCountry = profile?.country_code && countries.some((c) => c.code === profile.country_code)
    ? profile.country_code
    : "TG"

  return (
    <AuthStage>
      <div className="flex items-center">
        <Logo />
      </div>

      <div className="mt-6 inline-flex size-11 items-center justify-center rounded-2xl bg-[#071039]/8 text-[#071039] dark:bg-[#2E5DE6]/20 dark:text-[#AFC5F8]">
        <Building2 className="size-5" aria-hidden />
      </div>

      <h1 className="mt-4 text-[2rem] leading-[1.2] font-semibold tracking-tight text-[#071039] sm:text-[2.15rem] dark:text-[#F5F7FA]">
        Créer votre organisation
      </h1>
      <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed text-[#5E6D7E] dark:text-[#A8B4C0]">
        Vous devenez propriétaire. Un essai de {DEFAULT_TRIAL_DAYS} jours est proposé une seule fois par compte.
      </p>

      <ol className="mt-5 flex gap-2" aria-label="Progression">
        {["Compte", "Organisation", "Dashboard"].map((label, index) => (
          <li
            key={label}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-center",
              index === 1
                ? "border-[#2E5DE6]/40 bg-[#2E5DE6]/10 text-[#071039] dark:text-[#AFC5F8]"
                : index < 1
                  ? "border-border bg-muted/40 text-foreground"
                  : "border-dashed border-border text-muted-foreground",
            )}
          >
            <span className="text-[11px] font-semibold tabular-nums">{index + 1}</span>
            <span className="text-[11px] font-medium">{label}</span>
          </li>
        ))}
      </ol>

      {params.error ? (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          Cette organisation n&apos;a pas pu être créée. Vérifiez les champs et réessayez.
        </p>
      ) : null}

      <OrgOnboardingForm countries={countries} defaultCountry={defaultCountry} />
    </AuthStage>
  )
}
