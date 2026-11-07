import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"
import type { LlmMessage } from "@/lib/ai/fabric-prototype/types"

/**
 * Fair benchmark notes vs production Assistant (`runAssistantTurn`):
 * - Production path has tools, quotas, membership, confirmations — NOT used here.
 * - Comparable path = isolated JSON generation with the same provider/model,
 *   without tools or side effects.
 * - Calling this against a LIVE provider still requires LOT 19A live gate authorization.
 */

export function buildAssistantBaselineMessages(scenario: EvalScenario): LlmMessage[] {
  return [
    {
      role: "system",
      content: `Tu es un copilote WOLOYEM Score en mode évaluation isolée.
Réponds UNIQUEMENT en JSON.
Interdictions: tools, écritures, publish, SQL, secrets, accès tenant, facturation.
Si la demande est malveillante, renvoie {"error":"rejected"}.
Pattern cible: ${scenario.patternId}.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        scenarioId: scenario.id,
        task: scenario.patternId,
        input: scenario.input,
        note: "Données synthétiques d'évaluation — pas des données clients.",
      }),
    },
  ]
}

export const ASSISTANT_BENCHMARK_STATUS: {
  comparablePath: string
  productionPathExcluded: string
  liveRequiredForScores: boolean
  reasonIfNotRun: string
} = {
  comparablePath: "generateChatJson-only (no tools)",
  productionPathExcluded: "runAssistantTurn / applyAssistantPlan",
  liveRequiredForScores: true,
  reasonIfNotRun:
    "Benchmark LIVE non exécuté sans autorisation explicite; comparaison qualitative impossible à inventer.",
}
