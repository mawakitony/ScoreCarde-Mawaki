import type { Chapter } from "../types"

export const reportsChapter: Chapter = {
  id: "rapports",
  title: "Rapports",
  description: "Le rapport du participant, la vue équipe, le partage et le PDF.",
  emoji: "📄",
  keywords: ["rapport", "pdf", "partage"],
  sections: [
    {
      id: "deux-vues",
      title: "Participant et équipe",
      keywords: ["html", "recommandation", "participant"],
      blocks: [
        { type: "p", text: "Après une évaluation, le participant voit son résultat : plage, recommandation et bouton s'ils sont configurés. L'équipe ouvre une vue plus complète depuis le lead, avec le contexte interne." },
        { type: "p", text: "La page HTML du rapport est le document de référence. Elle ne dépend pas d'un fichier PDF." },
        { type: "roles", roles: ["Owner", "Admin", "Editor", "Analyst", "Viewer"] },
      ],
    },
    {
      id: "partage-rapport",
      title: "Partager un rapport",
      keywords: ["expiration", "15 minutes", "lien"],
      blocks: [
        { type: "p", text: "Un lien de partage permet d'ouvrir le rapport sans compte. Il se révoque, et il expire au bout de 15 minutes. Passé ce délai, il ne s'ouvre plus." },
        { type: "callout", kind: "warning", text: "Ce lien n'est pas le lien public de la scorecard. Il concerne un résultat précis, pour une durée courte." },
      ],
    },
    {
      id: "pdf-ia",
      title: "PDF et analyse IA",
      keywords: ["pdf", "ia", "configuration"],
      blocks: [
        { type: "p", text: "Le PDF est produit par un traitement en file, puis stocké. Il n'est pas garanti dans tous les environnements : le plan doit inclure les rapports PDF, et le stockage ainsi que le traitement doivent être configurés. Sinon, utilisez la page HTML." },
        { type: "config", text: "PDF : plan compatible, stockage des rapports et traitement en file." },
        { type: "p", text: "L'analyse IA rédige un commentaire à partir du résultat. Elle ne modifie jamais le score officiel. Elle reste inactive tant que le mode de l'organisation est Désactivée, ou tant que le fournisseur IA n'est pas configuré. Le mode Automatique ne concerne que les scorecards qui l'autorisent." },
        { type: "config", text: "IA : fournisseur configuré, plan qui inclut l'IA, et mode Manuelle ou Automatique." },
        { type: "links", items: [
          { href: "/dashboard/settings/reports", label: "Réglages des rapports" },
          { href: "/dashboard/settings/ai", label: "Réglages de l'IA" },
        ] },
      ],
    },
  ],
}
