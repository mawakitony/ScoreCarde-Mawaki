import {
  generateScorecardDraftInputSchema,
  generateScorecardDraftOutputSchema,
} from "@/lib/ai/fabric-prototype/schemas"
import type { FabricPatternDefinition } from "@/lib/ai/fabric-prototype/types"

const OUTPUT_DRAFT_EXAMPLE = `{
  "status": "draft_suggestion",
  "title": "Auto-évaluation pratiques de gestion de projet",
  "description": "Brouillon pour cartographier planification, risques et suivi — hors certification officielle.",
  "targetAudience": "Chefs de projet et coordinateurs",
  "objective": "Identifier forces et écarts avant un plan de développement individuel.",
  "categories": [
    { "name": "Planification", "description": "Cadence, jalons, livrables", "weightSuggestion": 35 },
    { "name": "Risques", "description": "Identification et suivi des risques", "weightSuggestion": 30 },
    { "name": "Suivi", "description": "Indicateurs utiles à la décision", "weightSuggestion": 35 }
  ],
  "questions": [{
    "title": "Dans quelle mesure le plan des jalons est-il partagé, daté et réellement suivi ?",
    "type": "single_choice",
    "isRequired": true,
    "isScored": true,
    "categoryName": "Planification",
    "options": [
      { "label": "Plan partagé, daté, responsables et écarts traités", "score": 20 },
      { "label": "Plan existant mais suivi irrégulier", "score": 10 },
      { "label": "Liste informelle ou absente", "score": 0 }
    ]
  }, {
    "title": "Le registre de risques conduit-il à des actions de mitigation suivies ?",
    "type": "yes_no",
    "categoryName": "Risques",
    "options": [{ "label": "Oui", "score": 15 }, { "label": "Non", "score": 0 }]
  }, {
    "title": "Quelle est l'utilité décisionnelle de votre reporting d'avancement ?",
    "type": "scale_5",
    "categoryName": "Suivi",
    "description": "1 = reporting rare ou sans décision ; 5 = cadence adaptée et indicateurs actionnables (la fréquence seule ne suffit pas)",
    "options": []
  }, {
    "title": "Quelle est votre principale difficulté actuelle sur le suivi ?",
    "type": "short_text",
    "isScored": false,
    "categoryName": "Suivi",
    "options": []
  }],
  "weightingNotes": "Pondérations et scores d'options indicatifs (~100). À valider métier dans le Builder avant publication.",
  "recommendations": ["Faire relire les questions par un pair métier avant publication."],
  "disclaimers": [
    "Suggestion IA non persistée.",
    "Ne constitue pas une certification PMI ni une validation officielle d'organisme.",
    "Validation humaine requise avant publication."
  ]
}`

const OUTPUT_CLARIFY_EXAMPLE = `{
  "status": "needs_clarification",
  "clarifyingQuestion": "Souhaitez-vous évaluer les compétences en leadership, les performances commerciales, ou les deux ?",
  "options": ["Leadership", "Performances commerciales", "Les deux (hybride)"],
  "rationale": "Le besoin mélange deux diagnostics distincts ; un questionnaire hybride sans arbitrage serait peu exploitable.",
  "disclaimers": [
    "Aucune scorecard n'a été créée ni persistée.",
    "Clarification requise avant toute suggestion de brouillon."
  ]
}`

export const generateScorecardDraftPattern: FabricPatternDefinition<
  typeof generateScorecardDraftInputSchema,
  typeof generateScorecardDraftOutputSchema
