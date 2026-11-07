/**
 * LOT 19D qualitative LIVE campaign — requires fresh human authorization.
 * 12 synthetic scenarios, max 16 HTTP attempts (retries included).
 * DO NOT run without FABRIC_EVAL_CONFIRM_19D=I_AUTHORIZE_LOT19D_LIVE + chat approval.
 */
import {
  runLot19aEvaluation,
  preflightDiagnostic,
} from "../lib/ai/fabric-prototype/eval/harness.ts"
import {
  LOT19D_CAMPAIGN,
  assertLot19dNotAutoRun,
  lot19dPreflightSnapshot,
} from "../lib/ai/fabric-prototype/eval/lot19d-campaign.ts"
import { LOT19D_DATASET } from "../lib/ai/fabric-prototype/eval/lot19d-dataset.ts"
import {
  buildTraceRecords,
  persistLot19dArtifacts,
  containsForbiddenSecrets,
} from "../lib/ai/fabric-prototype/eval/persistence.ts"

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--prepare-only")
const snapshot = lot19dPreflightSnapshot()
const preflight = preflightDiagnostic()

console.log("=== LOT 19D preflight ===")
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

if (dryRun) {
  console.log(
    "\nPREPARE-ONLY: no LIVE calls. After explicit chat authorization, set FABRIC_EVAL_CONFIRM_19D=I_AUTHORIZE_LOT19D_LIVE and run without --dry-run.",
  )
  process.exit(0)
}

assertLot19dNotAutoRun(process.env.FABRIC_EVAL_CONFIRM_19D)

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
if (!snapshot.patternsAtRequiredVersion) {
  console.error("Patterns must be version 1.2.0 before LIVE")
  process.exit(2)
}

const report = await runLot19aEvaluation({
  mode: "live",
  scenarios: LOT19D_DATASET,
  scenarioIds: LOT19D_CAMPAIGN.scenarioIds,
  campaignId: LOT19D_CAMPAIGN.id,
  maxLiveCalls: LOT19D_CAMPAIGN.maxHttpAttempts,
  minSpacingMs: LOT19D_CAMPAIGN.minSpacingMs,
  backoff: LOT19D_CAMPAIGN.backoff,
})

const traces = buildTraceRecords(report.results, report.provider.model)
const paths = persistLot19dArtifacts({
  campaignId: LOT19D_CAMPAIGN.id,
  report,
  traces,
  outputDir: LOT19D_CAMPAIGN.outputDir,
})

for (const path of Object.values(paths)) {
  if (typeof path !== "string" || path === paths.dir) continue
  const { readFileSync } = await import("node:fs")
  const blob = readFileSync(path, "utf8")
  if (containsForbiddenSecrets(blob)) {
    console.error("SECRET LEAK DETECTED in", path)
    process.exit(3)
  }
}

console.log("\n=== LOT 19D LIVE summary ===")
console.log(
  JSON.stringify(
    {
      campaignId: report.campaignId,
      summary: report.summary,
      integrationDecision: report.integrationDecision,
      stopReason: report.budget.stopReason,
      artifacts: paths,
    },
    null,
    2,
  ),
)
console.log(`\nWrote artifacts under ${paths.dir}`)
