import type { Chapter } from "../types"

const readers = ["Owner", "Admin", "Editor", "Analyst", "Viewer"]
const editors = ["Owner", "Admin"]

export const leadsChapter: Chapter = {
  id: "leads",
  title: "Leads et CRM",
  description: "Retrouver, qualifier, exporter, puis supprimer ou anonymiser un lead.",
  emoji: "👥",
  keywords: ["crm", "lead", "contact"],
  sections: [
    {
      id: "liste",
      title: "Retrouver un lead",
      keywords: ["recherche", "filtre", "liste"],
      blocks: [
        { type: "p", text: "La page Leads liste les contacts issus des scorecards de votre organisation. La recherche porte sur le nom, l'email, le téléphone et l'entreprise. Les onglets Actifs et Corbeille séparent la liste courante des leads supprimés." },
        { type: "p", text: "Les filtres s'ouvrent en pastilles : scorecard, statut, température, pays, tag, résultat, source, campagne, CTA, tri, score et période. Le tri va du plus récent au nom ou au score. Effacer retire les filtres actifs." },
        { type: "roles", roles: readers },
        { type: "links", items: [{ href: "/dashboard/leads", label: "Ouvrir les leads" }] },
      ],
    },
    {
      id: "fiche",
      title: "Lire la fiche",
      keywords: ["fiche", "note", "activité", "tag", "statut"],
      blocks: [
        { type: "p", text: "Ouvrez un lead pour voir, à gauche, les informations, le résultat, les réponses, les notes et l'historique. À droite : le statut, la température, la scorecard, les actions et l'origine marketing." },
        { type: "p", text: "Le statut se change à la main : Nouveau, Contacté, Qualifié, Nurturing, Converti, Perdu. La température est calculée. Chaud : 75 % ou plus, ou un clic sur le CTA. Tiède : à partir de 40 %. Sinon Froid. Vous ne la saisissez pas." },
        { type: "p", text: "Les tags se créent, se colorent et s'assignent. Une note interne est visible par l'équipe, pas par le visiteur. L'historique retrace ce qui s'est passé sur la fiche." },
        { type: "roles", roles: editors },
        { type: "callout", kind: "important", text: "Editor, Analyst et Viewer peuvent consulter. Seuls Owner et Admin modifient le statut, les tags et les notes." },
      ],
    },
    {
      id: "export",
      title: "Exporter",
      keywords: ["csv", "export", "sélection"],
      blocks: [
        { type: "p", text: "Trois exports CSV : le filtre en cours, toute la liste active, ou seulement les lignes cochées. L'export d'une fiche existe aussi depuis le lead." },
        { type: "roles", roles: ["Owner", "Admin", "Analyst"] },
        { type: "callout", kind: "important", text: "L'Analyst exporte seulement si le plan inclut l'export CSV. L'Editor et le Viewer ne voient pas ces actions." },
      ],
    },
    {
      id: "supprimer-et-restaurer",
      title: "Supprimer et restaurer un lead",
      keywords: ["corbeille", "restaurer", "restauration", "supprimer", "lead supprimé", "anonymiser"],
      blocks: [
        { type: "p", text: "Supprimer envoie le lead dans l'onglet Corbeille. Il disparaît de la liste active et de la recherche globale. Il n'est pas effacé de la base." },
        { type: "p", text: "Dans Corbeille, Restaurer le remet dans Actifs. Anonymiser définitivement retire le nom, l'email, le téléphone, l'entreprise et le contenu des notes." },
        { type: "compare", leftTitle: "Corbeille", left: "Le lead peut être restauré. Ses données personnelles sont encore là.", rightTitle: "Anonymiser définitivement", right: "Les données personnelles sont retirées. Cette action n'est pas réversible." },
        { type: "callout", kind: "warning", text: "Après anonymisation, vous ne pouvez pas retrouver l'identité. Les résultats statistiques non personnels peuvent rester." },
        { type: "roles", roles: editors },
        { type: "links", items: [{ href: "/dashboard/leads?view=trash", label: "Ouvrir la corbeille" }] },
      ],
    },
  ],
}
