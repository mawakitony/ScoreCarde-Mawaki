/**
 * LOT 19M — targeted LIVE retest (draft/plan 1.3.1, analyze 1.3.0).
 *
 * Default: dry-run / prepare-only — ZERO Groq calls.
 * LIVE requires:
 *   1) Explicit chat authorization for LOT 19M
 *   2) FABRIC_EVAL_CONFIRM_19M=I_AUTHORIZE_LOT19M_LIVE
 *   3) FABRIC_PROTOTYPE_ENABLED=1 + FABRIC_PROTOTYPE_LIVE=1 + FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM
 *   4) CLI flag --execute-live (env alone is NOT enough)
 *
 * Prior LOT 19J/19F confirm values do NOT authorize this campaign.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import {
  runLot19aEvaluation,
  preflightDiagnostic,
} from "../lib/ai/fabric-prototype/eval/harness.ts"
import {
  LOT19M_CAMPAIGN,
  assertLot19mLiveScriptReady,
  lot19mPreflightSnapshot,
} from "../lib/ai/fabric-prototype/eval/lot19m-campaign.ts"
import { LOT19M_DATASET } from "../lib/ai/fabric-prototype/eval/lot19m-dataset.ts"
import { validateLot19mScenario } from "../lib/ai/fabric-prototype/eval/lot19m-validators.ts"
import { scoreDeterministic } from "../lib/ai/fabric-prototype/eval/deterministic-scorer.ts"
import {
  buildTraceRecords,
  persistLot19dArtifacts,
  containsForbiddenSecrets,
  resolveEvalArtifactDir,
} from "../lib/ai/fabric-prototype/eval/persistence.ts"
import { runFabricPattern } from "../lib/ai/fabric-prototype/runner.ts"
import { createMockLlmAdapter } from "../lib/ai/fabric-prototype/llm-adapter.ts"

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

const wantExecuteLive = process.argv.includes("--execute-live")
const dryRun =
  !wantExecuteLive ||
  process.argv.includes("--dry-run") ||
  process.argv.includes("--prepare-only")

const snapshot = lot19mPreflightSnapshot()
const preflight = preflightDiagnostic()

console.log("=== LOT 19M preflight (offline) ===")
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
      wantExecuteLive,
      note: "Default mode is dry-run. LIVE requires --execute-live + FABRIC_EVAL_CONFIRM_19M + chat auth.",
    },
    null,
    2,
  ),
)

// Flags must be OFF during dry-run/prep. For authorized --execute-live they must be ON
// (assertLot19mLiveScriptReady / live gate). Do not treat "flags ON" as a LIVE blocker.
const prepBlockersForMode = dryRun
  ? snapshot.prepBlockers
  : snapshot.prepBlockers.filter(
      (b) => !/Fabric LIVE flags ON during preparation/i.test(b),
    )
if (prepBlockersForMode.length > 0) {
  console.error("PREFLIGHT BLOCKED:", prepBlockersForMode.join(" | "))
  process.exit(2)
}

if (!snapshot.versionsMatch.all) {
  console.error("VERSIONS mismatch vs LOT 19M required", snapshot.versionsRequired)
  process.exit(2)
}

const artifactDir = resolveEvalArtifactDir(process.cwd(), LOT19M_CAMPAIGN.outputDir, "tmp")
mkdirSync(artifactDir, { recursive: true })

if (dryRun) {
  // Mock pass over all 8 scenarios — zero HTTP.
  const mockAdapter = createMockLlmAdapter()
  const mockValidations = []
  for (const scenario of LOT19M_DATASET) {
    const result = await runFabricPattern(scenario.patternId, scenario.input, {
      allowInTests: true,
      adapter: mockAdapter,
    })
    const det = scoreDeterministic(scenario, result)
    mockValidations.push(validateLot19mScenario(scenario, result, det))
  }
  const mockPath = join(artifactDir, "lot19m-dry-run-mock-validations.json")
  writeFileSync(mockPath, JSON.stringify({ dryRun: true, httpCalls: 0, mockValidations }, null, 2), "utf8")
  if (containsForbiddenSecrets(readFileSync(mockPath, "utf8"))) {
    console.error("SECRET LEAK in dry-run artifact")
    process.exit(3)
  }
  console.log(
    "\nDRY-RUN / PREPARE-ONLY: zero Groq calls. Mock validations written to",
    mockPath,
  )
  console.log(
    "To run LIVE later (after explicit chat authorization): set FABRIC_EVAL_CONFIRM_19M=I_AUTHORIZE_LOT19M_LIVE and flags, then: npm run eval:fabric:19m -- --execute-live",
  )
  process.exit(0)
}

// —— LIVE path (must not be used without chat auth + --execute-live + confirm env) ——
try {
  assertLot19mLiveScriptReady({
    executeLiveFlag: wantExecuteLive,
    confirmEnvValue: process.env.FABRIC_EVAL_CONFIRM_19M,
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
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
  scenarios: LOT19M_DATASET,
  scenarioIds: [...LOT19M_CAMPAIGN.scenarioIds],
  campaignId: LOT19M_CAMPAIGN.id,
  maxLiveCalls: LOT19M_CAMPAIGN.maxHttpAttempts,
  maxEstimatedUsd: LOT19M_CAMPAIGN.maxEstimatedUsd,
  projectedUsdPerScenario: LOT19M_CAMPAIGN.projectedUsdPerScenario,
  minSpacingMs: LOT19M_CAMPAIGN.minSpacingMs,
  tpmLimit: LOT19M_CAMPAIGN.tpmLimit,
  backoff: LOT19M_CAMPAIGN.backoff,
})

const validations = report.results.map((r) => {
  const scenario = LOT19M_DATASET.find((s) => s.id === r.scenario.id)
  if (!scenario) return null
  const fakeResult = {
    ok: r.deterministic.runOk,
    patternId: r.scenario.patternId,
    version: r.patternVersion,
    data: r.validatedOutput,
    metrics: {
      ok: r.deterministic.runOk,
      patternId: r.scenario.patternId,
      patternVersion: r.patternVersion ?? "n/a",
      adapterId: "live",
      adapterMode: "live",
      latencyMs: r.deterministic.latencyMs,
      inputChars: r.deterministic.tokens.inputChars,
      outputChars: r.deterministic.tokens.outputChars,
    },
    error: r.errorCode ? { code: r.errorCode, message: r.errorMessage ?? "" } : undefined,
  }
  return validateLot19mScenario(scenario, /** @type {any} */ (fakeResult), r.deterministic)
})

