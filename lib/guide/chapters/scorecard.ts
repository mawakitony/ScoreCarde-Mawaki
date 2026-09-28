import type { Chapter } from "../types"

const editors = ["Owner", "Admin", "Editor"]

export const scorecardChapter: Chapter = {
  id: "premiere-scorecard",
  title: "Créer ma première scorecard",
  description: "Le tutoriel numéroté, de la création jusqu'au partage.",
  emoji: "📝",
  keywords: ["tutoriel", "première scorecard", "builder"],
  numbered: true,
  sections: [
    {
      id: "creer",
      title: "Créer une scorecard",
      keywords: ["créer", "modèle", "create scorecard"],
      blocks: [
        { type: "p", text: "Une scorecard est le questionnaire noté que vos visiteurs rempliront. Elle naît en brouillon." },
        { type: "p", text: "Où cliquer : Scorecards, puis le bouton Create Scorecard. La fenêtre s'intitule Nouvelle scorecard. Le bouton final est Créer la scorecard." },
        { type: "p", text: "Autre départ : Modèles, puis Créer à partir de ce modèle. Cela crée aussi un brouillon. S'il n'y a pas encore de modèle, la page l'indique et vous renvoie vers une scorecard vide." },
        { type: "roles", roles: editors },
        { type: "callout", kind: "example", text: "Vous partez d'un modèle « Éligibilité ». Vous obtenez une scorecard brouillon à personnaliser, pas une page déjà publique." },
        { type: "links", items: [
          { href: "/dashboard/scorecards", label: "Liste des scorecards" },
          { href: "/dashboard/templates", label: "Modèles" },
        ] },
      ],
    },
    {
      id: "identite",
      title: "Configurer son identité",
      keywords: ["nom", "slug", "identité", "couleur"],
      blocks: [
        { type: "p", text: "Dans le builder, l'étape Identité porte le nom interne, l'adresse publique (slug), la description, la langue (français ou anglais), la catégorie, les couleurs, le logo, l'image et la durée estimée." },
        { type: "p", text: "Le slug n'accepte que des minuscules, des chiffres et des tirets. Il devient la fin de l'adresse publique." },
        { type: "callout", kind: "example", text: "Nom : Éligibilité PMP. Slug : eligibilite-pmp. Les visiteurs ouvriront ensuite /s/eligibilite-pmp, ou le domaine vérifié suivi de ce slug." },
        { type: "callout", kind: "tip", text: "L'enregistrement est automatique. Attendez l'indication Enregistré avant de changer d'étape." },
      ],
    },
    {
      id: "page-accueil",
      title: "Construire la page d'accueil",
      keywords: ["landing", "page d'accueil", "surtitre", "bénéfice"],
      blocks: [
        { type: "p", text: "L'étape Page d'accueil est ce que le visiteur voit avant de commencer." },
        { type: "list", items: [
          "Surtitre, titre, sous-titre et description.",
          "Image, libellé du bouton (CTA) et durée affichée.",
          "Afficher ou masquer la durée, le nombre de questions et le texte de confidentialité.",
          "Bénéfices et témoignage.",
        ] },
        { type: "callout", kind: "example", text: "Titre : Êtes-vous prêt pour le PMP ? Bouton : Commencer. Durée affichée : 3 minutes." },
      ],
    },
    {
      id: "ajouter-questions",
      title: "Ajouter les questions",
      keywords: ["questions", "types", "options"],
      blocks: [
        { type: "p", text: "Étape Questions. Ajoutez une question, choisissez son type, rédigez l'intitulé, puis les options lorsqu'il y en a." },
        { type: "p", text: "Douze types existent : choix unique, choix multiple, oui/non, échelles 1–5 et 1–10, texte court, texte long, nombre, email, téléphone, pays, liste déroulante. Le détail de chacun est dans le chapitre Questions." },
        { type: "p", text: "Vous pouvez dupliquer une question. La supprimer l'archive : elle quitte le questionnaire, mais les réponses déjà données restent lisibles. Même principe pour une option." },
        { type: "callout", kind: "tip", text: "Une question peut être non scorée. Utile pour un email ou un commentaire qui ne doit pas changer le résultat." },
      ],
    },
    {
      id: "affichage-conditionnel",
      title: "Configurer l'affichage conditionnel",
      keywords: ["condition", "afficher si", "masquer si"],
      blocks: [
        { type: "p", text: "Chaque question a un affichage : Toujours afficher, Afficher si, ou Masquer si. Plusieurs conditions se cumulent : toutes doivent être vraies." },
        { type: "compare", leftTitle: "Afficher si", left: "La question n'apparaît que si la réponse précédente correspond.", rightTitle: "Masquer si", right: "La question est visible, puis disparaît si la condition est vraie." },
        { type: "callout", kind: "example", text: "Question 1 : Avez-vous déjà géré un projet ? Si la réponse est Non, afficher la question « Souhaitez-vous une formation ? ». Sinon, elle reste masquée." },
        { type: "callout", kind: "important", text: "Une question obligatoire masquée ne bloque pas la suite. Sa réponse, si elle existait, ne compte plus dans le score." },
      ],
    },
    {
      id: "organiser-categories",
      title: "Organiser les catégories",
      keywords: ["catégorie de questions", "mode avancé"],
      blocks: [
        { type: "p", text: "Passez en Mode avancé. L'étape Catégories sert à regrouper les questions pour le visiteur et pour vous. Ce n'est pas encore le calcul du score." },
        { type: "compare", leftTitle: "Catégorie de questions", left: "Un chapitre du questionnaire, par exemple Expérience ou Formation. Elle organise l'ordre et la lecture.", rightTitle: "Catégorie de scoring", right: "Un panier de points avec un poids. Elle se règle à l'étape Score et doit participer au total de 100 %." },
        { type: "callout", kind: "important", text: "En mode simple, les étapes Catégories et Score sont masquées. Le scoring détaillé demande le mode avancé." },
      ],
    },
    {
      id: "configurer-le-scoring",
      title: "Configurer le scoring",
      keywords: ["scoring", "poids", "points", "100"],
      blocks: [
        { type: "p", text: "Étape Score, en mode avancé. Donnez des points aux options. Regroupez les questions notées dans des catégories de scoring. Chaque catégorie a un poids en pourcentage." },
        { type: "p", text: "Le total des poids doit faire 100 %. Le résultat est une moyenne pondérée. Une question non scorée est ignorée. Un plafond de score, s'il est défini, réduit le pourcentage affiché." },
        { type: "callout", kind: "example", text: "Expérience 60 % et Formation 40 %. Une option à 80 points dans Expérience pèse davantage qu'une option à 80 points dans Formation." },
        { type: "callout", kind: "tip", text: "Si le total n'est pas 100 %, la publication peut être refusée. Utilisez la proposition de poids, puis ajustez." },
      ],
    },
    {
      id: "plages",
      title: "Configurer les plages de résultats",
      keywords: ["plage", "badge", "recommandation", "résultat"],
      blocks: [
        { type: "p", text: "Étape Résultats. Chaque plage a un minimum, un maximum, un titre, un badge, un message, une recommandation, un libellé de bouton et une URL." },
        { type: "callout", kind: "example", text: "0–39 : À améliorer. 40–69 : Intermédiaire. 70–100 : Excellent. Le visiteur voit le titre et la recommandation de la plage qui contient son pourcentage." },
        { type: "p", text: "Le testeur de résultat, sur la même étape, montre le badge, le message et le CTA sans publier." },
      ],
    },
    {
      id: "regles",
      title: "Configurer les règles obligatoires",
      keywords: ["règle", "force result", "maximum result", "éligibilité"],
      blocks: [
        { type: "p", text: "Toujours dans Score, en mode avancé. Une règle obligatoire s'ajoute seulement si un critère doit forcer ou limiter la plage, au-delà du pourcentage." },
        { type: "p", text: "Plusieurs conditions d'une même règle fonctionnent en ET. La règle la plus restrictive l'emporte." },
        { type: "compare", leftTitle: "Force Result", left: "Remplace la plage affichée. Le pourcentage calculé reste le même.", rightTitle: "Maximum Result", right: "Empêche un résultat plus favorable que la plage choisie. Le pourcentage officiel ne monte pas pour autant." },
        { type: "compare", leftTitle: "Score", left: "Le pourcentage calculé à partir des points et des poids.", rightTitle: "Résultat", right: "La plage montrée au visiteur. Une règle peut la changer sans réécrire le pourcentage." },
        { type: "callout", kind: "example", text: "Score 90 %, plage Excellent. Une règle « si l'expérience est Non, forcer À améliorer » affiche À améliorer. Le 90 % reste affiché." },
        { type: "callout", kind: "important", text: "Le plafond de score n'est pas une règle de résultat : lui, il baisse le pourcentage officiel." },
      ],
    },
    {
      id: "contacts",
      title: "Configurer la collecte des contacts",
      keywords: ["contact", "lead", "consentement", "formulaire"],
      blocks: [
        { type: "p", text: "Étape Contact. Cochez les champs utiles : prénom, nom, email, téléphone, WhatsApp, entreprise, fonction, pays, ville." },
        { type: "p", text: "Choisissez le moment : avant le questionnaire, pendant, avant les résultats, ou après les résultats. Le consentement peut être exigé, avec son texte." },
        { type: "callout", kind: "example", text: "Vous demandez prénom et email avant les résultats. Le visiteur voit son score seulement après avoir laissé ses coordonnées." },
        { type: "p", text: "Ces réponses deviennent des leads dans votre organisation. Elles ne sont pas partagées avec une autre organisation." },
      ],
    },
    {
      id: "apercu",
      title: "Tester avec Aperçu",
      keywords: ["aperçu", "preview", "tester"],
      blocks: [
        { type: "p", text: "Dans le builder, le bouton Aperçu ou l'étape Aperçu ouvre le questionnaire comme un membre de l'équipe. Depuis la liste, le menu de la scorecard a aussi Preview." },
        { type: "compare", leftTitle: "Aperçu", left: "Visible par vous, y compris sur un brouillon. Ce n'est pas l'adresse à envoyer à vos clients.", rightTitle: "Publication", right: "Rend la dernière version accessible aux visiteurs. Sans cela, ils ne voient pas vos changements." },
        { type: "callout", kind: "tip", text: "Parcourez les questions conditionnelles et le testeur de résultat avant de publier." },
      ],
    },
    {
      id: "publier-et-partager",
      title: "Publier et partager",
      keywords: ["qr", "qr code", "partager", "whatsapp", "publier", "publication", "brouillon", "draft", "published"],
      blocks: [
        { type: "p", text: "Le bouton Publier vérifie le questionnaire, puis remplace la version publique. Tant que vous ne republiez pas, les visiteurs restent sur la dernière publication. Le bandeau Modifications non publiées le rappelle." },
        { type: "compare", leftTitle: "Brouillon", left: "Vous travaillez dans le builder. Les visiteurs ne voient pas ce travail.", rightTitle: "Publiée", right: "La version publiée est celle du lien public. Un nouveau clic sur Publier est nécessaire après chaque changement à rendre public." },
        { type: "p", text: "Annuler revient au brouillon précédent, s'il existe. Restaurer la version publiée réécrit le brouillon avec la dernière publication. Les deux boutons sont dans le header du builder." },
        { type: "p", text: "Pour partager : Scorecards, menu de la scorecard, Partager. La même action est sur la fiche. La fenêtre propose Copier le lien, Partager via WhatsApp, Partager par email, le QR Code et Télécharger le QR Code. Partager par email ouvre votre messagerie avec le lien déjà rédigé. WOLOYEM Score n'envoie pas ce message." },
        { type: "p", text: "Le QR et les messages contiennent uniquement le nom et l'adresse publique. Si un domaine de votre organisation est vérifié, l'adresse est https://ce-domaine/slug. Sinon, c'est l'adresse de la plateforme suivie de /s/slug." },
        { type: "callout", kind: "warning", text: "Une scorecard en brouillon, en pause ou archivée ne se partage pas comme page publique. La fenêtre indique : Publiez cette scorecard avant de la partager." },
        { type: "callout", kind: "important", text: "Mettre la scorecard en pause la rend indisponible pour les nouveaux visiteurs. Réactivez-la depuis le menu Enable. Le partage public reste réservé au statut publié." },
        { type: "roles", roles: editors },
      ],
    },
  ],
}
