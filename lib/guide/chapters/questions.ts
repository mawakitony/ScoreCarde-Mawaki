import type { Chapter } from "../types"

export const questionsChapter: Chapter = {
  id: "questions",
  title: "Questions et logique conditionnelle",
  description: "Les douze types de questions et la façon de les afficher.",
  emoji: "🧩",
  keywords: ["question", "type", "condition"],
  sections: [
    {
      id: "types",
      title: "Les douze types",
      keywords: ["choix unique", "échelle", "texte", "liste déroulante"],
      blocks: [
        { type: "p", text: "Dans le builder, étape Questions, choisissez le type au moment de créer la question. Les points se posent sur les options des types à choix. Les autres types servent souvent à collecter une information : laissez-les non scorés, sauf si vous avez une raison de les noter." },
        { type: "questions", items: [
          { name: "Choix unique", use: "Une seule réponse parmi plusieurs. C'est le type le plus simple pour noter.", example: "Quel est votre niveau ? Débutant, Confirmé, Expert. Une option = un nombre de points.", scored: "En général scoré, une option à la fois." },
          { name: "Choix multiple", use: "Plusieurs réponses possibles. Les points des options choisies se cumulent, dans la limite prévue.", example: "Quels outils utilisez-vous ? Chaque outil coche ajoute ses points.", scored: "Scoré si vous attribuez des points aux options." },
          { name: "Oui / Non", use: "Une alternative binaire.", example: "Avez-vous déjà dirigé un projet ? Oui = 100, Non = 0.", scored: "Scoré dans la plupart des questionnaires d'éligibilité." },
          { name: "Échelle 1–5", use: "Une intensité courte, du plus faible au plus fort.", example: "À quel point cette pratique est-elle en place ? 1 = pas du tout, 5 = tout à fait.", scored: "Scoré : les extrémités correspondent au minimum et au maximum de l'échelle." },
          { name: "Échelle 1–10", use: "La même idée, avec plus de nuances.", example: "Notez votre maîtrise de 1 à 10.", scored: "Scoré de la même façon que l'échelle 1–5." },
          { name: "Texte court", use: "Une réponse libre et brève.", example: "Quel est l'intitulé de votre poste ?", scored: "En général non scoré." },
          { name: "Texte long", use: "Un commentaire ou un contexte.", example: "Décrivez votre dernier projet.", scored: "En général non scoré." },
          { name: "Nombre", use: "Une valeur numérique.", example: "Combien d'années d'expérience avez-vous ?", scored: "Non scoré par défaut. Une condition peut s'en servir, par exemple « supérieur à 3 »." },
          { name: "Email", use: "Une adresse. Préférez souvent le formulaire de contact pour l'email du lead.", example: "Email professionnel.", scored: "Non scoré." },
          { name: "Téléphone", use: "Un numéro, avec son indicatif.", example: "Téléphone de rappel.", scored: "Non scoré." },
          { name: "Pays", use: "Un pays, utile ensuite dans les filtres de leads.", example: "Pays de l'organisation.", scored: "Non scoré." },
          { name: "Liste déroulante", use: "Un choix unique présenté en liste, pratique quand il y a beaucoup d'options.", example: "Secteur d'activité.", scored: "Scoré si chaque entrée a des points." },
        ] },
      ],
    },
    {
      id: "logique",
      title: "Afficher, masquer, ou toujours montrer",
      keywords: ["afficher si", "masquer si", "toujours afficher"],
      blocks: [
        { type: "p", text: "Toujours afficher : la question est dans le parcours normal. Afficher si : elle n'existe que lorsque les conditions sont vraies. Masquer si : elle est prévue, puis retirée si les conditions sont vraies." },
        { type: "p", text: "Les conditions d'une même question se combinent en ET. Les comparaisons possibles sont : égal, différent, inférieur, inférieur ou égal, supérieur, supérieur ou égal." },
        { type: "callout", kind: "example", text: "Afficher « Quelle certification visez-vous ? » seulement si la question précédente vaut « Oui, je me prépare »." },
        { type: "callout", kind: "warning", text: "Ne faites pas dépendre une question d'une question qui vient après elle. Le parcours ne peut pas anticiper une réponse future." },
      ],
    },
  ],
}