const traces = buildTraceRecords(report.results, report.provider.model)
const paths = persistLot19dArtifacts({
  campaignId: LOT19M_CAMPAIGN.id,
  report,
  traces,
  outputDir: LOT19M_CAMPAIGN.outputDir,
})
const valPath = join(paths.dir, "lot19m-validations.json")
writeFileSync(valPath, JSON.stringify(validations, null, 2), "utf8")

for (const path of [...Object.values(paths), valPath]) {
  if (typeof path !== "string" || path === paths.dir) continue
  if (containsForbiddenSecrets(readFileSync(path, "utf8"))) {
    console.error("SECRET LEAK DETECTED in", path)
    process.exit(3)
  }
}

console.log("\n=== LOT 19M LIVE summary ===")
console.log(
  JSON.stringify(
    {
      campaignId: report.campaignId,
      summary: report.summary,
      budget: report.budget,
      stopReason: report.budget.stopReason ?? null,
      httpAttempts: report.summary.actualLlmCalls,
      httpCeiling: LOT19M_CAMPAIGN.maxHttpAttempts,
      costCeiling: LOT19M_CAMPAIGN.maxEstimatedUsd,
      artifacts: { ...paths, valPath },
      HUMAN_REVIEW: "PENDING",
    },
    null,
    2,
  ),
)
