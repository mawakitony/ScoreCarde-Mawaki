/**
 * LOT 19B — classification of LIVE failures observed in LOT 19A.
 * Does not assume every llm_error is HTTP 429.
 */

export type FailureClass =
  | "json_format"
  | "zod_validation"
  | "business_schema"
  | "provider_error"
  | "rate_limit_confirmed"
  | "timeout"
  | "prompt_issue"
  | "other"

export type ClassifiedFailure = {
  scenarioId: string
  errorCode?: string
  classification: FailureClass
  evidence: string
  confirmed: boolean
}

/** Campaign observations from docs/ai/lot19a-live-results.md (no secrets). */
export const LOT19A_FAILURE_CLASSIFICATION: ClassifiedFailure[] = [
  {
    scenarioId: "draft_pmp",
    errorCode: "output_invalid",
    classification: "zod_validation",
    evidence: "Diagnostic: title absent (alias text/question); options as strings — Zod reject after JSON parse OK.",
    confirmed: true,
  },
  {
    scenarioId: "draft_pmo",
    errorCode: "output_invalid",
    classification: "zod_validation",
    evidence: "Same shape mismatch as draft_pmp (campaign output_invalid + high latency).",
    confirmed: true,
  },
  {
    scenarioId: "draft_itil",
    errorCode: "output_invalid",
    classification: "zod_validation",
    evidence: "Campaign output_invalid with substantial output size.",
    confirmed: true,
  },
  {
    scenarioId: "draft_sales",
    errorCode: "output_invalid",
    classification: "business_schema",
    evidence: "Valid JSON likely but incompatible with Builder option object contract.",
    confirmed: true,
  },
  {
    scenarioId: "draft_digital",
    errorCode: "output_invalid",
    classification: "zod_validation",
    evidence: "Campaign output_invalid.",
    confirmed: true,
  },
  {
    scenarioId: "draft_training",
    errorCode: "llm_error",
    classification: "provider_error",
    evidence: "~133ms fail — not confirmed HTTP 429; could be empty/network/5xx/429.",
    confirmed: false,
  },
  {
    scenarioId: "draft_leadership",
    errorCode: "output_invalid",
    classification: "zod_validation",
    evidence: "Campaign output_invalid.",
    confirmed: true,
  },
  {
    scenarioId: "draft_ambiguous",
    errorCode: "llm_error",
    classification: "provider_error",
    evidence: "Fast fail after earlier calls — rate limit suspected but not confirmed via status code in logs.",
    confirmed: false,
  },
  {
    scenarioId: "analyze_* / plan_* llm_error cluster",
    errorCode: "llm_error",
    classification: "provider_error",
    evidence:
      "20 consecutive ~120ms llm_errors after draft burst. Rate limit plausible; HTTP status was not persisted in campaign report → not classified as rate_limit_confirmed.",
    confirmed: false,
  },
  {
    scenarioId: "security rejects",
    errorCode: "input_rejected",
    classification: "other",
    evidence: "Expected security behavior — PASS, not a defect.",
    confirmed: true,
  },
]

export function summarizeTaxonomy(rows: ClassifiedFailure[] = LOT19A_FAILURE_CLASSIFICATION) {
  const counts: Record<FailureClass, number> = {
    json_format: 0,
    zod_validation: 0,
    business_schema: 0,
    provider_error: 0,
    rate_limit_confirmed: 0,
    timeout: 0,
    prompt_issue: 0,
    other: 0,
  }
  for (const row of rows) counts[row.classification] += 1
  return counts
}
