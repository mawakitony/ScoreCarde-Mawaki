/**
 * LOT 19B mini LIVE campaign — requires fresh human authorization.
 * Max 12 HTTP attempts (retries included). 9 synthetic scenarios.
 */
import { writeFileSync } from "node:fs"
import { runLot19aEvaluation, preflightDiagnostic } from "../lib/ai/fabric-prototype/eval/harness.ts"
import {
  LOT19B_MINI_CAMPAIGN,
  assertMiniCampaignNotAutoRun,
} from "../lib/ai/fabric-prototype/eval/mini-campaign.ts"

assertMiniCampaignNotAutoRun(process.env.FABRIC_EVAL_CONFIRM_19B)

const preflight = preflightDiagnostic()
console.log("=== LOT 19B mini preflight ===")
console.log(JSON.stringify({
  campaign: LOT19B_MINI_CAMPAIGN.id,
  providerId: preflight.provider.providerId,
  model: preflight.provider.model,
  keyConfigured: preflight.provider.keyConfigured,
  canRunLive: preflight.liveGate.canRunLive,
  blockers: preflight.liveGate.blockers,
  maxCalls: LOT19B_MINI_CAMPAIGN.maxCalls,
  scenarioIds: LOT19B_MINI_CAMPAIGN.scenarioIds,
  pricing: preflight.pricingSnapshot,
}, null, 2))

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

const report = await runLot19aEvaluation({
  mode: "live",
  scenarioIds: LOT19B_MINI_CAMPAIGN.scenarioIds,
  maxLiveCalls: LOT19B_MINI_CAMPAIGN.maxCalls,
  minSpacingMs: LOT19B_MINI_CAMPAIGN.minSpacingMs,
  backoff: LOT19B_MINI_CAMPAIGN.backoff,
})
report.campaignId = LOT19B_MINI_CAMPAIGN.id

const byPattern = {}
for (const item of report.results) {
  const id = item.scenario.patternId
  byPattern[id] ??= { pass: 0, fail: 0, total: 0 }
  byPattern[id].total += 1
  if (item.deterministic.allRequiredPassed) byPattern[id].pass += 1
  else byPattern[id].fail += 1
}

const slim = {
  campaignId: report.campaignId,
  mode: report.mode,
  startedAt: report.startedAt,
  finishedAt: report.finishedAt,
  provider: {
    providerId: report.provider.providerId,
    model: report.provider.model,
  },
  pricingSnapshot: report.pricingSnapshot,
  summary: report.summary,
  byPattern,
  budget: report.budget,
  integrationDecision: report.integrationDecision,
  stopReason: report.budget.stopReason,
  results: report.results.map((item) => ({
    id: item.scenario.id,
    patternId: item.scenario.patternId,
    category: item.scenario.expectations.category,
    pass: item.deterministic.allRequiredPassed,
    invokedLlm: item.invokedLlm,
    httpAttempts: item.httpAttempts ?? 0,
    latencyMs: item.deterministic.latencyMs,
    errorCode: item.errorCode,
    errorMessage: item.errorMessage?.slice(0, 240),
    failedChecks: item.deterministic.checks.filter((c) => !c.pass).map((c) => c.id),
    scoringIntegrity: item.deterministic.checks.find((c) => c.id === "scoring_integrity")?.pass ?? null,
  })),
}

console.log("\n=== LOT 19B mini summary ===")
console.log(JSON.stringify(slim, null, 2))

const outPath = process.argv.find((a) => a.startsWith("--out="))?.slice(6) || "tmp/lot19b-mini-live-report.json"
writeFileSync(outPath, JSON.stringify({ slim, full: report }, null, 2), "utf8")
console.log(`\nWrote ${outPath}`)
