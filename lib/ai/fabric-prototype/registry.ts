import { analyzeScorecardResultsPattern } from "@/lib/ai/fabric-prototype/patterns/analyze-scorecard-results"
import { generateActionPlanPattern } from "@/lib/ai/fabric-prototype/patterns/generate-action-plan"
import { generateScorecardDraftPattern } from "@/lib/ai/fabric-prototype/patterns/generate-scorecard-draft"
import type { FabricPatternDefinition, FabricPatternId } from "@/lib/ai/fabric-prototype/types"
import type { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPattern = FabricPatternDefinition<z.ZodType<any>, z.ZodType<any>>

const PATTERNS: Record<FabricPatternId, AnyPattern> = {
  generate_scorecard_draft: generateScorecardDraftPattern,
  analyze_scorecard_results: analyzeScorecardResultsPattern,
  generate_action_plan: generateActionPlanPattern,
}

export function listFabricPatterns() {
  return Object.values(PATTERNS).map((pattern) => ({
    id: pattern.id,
    version: pattern.version,
    purpose: pattern.purpose,
    description: pattern.description,
    businessConstraints: pattern.businessConstraints,
    limits: pattern.limits,
  }))
}

export function getFabricPattern(id: string): AnyPattern | null {
  if (id in PATTERNS) return PATTERNS[id as FabricPatternId]
  return null
}

export function isFabricPatternId(id: string): id is FabricPatternId {
  return id in PATTERNS
}
