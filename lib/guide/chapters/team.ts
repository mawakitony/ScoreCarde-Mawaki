import type { Chapter } from "../types"

export const teamChapter: Chapter = {
  id: "equipe",
  title: "Équipe et permissions",
  description: "Choisir un rôle, inviter, puis ajuster l'accès.",
  emoji: "👤",
  keywords: ["membre", "équipe", "rôle", "invitation", "first access"],
  sections: [
    {
      id: "quel-role",
      title: "Quel rôle choisir ?",
      keywords: ["owner", "admin", "editor", "analyst", "viewer", "membre"],
      blocks: [
        { type: "p", text: "Le rôle limite les boutons, pas seulement les menus. Une personne sans le droit ne reçoit pas la donnée correspondante dans la recherche." },
        { type: "table", headers: ["Rôle", "Ce qu'il peut faire"], rows: [
          ["Owner", "Tout, y compris changer les rôles, transférer la propriété et gérer la facturation."],
          ["Admin", "L'équipe, l'organisation, les domaines, les intégrations, les leads et les scorecards. Il consulte la facturation. Il ne transfère pas la propriété et ne gère pas l'abonnement."],
          ["Editor", "Créer, modifier et publier les scorecards. Consulter les leads, les statistiques et les rapports. Pas d'export, pas de suppression de lead, pas d'équipe."],
          ["Analyst", "Consulter les leads, exporter le CSV si le plan l'inclut, lire les statistiques, les rapports et la facturation. Pas de modification de scorecard."],
          ["Viewer", "Consulter les leads, les statistiques et les rapports. Email masqué dans la recherche. Aucune action de modification."],
        ] },
        { type: "callout", kind: "tip", text: "Choisissez Editor pour quelqu'un qui rédige les questionnaires. Analyst pour quelqu'un qui lit et exporte. Viewer pour une consultation seule. Admin pour un responsable d'organisation. Gardez un seul Owner, ou transférez la propriété explicitement." },
      ],
    },
    {
      id: "inviter",
      title: "Inviter et premier accès",
      keywords: ["invitation", "code", "whatsapp", "régénérer", "annuler"],
      blocks: [
        { type: "p", text: "Réglages, Équipe. Deux façons d'ajouter quelqu'un : une invitation par lien, pour une personne qui a déjà un compte, ou un code de première connexion." },
        { type: "p", text: "Le code s'affiche une fois. Copiez-le ou ouvrez Partager via WhatsApp. Le message contient le code et le lien de création du mot de passe. Vous pouvez régénérer le code ou annuler l'invitation tant qu'elle n'est pas utilisée." },
        { type: "callout", kind: "important", text: "L'envoi automatique par email n'est pas garanti. Le partage manuel du code, par copie ou WhatsApp, est le parcours prévu." },
        { type: "roles", roles: ["Owner", "Admin"] },
        { type: "links", items: [{ href: "/dashboard/settings/team", label: "Ouvrir l'équipe" }] },
      ],
    },
    {
      id: "changer-role",
      title: "Changer un rôle ou la propriété",
      keywords: ["modifier le rôle", "transférer"],
      blocks: [
        { type: "p", text: "Le Owner voit Modifier le rôle sur un membre qui n'est pas Owner. Le choix est Admin, Editor, Analyst ou Viewer. La phrase de confirmation indique l'ancien et le nouveau rôle. Le changement s'applique au prochain chargement de page." },
        { type: "p", text: "Transférer la propriété échange les rôles : le membre choisi devient Owner, et l'actuel Owner devient Admin. Un Admin ne peut pas lancer ce transfert." },
        { type: "roles", roles: ["Owner"] },
      ],
    },
  ],
}
