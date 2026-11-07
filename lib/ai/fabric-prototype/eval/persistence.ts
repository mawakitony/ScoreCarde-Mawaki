import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve, sep } from "node:path"
import { QUALITY_CRITERIA, RUBRIC_GUIDE, emptyPendingReview } from "@/lib/ai/fabric-prototype/eval/quality-rubric"
import type { ScenarioEvalResult, EvalRunReport } from "@/lib/ai/fabric-prototype/eval/harness"
import { LOT19D_OUTPUT_DIR } from "@/lib/ai/fabric-prototype/eval/lot19d-campaign"

const SECRET_KEY_RE =
  /^(api[_-]?key|authorization|bearer|password|secret|access[_-]?token|refresh[_-]?token|id[_-]?token|cookie|supabase(?:Url|Key)?|stripe(?:Key)?|private[_-]?key)$/i

const SECRET_INLINE_RE =
  /(?:sk-[a-zA-Z0-9]{10,}|gsk_[a-zA-Z0-9_]{10,}|Bearer\s+\S+|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,})/i

/** Strip likely secrets from arbitrary JSON-ish values (defensive). */
export function sanitizeForPersistence(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[truncated]"
  if (value == null) return value
  if (typeof value === "string") {
    if (SECRET_INLINE_RE.test(value)) {
      return value
        .replace(/sk-[a-zA-Z0-9]{10,}/g, "[redacted-key]")
        .replace(/gsk_[a-zA-Z0-9_]{10,}/g, "[redacted-key]")
        .replace(/Bearer\s+\S+/gi, "[redacted-bearer]")
        .replace(/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}\.?[a-zA-Z0-9_-]*/g, "[redacted-jwt]")
    }
    return value
  }
  if (typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((item) => sanitizeForPersistence(item, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY_RE.test(key)) {
      out[key] = "[redacted]"
      continue
    }
    out[key] = sanitizeForPersistence(child, depth + 1)
  }
  return out
}

export type TraceRecord = {
  scenarioId: string
  patternId: string
  patternVersion: string
  model: string
  syntheticInput: unknown
  validatedOutput?: unknown
  zodOk: boolean
  runOk: boolean
  latencyMs: number
  providerLatencyMs?: number
  retryWaitMs?: number
  validationMs?: number
  httpAttempts?: number
  promptTokens?: number
  completionTokens?: number
  cachedTokens?: number
  errorCode?: string
  errorMessage?: string
  qualitative: ReturnType<typeof emptyPendingReview>
}

export function buildTraceRecords(
  results: Array<
    ScenarioEvalResult & {
      patternVersion?: string
      syntheticInput?: unknown
      model?: string
      providerLatencyMs?: number
      retryWaitMs?: number
      validationMs?: number
    }
  >,
  modelFallback: string,
): TraceRecord[] {
  return results.map((item) => {
    const zodOk =
      item.deterministic.checks.find((c) => c.id === "zod_ok")?.pass ??
      item.deterministic.checks.find((c) => c.id === "json_ok")?.pass ??
      false
    return {
      scenarioId: item.scenario.id,
      patternId: item.scenario.patternId,
      patternVersion: item.patternVersion ?? "unknown",
      model: item.model ?? modelFallback,
      syntheticInput: sanitizeForPersistence(item.syntheticInput ?? null),
      validatedOutput: item.validatedOutput !== undefined ? sanitizeForPersistence(item.validatedOutput) : undefined,
      zodOk: Boolean(zodOk),
      runOk: item.deterministic.runOk,
      latencyMs: item.deterministic.latencyMs,
      providerLatencyMs: item.providerLatencyMs,
      retryWaitMs: item.retryWaitMs,
      validationMs: item.validationMs,
      httpAttempts: item.httpAttempts,
      promptTokens: item.usage?.promptTokens,
      completionTokens: item.usage?.completionTokens,
      cachedTokens: item.usage?.cachedTokens,
      errorCode: item.errorCode,
      errorMessage:
        typeof item.errorMessage === "string"
          ? String(sanitizeForPersistence(item.errorMessage.slice(0, 400)))
          : undefined,
      qualitative: item.qualitative.status === "pending_human"
        ? item.qualitative
        : emptyPendingReview(item.scenario.id, item.scenario.patternId),
    }
  })
}

/** Human review worksheet — scores blank; Zod must not pre-fill quality. */
export function buildHumanReviewWorksheet(traces: TraceRecord[]) {
  return {
    instructions: [
      "Noter chaque critère de 0 à 5 selon RUBRIC_GUIDE.",
      "Ne pas attribuer de notes qualitatives uniquement parce que Zod est valide.",
      "Laisser overallAverage null jusqu'à revue complète.",
    ],
    criteria: QUALITY_CRITERIA.map((criterion) => ({
      criterion,
      guide: RUBRIC_GUIDE[criterion],
    })),
    scenarios: traces.map((trace) => ({
      scenarioId: trace.scenarioId,
      patternId: trace.patternId,
      patternVersion: trace.patternVersion,
      zodOk: trace.zodOk,
      runOk: trace.runOk,
      /** Presentation only — reviewer must still read validatedOutput. */
      inputSummary: summarizeInput(trace.syntheticInput),
      scores: QUALITY_CRITERIA.map((criterion) => ({
        criterion,
        score: null as number | null,
        notes: "",
      })),
      overallAverage: null as number | null,
    })),
  }
}

