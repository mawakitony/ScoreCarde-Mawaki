import {
  findGuaranteedPercentClaims,
  findHorizonInconsistencies,
  findOffTopicContactQuestions,
  findUnvalidatedPercentTargets,
  shouldRequireArbitration,
} from "@/lib/ai/fabric-prototype/business-guards"
import { isFabricPrototypeEnabled } from "@/lib/ai/fabric-prototype/flags"
import { createMockLlmAdapter } from "@/lib/ai/fabric-prototype/llm-adapter"
import { getFabricPattern } from "@/lib/ai/fabric-prototype/registry"
import { stripLlmOfficialScores } from "@/lib/ai/fabric-prototype/normalize"
import {
  extractJsonObject,
  FORBIDDEN_OUTPUT_KEYS,
  rejectUnsafeInput,
  stripForbiddenOutputKeys,
} from "@/lib/ai/fabric-prototype/security"
import type {
  FabricLlmAdapter,
  FabricPatternId,
  FabricRunMetrics,
  FabricRunResult,
} from "@/lib/ai/fabric-prototype/types"

export type RunPatternOptions = {
  /** Force-run in unit tests without enabling the env flag. */
  allowInTests?: boolean
  adapter?: FabricLlmAdapter
  /** Require enabled flag even in tests when false (default). */
  requireEnabled?: boolean
}

function baseMetrics(partial: Omit<FabricRunMetrics, "ok"> & { ok?: boolean }): FabricRunMetrics {
  return { ok: partial.ok ?? false, ...partial }
}

/**
 * Execute a Fabric-inspired pattern. Read-only: never writes to DB or calls business actions.
 */
