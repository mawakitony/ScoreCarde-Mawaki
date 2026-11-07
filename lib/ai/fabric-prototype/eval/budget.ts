import { LIVE_BUDGET_DEFAULTS, estimateCostUsd, type TokenEstimate } from "@/lib/ai/fabric-prototype/eval/cost-model"



export type BudgetState = {

  calls: number

  inputTokens: number

  outputTokens: number

  /** Cumulative estimated USD for the campaign (Groq tariff when known). */

  estimatedUsd: number

  stopped: boolean

  stopReason?: string

}



export function createBudgetTracker(limits = LIVE_BUDGET_DEFAULTS) {

  const state: BudgetState = {

    calls: 0,

    inputTokens: 0,

    outputTokens: 0,

    estimatedUsd: 0,

    stopped: false,

  }



  return {

    state,

    limits,

    canContinue() {

      return !state.stopped

    },

    /** True if adding `additionalUsd` would breach the campaign dollar ceiling. */

    wouldExceedUsd(additionalUsd: number) {

      return state.estimatedUsd + additionalUsd > limits.maxEstimatedUsd

    },

    stop(reason: string) {

      state.stopped = true

      state.stopReason = reason

    },

    recordCall(

      tokens: TokenEstimate,

      providerId: string,

      opts?: {
        inputTokens?: number
        outputTokens?: number
        cachedInputTokens?: number
        /**
         * Fail-closed floor when provider usage is missing/zero after an HTTP attempt.
         * Never treat unknown usage as $0 for ceiling purposes.
         */
        unknownUsageFloorUsd?: number
        /** When true (LIVE), unknown tariff stops the campaign instead of assuming $0. */
        requireKnownUsd?: boolean
      },

    ) {

      if (state.stopped) return

      state.calls += 1

      const inTok = opts?.inputTokens ?? tokens.estimatedInputTokens

      const outTok = opts?.outputTokens ?? tokens.estimatedOutputTokens

      state.inputTokens += inTok

      state.outputTokens += outTok



      if (state.calls > limits.maxCalls) {

        state.stopped = true

        state.stopReason = `maxCalls exceeded (${limits.maxCalls})`

        return

      }

      if (state.inputTokens > limits.maxEstimatedInputTokens) {

        state.stopped = true

        state.stopReason = "maxEstimatedInputTokens exceeded"

        return

      }

      if (state.outputTokens > limits.maxEstimatedOutputTokens) {

        state.stopped = true

        state.stopReason = "maxEstimatedOutputTokens exceeded"

        return

      }

      const cost = estimateCostUsd(tokens, providerId, {

        inputTokens: inTok,

        outputTokens: outTok,

        cachedInputTokens: opts?.cachedInputTokens,

      })

      let addUsd = cost.estimatedUsd
      if ((addUsd == null || addUsd === 0) && (inTok === 0 && outTok === 0) && opts?.unknownUsageFloorUsd != null) {
        addUsd = opts.unknownUsageFloorUsd
      }

      if (addUsd == null) {
        if (opts?.requireKnownUsd) {
          // Fail closed (LIVE): unknown tariff must not be treated as free.
          state.stopped = true
          state.stopReason = "estimatedUsd unavailable (unknown tariff) — refusing further calls"
        }
        return
      }

      state.estimatedUsd = Number((state.estimatedUsd + addUsd).toFixed(6))

      if (state.estimatedUsd > limits.maxEstimatedUsd) {
        state.stopped = true
        state.stopReason = `maxEstimatedUsd exceeded (${limits.maxEstimatedUsd})`
      }

    },

  }

}


