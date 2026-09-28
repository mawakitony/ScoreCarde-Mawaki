import type { Chapter } from "../types"

const editors = ["Owner", "Admin", "Editor"]

export const startChapter: Chapter = {
  id: "bien-demarrer",
  title: "Bien démarrer",
  description: "Le parcours court pour publier une première scorecard et lire les premiers leads.",
  emoji: "🚀",
  keywords: ["débutant", "premiers pas", "dashboard", "notification"],
  sections: [
    {
      id: "parcours-court",
      title: "Le parcours en cinq actions",
      keywords: ["premiers pas", "publier", "lead"],
      blocks: [
        { type: "p", text: "WOLOYEM Score sert à publier un questionnaire noté, recueillir des contacts, puis lire les leads et les statistiques." },
        { type: "list", items: [
          "Créez une scorecard, vide ou depuis un modèle.",
          "Complétez l'identité, la page d'accueil et les questions dans le builder.",
          "Ajoutez le scoring et les résultats si vous êtes en mode avancé.",
          "Testez avec Aperçu, puis cliquez sur Publier.",
          "Partagez le lien ou le QR Code, puis suivez les leads.",
        ] },
        { type: "roles", roles: editors },
        { type: "links", items: [
          { href: "/dashboard", label: "Ouvrir le tableau de bord" },
          { href: "/dashboard/scorecards", label: "Ouvrir les scorecards" },
          { href: "/dashboard/templates", label: "Voir les modèles" },
        ] },
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      keywords: ["cloche", "notification", "lead chaud"],
      blocks: [
        { type: "p", text: "La cloche du header affiche les alertes de votre organisation : nouveau lead chaud, score élevé, clic sur un CTA, conversion enregistrée, ou usage proche de la limite du plan." },
        { type: "p", text: "Ouvrez la cloche pour lire une alerte ou tout marquer comme lu. Ces messages ne contiennent pas le détail personnel du lead : ouvrez la fiche lead pour le contexte." },
      ],
    },
  ],
}
