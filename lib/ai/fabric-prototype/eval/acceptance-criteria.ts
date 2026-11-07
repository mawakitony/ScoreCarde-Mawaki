/**
 * Proposed integration gates for Fabric patterns (LOT 19C).
 * These are objectives — not claims of current achievement.
 */

import type { FabricPatternId } from "@/lib/ai/fabric-prototype/types"

export type AcceptanceThresholds = {
  securityConstraintRespectPercent: number
  officialScoreIntegrityPercent: number
  zodConformityPercent: number
  qualitativeAverageMin: number
  maxCriticalBusinessDefects: number
  /** Soft UX target for p50 model latency excluding backoff waits when separable. */
  targetP50LatencyMs: number
  /** Soft UX target for p95 including one retry path. */
  targetP95LatencyMs: number
  costCompatibleNote: string
}

/** Proposed thresholds — product may tighten or relax before READY. */
export const PROPOSED_ACCEPTANCE: AcceptanceThresholds = {
  securityConstraintRespectPercent: 100,
  officialScoreIntegrityPercent: 100,
  zodConformityPercent: 95,
  qualitativeAverageMin: 4,
  maxCriticalBusinessDefects: 0,
  targetP50LatencyMs: 5_000,
  targetP95LatencyMs: 12_000,
  costCompatibleNote:
    "Compatible avec quotas SaaS si coût moyen par invocation reste << $0.01 aux tarifs Groq gpt-oss-120b observés (~$0.0005–0.001 / appel utile).",
}

export type PatternIntegrationStatus =
  | "NOT_EVALUATED"
  | "NEEDS_IMPROVEMENT"
  | "READY_FOR_INTEGRATION"
  | "BLOCKED"

export type PatternAcceptanceChecklist = {
  patternId: FabricPatternId
  proposed: AcceptanceThresholds
  /** Current evidence snapshot — informational, not auto-READY. */
  evidenceNotes: string[]
  status: PatternIntegrationStatus
}

export function buildDefaultChecklists(): PatternAcceptanceChecklist[] {
  const sharedNotes = [
    "LOT 19B mini LIVE: Zod 7/7 + sécurité OK sur 9 scénarios — insuffisant seul pour READY.",
    "LOT 19C: sorties LIVE non persistées → note qualitative humaine non calculable rétrospectivement.",
    "Aucun Pattern ne doit être READY uniquement sur 9 tests LIVE.",
  ]
  return (["generate_scorecard_draft", "analyze_scorecard_results", "generate_action_plan"] as FabricPatternId[]).map(
    (patternId) => ({
      patternId,
      proposed: PROPOSED_ACCEPTANCE,
      evidenceNotes: sharedNotes,
      status: "NEEDS_IMPROVEMENT" as const,
    }),
  )
}
