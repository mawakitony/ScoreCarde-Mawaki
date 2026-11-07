import {
  generateActionPlanInputSchema,
  generateActionPlanOutputSchema,
} from "@/lib/ai/fabric-prototype/schemas"
import type { FabricPatternDefinition } from "@/lib/ai/fabric-prototype/types"

const OUTPUT_EXAMPLE = `{
  "situationSynthesis": "Bases process correctes ; écart principal sur le suivi irrégulier des indicateurs.",
  "topPriorities": [
    "Rétablir une cadence de revue des KPI fournis",
    "Traiter le principal écart cité",
    "Définir un indicateur de suivi simple"
  ],
  "actions": [{
    "title": "Revue hebdomadaire des indicateurs",
    "description": "Planifier une revue de 30 minutes sur les écarts fournis avec le responsable concerné.",
    "priority": "haute",
    "horizon": "immédiat",
    "expectedOutcome": "1 à 3 écarts priorisés (cible de process, non un résultat garanti)",
    "successIndicator": "Compte-rendu daté sous 7 jours"
  }, {
    "title": "Programme de révision ciblé",
    "description": "Identifier les trois domaines les plus faibles fournis, puis un programme de révision avec contrôle hebdomadaire.",
    "priority": "haute",
    "horizon": "30_jours",
    "expectedOutcome": "Parcours indicatif documenté",
    "successIndicator": "Au moins 2 actions démarrées et tracées à J+30"
  }, {
    "title": "Indicateur d'impact minimal",
    "description": "Choisir un indicateur simple lié aux écarts fournis ; renseigner à J+30 et J+90.",
    "priority": "moyenne",
    "horizon": "90_jours",
    "expectedOutcome": "Tableau de suivi minimal",
    "successIndicator": "Indicateur renseigné à J+90"
  }],
  "facts": ["Les forces et écarts fournis en entrée sont les seuls faits retenus."],
  "hypotheses": ["Des causes organisationnelles non fournies peuvent exister."],
  "recommendations": ["Valider le plan avec un responsable métier avant exécution."],
  "disclaimers": ["Aucun résultat n'est garanti.", "Aucune formation WOLOYEM ni prix inventés."],
  "missingInformation": ["Baseline chiffrée des délais / volumes non fournie."],
  "requiresArbitration": false
}`

const OUTPUT_ARBITRATION_EXAMPLE = `{
  "situationSynthesis": "Deux chantiers majeurs concurrents ; le budget fourni n'en couvre qu'un.",
  "topPriorities": [
    "Comparer les deux options sur impact / effort / délai",
    "Obtenir un arbitrage métier explicite",
    "Préparer un plan conditionnel selon le choix"
  ],
  "actions": [{
    "title": "Grille de décision",
    "description": "Comparer les options fournies selon impact métier, effort, délai et risque — sans choisir à la place du décideur.",
    "priority": "haute",
    "horizon": "immédiat",
    "expectedOutcome": "Tableau comparatif partagé",
    "successIndicator": "Critères et scores relatifs documentés sous 7 jours"
  }, {
    "title": "Arbitrage conditionnel",
    "description": "Présenter les hypothèses et demander confirmation du chantier unique à financer.",
    "priority": "haute",
    "horizon": "immédiat",
    "expectedOutcome": "Décision écrite du sponsor",
    "successIndicator": "Choix A ou B validé"
  }, {
    "title": "Plan conditionnel A/B",
    "description": "Préparer deux squelettes d'actions (un par option) activables après arbitrage — sans engager de dépense.",
    "priority": "moyenne",
    "horizon": "30_jours",
    "expectedOutcome": "Deux plans conditionnels",
    "successIndicator": "Plans prêts, non exécutés, à J+30"
  }],
  "facts": ["Contrainte budget unique fournie.", "Au moins deux écarts/chantiers distincts fournis."],
  "hypotheses": ["L'ordre de priorité réel dépend de critères non tous fournis (ROI, risque, obligation légale)."],
  "recommendations": ["Ne pas lancer de dépense avant confirmation."],
  "disclaimers": ["Aucun chantier n'est engagé automatiquement.", "Aucun résultat chiffré n'est garanti."],
  "missingInformation": ["Critère de décision prioritaire du sponsor (impact, délai, risque)."],
  "requiresArbitration": true,
  "arbitrationQuestion": "Avec un budget pour un seul chantier majeur, préférez-vous prioriser l'option A ou l'option B, et selon quel critère (impact, délai, risque) ?"
}`

export const generateActionPlanPattern: FabricPatternDefinition<
  typeof generateActionPlanInputSchema,
  typeof generateActionPlanOutputSchema
