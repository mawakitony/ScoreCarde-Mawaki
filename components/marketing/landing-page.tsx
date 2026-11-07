import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileBarChart,
  LineChart,
  Shield,
  Users,
  UsersRound,
} from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { DashboardPreview } from "@/components/marketing/dashboard-preview"
import { GuidedDemo } from "@/components/marketing/guided-demo"
import { Button } from "@/components/ui/button"
import { DEFAULT_TRIAL_DAYS, PLANS } from "@/lib/billing/plans"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#demonstration", label: "Démonstration" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
] as const

const FEATURES = [
  {
    title: "Scorecards personnalisées",
    text: "Créez questionnaires, catégories, scoring et pages de résultat adaptés à votre activité.",
    icon: ClipboardList,
  },
  {
    title: "CRM intégré",
    text: "Consultez les leads de votre organisation, leurs fiches, statuts et liens vers les réponses.",
    icon: Users,
  },
  {
    title: "Prospects et clients",
    text: "Suivez les contacts issus de vos scorecards dans un espace privé à votre entreprise.",
    icon: UsersRound,
  },
  {
    title: "Dashboard analytique",
    text: "Vue d’ensemble, activité et indicateurs calculés à partir des données de votre organisation.",
    icon: LineChart,
  },
  {
    title: "Équipes et rôles",
    text: "Invitez des collaborateurs par e-mail avec des rôles OWNER, ADMIN ou MEMBER selon les permissions.",
    icon: Building2,
  },
  {
    title: "Organisations multi-entreprises",
    text: "Chaque entreprise dispose de son espace, isolé par authentification et RLS Supabase.",
    icon: Shield,
  },
  {
    title: "Rapports et résultats",
    text: "Exploitez résultats, rapports et exports déjà disponibles dans le produit.",
    icon: FileBarChart,
  },
  {
    title: "Facturation et abonnement",
    text: "Essai organisationnel, Checkout Stripe, portail de facturation et gestion de l’accès après paiement.",
    icon: CreditCard,
  },
] as const

const SECTORS = [
  {
    title: "Cosmétiques et beauté",
    text: "Scorecard de besoins, consentement, qualification des prospects et suivi dans le CRM de l’organisation.",
  },
  {
    title: "Immobilier",
    text: "Qualifiez les projets d’achat ou de location, centralisez les réponses et priorisez les contacts.",
  },
  {
    title: "Formation et coaching",
    text: "Diagnostics d’éligibilité, orientation vers une offre, et collaboration entre formateurs.",
  },
  {
    title: "Services professionnels",
    text: "Questionnaires de cadrage, scoring interne et passage de relais entre collaborateurs.",
  },
  {
    title: "Commerce et vente",
    text: "Capture de leads via lien public, suivi des statuts et lecture des résultats dans le dashboard.",
  },
  {
    title: "Conseil aux entreprises",
    text: "Évaluations clients, rapports et espace équipe pour partager le suivi sans mélanger les tenants.",
  },
] as const

const FAQ = [
  {
    q: "Comment fonctionne l’essai gratuit ?",
    a: `À la création de votre organisation, un essai de ${DEFAULT_TRIAL_DAYS} jours est activé une seule fois. Il est géré côté Supabase : aucune carte n’est demandée pour démarrer.`,
  },
  {
    q: "Dois-je ajouter une carte bancaire ?",
    a: "Non pour démarrer. La carte n’est demandée qu’au moment de souscrire via Stripe Checkout, après l’essai.",
  },
  {
    q: "Puis-je inviter mon équipe ?",
    a: "Oui. Le propriétaire invite des collaborateurs par e-mail. Ils rejoignent l’organisation existante ; ils ne créent pas un abonnement individuel.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Chaque organisation ne voit que ses propres données. L’accès est protégé par authentification Supabase et des politiques RLS par tenant.",
  },
  {
    q: "Que se passe-t-il après 14 jours ?",
    a: "Sans abonnement actif, l’espace de travail est bloqué. La facturation reste accessible pour souscrire. Les mécanismes de grâce et d’annulation déjà en place s’appliquent ensuite.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui via le portail de facturation Stripe. L’accès reste disponible jusqu’à la fin de la période déjà payée lorsque l’annulation est planifiée en fin de période.",
  },
  {
    q: "Puis-je utiliser WOLOYEM Score pour n’importe quel secteur ?",
    a: "Oui. Les scorecards, le CRM et le dashboard sont génériques : cosmétiques, immobilier, formation, services, commerce ou conseil.",
  },
] as const

const STARTER = PLANS.starter
const STARTER_PRICE = STARTER.monthlyPrice ?? 10

function limitLabel(value: number | null, singular: string, plural: string) {
  if (value === null) return plural
  return `${new Intl.NumberFormat("fr-FR").format(value)} ${value === 1 ? singular : plural}`
}

