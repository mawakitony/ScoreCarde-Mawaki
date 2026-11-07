import { assertLiveAllowed } from "@/lib/ai/fabric-prototype/flags"
import type { FabricLlmAdapter, LlmMessage } from "@/lib/ai/fabric-prototype/types"
import {
  mockAnalyzeResults,
  mockActionPlan,
  mockScorecardDraft,
  pickFixtureKey,
} from "@/lib/ai/fabric-prototype/fixtures/mock-responses"

/**
 * Isolate the pattern `input` JSON so fixture routing ignores system examples
 * and appended "Contraintes métier" lines (which mention ambiguïté / budget unique).
 */
function extractPatternInputBlob(userBlob: string): string {
  const marker = "\n\nContraintes métier:"
  const cut = userBlob.indexOf(marker)
  const payloadText = cut >= 0 ? userBlob.slice(0, cut) : userBlob
  try {
    const parsed = JSON.parse(payloadText.trim()) as { input?: unknown }
    if (parsed && typeof parsed === "object" && parsed.input != null) {
      return JSON.stringify(parsed.input)
    }
  } catch {
    /* fall through */
  }
  return payloadText
}

/**
 * Deterministic mock — required for CI. No API keys.
 */
export function createMockLlmAdapter(): FabricLlmAdapter {
  return {
    id: "mock-v1",
    mode: "mock",
    async completeJson(messages) {
      const systemBlob = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n")
      const userBlob = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n")
      const inputBlob = extractPatternInputBlob(userBlob)
      const key = pickFixtureKey(inputBlob)

      if (systemBlob.includes("PATTERN_ID=analyze_scorecard_results")) {
        return JSON.stringify(mockAnalyzeResults(key, inputBlob))
      }
      if (systemBlob.includes("PATTERN_ID=generate_action_plan")) {
        return JSON.stringify(mockActionPlan(key, inputBlob))
      }
      return JSON.stringify(mockScorecardDraft(key))
    },
  }
}

/**
 * LIVE adapter — interface only for future eval.
 * Throws unless FABRIC_PROTOTYPE_ENABLED=1 and FABRIC_PROTOTYPE_LIVE=1.
 * LOT 19 must NOT invoke this in CI.
 */
export function createLiveLlmAdapter(deps?: {
  completeJson?: (
    messages: LlmMessage[],
    timeoutMs?: number,
    callOpts?: { maxTokens?: number },
  ) => Promise<string | null>
}): FabricLlmAdapter {
  assertLiveAllowed()
  return {
    id: "live-openai-compatible",
    mode: "live",
    async completeJson(messages, options) {
      if (!deps?.completeJson) {
        throw new Error("Live adapter has no completeJson implementation wired.")
      }
      const content = await deps.completeJson(messages, options?.timeoutMs, {
        maxTokens: options?.maxTokens,
      })
      if (!content) throw new Error("Live LLM returned empty content.")
      return content
    },
  }
}
