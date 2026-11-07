import type { z } from "zod"

/** LOT 19 — isolated Fabric-inspired pattern engine (read-only, no side effects). */

export type FabricPatternId =
  | "generate_scorecard_draft"
  | "analyze_scorecard_results"
  | "generate_action_plan"

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string }

export type FabricLlmAdapter = {
  id: string
  mode: "mock" | "live"
  completeJson: (
    messages: LlmMessage[],
    options?: { timeoutMs?: number; maxTokens?: number },
  ) => Promise<string>
}

export type FabricRunMetrics = {
  patternId: FabricPatternId
  patternVersion: string
  adapterId: string
  adapterMode: "mock" | "live"
  ok: boolean
  errorCode?: string
  latencyMs: number
  inputChars: number
  outputChars: number
  /** Never include raw user content or secrets. */
}

export type FabricRunSuccess<T> = {
  ok: true
  patternId: FabricPatternId
  version: string
  data: T
  metrics: FabricRunMetrics
}

export type FabricRunFailure = {
  ok: false
  patternId: FabricPatternId
  version?: string
  error: {
    code:
      | "disabled"
      | "unknown_pattern"
      | "input_invalid"
      | "input_rejected"
      | "llm_error"
      | "output_invalid"
      | "live_forbidden"
      | "side_effect_blocked"
    message: string
    details?: unknown
  }
  metrics: FabricRunMetrics
}

export type FabricRunResult<T> = FabricRunSuccess<T> | FabricRunFailure

export type FabricPatternDefinition<TIn extends z.ZodType, TOut extends z.ZodType> = {
  id: FabricPatternId
  version: string
  purpose: string
  description: string
  inputSchema: TIn
  outputSchema: TOut
  systemInstructions: string
  businessConstraints: string[]
  limits: {
    maxInputChars: number
    maxOutputChars: number
  }
  examples: { name: string; input: z.infer<TIn> }[]
  buildUserPayload: (input: z.infer<TIn>) => unknown
}

export const FABRIC_PROTOTYPE_PACKAGE = "lib/ai/fabric-prototype" as const
