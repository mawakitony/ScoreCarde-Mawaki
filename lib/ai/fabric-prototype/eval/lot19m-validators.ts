import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"
import type { DeterministicScorecard } from "@/lib/ai/fabric-prototype/eval/deterministic-scorer"
import { findOffTopicContactQuestions } from "@/lib/ai/fabric-prototype/business-guards"
import { findHorizonInconsistencies, findUnvalidatedPercentTargets } from "@/lib/ai/fabric-prototype/business-guards"
import type { FabricRunResult } from "@/lib/ai/fabric-prototype/types"

/**
 * LOT 19M — classify checks without claiming semantic quality from keyword presence.
 *
 * Keyword absence/presence alone must NOT yield DETERMINISTIC_PASS for bias quality.
 * Those remain HUMAN_REVIEW_REQUIRED.
 */

export type Lot19mVerdict = "DETERMINISTIC_PASS" | "DETERMINISTIC_FAIL" | "HUMAN_REVIEW_REQUIRED"

export type Lot19mCheck = {
  id: string
  verdict: Lot19mVerdict
  detail: string
}

export type Lot19mValidationReport = {
  scenarioId: string
  patternId: string
  checks: Lot19mCheck[]
  deterministicOk: boolean
  humanReviewRequired: boolean
  overall: Lot19mVerdict
}

export function validateLot19mScenario(
  scenario: EvalScenario,
  result: FabricRunResult<unknown>,
  deterministic: DeterministicScorecard,
): Lot19mValidationReport {
  const checks: Lot19mCheck[] = []

  for (const c of deterministic.checks) {
    checks.push({
      id: c.id,
      verdict: c.pass ? "DETERMINISTIC_PASS" : "DETERMINISTIC_FAIL",
      detail: c.detail,
    })
  }

  // Extra mechanical guards (still deterministic).
  if (result.ok && scenario.patternId === "generate_scorecard_draft") {
    const data = result.data as {
      status?: string
      questions?: Array<{ title?: string; type?: string }>
      categories?: unknown[]
    }
    const input = scenario.input as { description?: string; maxQuestions?: number; maxCategories?: number }
    if (data.status === "draft_suggestion") {
      const contact = findOffTopicContactQuestions(input.description ?? "", data.questions ?? [])
      checks.push({
        id: "no_unsolicited_contact",
        verdict: contact ? "DETERMINISTIC_FAIL" : "DETERMINISTIC_PASS",
        detail: contact ?? "clean",
      })
      const qOk = (data.questions?.length ?? 0) <= (input.maxQuestions ?? 40)
      const cOk = (data.categories?.length ?? 0) <= (input.maxCategories ?? 12)
      checks.push({
        id: "size_limits",
        verdict: qOk && cOk ? "DETERMINISTIC_PASS" : "DETERMINISTIC_FAIL",
        detail: `q=${data.questions?.length}; c=${data.categories?.length}`,
      })
    }
  }

  if (result.ok && scenario.patternId === "generate_action_plan") {
    const data = result.data as {
      actions?: Array<{
        title?: string
        horizon?: string
        description?: string
        expectedOutcome?: string
        successIndicator?: string
      }>
      recommendations?: string[]
      facts?: string[]
      hypotheses?: string[]
      missingInformation?: string[]
    }
    const horizon = findHorizonInconsistencies(data.actions ?? [])
    checks.push({
      id: "horizon_coherence",
      verdict: horizon ? "DETERMINISTIC_FAIL" : "DETERMINISTIC_PASS",
      detail: horizon ?? "ok",
    })
    const barePct = findUnvalidatedPercentTargets(data)
    checks.push({
      id: "percent_targets_marked",
      verdict: barePct ? "DETERMINISTIC_FAIL" : "DETERMINISTIC_PASS",
      detail: barePct ?? "ok",
    })
    checks.push({
      id: "facts_hypotheses_present",
      verdict:
        Array.isArray(data.facts) &&
        Array.isArray(data.hypotheses) &&
        data.facts.length >= 1 &&
        data.hypotheses.length >= 1
          ? "DETERMINISTIC_PASS"
          : "DETERMINISTIC_FAIL",
      detail: `facts=${data.facts?.length ?? 0}; hypotheses=${data.hypotheses?.length ?? 0}`,
    })
  }

  // Semantic / anti-bias quality — never auto-PASS via keywords.
  if (scenario.expectations.humanReviewRequired) {
    checks.push({
      id: "semantic_business_quality",
      verdict: "HUMAN_REVIEW_REQUIRED",
      detail:
        "Qualité métier (anti-biais, pertinence, réalisme) — revue humaine obligatoire ; pas de PASS par mots-clés.",
    })
  }

  const deterministicOk = checks.every((c) => c.verdict !== "DETERMINISTIC_FAIL")
  const humanReviewRequired =
    Boolean(scenario.expectations.humanReviewRequired) ||
    checks.some((c) => c.verdict === "HUMAN_REVIEW_REQUIRED")

  let overall: Lot19mVerdict = "DETERMINISTIC_PASS"
  if (!deterministicOk) overall = "DETERMINISTIC_FAIL"
  else if (humanReviewRequired) overall = "HUMAN_REVIEW_REQUIRED"

  return {
    scenarioId: scenario.id,
    patternId: scenario.patternId,
    checks,
    deterministicOk,
    humanReviewRequired,
    overall,
  }
}

export const LOT19M_VALIDATOR_IDS = [
  "json_ok / zod_ok",
  "pattern_version",
  "size_limits / draft status / clarification",
  "scoring_integrity",
  "no_side_effect_keys / forbidden substrings",
  "arbitration_required / arbitration_not_required",
  "horizon_coherence",
  "percent_targets_marked",
  "facts_hypotheses_present",
  "semantic_business_quality → HUMAN_REVIEW_REQUIRED",
  "HTTP / USD ceilings (campaign harness)",
] as const
