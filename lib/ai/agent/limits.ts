export const AGENT_LIMITS = {
  promptMaxChars: 4_000,
  historyMaxMessages: 12,
  historyMessageMaxChars: 1_200,
  maxToolsPerTurn: 5,
  maxQuestionsGenerated: 50,
  maxLeadsPerMutation: 25,
  maxResultRanges: 8,
  maxCategories: 12,
  providerTimeoutMs: 45_000,
  toolResultMaxChars: 8_000,
  maxPlanSteps: 12,
} as const

export const FORBIDDEN_ASSISTANT_ACTIONS = [
  "publish",
  "publier",
  "delete_scorecard",
  "supprimer la scorecard",
  "anonymize",
  "anonymiser",
  "delete_lead",
  "supprimer le lead",
  "billing",
  "stripe",
  "domain",
  "domaine",
  "api key",
  "clé api",
  "transfer ownership",
  "transférer la propriété",
  "platform",
] as const

export const ASSISTANT_UNAVAILABLE =
  "Cette action n'est pas disponible dans l'Assistant IA. Utilisez l'interface WOLOYEM Score correspondante."
