/**
 * LOT 19A evaluation CLI — default MOCK (no paid calls).
 *
 * LIVE requires ALL of:
 *   FABRIC_PROTOTYPE_ENABLED=1
 *   FABRIC_PROTOTYPE_LIVE=1
 *   FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM
 * plus an explicit human go-ahead outside this file.
 *
 * Usage:
 *   node --experimental-strip-types --import ./test/register.mjs scripts/lot19a-eval.mjs
 *   node ... scripts/lot19a-eval.mjs --mode=live   # blocked unless gates pass
 */
import { writeFileSync } from "node:fs"
import { preflightDiagnostic, runLot19aEvaluation } from "../lib/ai/fabric-prototype/eval/harness.ts"

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="))
const mode = modeArg?.split("=")[1] === "live" ? "live" : "mock"
const outArg = process.argv.find((arg) => arg.startsWith("--out="))
const outPath = outArg?.slice("--out=".length)

const preflight = preflightDiagnostic()
console.log("=== LOT 19A preflight ===")
console.log(JSON.stringify({
  providerId: preflight.provider.providerId,
  model: preflight.provider.model,
  providerConfigured: preflight.provider.providerConfigured,
  keyConfigured: preflight.provider.keyConfigured,
  liveGate: {
    canRunLive: preflight.liveGate.canRunLive,
    blockers: preflight.liveGate.blockers,
    budget: preflight.liveGate.budget,
  },
  dataset: preflight.dataset,
  costNote: preflight.costNote.note,
}, null, 2))

if (mode === "live" && !preflight.liveGate.canRunLive) {
  console.error("\nLIVE blocked. Refusing to spend API credits.")
  console.error("Blockers:", preflight.liveGate.blockers.join(" | "))
  process.exit(2)
}

const report = await runLot19aEvaluation({ mode })
const slim = {
  mode: report.mode,
  startedAt: report.startedAt,
  finishedAt: report.finishedAt,
  provider: {
    providerId: report.provider.providerId,
    model: report.provider.model,
    configured: report.provider.providerConfigured,
  },
  pricingSnapshot: report.pricingSnapshot,
  summary: report.summary,
  budget: report.budget,
  assistantBenchmark: report.assistantBenchmark,
  integrationDecision: report.integrationDecision,
  results: report.results.map((item) => ({
    id: item.scenario.id,
    patternId: item.scenario.patternId,
    pass: item.deterministic.allRequiredPassed,
    invokedLlm: item.invokedLlm,
    latencyMs: item.deterministic.latencyMs,
    tokensEstimate: item.deterministic.tokens.estimatedTotalTokens,
    errorCode: item.errorCode,
    failedChecks: item.deterministic.checks.filter((check) => !check.pass).map((check) => check.id),
  })),
}

console.log("\n=== LOT 19A summary ===")
console.log(JSON.stringify(slim, null, 2))

if (outPath) {
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8")
  console.log(`\nWrote full report to ${outPath}`)
}
