import type { Chapter } from "../types"

export const excelChapter: Chapter = {
  id: "excel",
  title: "Import / Export Excel",
  description: "Sortir le questionnaire, le modifier, puis le réimporter sans surprise.",
  emoji: "📥",
  keywords: ["excel", "importer", "exporter", "xlsx"],
  sections: [
    {
      id: "exporter-importer",
      title: "Exporter, ajouter, mettre à jour",
      keywords: ["excel", "export", "ajouter", "mettre à jour"],
      blocks: [
        { type: "p", text: "Dans le builder, étape Questions : Exporter vers Excel télécharge le questionnaire actuel. Importer des questions ouvre la fenêtre. Vous pouvez aussi télécharger le modèle vide." },
        { type: "list", items: [
          "Ajouter au questionnaire : les lignes deviennent de nouvelles questions.",
          "Mettre à jour le questionnaire existant : les lignes qui portent l'identifiant d'une question déjà là la modifient. Le résumé vous montre les différences avant confirmation.",
          "Remplacer toutes les questions existantes : traité dans la section suivante.",
        ] },
        { type: "p", text: "Les feuilles du classeur WOLOYEM sont : Instructions, Questions, Categories, Scoring Categories, Result Ranges, Conditions, Eligibility Rules." },
        { type: "p", text: "Instructions rappelle les colonnes. Questions porte les intitulés, les types et les options. Categories correspond aux catégories de questions. Scoring Categories porte les poids. Result Ranges porte les plages. Conditions porte l'affichage conditionnel, une ligne par condition ET. Eligibility Rules porte les règles obligatoires, une ligne par condition, avec le même identifiant de règle." },
        { type: "callout", kind: "important", text: "Conservez les identifiants déjà présents si vous mettez à jour. Un identifiant inconnu ou d'une autre scorecard est refusé. L'import ne change pas la page publique : il faut encore Publier." },
        { type: "roles", roles: ["Owner", "Admin", "Editor"] },
      ],
    },
    {
      id: "remplacer",
      title: "Attention avant d'utiliser Remplacer",
      keywords: ["remplacer", "archiver"],
      blocks: [
        { type: "p", text: "Remplacer archive les questions actuelles. Elles disparaissent du questionnaire et du builder, mais les réponses déjà collectées restent lisibles. Une confirmation est demandée." },
        { type: "callout", kind: "warning", text: "Ne choisissez Remplacer que si le fichier contient l'ensemble du questionnaire voulu. Pour corriger quelques lignes, utilisez Mettre à jour." },
      ],
    },
    {
      id: "scoreapp",
      title: "Source avancée",
      keywords: ["scoreapp", "clé"],
      blocks: [
        { type: "p", text: "Dans la fenêtre d'import, Source avancée peut lire une scorecard distante avec une clé d'accès et un identifiant. Ce n'est pas le fichier Excel WOLOYEM. Le fichier déposé dans la zone principale est lu comme un classeur WOLOYEM." },
        { type: "config", text: "Clé d'accès et identifiant de la source externe." },
      ],
    },
  ],
}