export async function runFabricPattern(
  patternId: FabricPatternId,
  rawInput: unknown,
  options: RunPatternOptions = {},
): Promise<FabricRunResult<unknown>> {
  const started = Date.now()
  const adapter = options.adapter ?? createMockLlmAdapter()
  const requireEnabled = options.requireEnabled ?? !options.allowInTests

  if (requireEnabled && !isFabricPrototypeEnabled()) {
    return {
      ok: false,
      patternId,
      error: {
        code: "disabled",
        message: "Prototype Fabric désactivé (FABRIC_PROTOTYPE_ENABLED≠1).",
      },
      metrics: baseMetrics({
        patternId,
        patternVersion: "n/a",
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: 0,
        outputChars: 0,
        errorCode: "disabled",
      }),
    }
  }

  if (adapter.mode === "live" && process.env.FABRIC_PROTOTYPE_LIVE !== "1") {
    return {
      ok: false,
      patternId,
      error: {
        code: "live_forbidden",
        message: "Mode LIVE interdit (FABRIC_PROTOTYPE_LIVE≠1).",
      },
      metrics: baseMetrics({
        patternId,
        patternVersion: "n/a",
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: 0,
        outputChars: 0,
        errorCode: "live_forbidden",
      }),
    }
  }

  const pattern = getFabricPattern(patternId)
  if (!pattern) {
    return {
      ok: false,
      patternId,
      error: { code: "unknown_pattern", message: `Pattern inconnu: ${patternId}` },
      metrics: baseMetrics({
        patternId,
        patternVersion: "n/a",
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: 0,
        outputChars: 0,
        errorCode: "unknown_pattern",
      }),
    }
  }

  const safety = rejectUnsafeInput(rawInput, pattern.limits.maxInputChars)
  if (!safety.ok) {
    return {
      ok: false,
      patternId,
      version: pattern.version,
      error: { code: "input_rejected", message: safety.reason },
      metrics: baseMetrics({
        patternId,
        patternVersion: pattern.version,
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: safety.reason.length,
        outputChars: 0,
        errorCode: "input_rejected",
      }),
    }
  }

  const parsedIn = pattern.inputSchema.safeParse(rawInput)
  if (!parsedIn.success) {
    return {
      ok: false,
      patternId,
      version: pattern.version,
      error: {
        code: "input_invalid",
        message: "Entrée invalide (Zod).",
        details: parsedIn.error.flatten(),
      },
      metrics: baseMetrics({
        patternId,
        patternVersion: pattern.version,
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: safety.text.length,
        outputChars: 0,
        errorCode: "input_invalid",
      }),
    }
  }

  const userPayload = JSON.stringify(pattern.buildUserPayload(parsedIn.data))
  let rawOut = ""
  try {
    // Cap completion tokens from pattern output budget (chars≈3–4/token) to reduce TPM pressure.
    const maxTokens = Math.min(
      4_000,
      Math.max(400, Math.ceil(pattern.limits.maxOutputChars / 3.5)),
    )
    rawOut = await adapter.completeJson(
      [
        { role: "system", content: pattern.systemInstructions },
        {
          role: "user",
          content: `${userPayload}\n\nContraintes métier:\n- ${pattern.businessConstraints.join("\n- ")}`,
        },
      ],
      { maxTokens },
    )
  } catch (error) {
    return {
      ok: false,
      patternId,
      version: pattern.version,
      error: {
        code: "llm_error",
        message: error instanceof Error ? error.message : "Erreur LLM",
      },
      metrics: baseMetrics({
        patternId,
        patternVersion: pattern.version,
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: safety.text.length,
        outputChars: 0,
        errorCode: "llm_error",
      }),
    }
  }

  if (rawOut.length > pattern.limits.maxOutputChars) {
    return {
      ok: false,
      patternId,
      version: pattern.version,
      error: { code: "output_invalid", message: "Réponse LLM trop longue." },
      metrics: baseMetrics({
        patternId,
        patternVersion: pattern.version,
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: safety.text.length,
        outputChars: rawOut.length,
        errorCode: "output_invalid",
      }),
    }
  }

  let jsonValue: unknown
  try {
    jsonValue = JSON.parse(extractJsonObject(rawOut))
  } catch {
    return {
      ok: false,
      patternId,
      version: pattern.version,
      error: { code: "output_invalid", message: "Réponse LLM non JSON." },
      metrics: baseMetrics({
        patternId,
        patternVersion: pattern.version,
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: safety.text.length,
        outputChars: rawOut.length,
        errorCode: "output_invalid",
      }),
    }
  }

  if (jsonValue && typeof jsonValue === "object" && !Array.isArray(jsonValue)) {
    const keys = Object.keys(jsonValue as Record<string, unknown>)
    const blocked = keys.find((key) => (FORBIDDEN_OUTPUT_KEYS as readonly string[]).includes(key))
    if (blocked) {
      return {
        ok: false,
        patternId,
        version: pattern.version,
        error: {
          code: "side_effect_blocked",
          message: `La réponse contenait une action non autorisée (${blocked}).`,
        },
        metrics: baseMetrics({
          patternId,
          patternVersion: pattern.version,
          adapterId: adapter.id,
          adapterMode: adapter.mode,
          latencyMs: Date.now() - started,
          inputChars: safety.text.length,
          outputChars: rawOut.length,
          errorCode: "side_effect_blocked",
        }),
      }
    }
  }

  let cleaned = stripForbiddenOutputKeys(jsonValue)

  // Scoring integrity: discard any LLM-supplied numeric overrides, then force input echo.
  if (patternId === "analyze_scorecard_results") {
    cleaned = stripLlmOfficialScores(cleaned)
    if (cleaned && typeof cleaned === "object") {
      const input = parsedIn.data as {
        globalScorePercent: number
        categoryScores: { name: string; scorePercent: number }[]
      }
      ;(cleaned as Record<string, unknown>).officialScoresEcho = {
        globalScorePercent: input.globalScorePercent,
        categoryScores: input.categoryScores.map((item) => ({ ...item })),
      }
    }
  }

  const parsedOut = pattern.outputSchema.safeParse(cleaned)
  if (!parsedOut.success) {
    const flat = parsedOut.error.flatten()
    const fieldHints = Object.entries(flat.fieldErrors)
      .slice(0, 6)
      .map(([k, msgs]) => `${k}: ${(msgs ?? []).join("; ")}`)
      .join(" | ")
    const formHints = (flat.formErrors ?? []).slice(0, 3).join("; ")
    const hint = [formHints, fieldHints].filter(Boolean).join(" · ").slice(0, 480)
    return {
      ok: false,
      patternId,
      version: pattern.version,
      error: {
        code: "output_invalid",
        message: hint ? `Sortie invalide (Zod): ${hint}` : "Sortie invalide (Zod).",
        details: flat,
      },
      metrics: baseMetrics({
        patternId,
        patternVersion: pattern.version,
        adapterId: adapter.id,
        adapterMode: adapter.mode,
        latencyMs: Date.now() - started,
        inputChars: safety.text.length,
        outputChars: rawOut.length,
        errorCode: "output_invalid",
      }),
    }
  }

  // Post-condition: official echo must still match input after Zod.
  if (patternId === "analyze_scorecard_results") {
    const input = parsedIn.data as {
      globalScorePercent: number
      categoryScores: { name: string; scorePercent: number }[]
    }
    const echo = (parsedOut.data as {
      officialScoresEcho: { globalScorePercent: number; categoryScores: { name: string; scorePercent: number }[] }
    }).officialScoresEcho
    const mismatch =
      echo.globalScorePercent !== input.globalScorePercent ||
      JSON.stringify(echo.categoryScores) !== JSON.stringify(input.categoryScores)
    if (mismatch) {
      return {
        ok: false,
        patternId,
        version: pattern.version,
        error: {
          code: "side_effect_blocked",
          message: "Intégrité des scores officiels compromise.",
        },
        metrics: baseMetrics({
          patternId,
          patternVersion: pattern.version,
          adapterId: adapter.id,
          adapterMode: adapter.mode,
          latencyMs: Date.now() - started,
          inputChars: safety.text.length,
          outputChars: rawOut.length,
          errorCode: "side_effect_blocked",
        }),
      }
    }
  }

  // LOT 19I — business guards (fail closed; no persistence side effects).
  if (patternId === "generate_scorecard_draft") {
    const draftOut = parsedOut.data as {
      status: string
      questions?: Array<{ title?: string; type?: string }>
      categories?: unknown[]
    }
    if (draftOut.status === "draft_suggestion") {
      const input = parsedIn.data as {
        description: string
        maxQuestions: number
        maxCategories: number
      }
      const contactHit = findOffTopicContactQuestions(input.description, draftOut.questions ?? [])
      if (contactHit) {
        return {
          ok: false,
          patternId,
          version: pattern.version,
          error: {
            code: "output_invalid",
            message: `Question hors sujet (contact) : ${contactHit}`,
          },
          metrics: baseMetrics({
            patternId,
            patternVersion: pattern.version,
            adapterId: adapter.id,
            adapterMode: adapter.mode,
            latencyMs: Date.now() - started,
            inputChars: safety.text.length,
            outputChars: rawOut.length,
            errorCode: "output_invalid",
          }),
        }
      }
      if ((draftOut.questions?.length ?? 0) > input.maxQuestions) {
        return {
          ok: false,
          patternId,
          version: pattern.version,
          error: { code: "output_invalid", message: "maxQuestions dépassé." },
          metrics: baseMetrics({
            patternId,
            patternVersion: pattern.version,
            adapterId: adapter.id,
            adapterMode: adapter.mode,
            latencyMs: Date.now() - started,
            inputChars: safety.text.length,
            outputChars: rawOut.length,
            errorCode: "output_invalid",
          }),
        }
      }
      if ((draftOut.categories?.length ?? 0) > input.maxCategories) {
        return {
          ok: false,
          patternId,
          version: pattern.version,
          error: { code: "output_invalid", message: "maxCategories dépassé." },
          metrics: baseMetrics({
            patternId,
            patternVersion: pattern.version,
            adapterId: adapter.id,
            adapterMode: adapter.mode,
            latencyMs: Date.now() - started,
            inputChars: safety.text.length,
            outputChars: rawOut.length,
            errorCode: "output_invalid",
          }),
        }
      }
    }
  }

  let finalData = parsedOut.data
  if (patternId === "generate_action_plan") {
    const planOut = parsedOut.data as {
      actions?: Array<{
        title?: string
        horizon?: string
        description?: string
        expectedOutcome?: string
        successIndicator?: string
      }>
      recommendations?: string[]
      situationSynthesis?: string
      requiresArbitration?: boolean
      arbitrationQuestion?: string
      missingInformation?: string[]
    }
    const claim = findGuaranteedPercentClaims(planOut)
    if (claim) {
      return {
        ok: false,
        patternId,
        version: pattern.version,
        error: {
          code: "output_invalid",
          message: `Objectif chiffré présenté comme garanti : ${claim}`,
        },
        metrics: baseMetrics({
          patternId,
          patternVersion: pattern.version,
          adapterId: adapter.id,
          adapterMode: adapter.mode,
          latencyMs: Date.now() - started,
          inputChars: safety.text.length,
          outputChars: rawOut.length,
          errorCode: "output_invalid",
        }),
      }
    }
    const barePct = findUnvalidatedPercentTargets(planOut)
    if (barePct) {
      return {
        ok: false,
        patternId,
        version: pattern.version,
        error: {
          code: "output_invalid",
          message: `Pourcentage non marqué comme cible à valider : ${barePct}`,
        },
        metrics: baseMetrics({
          patternId,
          patternVersion: pattern.version,
          adapterId: adapter.id,
          adapterMode: adapter.mode,
          latencyMs: Date.now() - started,
          inputChars: safety.text.length,
          outputChars: rawOut.length,
          errorCode: "output_invalid",
        }),
      }
    }
    const horizonHit = findHorizonInconsistencies(planOut.actions ?? [])
    if (horizonHit) {
      return {
        ok: false,
        patternId,
        version: pattern.version,
        error: {
          code: "output_invalid",
          message: `Incohérence horizon / échéance : ${horizonHit}`,
        },
        metrics: baseMetrics({
          patternId,
          patternVersion: pattern.version,
          adapterId: adapter.id,
          adapterMode: adapter.mode,
          latencyMs: Date.now() - started,
          inputChars: safety.text.length,
          outputChars: rawOut.length,
          errorCode: "output_invalid",
        }),
      }
    }
    const planIn = parsedIn.data as { gaps?: string[]; constraints?: string[] }
    // Force arbitration only for exclusive constraints — never for mere "budget limité".
    if (shouldRequireArbitration(planIn) && !planOut.requiresArbitration) {
      finalData = {
        ...planOut,
        requiresArbitration: true,
        arbitrationQuestion:
          planOut.arbitrationQuestion ??
          "Avec une contrainte de choix exclusif (un seul chantier majeur), quelle option priorisez-vous et selon quel critère ?",
        missingInformation: [
          ...(planOut.missingInformation ?? []),
          "Critère d'arbitrage sponsor non fourni.",
        ],
      }
    }
  }

  return {
    ok: true,
    patternId,
    version: pattern.version,
    data: finalData,
    metrics: baseMetrics({
      ok: true,
      patternId,
      patternVersion: pattern.version,
      adapterId: adapter.id,
      adapterMode: adapter.mode,
      latencyMs: Date.now() - started,
      inputChars: safety.text.length,
      outputChars: rawOut.length,
    }),
  }
}
