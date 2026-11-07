/**
 * LOT 19F — targeted LIVE retest for generate_action_plan.
 * Dry-run by default path: npm run eval:fabric:19f:prepare
 * LIVE requires FABRIC_EVAL_CONFIRM_19F=I_AUTHORIZE_LOT19F_LIVE + explicit chat authorization.
 */
import {
  runLot19aEvaluation,
  preflightDiagnostic,
} from "../lib/ai/fabric-prototype/eval/harness.ts"
import {
  LOT19F_CAMPAIGN,
  assertLot19fNotAutoRun,
  lot19fPreflightSnapshot,
} from "../lib/ai/fabric-prototype/eval/lot19f-campaign.ts"
import { LOT19F_DATASET } from "../lib/ai/fabric-prototype/eval/lot19f-dataset.ts"
import {
  buildTraceRecords,
  persistLot19dArtifacts,
  containsForbiddenSecrets,
} from "../lib/ai/fabric-prototype/eval/persistence.ts"
import { readFileSync } from "node:fs"

const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--prepare-only")
const snapshot = lot19fPreflightSnapshot()
const preflight = preflightDiagnostic()

console.log("=== LOT 19F preflight ===")
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
    "\nPREPARE-ONLY: zero Groq calls. After explicit chat authorization for LOT 19F LIVE, set FABRIC_EVAL_CONFIRM_19F=I_AUTHORIZE_LOT19F_LIVE and run: npm run eval:fabric:19f",
  )
  process.exit(0)
}

assertLot19fNotAutoRun(process.env.FABRIC_EVAL_CONFIRM_19F)

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
if (!snapshot.patternAtRequiredVersion) {
  console.error("generate_action_plan must be version 1.2.1")
  process.exit(2)
}

const report = await runLot19aEvaluation({
  mode: "live",
  scenarios: LOT19F_DATASET,
  scenarioIds: [...LOT19F_CAMPAIGN.scenarioIds],
  campaignId: LOT19F_CAMPAIGN.id,
  maxLiveCalls: LOT19F_CAMPAIGN.maxHttpAttempts,
  minSpacingMs: LOT19F_CAMPAIGN.minSpacingMs,
  tpmLimit: LOT19F_CAMPAIGN.tpmLimit,
  backoff: LOT19F_CAMPAIGN.backoff,
})

const traces = buildTraceRecords(report.results, report.provider.model)
const paths = persistLot19dArtifacts({
  campaignId: LOT19F_CAMPAIGN.id,
  report,
  traces,
  outputDir: LOT19F_CAMPAIGN.outputDir,
})

for (const path of Object.values(paths)) {
  if (typeof path !== "string" || path === paths.dir) continue
  const blob = readFileSync(path, "utf8")
  if (containsForbiddenSecrets(blob)) {
    console.error("SECRET LEAK DETECTED in", path)
    process.exit(3)
  }
}

console.log("\n=== LOT 19F LIVE summary ===")
console.log(
  JSON.stringify(
    {
      campaignId: report.campaignId,
      summary: report.summary,
      stopReason: report.budget.stopReason,
      artifacts: paths,
    },
    null,
    2,
  ),
)
console.log(`\nWrote artifacts under ${paths.dir}`)
