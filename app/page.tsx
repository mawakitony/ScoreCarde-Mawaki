import type { Metadata } from "next"
import { LandingPage } from "@/components/marketing/landing-page"
import { getUser } from "@/lib/auth/session"
import { DEFAULT_TRIAL_DAYS } from "@/lib/billing/plans"

export const metadata: Metadata = {
  title: "WOLOYEM Score — Scorecards, CRM et décisions pour chaque entreprise",
  description: `Créez des scorecards, analysez les réponses, gérez vos prospects et collaborez en équipe. Essai ${DEFAULT_TRIAL_DAYS} jours gratuit, puis Starter à 10 USD / mois / organisation.`,
  openGraph: {
    title: "WOLOYEM Score",
    description:
      "Plateforme SaaS multi-entreprises : scorecards intelligentes, CRM, analytics et abonnement par organisation.",
    type: "website",
  },
}

export default async function HomePage() {
  const user = await getUser()
  return <LandingPage signedIn={Boolean(user)} />
}
