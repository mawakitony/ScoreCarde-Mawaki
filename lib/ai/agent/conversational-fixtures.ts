/**
 * LOT 18A — simulated conversational contracts (mocks only).
 * These encode expected UX shapes; they do not call a real LLM.
 */

export type SimulatedTurn = {
  user: string
  /** User-facing assistant reply — never raw JSON / tool names. */
  assistantMessage: string
  expectsClarification?: boolean
  claimsWriteCompleted?: boolean
  proposesWrite?: boolean
  planPreview?: {
    title: string
    facts: { label: string; value: string }[]
  }
  reads?: { tool: string; summary: string; result: unknown }[]
}

export const CONVERSATIONAL_FIXTURES: SimulatedTurn[] = [
  {
    user: "Bonjour",
    assistantMessage:
      "Bonjour ! Je suis votre copilote WOLOYEM Score. Je peux vous aider à créer une scorecard, générer des questions, analyser vos leads ou résumer vos statistiques. Que souhaitez-vous faire ?",
    claimsWriteCompleted: false,
  },
  {
    user: "Que peux-tu faire ?",
    assistantMessage:
      "Je peux conseiller, préparer et — après votre confirmation — appliquer certaines actions : créer un brouillon de scorecard, ajouter des questions, configurer le scoring, analyser une scorecard ou vos leads. Je ne publie pas, ne facture pas et ne modifie jamais vos données sans confirmation.",
    claimsWriteCompleted: false,
  },
  {
    user: "Créer une scorecard",
    assistantMessage:
      "Bien sûr ! Je peux vous aider à créer une scorecard. Quel est votre objectif principal : évaluer des compétences, qualifier des prospects ou recommander une formation ?",
    expectsClarification: true,
    claimsWriteCompleted: false,
    proposesWrite: false,
  },
  {
    user: "Génère 10 questions pour évaluer les compétences en gestion de projet",
    assistantMessage:
      "Voici une proposition de scorecard brouillon avec 10 questions sur la gestion de projet. Rien n'est encore créé : confirmez dans l'espace de travail pour générer le brouillon.",
    claimsWriteCompleted: false,
    proposesWrite: true,
    planPreview: {
      title: "Créer une scorecard brouillon — Gestion de projet",
      facts: [
        { label: "Nom", value: "Évaluation gestion de projet" },
        { label: "Langue", value: "Français" },
        { label: "Statut", value: "Brouillon" },
        { label: "Questions", value: "10" },
      ],
    },
  },
  {
    user: "Analyse mes résultats",
    assistantMessage:
      "Je peux analyser vos résultats. Souhaitez-vous un aperçu global du tableau de bord, ou l'analyse d'une scorecard précise ?",
    expectsClarification: true,
    claimsWriteCompleted: false,
    reads: [
      {
        tool: "get_dashboard_metrics",
        summary: "Indicateurs des 30 derniers jours",
        result: { leads: 42, completions: 18, conversionRate: "12%" },
      },
    ],
  },
  {
    user: "Explique-moi cette scorecard",
    assistantMessage:
      "Pour vous expliquer une scorecard, j'ai besoin de savoir laquelle : indiquez son nom, ou ouvrez-la dans le builder et relancez la conversation depuis ce contexte.",
    expectsClarification: true,
    claimsWriteCompleted: false,
  },
]

const FORBIDDEN_IN_USER_MESSAGE = [
  /```json/i,
  /^\s*\{/,
  /create_scorecard_draft/,
  /list_scorecards/,
  /toolArgs/,
  /"tools"\s*:/,
  /requiresConfirmation/,
]

export function assertNaturalAssistantCopy(message: string) {
  const text = message.trim()
  if (!text) throw new Error("Empty assistant message")
  for (const pattern of FORBIDDEN_IN_USER_MESSAGE) {
    if (pattern.test(text)) {
      throw new Error(`Technical leak in assistant message: ${pattern}`)
    }
  }
  if (/j['']ai (créé|créée|publié|supprimé|appliqué)/i.test(text) && /brouillon|scorecard/i.test(text)) {
    // Soft check: fixtures must not claim completed writes without confirmation wording
    if (!/confirm|proposition|espace de travail|pas encore/i.test(text)) {
      throw new Error("Message claims a write without confirmation framing")
    }
  }
}

export function fixtureClaimsWriteWithoutConfirmation(turn: SimulatedTurn) {
  return Boolean(turn.claimsWriteCompleted)
}
