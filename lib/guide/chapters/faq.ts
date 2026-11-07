import type { Chapter } from "../types"

export const faqChapter: Chapter = {
  id: "faq",
  title: "Questions fréquentes",
  description: "Les réponses courtes aux blocages les plus fréquents.",
  emoji: "❓",
  keywords: ["faq", "aide"],
  sections: [
    {
      id: "faq-creer",
      title: "Comment créer ma première scorecard ?",
      keywords: ["créer", "première"],
      blocks: [
        { type: "p", text: "Scorecards, Nouvelle scorecard, puis le builder. Ou un modèle, Créer à partir de ce modèle. Suivez ensuite le chapitre Créer ma première scorecard." },
      ],
    },
    {
      id: "faq-public",
      title: "Pourquoi mes modifications ne sont-elles pas visibles publiquement ?",
      keywords: ["publier", "brouillon", "visible"],
      blocks: [
        { type: "p", text: "Le builder modifie le brouillon. Les visiteurs voient la dernière version publiée. Cliquez sur Publier pour remplacer cette version. Le bandeau Modifications non publiées confirme qu'il reste un écart." },
      ],
    },
    {
      id: "faq-tester",
      title: "Comment tester avant de publier ?",
      keywords: ["aperçu", "preview"],
      blocks: [
        { type: "p", text: "Utilisez Aperçu dans le builder, ou Aperçu dans le menu de la liste. Ce n'est pas le lien à envoyer. Le testeur de résultat, à l'étape Résultats, montre la plage sans publier." },
      ],
    },
    {
      id: "faq-score",
      title: "Comment modifier le score ?",
      keywords: ["points", "poids"],
      blocks: [
        { type: "p", text: "Mode avancé, étape Score. Changez les points des options ou les poids des catégories de scoring. Le total des poids doit rester 100 %. Republiez ensuite." },
      ],
    },
    {
      id: "faq-categories",
      title: "Quelle différence entre catégorie et catégorie de scoring ?",
      keywords: ["catégorie"],
      blocks: [
        { type: "p", text: "La catégorie de questions organise le questionnaire. La catégorie de scoring porte un poids et entre dans le calcul. Les deux se règlent à des étapes différentes du mode avancé." },
      ],
    },
    {
      id: "faq-regles",
      title: "Comment fonctionnent les règles obligatoires ?",
      keywords: ["force", "maximum"],
      blocks: [
        { type: "p", text: "Elles sont dans l'étape Score. Force Result change la plage affichée sans changer le pourcentage. Maximum Result empêche une plage plus favorable. Les conditions d'une règle sont toutes exigées." },
      ],
    },
    {
      id: "faq-corbeille",
      title: "Comment récupérer un lead supprimé ?",
      keywords: ["restaurer", "récupérer"],
      blocks: [
        { type: "p", text: "Leads, onglet Corbeille, Restaurer. Le lead revient dans Actifs. Owner et Admin seulement." },
        { type: "links", items: [{ href: "/dashboard/leads?view=trash", label: "Aller à la corbeille" }] },
      ],
    },
    {
      id: "faq-anonyme",
      title: "Puis-je annuler une anonymisation ?",
      keywords: ["anonymiser", "irréversible"],
      blocks: [
        { type: "p", text: "Non. Anonymiser définitivement retire les données personnelles et les notes. La restauration n'existe que pour un lead encore dans la corbeille, avant cette action." },
      ],
    },
    {
      id: "faq-qr",
      title: "Comment générer un QR Code ?",
      keywords: ["télécharger", "générer"],
      blocks: [
        { type: "p", text: "La scorecard doit être publiée. Menu Partager, puis le QR s'affiche. Télécharger le QR Code enregistre un PNG. Un brouillon ne produit pas de QR public." },
      ],
    },
    {
      id: "faq-inviter",
      title: "Comment inviter un membre ?",
      keywords: ["invitation", "code"],
      blocks: [
        { type: "p", text: "Réglages, Équipe. Invitation par lien, ou code de première connexion à copier ou à envoyer avec WhatsApp. Owner et Admin." },
      ],
    },
    {
      id: "faq-role",
      title: "Quel rôle donner à un membre ?",
      keywords: ["rôle", "editor", "viewer"],
      blocks: [
        { type: "p", text: "Editor pour rédiger et publier. Analyst pour consulter et exporter si le plan le permet. Viewer pour lire seulement. Admin pour gérer l'organisation. Le changement de rôle est réservé au Owner." },
      ],
    },
    {
      id: "faq-excel",
      title: "Comment importer des questions avec Excel ?",
      keywords: ["importer", "classeur"],
      blocks: [
        { type: "p", text: "Téléchargez le modèle ou exportez la scorecard. Déposez le fichier .xlsx, choisissez Ajouter, Mettre à jour ou Remplacer, lisez le résumé, puis confirmez. Publiez ensuite." },
      ],
    },
    {
      id: "faq-indisponible",
      title: "Pourquoi une fonctionnalité est-elle indisponible ?",
      keywords: ["permission", "plan", "rôle"],
      blocks: [
        { type: "p", text: "Soit votre rôle ne l'autorise pas, soit le plan ne l'inclut pas, soit un service externe n'est pas configuré. Le badge Disponible pour et le badge Configuration requise, dans ce guide, indiquent lequel des trois s'applique." },
      ],
    },
    {
      id: "faq-domaine",
      title: "Comment utiliser un domaine personnalisé ?",
      keywords: ["hôte", "dns"],
      blocks: [
        { type: "p", text: "Réglages, Domaines. Ajoutez l'hôte, configurez le DNS, puis vérifiez. Seul un domaine vérifié de votre organisation remplace l'adresse de partage. Le plan doit inclure cette fonction." },
      ],
    },
  ],
}
