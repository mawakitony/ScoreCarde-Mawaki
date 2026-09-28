import type { Chapter } from "../types"

export const analyticsChapter: Chapter = {
  id: "analytics",
  title: "Analytics",
  description: "Lire les indicateurs du tableau de bord et de la page Statistiques.",
  emoji: "📈",
  keywords: ["statistiques", "kpi", "entonnoir"],
  sections: [
    {
      id: "kpi",
      title: "Les indicateurs du tableau de bord",
      keywords: ["kpi", "leads", "score moyen", "hot"],
      blocks: [
        { type: "p", text: "Le tableau de bord et la page Statistiques utilisent la période choisie en haut de page. Comparez-la à la période précédente grâce à la variation affichée sous certains chiffres." },
        { type: "list", items: [
          "Total des leads : les contacts capturés sur la période. C'est votre volume commercial.",
          "Nouveaux leads : ceux qui arrivent pour la première fois. Utile pour voir si une campagne démarre.",
          "Évaluations terminées : les visiteurs qui sont allés au bout. Si ce chiffre est bas par rapport aux démarrages, le questionnaire est trop long ou bloque.",
          "Taux de conversion : clics sur le CTA divisés par les évaluations terminées. Il dit si le résultat donne envie d'agir.",
          "Score moyen : le niveau général des évaluations terminées. Un score bas récurrent peut venir des questions, pas seulement des visiteurs.",
          "Leads chauds : température chaude, donc 75 % ou plus, ou un clic CTA. Ce sont les personnes à rappeler en premier.",
          "Taux de clic CTA : clics divisés par les résultats vus. Il isole l'efficacité du bouton, une fois le résultat affiché.",
        ] },
        { type: "links", items: [
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/dashboard/analytics", label: "Statistiques" },
        ] },
      ],
    },
    {
      id: "funnel",
      title: "Entonnoir, distributions et origines",
      keywords: ["funnel", "pays", "source", "campagne", "drop-off"],
      blocks: [
        { type: "p", text: "L'entonnoir compte, dans l'ordre : vues de la page, démarrages, leads envoyés, évaluations terminées, résultats vus, clics CTA. Le pourcentage sous une étape est sa part par rapport à l'étape d'avant. Le temps médian et le temps moyen ignorent les sessions de plus de 24 heures." },
        { type: "p", text: "La distribution des scores regroupe les pourcentages. La distribution des résultats regroupe les plages réellement obtenues. Les tableaux Pays, Sources, Campagnes et Mediums montrent d'où viennent les sessions." },
        { type: "p", text: "Le tableau Scorecards reprend vues, démarrages, leads, terminées, conversion, score moyen et CTA. Le lien d'une ligne ouvre les statistiques de cette scorecard : le même entonnoir, le drop-off question par question, et les réponses des questions à choix." },
        { type: "callout", kind: "tip", text: "Un drop-off fort sur une question indique l'endroit où les visiteurs abandonnent. Raccourcissez-la ou rendez-la non obligatoire si elle n'est pas essentielle." },
      ],
    },
  ],
}