function summarizeInput(input: unknown): string {
  try {
    const text = JSON.stringify(input)
    return text.length > 280 ? `${text.slice(0, 280)}…` : text
  } catch {
    return "[unserializable]"
  }
}

export type PersistLot19dOptions = {
  cwd?: string
  outputDir?: string
  campaignId: string
  report: EvalRunReport
  traces: TraceRecord[]
}

/**
 * Resolve eval artifact dir. Always refuses escape outside `cwd`.
 * When `allowedRoot` is set (e.g. `"tmp"` for LOT 19M), also refuses paths
 * outside `<cwd>/<allowedRoot>/`.
 */
export function resolveEvalArtifactDir(
  cwd: string,
  outputDir: string,
  allowedRoot?: string,
): string {
  const cwdResolved = resolve(cwd)
  const candidate = resolve(cwd, outputDir)
  const cwdPrefix = cwdResolved.endsWith(sep) ? cwdResolved : cwdResolved + sep
  if (candidate !== cwdResolved && !candidate.startsWith(cwdPrefix)) {
    throw new Error(`Eval artifact path refused: "${outputDir}" escapes workspace cwd`)
  }
  if (allowedRoot) {
    const root = resolve(cwd, allowedRoot)
    const prefix = root.endsWith(sep) ? root : root + sep
    if (candidate !== root && !candidate.startsWith(prefix)) {
      throw new Error(
        `Eval artifact path refused: "${outputDir}" escapes allowed root "${allowedRoot}/"`,
      )
    }
  }
  return candidate
}

/**
 * Write anonymized artifacts under a gitignored local folder.
 * Never writes API keys / auth tokens / env secrets.
 */
export function persistLot19dArtifacts(options: PersistLot19dOptions) {
  const cwd = options.cwd ?? process.cwd()
  // Confinement: must stay under cwd (blocks `..` / absolute escapes).
  const dir = resolveEvalArtifactDir(cwd, options.outputDir ?? LOT19D_OUTPUT_DIR)
  mkdirSync(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const base = `${options.campaignId}-${stamp}`

  const safeReport = sanitizeForPersistence({
    ...options.report,
    provider: {
      providerId: options.report.provider.providerId,
      model: options.report.provider.model,
      providerConfigured: options.report.provider.providerConfigured,
      keyConfigured: Boolean(options.report.provider.keyConfigured),
      baseUrlConfigured: Boolean(options.report.provider.baseUrlConfigured),
    },
    liveGate: {
      canRunLive: options.report.liveGate.canRunLive,
      blockers: options.report.liveGate.blockers,
      enabled: options.report.liveGate.enabled,
      liveAllowed: options.report.liveGate.liveAllowed,
      confirmOk: options.report.liveGate.confirmOk,
      providerConfigured: options.report.liveGate.providerConfigured,
      providerId: options.report.liveGate.providerId,
      model: options.report.liveGate.model,
    },
  }) as EvalRunReport

  const fullPath = join(dir, `${base}-full.json`)
  const tracesPath = join(dir, `${base}-traces.json`)
  const reviewPath = join(dir, `${base}-human-review.json`)
  const slimPath = join(dir, `${base}-slim.json`)

  writeFileSync(fullPath, JSON.stringify(safeReport, null, 2), "utf8")
  writeFileSync(tracesPath, JSON.stringify({ traces: options.traces }, null, 2), "utf8")
  writeFileSync(reviewPath, JSON.stringify(buildHumanReviewWorksheet(options.traces), null, 2), "utf8")
  writeFileSync(
    slimPath,
    JSON.stringify(
      {
        campaignId: options.campaignId,
        startedAt: options.report.startedAt,
        finishedAt: options.report.finishedAt,
        summary: options.report.summary,
        integrationDecision: options.report.integrationDecision,
        scenarioCount: options.report.scenarioCount,
        results: options.traces.map((t) => ({
          scenarioId: t.scenarioId,
          patternId: t.patternId,
          patternVersion: t.patternVersion,
          zodOk: t.zodOk,
          runOk: t.runOk,
          latencyMs: t.latencyMs,
          httpAttempts: t.httpAttempts,
          errorCode: t.errorCode,
        })),
      },
      null,
      2,
    ),
    "utf8",
  )

  return { dir, fullPath, tracesPath, reviewPath, slimPath }
}

/** Detect accidental secret leakage in a serialized blob. */
export function containsForbiddenSecrets(serialized: string): boolean {
  if (/sk-[a-zA-Z0-9]{20,}/.test(serialized)) return true
  if (/gsk_[a-zA-Z0-9_]{20,}/.test(serialized)) return true
  if (/Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(serialized)) return true
  if (/AI_API_KEY\s*[:=]\s*["']?[^"'\s]{8,}/i.test(serialized)) return true
  if (/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}/.test(serialized)) return true
  if (/SUPABASE_(?:SERVICE_ROLE|ANON)_KEY\s*[:=]\s*["']?[^"'\s]{8,}/i.test(serialized)) return true
  return false
}