> = {
  id: "generate_scorecard_draft",
  version: "1.3.1",
  purpose: "Transformer une description utilisateur en proposition structurée de scorecard (brouillon) ou en demande de clarification.",
  description:
    "Produit un draft JSON aligné sur les types Builder, ou une clarification discriminée — sans création en base ni publication.",
  inputSchema: generateScorecardDraftInputSchema,
  outputSchema: generateScorecardDraftOutputSchema,
  systemInstructions: `Tu conçois des scorecards WOLOYEM Score.
PATTERN_ID=generate_scorecard_draft VERSION=1.3.1
JSON seul — aucun markdown.

AMBIGUÏTÉ (obligatoire):
- Si le besoin est insuffisamment défini, ou mélange des objectifs incompatibles sans priorité
  (ex. « leadership ou ventes », « quelque chose sur le management »),
  retourne status="needs_clarification" avec clarifyingQuestion claire (FR si locale=fr).
- Ne génère PAS de questionnaire hybride arbitraire.
- needs_clarification = AUCUNE scorecard persistée, pas de questions/catégories.

QUALITÉ (status="draft_suggestion"):
- Titre spécifique ; objectif en 1 phrase ; public cible clair.
- Catégories distinctes ; noms dans la langue de locale ; weights ~100 (indicatifs).
- Questions métier mesurables, non redondantes, liées aux catégories.
- Échelles (scale_5 / scale_10) : préciser 1 et le max ; éviter les échelles ambiguës.
- Scores/options/pondérations = suggestions indicatives jusqu'à validation métier.
- Pas d'email / phone / country sauf besoin explicite de capture lead.
- Interdit: certification PMI / ITIL / ISO officielle.
- Respecter maxQuestions / maxCategories.

ANTI-BIAIS MÉTIER (obligatoire):
PMP / gestion de projet:
- Ne PAS attribuer un meilleur score uniquement à une fréquence de reporting élevée.
- Évaluer l'utilité décisionnelle / l'efficacité réelle des pratiques (actions tirées du suivi).
- Ne PAS traiter la seule possession d'un logiciel (MS Project, Jira, etc.) comme preuve de maturité.

PMO / maturité organisationnelle:
- Ne PAS considérer l'autonomie maximale comme systématiquement meilleure — viser une gouvernance adaptée.
- Ne PAS récompenser automatiquement l'automatisation du reporting ; privilégier la valeur décisionnelle et la priorisation.
- Échelles : décrire clairement ce qui est « adapté » vs « excessif / insuffisant ».

Qualification B2B / prospects:
- Ne PAS donner de points simplement parce qu'un prospect a des contraintes sécurité/conformité.
- Scorer la capacité de la solution / du process à répondre aux contraintes, ou séparer contrainte (non scorée / contexte) et adéquation (scorée).
- Séparer qualification commerciale (besoin, urgence, maturité d'achat) des contraintes techniques.
- Interdit: collecte automatique de coordonnées personnelles sans besoin explicite.

CONTRAT discriminé:
- status="draft_suggestion" | "needs_clarification"
- draft: title, description, targetAudience, objective, categories, questions,
  weightingNotes, recommendations, disclaimers
- clarification: clarifyingQuestion, options[], rationale?, disclaimers
- question.title ; options=[{label,score?}]
- types: single_choice, multiple_choice, yes_no, scale_5, scale_10, short_text, long_text, number, email, phone, country, dropdown
Interdit: sql, publish, delete, serverAction, stripe, executeTool.

Exemples:
DRAFT:
${OUTPUT_DRAFT_EXAMPLE}

CLARIFICATION:
${OUTPUT_CLARIFY_EXAMPLE}`,
  businessConstraints: [
    "Brouillon uniquement — aucune persistence",
    "Types Builder uniquement",
    "Pas de promesse de certification / validation organique officielle",
    "Pas d'effet de bord",
    "options objets {label,score?} uniquement",
    "Questions non redondantes ; pondérations indicatives",
    "Pas de champs contact inutiles",
    "Ambiguïté → needs_clarification",
    "Anti-biais: fréquence / outil / autonomie max / automatisation / contraintes≠points",
    "Validation humaine requise avant publication",
    "Respecter maxQuestions / maxCategories",
  ],
  limits: { maxInputChars: 4_500, maxOutputChars: 10_000 },
  examples: [
    {
      name: "pmp_competency",
      input: {
        description: "Je souhaite créer une scorecard pour évaluer les compétences en gestion de projet PMP.",
        locale: "fr",
        maxQuestions: 12,
        maxCategories: 4,
      },
    },
  ],
  buildUserPayload: (input) => ({
    task: "generate_scorecard_draft",
    input,
    qualityHints: [
      "Si besoin ambigu → needs_clarification.",
      "Scorer l'efficacité / utilité décisionnelle, pas la seule fréquence ou le seul outil.",
      "PMO: gouvernance adaptée, pas autonomie max automatique.",
      "B2B: ne pas scorer positivement la seule présence de contraintes sécurité.",
      "Pondérations et scores indicatifs jusqu'à validation métier.",
    ],
    requiredStatus: ["draft_suggestion", "needs_clarification"],
  }),
}

