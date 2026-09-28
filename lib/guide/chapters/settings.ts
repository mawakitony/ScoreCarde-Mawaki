import type { Chapter } from "../types"

const managers = ["Owner", "Admin"]

export const settingsChapter: Chapter = {
  id: "parametres",
  title: "Paramètres",
  description: "Chaque entrée de Réglages, et ce qu'elle exige.",
  emoji: "⚙️",
  keywords: ["réglages", "paramètres"],
  sections: [
    {
      id: "profil",
      title: "Profil",
      keywords: ["profil", "nom"],
      blocks: [
        { type: "p", text: "Réglages, Profil. Vous y mettez le nom affiché à côté de votre avatar. L'email du compte n'est pas un champ libre de cette page." },
        { type: "links", items: [{ href: "/dashboard/settings/profile", label: "Ouvrir le profil" }] },
      ],
    },
    {
      id: "organisation",
      title: "Organisation",
      keywords: ["organisation", "fuseau", "langue", "site"],
      blocks: [
        { type: "p", text: "Nom, adresse interne, site web, pays, fuseau horaire, langue par défaut et pied de page. Ces informations décrivent l'organisation, pas une scorecard." },
        { type: "roles", roles: managers },
        { type: "links", items: [{ href: "/dashboard/settings/organization", label: "Ouvrir l'organisation" }] },
      ],
    },
    {
      id: "equipe-reglage",
      title: "Équipe",
      keywords: ["équipe"],
      blocks: [
        { type: "p", text: "La page Équipe concentre les membres, les invitations et le transfert de propriété. Le détail est dans le chapitre Équipe et permissions." },
        { type: "roles", roles: managers },
      ],
    },
    {
      id: "facturation",
      title: "Facturation",
      keywords: ["plan", "quota", "stripe"],
      blocks: [
        { type: "p", text: "La page montre le plan, la période et l'usage : évaluations démarrées, leads, scorecards, membres. Les plafonds dépendent du plan. Un usage élevé ou une limite atteinte peut créer une notification." },
        { type: "p", text: "Le Owner ouvre le paiement ou le portail d'abonnement. L'Admin et l'Analyst consultent la page. L'Editor et le Viewer sont refusés." },
        { type: "config", text: "Stripe : clés de paiement configurées pour changer de plan depuis l'application." },
        { type: "roles", roles: ["Owner", "Admin", "Analyst"] },
        { type: "callout", kind: "important", text: "Consulter n'est pas gérer. Seul le Owner lance un changement d'abonnement." },
        { type: "links", items: [{ href: "/dashboard/settings/billing", label: "Ouvrir la facturation" }] },
      ],
    },
    {
      id: "domaine-personnalise",
      title: "Domaine personnalisé",
      keywords: ["domaine", "dns", "vérifié"],
      blocks: [
        { type: "p", text: "Réglages, Domaines. Ajoutez le nom d'hôte, puis vérifiez-le. Tant que le statut n'est pas vérifié, les liens publics restent sur l'adresse de la plateforme. Un domaine pending, en échec ou désactivé n'est pas utilisé." },
        { type: "p", text: "Une fois vérifié, le partage d'une scorecard publiée utilise https://votre-domaine/slug. Les adresses /s/slug de la plateforme continuent d'exister." },
        { type: "config", text: "DNS du domaine, et vérification réussie dans WOLOYEM Score. Le plan doit inclure le domaine personnalisé." },
        { type: "roles", roles: managers },
        { type: "links", items: [{ href: "/dashboard/settings/domains", label: "Ouvrir les domaines" }] },
      ],
    },
    {
      id: "integrations",
      title: "Intégrations",
      keywords: ["webhook", "brevo", "api", "automatisation"],
      blocks: [
        { type: "p", text: "Vous pouvez brancher un webhook, consulter ses livraisons, activer des règles d'automatisation, créer une clé d'API et connecter Brevo. Les événements utiles sont le lead chaud, le score élevé, le clic CTA et la conversion." },
        { type: "config", text: "Webhook, automatisation, clé d'API et Brevo : un compte externe, plus un plan qui inclut la fonction. Brevo commence au plan Pro." },
        { type: "roles", roles: managers },
        { type: "links", items: [{ href: "/dashboard/settings/integrations", label: "Ouvrir les intégrations" }] },
      ],
    },
    {
      id: "rapports-reglage",
      title: "Rapports",
      keywords: ["marque", "pied de page"],
      blocks: [
        { type: "p", text: "Marque, site, email de contact et pied de page utilisés dans les rapports. Le mode IA se règle sur la page IA, pas ici." },
        { type: "roles", roles: managers },
        { type: "links", items: [{ href: "/dashboard/settings/reports", label: "Ouvrir les rapports" }] },
      ],
    },
    {
      id: "ia",
      title: "Intelligence artificielle",
      keywords: ["ia", "automatique", "manuelle"],
      blocks: [
        { type: "p", text: "Trois modes : Désactivée, Manuelle, Automatique pour les scorecards qui l'autorisent. L'IA commente un rapport. Elle n'écrit aucun score." },
        { type: "config", text: "Fournisseur IA configuré sur l'environnement, et plan qui inclut l'IA." },
        { type: "p", text: "Si le fournisseur n'est pas configuré, la page l'indique : l'analyse IA n'est pas configurée." },
        { type: "roles", roles: managers },
        { type: "links", items: [{ href: "/dashboard/settings/ai", label: "Ouvrir l'IA" }] },
      ],
    },
    {
      id: "journal",
      title: "Journal d'activité",
      keywords: ["journal", "acteur", "filtre"],
      blocks: [
        { type: "p", text: "Le journal montre qui a fait quoi : acteur, action en langage clair, ressource et date. Les filtres sont l'acteur, le type d'action et la période." },
        { type: "p", text: "Vous y voyez notamment les invitations, les changements de rôle, les codes de première connexion, les publications, les suppressions, restaurations et anonymisations de leads, et les changements d'abonnement. Les secrets, les codes et les emails complets ne sont pas affichés." },
        { type: "roles", roles: managers },
        { type: "links", items: [{ href: "/dashboard/settings/activity", label: "Ouvrir le journal" }] },
      ],
    },
  ],
}
