import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { DEFAULT_TRIAL_DAYS, PLANS, publicPlans, type Feature, type PlanDefinition } from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

export const metadata = { title: "Tarifs" }

const FEATURE_LABELS: Record<Feature, string> = {
  advanced_analytics: "Analytics avancées",
  csv_export: "Export CSV",
  pdf_reports: "Rapports PDF",
  webhooks: "Webhooks",
  basic_automation: "Automatisations de base",
  advanced_automation: "Automatisations avancées",
  brevo: "Brevo",
  api: "API",
  ai: "Assistant IA",
  custom_branding: "Personnalisation de marque",
  custom_domain: "Domaine personnalisé",
  remove_powered_by: "Masquer « Propulsé par »",
}

export default function PricingPage() {
  const plans = publicPlans()
  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#071039] dark:bg-[#0B1220] dark:text-[#F2F5FA]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden h-10 min-h-10 rounded-xl sm:inline-flex">
            <Link href="/">Accueil</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 min-h-10 rounded-xl">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild className="h-10 min-h-10 rounded-xl bg-[#2E5DE6] text-white hover:bg-[#1A3BB0]">
            <Link href="/signup">Essayer gratuitement</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-[#1A3BB0] uppercase dark:text-[#6E92F2]">
          WOLOYEM Score
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Tarifs</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
          Offre catalogue par organisation. {DEFAULT_TRIAL_DAYS} jours gratuits sans carte. Les montants
          définitifs sont confirmés par Stripe au Checkout. Enterprise se traite sur devis.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan, index) => (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_12px_32px_-24px_rgba(7,16,57,0.35)]",
                "motion-safe:transition-[transform,border-color] hover:-translate-y-0.5 hover:border-[#2E5DE6]/35",
                plan.id === "starter" && "border-[#2E5DE6]/40 ring-1 ring-[#2E5DE6]/20",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h2 className="text-2xl font-semibold tracking-tight">{plan.name}</h2>
              <p className="mt-2 text-[15px] font-semibold text-[#071039] dark:text-[#F5F7FA]">
                {priceLabel(plan)}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-[13px] text-[#3D4F7A] dark:text-[#C5D0DE]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#2E5DE6]" aria-hidden />
                  {countLabel(plan.limits.scorecards, "scorecard", "scorecards")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#2E5DE6]" aria-hidden />
                  {countLabel(plan.limits.assessment_starts, "démarrage / mois", "démarrages / mois")}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#2E5DE6]" aria-hidden />
                  {countLabel(plan.limits.team_members, "membre", "membres")}
                </li>
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#2E5DE6]" aria-hidden />
                    {FEATURE_LABELS[feature] ?? feature.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                {plan.id === "starter" || plan.id === "free" ? (
                  <Link
                    className="inline-flex h-10 min-h-10 items-center gap-1.5 rounded-xl bg-[#2E5DE6] px-4 text-[13px] font-semibold text-white hover:bg-[#1A3BB0] focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none dark:bg-[#2E5DE6] dark:hover:bg-[#6E92F2]"
                    href="/signup"
                  >
                    {plan.id === "starter"
                      ? `Commencer mes ${DEFAULT_TRIAL_DAYS} jours gratuits`
                      : "Commencer gratuitement"}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ) : null}
                {plan.selfServe && plan.id !== "starter" && plan.id !== "free" ? (
                  <Link
                    className="inline-flex h-10 min-h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-[13px] font-semibold hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none"
                    href="/dashboard/settings/billing"
                  >
                    Gérer l&apos;abonnement
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ) : null}
                {plan.id === "enterprise" ? (
                  <a
                    className="inline-flex h-10 min-h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-[13px] font-semibold hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none"
                    href="mailto:hello@woloyem.com"
                  >
                    Contacter les ventes
                    <ArrowRight className="size-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-[13px] text-[#3D4F7A] dark:text-[#C5D0DE]">
          {PLANS.internal.public ? "" : "Le plan interne n'est pas proposé ici. L’abonnement Starter est facturé à l’organisation."}
        </p>
      </main>
    </div>
  )
}

function priceLabel(plan: PlanDefinition) {
  if (plan.monthlyPrice === 0) return "Gratuit"
  if (plan.monthlyPrice == null) return "Sur devis / Checkout Stripe"
  return `${plan.monthlyPrice} USD / mois / organisation`
}

function countLabel(value: number | null, singular: string, plural: string) {
  if (value === null) return `Illimité · ${plural}`
  const formatted = new Intl.NumberFormat("fr-FR").format(value)
  return `${formatted} ${value === 1 ? singular : plural}`
}
