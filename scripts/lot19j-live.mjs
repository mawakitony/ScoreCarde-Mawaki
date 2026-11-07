/**
 * LOT 19J — controlled LIVE retest of Fabric Patterns v1.3.0 (12 scenarios).
 * Dry-run: npm run eval:fabric:19j:prepare
 * LIVE requires chat authorization + FABRIC_EVAL_CONFIRM_19J=I_AUTHORIZE_LOT19J_LIVE
 * Hard ceilings: 18 HTTP attempts, $0.02 USD estimated.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

function loadEnvLocal() {
  if (!existsSync(".env.local")) return
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvLocal()
import {
  runLot19aEvaluation,
  preflightDiagnostic,
} from "../lib/ai/fabric-prototype/eval/harness.ts"
import {
  LOT19J_CAMPAIGN,
  assertLot19jNotAutoRun,
  lot19jPreflightSnapshot,
} from "../lib/ai/fabric-prototype/eval/lot19j-campaign.ts"
import { LOT19J_DATASET } from "../lib/ai/fabric-prototype/eval/lot19j-dataset.ts"
import {
  buildTraceRecords,
  persistLot19dArtifacts,
  containsForbiddenSecrets,
} from "../lib/ai/fabric-prototype/eval/persistence.ts"
import { findGuaranteedPercentClaims, findOffTopicContactQuestions } from "../lib/ai/fabric-prototype/business-guards.ts"
import { estimateCostUsd } from "../lib/ai/fabric-prototype/eval/cost-model.ts"

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--prepare-only")
const snapshot = lot19jPreflightSnapshot()
const preflight = preflightDiagnostic()

console.log("=== LOT 19J preflight ===")
console.log(
  JSON.stringify(
    {
      ...snapshot,
      liveGate: {
        canRunLive: preflight.liveGate.canRunLive,
        blockers: preflight.liveGate.blockers,
      },
      provider: {
        providerId: preflight.provider.providerId,
        model: preflight.provider.model,
        keyConfigured: preflight.provider.keyConfigured,
      },
      dryRun,
    },
    null,
    2,
  ),
)

if (!snapshot.patternAtRequiredVersion) {
  console.error("BLOCKED: all Patterns must be version 1.3.0")
  process.exit(2)
}

if (dryRun) {
  console.log(
    "\nPREPARE-ONLY: zero Groq calls. After chat authorization for LOT 19J, set env flags and run: npm run eval:fabric:19j",
  )
  process.exit(0)
}

assertLot19jNotAutoRun(process.env.FABRIC_EVAL_CONFIRM_19J)

if (!preflight.liveGate.canRunLive) {
  console.error("LIVE blocked:", preflight.liveGate.blockers.join(" | "))
  process.exit(2)
}
if (preflight.provider.providerId.toLowerCase() !== "groq") {
  console.error("Provider must be groq")
  process.exit(2)
}
if (preflight.provider.model !== "openai/gpt-oss-120b") {
  console.error("Model must be openai/gpt-oss-120b")
  process.exit(2)
}
if (!preflight.provider.keyConfigured) {
  console.error("BLOCKED: AI_API_KEY not configured")
  process.exit(2)
}

const report = await runLot19aEvaluation({
  mode: "live",
  scenarios: LOT19J_DATASET,
  scenarioIds: [...LOT19J_CAMPAIGN.scenarioIds],
  campaignId: LOT19J_CAMPAIGN.id,
  maxLiveCalls: LOT19J_CAMPAIGN.maxHttpAttempts,
  maxEstimatedUsd: LOT19J_CAMPAIGN.maxEstimatedUsd,
  projectedUsdPerScenario: LOT19J_CAMPAIGN.projectedUsdPerScenario,
  minSpacingMs: LOT19J_CAMPAIGN.minSpacingMs,
  tpmLimit: LOT19J_CAMPAIGN.tpmLimit,
  backoff: LOT19J_CAMPAIGN.backoff,
})

const traces = buildTraceRecords(report.results, report.provider.model)
const paths = persistLot19dArtifacts({
  campaignId: LOT19J_CAMPAIGN.id,
  report,
  traces,
  outputDir: LOT19J_CAMPAIGN.outputDir,
})

/** Extra per-scenario business annotations for the 19J report. */
const scenarioExtras = report.results.map((r) => {
  const out = r.validatedOutput
  const extras = {
    id: r.scenario.id,
    patternId: r.scenario.patternId,
    version: r.patternVersion,
    technicalStatus:
      r.errorCode === "not_run"
        ? "NOT_RUN"
        : r.deterministic.allRequiredPassed
          ? "PASS"
          : "FAIL",
    httpAttempts: r.httpAttempts ?? 0,
    latencyMs: r.deterministic.latencyMs,
    usage: r.usage,
    costUsd:
      r.usage != null
        ? estimateCostUsd(
            {
              inputChars: 0,
              outputChars: 0,
              estimatedInputTokens: r.usage.promptTokens,
              estimatedOutputTokens: r.usage.completionTokens,
              estimatedTotalTokens: r.usage.totalTokens,
            },
            "groq",
            {
              inputTokens: r.usage.promptTokens,
              outputTokens: r.usage.completionTokens,
              cachedInputTokens: r.usage.cachedTokens,
            },
          ).estimatedUsd
        : null,
    zodOk: r.deterministic.checks.some((c) => c.id === "zod_ok" && c.pass) ||
      (r.errorCode === "not_run" ? null : r.deterministic.runOk),
    anomalies: /** @type {string[]} */ ([]),
  }
  if (r.errorCode && r.errorCode !== "not_run") extras.anomalies.push(`${r.errorCode}: ${r.errorMessage ?? ""}`)
  if (r.scenario.patternId === "generate_scorecard_draft" && out && typeof out === "object") {
    const data = /** @type {Record<string, unknown>} */ (out)
    if (data.status === "draft_suggestion" && Array.isArray(data.questions)) {
      const hit = findOffTopicContactQuestions(
        String(/** @type {{description?: string}} */ (r.syntheticInput)?.description ?? ""),
        /** @type {Array<{title?: string, type?: string}>} */ (data.questions),
      )
      if (hit) extras.anomalies.push(`contact:${hit}`)
    }
    if (r.scenario.expectations.mustClarify && data.status !== "needs_clarification") {
      extras.anomalies.push("expected_needs_clarification")
    }
  }
  if (r.scenario.patternId === "generate_action_plan" && out && typeof out === "object") {
    const claim = findGuaranteedPercentClaims(/** @type {any} */ (out))
    if (claim) extras.anomalies.push(`guaranteed_pct:${claim}`)
    if (r.scenario.expectations.mustRequireArbitration) {
      const data = /** @type {{requiresArbitration?: boolean}} */ (out)
      if (!data.requiresArbitration) extras.anomalies.push("expected_requiresArbitration")
    }
  }
  return extras
})

