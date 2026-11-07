import {

  analyzeScorecardResultsInputSchema,

  analyzeScorecardResultsOutputSchema,

} from "@/lib/ai/fabric-prototype/schemas"

import type { FabricPatternDefinition } from "@/lib/ai/fabric-prototype/types"



const OUTPUT_EXAMPLE = `{

  "summary": "Avec un score global de 58 %, le profil se situe dans la bande Intermédiaire fournie (40–74 %).",

  "strengths": ["La catégorie Outils (62 %) est au-dessus du score global."],

  "improvementAreas": ["Prioriser la catégorie la plus basse parmi celles fournies."],

  "explanations": [

    "Les pourcentages cités (global 58 %, Outils 62 %) sont exclusivement ceux fournis en entrée.",

    "Aucune cause organisationnelle n'est affirmée faute de données supplémentaires."

  ],

  "recommendations": ["Comparer chaque catégorie aux seuils métier fournis avant toute décision."],

  "facts": [

    "Score global fourni : 58 %.",

    "Catégorie Outils fournie : 62 %."

  ],

  "interpretations": [

    "L'écart Outils vs global (+4 pts) est modeste ; il peut refléter une relative force sans en prouver la cause."

  ],

  "analysisLimits": [

    "L'IA n'a pas recalculé les scores officiels.",

    "Échantillon / contexte limité : interprétation non certaine."

  ],

  "officialScoresEcho": {

    "globalScorePercent": 58,

    "categoryScores": [{ "name": "Outils", "scorePercent": 62 }]

  }

}`



export const analyzeScorecardResultsPattern: FabricPatternDefinition<

  typeof analyzeScorecardResultsInputSchema,

  typeof analyzeScorecardResultsOutputSchema

> = {

  id: "analyze_scorecard_results",

  version: "1.3.0",

  purpose: "Produire une analyse compréhensible à partir de résultats déjà calculés.",

  description:

    "Interprète des scores officiels fournis sans les recalculer ; distingue faits, interprétations et recommandations.",

  inputSchema: analyzeScorecardResultsInputSchema,

  outputSchema: analyzeScorecardResultsOutputSchema,

  systemInstructions: `Tu analyses des résultats de scorecard déjà calculés pour WOLOYEM Score.

PATTERN_ID=analyze_scorecard_results VERSION=1.3.0

JSON seul — aucun markdown.



INTÉGRITÉ:

- Scores officiels = entrée uniquement (moteur WOLOYEM Score).

- officialScoresEcho = copie exacte de globalScorePercent + categoryScores.

- Ne recalcule / ne corrige / n'arrondis jamais.

- Toute divergence score officiel / echo = échec (le runner force l'echo).



DISTINCTION:

- facts : uniquement des constats observables depuis les scores / seuils / métadonnées fournis.

- interpretations : hypothèses prudentes sur les écarts — jamais de causes inventées.

- recommendations : actions proportionnées aux écarts réels.

- explanations : peuvent rappeler la méthode (pas de recalcul).



ANALYSE:

- Cite les % fournis.

- Explique les écarts entre catégories en termes d'amplitude (ex. +X pts), sans inventer pourquoi.

- Forces = clairement au-dessus du global ou du seuil ; faiblesses = clairement en dessous.

- Écart < 5 points vs global dans la même bande de seuil : ne pas forcer en « axe d'amélioration ».

- Catégories à scores identiques : le dire ; ne pas inventer de différenciation.

- Une seule catégorie / données partielles / respondentCount bas / seuils absents :

  le signaler dans analysisLimits ; rester prudent ; strengths/improvementAreas peuvent rester vides.

- Recommandations liées aux écarts réels (pas de généralités).



CONTRAT:

summary, strengths, improvementAreas, explanations, recommendations,

facts, interpretations, analysisLimits, officialScoresEcho.

Listes = arrays de strings.

Interdit: sql, publish, correctedScores, newScores.



Exemple:

${OUTPUT_EXAMPLE}`,

  businessConstraints: [

    "Scores officiels = valeurs d'entrée uniquement",

    "Pas de mutation de résultats",

    "Pas d'invention de causes",

    "Distinguer facts / interpretations / recommendations",

    "Ton prudent / non certain",

    "Listes = arrays de strings",

    "Interprétation liée aux catégories fournies uniquement",

    "Pas d'axes d'amélioration artificiels sur écarts négligeables",

    "Signaler données insuffisantes explicitement",

  ],

  limits: { maxInputChars: 6_000, maxOutputChars: 8_000 },

  examples: [

    {

      name: "medium_balanced",

      input: {

        scorecardName: "Maturité commerciale",

        objective: "Qualifier la maturité d'approche prospect",

        globalScorePercent: 62,

        categoryScores: [

          { name: "Découverte", scorePercent: 70 },

          { name: "Proposition", scorePercent: 55 },

        ],

        thresholds: [{ label: "Intermédiaire", minPercent: 40, maxPercent: 74 }],

        allowedMetadata: { language: "fr", respondentCount: 1 },

      },

    },

  ],

  buildUserPayload: (input) => ({

    task: "analyze_scorecard_results",

    input,

    note: "Les valeurs numériques sont officielles et immuables. Recopie-les dans officialScoresEcho.",

    qualityHints: [

      "Séparer facts, interpretations et recommendations.",

      "Expliquer les écarts sans inventer de causes.",

      "Signaler les limites si données insuffisantes.",

      "Ne jamais recalculer les scores.",

    ],

  }),

}


