import type { Chapter } from "../types"

export const productSearchChapter: Chapter = {
  id: "recherche",
  title: "Rechercher dans WOLOYEM Score",
  description: "La recherche du header, distincte de la recherche de ce guide.",
  emoji: "🔎",
  keywords: ["recherche globale", "header"],
  sections: [
    {
      id: "recherche-header",
      title: "Ce que la recherche trouve",
      keywords: ["scorecards", "leads", "membres", "mobile"],
      blocks: [
        { type: "p", text: "Le champ du header indique Rechercher dans WOLOYEM Score. À partir de deux caractères, un panneau groupe les résultats : Scorecards, Leads, Membres. Un clic ouvre la fiche." },
        { type: "list", items: [
          "Scorecards : nom ou adresse publique.",
          "Leads actifs : prénom, nom, email, téléphone, entreprise. La corbeille n'apparaît pas.",
          "Membres : nom ou email, seulement pour Owner et Admin. Le lien ouvre l'équipe avec le membre mis en évidence.",
        ] },
        { type: "p", text: "Sur un écran étroit, l'icône Recherche ouvre une feuille plein écran. Editor, Analyst et Viewer voient les scorecards et les leads, avec l'email du lead masqué. Ils ne reçoivent pas les membres." },
        { type: "callout", kind: "important", text: "Cette recherche n'explore ni les notes, ni les rapports, ni le texte de ce guide. Pour le guide, utilisez Que souhaitez-vous apprendre ? en haut de cette page." },
      ],
    },
  ],
}