export function LandingPage({ signedIn = false }: { signedIn?: boolean }) {
  const primaryHref = signedIn ? "/dashboard" : "/signup"
  const primaryLabel = signedIn ? "Ouvrir mon espace" : "Essayer gratuitement pendant 14 jours"
  const secondaryTrialHref = signedIn ? "/dashboard" : "/signup"
  const loginHref = signedIn ? "/dashboard" : "/login"

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#071039] dark:bg-[#0B1220] dark:text-[#F2F5FA]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_top,#2E5DE622_0%,transparent_55%),linear-gradient(180deg,#E8EEFA_0%,#F4F6FB_48%,#F4F6FB_100%)] dark:bg-[radial-gradient(ellipse_at_top,#2E5DE633_0%,transparent_50%),linear-gradient(180deg,#0B1220_0%,#0B1220_100%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-[#071039]/08 bg-[#F4F6FB]/85 backdrop-blur-md dark:border-white/10 dark:bg-[#0B1220]/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#3D4F7A] transition-colors hover:bg-white/70 hover:text-[#071039] dark:text-[#C5D0DE] dark:hover:bg-white/5 dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden h-10 rounded-xl sm:inline-flex">
              <Link href={loginHref}>{signedIn ? "Dashboard" : "Se connecter"}</Link>
            </Button>
            <Button asChild className="h-10 rounded-xl bg-[#2E5DE6] px-4 text-white hover:bg-[#1A3BB0]">
              <Link href={signedIn ? "/dashboard" : "/signup"}>
                {signedIn ? "Mon espace" : "Essayer gratuitement"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — one composition: brand, headline, support, CTAs, dominant product visual */}
        <section className="relative overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-5 pt-10 pb-8 sm:pt-14 sm:pb-10">
            <div className="max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
              <p className="font-display text-[13px] font-semibold tracking-[0.2em] text-[#1A3BB0] uppercase dark:text-[#6E92F2]">
                WOLOYEM Score
              </p>
              <h1 className="mt-4 text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl md:text-[3.35rem]">
                Transformez vos questionnaires en clients et en décisions.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
                Créez des scorecards intelligentes, analysez les réponses, gérez vos prospects et
                collaborez avec votre équipe depuis une seule plateforme.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-12 rounded-xl bg-[#2E5DE6] px-5 text-[15px] text-white hover:bg-[#1A3BB0]"
                >
                  <Link href={primaryHref}>
                    {primaryLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-xl bg-white/70 px-5 text-[15px] dark:bg-transparent">
                  <a href="#demonstration">Découvrir la démonstration</a>
                </Button>
              </div>
              <p className="mt-4 text-[13px] text-[#5E6D7E] dark:text-[#A8B4C0]">
                {DEFAULT_TRIAL_DAYS} jours gratuits · sans carte bancaire · abonnement par organisation
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-6xl px-5 pb-16 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
            <DashboardPreview />
          </div>
        </section>

        <section id="fonctionnalites" className="scroll-mt-24 border-t border-[#071039]/08 py-16 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Fonctionnalités réellement disponibles</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
              Modules déjà présents dans le produit — présentés sans promesse hors périmètre.
            </p>
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <article key={feature.title}>
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#071039] text-white dark:bg-[#2E5DE6]">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{feature.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">{feature.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="scroll-mt-24 bg-white/70 py-16 dark:bg-white/[0.03]">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Comment ça marche</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
              Du premier clic à l’équipe opérationnelle, sans reconstruire un nouvel outil à chaque métier.
            </p>
            <ol className="mt-10 grid gap-6 md:grid-cols-4">
              {[
                "Créez votre compte et votre organisation.",
                "Publiez une scorecard et partagez le lien public.",
                "Recevez réponses et prospects dans votre espace.",
                "Invitez l’équipe et suivez résultats et abonnement.",
              ].map((text, index) => (
                <li key={text} className="relative">
                  <span className="text-[12px] font-semibold tracking-[0.16em] text-[#2E5DE6] uppercase">
                    0{index + 1}
                  </span>
                  <p className="mt-3 text-[15px] leading-relaxed font-medium text-[#071039] dark:text-[#F5F7FA]">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="demonstration" className="scroll-mt-24 py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Démonstration guidée</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
              Parcours fictif pour comprendre le produit. Aucune donnée client réelle n’est affichée.
            </p>
            <div className="mt-10">
              <GuidedDemo />
            </div>
          </div>
        </section>

        <section id="cas-usage" className="scroll-mt-24 border-t border-[#071039]/08 py-16 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pour tous les secteurs</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
              Exemples basés sur les modules existants (scorecards, CRM, équipe, rapports).
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {SECTORS.map((sector) => (
                <article key={sector.title} className="border-t border-[#071039]/12 pt-5 dark:border-white/15">
                  <h3 className="text-lg font-semibold tracking-tight">{sector.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">{sector.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tarifs" className="scroll-mt-24 bg-[#071039] py-16 text-white">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tarification simple</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/75">
              Une offre Starter pour démarrer. Facturation à l’organisation, pas par utilisateur individuel.
            </p>
            <div className="mt-10 max-w-xl">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-[#AFC5F8] uppercase">
                WOLOYEM Score — Starter
              </p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">{STARTER_PRICE}&nbsp;USD</span>
                <span className="text-white/70">/ mois / organisation</span>
              </p>
              <p className="mt-3 text-[15px] text-white/80">
                {DEFAULT_TRIAL_DAYS} jours gratuits, sans carte bancaire. L’essai est géré dans Supabase ;
                Stripe n’ouvre le paiement qu’après.
              </p>
              <ul className="mt-8 space-y-3 text-[14px] text-white/85">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6E92F2]" aria-hidden />
                  {limitLabel(STARTER.limits.scorecards, "scorecard", "scorecards")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6E92F2]" aria-hidden />
                  {limitLabel(STARTER.limits.assessment_starts, "démarrage d’évaluation / mois", "démarrages d’évaluation / mois")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6E92F2]" aria-hidden />
                  {limitLabel(STARTER.limits.leads, "lead", "leads")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6E92F2]" aria-hidden />
                  {limitLabel(STARTER.limits.team_members, "membre d’équipe", "membres d’équipe")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6E92F2]" aria-hidden />
                  Analytics, export CSV, rapports PDF, webhooks et automatisations de base
                </li>
              </ul>
              <Button asChild className="mt-8 h-12 rounded-xl bg-white px-5 text-[15px] font-semibold text-[#071039] hover:bg-[#E6EDFD]">
                <Link href={secondaryTrialHref}>
                  Commencer mes {DEFAULT_TRIAL_DAYS} jours gratuits
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <p className="mt-4 text-[12px] text-white/55">
                Montant catalogue affiché ici ; le montant définitif est confirmé par Stripe au Checkout.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 py-16">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">FAQ</h2>
            <div className="mt-8 divide-y divide-[#071039]/10 dark:divide-white/10">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="cursor-pointer list-none text-[16px] font-semibold tracking-tight marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-[#2E5DE6] transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#071039]/08 py-14 dark:border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Prêt à qualifier vos prochains contacts ?</h2>
              <p className="mt-2 text-[15px] text-[#3D4F7A] dark:text-[#C5D0DE]">
                Créez votre organisation et démarrez l’essai de {DEFAULT_TRIAL_DAYS} jours.
              </p>
            </div>
            <Button asChild className="h-12 rounded-xl bg-[#2E5DE6] px-5 text-white hover:bg-[#1A3BB0]">
              <Link href={primaryHref}>
                {signedIn ? "Retour au dashboard" : "Essayer gratuitement"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#071039]/08 bg-white/60 py-12 dark:border-white/10 dark:bg-[#0B1220]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[#3D4F7A] dark:text-[#C5D0DE]">
              Plateforme SaaS multi-entreprises pour scorecards, CRM et décisions.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1A3BB0] uppercase dark:text-[#6E92F2]">
              Produit
            </p>
            <ul className="mt-3 space-y-2 text-[14px]">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-[#3D4F7A] hover:text-[#071039] dark:text-[#C5D0DE] dark:hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/pricing" className="text-[#3D4F7A] hover:text-[#071039] dark:text-[#C5D0DE] dark:hover:text-white">
                  Grille tarifaire
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1A3BB0] uppercase dark:text-[#6E92F2]">
              Compte
            </p>
            <ul className="mt-3 space-y-2 text-[14px]">
              <li>
                <Link href={loginHref} className="text-[#3D4F7A] hover:text-[#071039] dark:text-[#C5D0DE] dark:hover:text-white">
                  {signedIn ? "Dashboard" : "Se connecter"}
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-[#3D4F7A] hover:text-[#071039] dark:text-[#C5D0DE] dark:hover:text-white">
                  Essayer gratuitement
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-[12px] leading-relaxed text-[#5E6D7E] dark:text-[#A8B4C0]">
              Politique de confidentialité et conditions d’utilisation : documents juridiques à publier —
              non inventés ici. Contact commercial déjà référencé dans le produit :{" "}
              <a className="underline-offset-2 hover:underline" href="mailto:hello@woloyem.com">
                hello@woloyem.com
              </a>
              .
            </p>
          </div>
        </div>
        <p className={cn("mx-auto mt-10 max-w-6xl px-5 text-[12px] text-[#5E6D7E] dark:text-[#A8B4C0]")}>
          © {new Date().getFullYear()} WOLOYEM Score. Les liens publics d’évaluation `/s/…` restent
          accessibles sans compte administrateur.
        </p>
      </footer>
    </div>
  )
}