mkdirSync(paths.dir, { recursive: true })
const extrasPath = join(paths.dir, "lot19j-scenario-extras.json")
writeFileSync(extrasPath, JSON.stringify(scenarioExtras, null, 2), "utf8")

for (const path of [...Object.values(paths), extrasPath]) {
  if (typeof path !== "string" || path === paths.dir) continue
  const blob = readFileSync(path, "utf8")
  if (containsForbiddenSecrets(blob)) {
    console.error("SECRET LEAK DETECTED in", path)
    process.exit(3)
  }
}

const pass = scenarioExtras.filter((s) => s.technicalStatus === "PASS").length
const fail = scenarioExtras.filter((s) => s.technicalStatus === "FAIL").length
const notRun = scenarioExtras.filter((s) => s.technicalStatus === "NOT_RUN").length

console.log("\n=== LOT 19J LIVE summary ===")
console.log(
  JSON.stringify(
    {
      campaignId: report.campaignId,
      versionRequired: LOT19J_CAMPAIGN.patternVersionRequired,
      technical: { pass, fail, notRun },
      httpAttempts: report.summary.actualLlmCalls,
      httpCeiling: LOT19J_CAMPAIGN.maxHttpAttempts,
      estimatedCostUsd: report.summary.estimatedCostUsd,
      budgetUsd: report.budget.estimatedUsd,
      costCeiling: LOT19J_CAMPAIGN.maxEstimatedUsd,
      stopReason: report.budget.stopReason ?? null,
      scoringIntegrityFail: report.summary.scoringIntegrityFail,
      artifacts: { ...paths, extrasPath },
      HUMAN_REVIEW: "PENDING",
      BUSINESS_REVIEW: "PENDING",
    },
    null,
    2,
  ),
)
console.log(`\nWrote artifacts under ${paths.dir}`)

