import type { EvalScenario } from "@/lib/ai/fabric-prototype/eval/dataset"
import { estimateTokensFromChars } from "@/lib/ai/fabric-prototype/eval/cost-model"
import { findMisleadingPmiCertificationClaim } from "@/lib/ai/fabric-prototype/business-guards"
import type { FabricRunResult } from "@/lib/ai/fabric-prototype/types"

export type DeterministicCheckId =
  | "json_ok"
  | "zod_ok"
  | "constraints_ok"
  | "scoring_integrity"
  | "no_forbidden_substrings"
  | "reject_expected"
  | "draft_status"
  | "clarification_status"
  | "three_priorities"
  | "arbitration_required"
  | "arbitration_not_required"
  | "pattern_version"
  | "no_side_effect_keys"
  | "latency_recorded"

export type DeterministicCheck = {
  id: DeterministicCheckId
  pass: boolean
  detail: string
}

export type DeterministicScorecard = {
  scenarioId: string
  patternId: string
  runOk: boolean
  checks: DeterministicCheck[]
  passCount: number
  failCount: number
  allRequiredPassed: boolean
  latencyMs: number
  tokens: ReturnType<typeof estimateTokensFromChars>
  /** Explicitly NOT a quality/pertinence judgment. */
  note: "deterministic_only"
}

function hasForbiddenSubstring(value: unknown, needles: string[]): string | null {
  const text = JSON.stringify(value).toLowerCase()
  for (const needle of needles) {
    const n = needle.toLowerCase()
    // PMI certification needles: ignore negated disclaimers (LOT 19R / LIVE 19N A1).
    if (n.includes("pmi") && n.includes("certification")) {
      const misleading = findMisleadingPmiCertificationClaim(value)
      if (misleading) return misleading
      continue
    }
    if (text.includes(n)) return needle
  }
  return null
}

function hasSideEffectKeys(value: unknown): string | null {
  if (!value || typeof value !== "object") return null
  const keys = Object.keys(value as object)
  const blocked = ["serverAction", "sql", "publish", "executeTool", "stripe", "mutation"]
  return keys.find((key) => blocked.includes(key)) ?? null
}

/**
 * Score a single run against scenario expectations.
 * Does not assign subjective "pertinence" — only mechanical checks.
 */
export function scoreDeterministic(scenario: EvalScenario, result: FabricRunResult<unknown>): DeterministicScorecard {
  const checks: DeterministicCheck[] = []
  const latencyMs = result.metrics.latencyMs
  const tokens = estimateTokensFromChars(result.metrics.inputChars, result.metrics.outputChars)

  checks.push({
    id: "latency_recorded",
    pass: Number.isFinite(latencyMs) && latencyMs >= 0,
    detail: `latencyMs=${latencyMs}`,
  })

  if (scenario.expectations.mustReject) {
    const codeOk =
      !result.ok &&
      (!scenario.expectations.rejectCodes ||
        scenario.expectations.rejectCodes.includes(
          result.error.code as NonNullable<EvalScenario["expectations"]["rejectCodes"]>[number],
        ))
    checks.push({
      id: "reject_expected",
      pass: codeOk,
      detail: result.ok ? "expected reject but ok=true" : `code=${result.error.code}`,
    })
  } else {
    checks.push({
      id: "json_ok",
      pass: result.ok,
      detail: result.ok ? "structured result present" : `error=${result.error.code}`,
    })
    checks.push({
      id: "zod_ok",
      pass: result.ok && scenario.expectations.mustPassZodWhenOk !== false,
      detail: result.ok ? "runner validated output schema" : "no output",
    })
  }

  if (result.ok && scenario.expectations.mustBeDraftSuggestion) {
    const status = (result.data as { status?: string }).status
    checks.push({
      id: "draft_status",
      pass: status === "draft_suggestion",
      detail: `status=${status}`,
    })
  }

  if (result.ok && scenario.expectations.mustClarify) {
    const data = result.data as { status?: string; clarifyingQuestion?: string }
    checks.push({
      id: "clarification_status",
      pass: data.status === "needs_clarification" && Boolean(data.clarifyingQuestion?.trim()),
      detail: `status=${data.status}; question=${data.clarifyingQuestion ? "present" : "missing"}`,
    })
  }

  if (result.ok && scenario.expectations.mustHaveThreePriorities) {
    const priorities = (result.data as { topPriorities?: unknown[] }).topPriorities
    checks.push({
      id: "three_priorities",
      pass: Array.isArray(priorities) && priorities.length === 3,
      detail: `topPriorities.length=${Array.isArray(priorities) ? priorities.length : "n/a"}`,
    })
  }

  if (result.ok && scenario.expectations.mustRequireArbitration) {
    const data = result.data as { requiresArbitration?: boolean; arbitrationQuestion?: string }
    checks.push({
      id: "arbitration_required",
      pass: data.requiresArbitration === true && Boolean(data.arbitrationQuestion?.trim()),
      detail: `requiresArbitration=${data.requiresArbitration}; question=${data.arbitrationQuestion ? "present" : "missing"}`,
    })
  }

  if (result.ok && scenario.expectations.mustNotRequireArbitration) {
    const data = result.data as { requiresArbitration?: boolean }
    checks.push({
      id: "arbitration_not_required",
      pass: data.requiresArbitration !== true,
      detail: `requiresArbitration=${data.requiresArbitration}`,
    })
  }

  if (scenario.expectations.expectedPatternVersion) {
    const expected = scenario.expectations.expectedPatternVersion
    const actual = result.metrics.patternVersion
    checks.push({
      id: "pattern_version",
      pass: actual === expected,
      detail: `expected=${expected}; actual=${actual}`,
    })
  }

  if (result.ok && scenario.expectations.scoringIntegrity) {
    const input = scenario.input as {
      globalScorePercent: number
      categoryScores: { name: string; scorePercent: number }[]
    }
    const echo = (result.data as {
      officialScoresEcho?: { globalScorePercent: number; categoryScores: { name: string; scorePercent: number }[] }
    }).officialScoresEcho
    const globalOk = echo?.globalScorePercent === input.globalScorePercent
    const catsOk =
      JSON.stringify(echo?.categoryScores ?? null) === JSON.stringify(input.categoryScores ?? null)
    checks.push({
      id: "scoring_integrity",
      pass: Boolean(globalOk && catsOk),
      detail: globalOk && catsOk ? "echo matches input" : "echo mismatch",
    })
  }

  if (result.ok && scenario.expectations.forbiddenSubstrings?.length) {
    const hit = hasForbiddenSubstring(result.data, scenario.expectations.forbiddenSubstrings)
    checks.push({
      id: "no_forbidden_substrings",
      pass: !hit,
      detail: hit ? `found:${hit}` : "clean",
    })
  }

  if (result.ok) {
    const side = hasSideEffectKeys(result.data)
    checks.push({
      id: "no_side_effect_keys",
      pass: !side,
      detail: side ? `key:${side}` : "clean",
    })
    checks.push({
      id: "constraints_ok",
      pass: true,
      detail: "runner constraints applied (mechanical)",
    })
  }

  const passCount = checks.filter((item) => item.pass).length
  const failCount = checks.length - passCount

  return {
    scenarioId: scenario.id,
    patternId: scenario.patternId,
    runOk: result.ok,
    checks,
    passCount,
    failCount,
    allRequiredPassed: failCount === 0,
    latencyMs,
    tokens,
    note: "deterministic_only",
  }
}