> = {
  id: "generate_action_plan",
  version: "1.3.3",
  purpose: "Transformer un diagnostic en plan d'amélioration exploitable, avec arbitrage si nécessaire.",
  description:
    "Propose priorités et actions indicatives en séparant faits, hypothèses et recommandations ; demande un arbitrage seulement si un choix exclusif est imposé ou indispensable.",
  inputSchema: generateActionPlanInputSchema,
  outputSchema: generateActionPlanOutputSchema,
  systemInstructions: `Tu produis un plan d'action indicatif pour WOLOYEM Score.
PATTERN_ID=generate_action_plan VERSION=1.3.3
JSON seul — aucun markdown.

QUALITÉ:
- Chaque action concrète, liée à un écart/force/contrainte fourni.
- Interdit: formulations vagues (« Améliorez vos compétences »).
- successIndicator observable (livrable, date, mesure).
- Respecter constraints (budget, temps) ; pas d'actions irréalistes.
- Pas de CRM / prix / formations WOLOYEM inventés.
- Pas de résultat garanti ni relances automatiques.
- Diagnostic insuffisant → actions de clarification + missingInformation.

FAITS / HYPOTHÈSES / MANQUES:
- facts = uniquement ce qui est fourni en entrée.
- hypotheses = suppositions explicites (jamais présentées comme acquises).
- missingInformation = données absentes nécessaires à trancher.
- recommendations = conseils, distincts des faits.
- Interdit: présenter capacité technique, budget réel ou ROI comme acquis s'ils ne sont pas fournis.

CHIFFRES / OBJECTIFS:
- Interdit: % inventés comme résultats prévisibles ou garantis.
- Un % n'est acceptable que comme cible proposée à valider, marquée
  (indicatif / à valider / cible proposée) — sinon éviter le chiffre.
- Preferer des indicateurs mesurables contextuels (livrable, date, compteur).

CALENDRIER (cohérence):
- horizon ∈ immédiat | 30_jours | 90_jours | 6_mois doit coller aux échéances du texte.
- Interdit: horizon=6_mois avec réalisation à J+60 ; horizon=immédiat avec J+90.
- Si tu cites J+N / « sous X jours », choisir l'horizon compatible.

ARBITRAGE:
- requiresArbitration=true SEULEMENT si :
  (a) contrainte explicite de choix exclusif (budget unique / un seul chantier majeur / mutuellement exclusif)
      ET ≥2 options/écarts majeurs, OU
  (b) une décision indispensable ne peut pas être prise avec les données disponibles
      (alors missingInformation + arbitrationQuestion).
- Un budget simplement « limité » ou « formation limitée » NE suffit PAS à lui seul.
- Ne PAS transformer une hypothèse (ex. « on ne peut financer qu'un chantier ») en fait.
- Si arbitrage: comparer options, critères, hypothèses ; plan conditionnel ; ne pas choisir seul.
- Ne jamais engager de dépense automatiquement.

CONTRAT:
situationSynthesis ; topPriorities (exactement 3) ; actions (≥3, ≤12) ;
priority = exactement "haute"|"moyenne"|"basse" (pas high/medium/low) ;
horizon = exactement "immédiat"|"30_jours"|"90_jours"|"6_mois" (underscores ; pas "30 jours") ;
facts / hypotheses / recommendations / disclaimers (≥1) ;
missingInformation[] ; requiresArbitration (boolean JSON true/false) ; arbitrationQuestion? ;
Textes concis (description ≤400, situationSynthesis ≤600, arbitrationQuestion ≤400).
Dépassement de longueur = sortie invalide (pas de troncature silencieuse).
Interdit: sql, publish, billing, stripe, executeTool, relances automatiques.

Exemples:
PLAN:
${OUTPUT_EXAMPLE}

ARBITRAGE:
${OUTPUT_ARBITRATION_EXAMPLE}`,
  businessConstraints: [
    "Pas de garanties de résultat",
    "Pas de pourcentages inventés présentés comme prévisibles",
    "% chiffrés = cibles proposées à valider ou absents",
    "Pas d'offres / prix inventés",
    "Pas de CRM réel",
    "Pas de relances automatiques",
    "Exactement 3 priorités",
    "Actions concrètes liées au diagnostic fourni",
    "Arbitrage seulement si choix exclusif explicite ou décision impossible sans données",
    "Cohérence horizon ↔ échéances J+N",
    "Séparer faits / hypothèses / missingInformation",
    "Aucune dépense engagée automatiquement",
  ],
  limits: { maxInputChars: 5_000, maxOutputChars: 8_000 },
  examples: [
    {
      name: "team_performance",
      input: {
        situationSummary: "Équipe avec bons process mais suivi irrégulier des indicateurs.",
        useCase: "performance_equipe",
        strengths: ["Process documentés"],
        gaps: ["Suivi KPI irrégulier"],
        constraints: ["Budget formation limité"],
        locale: "fr",
      },
    },
  ],
  buildUserPayload: (input) => ({
    task: "generate_action_plan",
    input,
    qualityHints: [
      "Actions concrètes liées aux écarts fournis.",
      "Budget limité ≠ arbitrage exclusif ; budget unique / un seul chantier → arbitrage.",
      "Cohérence horizon et dates J+N.",
      "Séparer facts / hypotheses / missingInformation.",
      "% uniquement comme cible proposée à valider.",
    ],
  }),
}

