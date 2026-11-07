import { redirect } from "next/navigation"
import { Building2 } from "lucide-react"
import { createOrganization } from "@/actions/organization"
import { AuthStage } from "@/components/auth/auth-stage"
import { Logo } from "@/components/brand/logo"
import { requireUser } from "@/lib/auth/session"
import { getMembership } from "@/lib/data/membership"
import { cn } from "@/lib/utils"

export const metadata = { title: "Créer une organisation" }

const fieldClass = cn(
  "h-14 w-full rounded-[13px] border border-border bg-muted/40 px-3.5 text-[14px] text-foreground",
  "shadow-[0_1px_2px_rgba(7,16,57,0.04)] transition-[border-color,box-shadow,background-color] duration-200",
  "placeholder:text-muted-foreground/80",
  "hover:border-[#B8C6D4] hover:bg-muted/55",
  "focus-visible:border-[#2E5DE6] focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/25 focus-visible:outline-none",
  "dark:border-[#2A3A4A] dark:bg-[#141E28] dark:hover:border-[#3A4E60]",
  "dark:focus-visible:border-[#6E92F2] dark:focus-visible:ring-[#6E92F2]/25",
)

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireUser()
  const membership = await getMembership()
  if (membership) redirect("/dashboard")
  const params = await searchParams

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
        Vous devenez propriétaire. Un essai de 14 jours est proposé une seule fois par compte.
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
          Cette organisation n&apos;a pas pu être créée.
        </p>
      ) : null}

      <form action={createOrganization} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]">
            Nom de l&apos;organisation
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            placeholder="WOLOYEM Formation"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug" className="text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]">
            Identifiant (slug)
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="woloyem-formation"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="useCase" className="text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]">
            Secteur d&apos;activité / usage
          </label>
          <input
            id="useCase"
            name="useCase"
            placeholder="Formation, conseil, IT, RH…"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="country" className="text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]">
            Pays
          </label>
          <input
            id="country"
            name="country"
            placeholder="France"
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="logoUrl" className="text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]">
            Logo (URL HTTPS, optionnel)
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            placeholder="https://…"
            className={fieldClass}
          />
        </div>
        <button
          className={cn(
            "mt-2 inline-flex h-14 w-full items-center justify-center rounded-[13px] bg-[#2E5DE6] text-[15px] font-semibold text-white",
            "shadow-[0_12px_28px_-16px_rgba(7,16,57,0.45)] transition-[transform,background-color] duration-200",
            "hover:-translate-y-px hover:bg-[#1A3BB0]",
            "focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none",
            "dark:bg-[#2E5DE6] dark:hover:bg-[#6E92F2]",
          )}
          type="submit"
        >
          Continuer
        </button>
      </form>
    </AuthStage>
  )
}
