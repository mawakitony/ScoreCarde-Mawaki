import type { Chapter } from "../types"

const editors = ["Owner", "Admin", "Editor"]

export const scoringChapter: Chapter = {
  id: "scoring",
  title: "Scoring et résultats",
  description: "Poids, plages, règles obligatoires et lecture du pourcentage.",
  emoji: "🎯",
  keywords: ["score", "scoring", "résultat", "plage"],
  sections: [
    {
      id: "configurer-le-scoring",
      title: "Configurer le scoring",
      keywords: ["score", "poids", "moyenne pondérée", "100 %"],
      blocks: [
        { type: "p", text: "Le score est un pourcentage. Il vient des points des options et du poids de chaque catégorie de scoring. Ouvrez le builder, passez en Mode avancé, puis l'étape Score." },
        { type: "list", items: [
          "Donnez des points aux options des questions scorées.",
          "Créez des catégories de scoring et indiquez leur poids.",
          "Vérifiez que la somme fait 100 %.",
          "Laissez non scorées les questions qui ne jugent pas le niveau.",
        ] },
        { type: "roles", roles: editors },
        { type: "callout", kind: "example", text: "Deux catégories : Pratique 70 % et Connaissance 30 %. Un excellent score en Connaissance ne compense pas une Pratique très faible." },
        { type: "callout", kind: "important", text: "Si les poids ne totalisent pas 100 %, ou si les plages se chevauchent ou laissent un trou, la publication est bloquée." },
      ],
    },
    {
      id: "deux-categories",
      title: "Catégorie de questions et catégorie de scoring",
      keywords: ["catégorie", "différence"],
      blocks: [
        { type: "compare", leftTitle: "Catégorie de questions", left: "Étape Catégories. Elle range les questions pour la lecture du questionnaire. Elle ne pèse rien.", rightTitle: "Catégorie de scoring", right: "Étape Score. Elle porte un poids, un score maximum et des messages haut, moyen et bas." },
      ],
    },
    {
      id: "plages-detail",
      title: "Lire une plage de résultat",
      keywords: ["badge", "recommandation", "cta", "0-39"],
      blocks: [
        { type: "p", text: "La plage transforme le pourcentage en message. Exemple simple : 0–39 À améliorer, 40–69 Intermédiaire, 70–100 Excellent." },
        { type: "p", text: "Pour chaque plage, remplissez le titre, le badge, le message, la recommandation, le libellé du CTA et son URL. Le visiteur voit la plage qui contient son pourcentage, après application des règles." },
        { type: "callout", kind: "tip", text: "Le testeur de l'étape Résultats montre le badge et le CTA sans créer de lead et sans publier." },
      ],
    },
    {
      id: "regles-detail",
      title: "Règles obligatoires",
      keywords: ["force result", "maximum result", "et"],
      blocks: [
        { type: "p", text: "Une règle ne remplace pas le calcul des points. Elle décide si la plage affichée doit être forcée ou limitée. Les conditions d'une règle sont toutes exigées (ET)." },
        { type: "compare", leftTitle: "Force Result", left: "Impose une plage. Le pourcentage calculé ne change pas.", rightTitle: "Maximum Result", right: "Interdit une plage plus favorable. Le pourcentage officiel n'est pas augmenté." },
        { type: "compare", leftTitle: "Score", left: "Le pourcentage, éventuellement réduit par un plafond de score.", rightTitle: "Résultat", right: "La plage, le badge et la recommandation montrés. Ils peuvent différer de ce que le seul pourcentage aurait choisi." },
        { type: "callout", kind: "warning", text: "Le plafond de score, dans la même étape, baisse le pourcentage. Ne le confondez pas avec Maximum Result." },
      ],
    },
  ],
}
