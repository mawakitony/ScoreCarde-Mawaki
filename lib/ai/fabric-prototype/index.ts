/**
 * LOT 19 — Fabric-inspired pattern prototype.
 * Disabled by default. Not wired to production Assistant UI.
 */
export { isFabricPrototypeEnabled, isFabricPrototypeLiveAllowed } from "@/lib/ai/fabric-prototype/flags"
export { createMockLlmAdapter, createLiveLlmAdapter } from "@/lib/ai/fabric-prototype/llm-adapter"
export { listFabricPatterns, getFabricPattern, isFabricPatternId } from "@/lib/ai/fabric-prototype/registry"
export { runFabricPattern } from "@/lib/ai/fabric-prototype/runner"
export type { RunPatternOptions } from "@/lib/ai/fabric-prototype/runner"
export type {
  FabricPatternId,
  FabricLlmAdapter,
  FabricRunResult,
  FabricRunMetrics,
} from "@/lib/ai/fabric-prototype/types"
export {
  generateScorecardDraftInputSchema,
  generateScorecardDraftOutputSchema,
  analyzeScorecardResultsInputSchema,
  analyzeScorecardResultsOutputSchema,
  generateActionPlanInputSchema,
  generateActionPlanOutputSchema,
  FABRIC_QUESTION_TYPES,
} from "@/lib/ai/fabric-prototype/schemas"
