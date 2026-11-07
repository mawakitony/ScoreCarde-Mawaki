import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import {
  CONVERSATIONAL_FIXTURES,
  assertNaturalAssistantCopy,
  fixtureClaimsWriteWithoutConfirmation,
} from "./conversational-fixtures.ts"
import { humanizePlanArguments, presentReadResult, sanitizeAssistantMessage } from "./present.ts"

const view = readFileSync(new URL("../../../components/assistant/assistant-view.tsx", import.meta.url), "utf8")
const robot = readFileSync(new URL("../../../components/assistant/animated-ai-robot.tsx", import.meta.url), "utf8")
const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8")
const qaHost = readFileSync(new URL("../../../public/e2e/assistant-robot-qa.html", import.meta.url), "utf8")

test("LOT18A — all six robot states have distinct CSS motion hooks", () => {
  for (const state of ["idle", "listening", "thinking", "responding", "success", "error"]) {
    assert.match(css, new RegExp(`ai-robot--${state}`))
    assert.match(robot, new RegExp(`"${state}"`))
    assert.match(qaHost, new RegExp(`ai-robot--\\$\\{state\\}|ai-robot--${state}`))
  }
  assert.match(qaHost, /\["idle", "listening", "thinking", "responding", "success", "error"\]/)
  assert.match(qaHost, /data-state="\$\{state\}"/)
  assert.match(css, /\.ai-robot-svg\.ai-robot--listening/)
  assert.match(css, /\.ai-robot-svg\.ai-robot--responding/)
  assert.match(css, /ai-robot-float/)
  assert.match(css, /ai-robot-blink/)
})

test("LOT18A — SUCCESS is gated; RESPONDING/ERROR flash from real outcomes", () => {
  assert.match(view, /pulseFlash\("responding"\)/)
  assert.match(view, /pulseFlash\("error"\)/)
  const apply = view.slice(view.indexOf("async function apply"), view.indexOf("const workspaceEmpty"))
  assert.match(apply, /pulseFlash\("success"\)/)
  assert.doesNotMatch(
    view.slice(view.indexOf("async function send"), view.indexOf("async function apply")),
    /pulseFlash\("success"\)/,
  )
})

test("LOT18A — live status announces responding + thinking", () => {
  assert.match(view, /Réponse en cours/)
  assert.match(view, /Analyse en cours/)
  assert.match(view, /aria-live="polite"/)
})

test("LOT18A — composer stays flex-safe on narrow viewports", () => {
  assert.match(view, /min-w-0 flex-1/)
  assert.match(view, /flex min-w-0 items-center gap-2/)
  assert.match(view, /flex flex-wrap gap-2 border-b/)
})

test("LOT18A — workspace keeps confirmation + collapsible tech details", () => {
  assert.match(view, /data-testid="assistant-apply"/)
  assert.match(view, /data-testid="assistant-cancel"/)
  assert.match(view, /Voir les détails techniques/)
  assert.doesNotMatch(view, /JSON\.stringify\(read\.result/)
})

test("LOT18A — simulated conversational fixtures stay natural", () => {
  assert.equal(CONVERSATIONAL_FIXTURES.length, 6)
  for (const turn of CONVERSATIONAL_FIXTURES) {
    assertNaturalAssistantCopy(turn.assistantMessage)
    assert.equal(fixtureClaimsWriteWithoutConfirmation(turn), false)
    const sanitized = sanitizeAssistantMessage(turn.assistantMessage)
    assert.equal(sanitized, turn.assistantMessage.trim())
  }
  const create = CONVERSATIONAL_FIXTURES.find((item) => item.user === "Créer une scorecard")
  assert.equal(create?.expectsClarification, true)
  assert.equal(create?.proposesWrite, false)

  const generate = CONVERSATIONAL_FIXTURES.find((item) => item.user.startsWith("Génère 10"))
  assert.equal(generate?.proposesWrite, true)
  assert.ok(generate?.planPreview?.facts.some((fact) => fact.label === "Questions" && fact.value === "10"))
})

test("LOT18A — fixture plan facts map through humanizePlanArguments", () => {
  const rows = humanizePlanArguments("create_scorecard_draft", {
    name: "Évaluation gestion de projet",
    language: "fr",
    category: "Évaluation",
    questions: Array.from({ length: 10 }, (_, i) => ({ title: `Q${i + 1}` })),
  })
  assert.equal(rows.find((row) => row.label === "Questions")?.value, "10")
  assert.equal(rows.find((row) => row.label === "Statut")?.value, "Brouillon")
})

test("LOT18A — analysis fixture reads stay human in presentReadResult", () => {
  const presented = presentReadResult("get_dashboard_metrics", "Indicateurs des 30 derniers jours", {
    leads: 42,
    completions: 18,
    conversionRate: "12%",
  })
  assert.ok(presented.lines.some((line) => line.includes("leads")))
  assert.ok(!presented.lines.some((line) => line.includes('{"')))
})

test("LOT18A — reduced-motion keeps robot static", () => {
  assert.match(css, /ai-robot\[data-reduced="true"\]/)
  assert.match(robot, /reducedMotion/)
  assert.match(qaHost, /prefers-reduced-motion/)
})
