import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import {
  humanizePlanArguments,
  presentReadResult,
  sanitizeAssistantMessage,
  toolLabel,
} from "./present.ts"

const view = readFileSync(new URL("../../../components/assistant/assistant-view.tsx", import.meta.url), "utf8")
const robot = readFileSync(new URL("../../../components/assistant/animated-ai-robot.tsx", import.meta.url), "utf8")
const runtime = readFileSync(new URL("./runtime.ts", import.meta.url), "utf8")
const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8")

test("LOT18 — conversational UX hides primary JSON dumps", () => {
  assert.match(view, /Voir les détails techniques/)
  assert.match(view, /assistant-technical-json/)
  assert.match(view, /presentReadResult/)
  assert.match(view, /humanizePlanArguments/)
  // Primary reads must not dump JSON.stringify(read.result) in a bare <pre>
  assert.doesNotMatch(view, /JSON\.stringify\(read\.result/)
  assert.doesNotMatch(view, /JSON\.stringify\(step\.arguments/)
})

test("LOT18 — plan confirmation controls remain", () => {
  assert.match(view, /data-testid="assistant-apply"/)
  assert.match(view, /data-testid="assistant-cancel"/)
  assert.match(view, /useState<AssistantMode>\("prepare"\)/)
  assert.match(view, /Confirmer/)
})

test("LOT18 — animated robot exposes required states", () => {
  for (const state of ["idle", "listening", "thinking", "responding", "success", "error"]) {
    assert.match(robot, new RegExp(`"${state}"`))
  }
  assert.match(robot, /data-testid="ai-robot"/)
  assert.match(robot, /reducedMotion/)
  assert.match(view, /AnimatedAiRobot/)
  assert.match(view, /robotState/)
})

test("LOT18 — reduced-motion CSS kills robot loops", () => {
  assert.match(css, /ai-robot\[data-reduced="true"\]/)
  assert.match(css, /ai-robot--thinking/)
  assert.match(css, /ai-robot--success/)
  assert.match(css, /ai-robot--error/)
})

test("LOT18 — system prompt asks for natural user-facing messages", () => {
  assert.match(runtime, /copilote IA/)
  assert.match(runtime, /jamais de JSON brut/)
  assert.match(runtime, /Ne prétends jamais/)
  assert.match(runtime, /sanitizeAssistantMessage/)
})

test("LOT18 — presentReadResult humanizes scorecard lists", () => {
  const presented = presentReadResult("list_scorecards", "Lister les scorecards disponibles", [
    { name: "Nouvelle Scorecard", status: "draft" },
    { name: "Digital Experience", status: "draft" },
  ])
  assert.equal(presented.count, 2)
  assert.ok(presented.lines.some((line) => line.includes("Nouvelle Scorecard") && line.includes("Brouillon")))
  assert.ok(!presented.lines.some((line) => line.includes('"status"')))
})

test("LOT18 — humanizePlanArguments uses real create_scorecard_draft fields only", () => {
  const rows = humanizePlanArguments("create_scorecard_draft", {
    name: "Nouvelle Scorecard",
    language: "fr",
    category: "Évaluation",
    questions: [{ title: "Q1" }, { title: "Q2" }],
  })
  assert.deepEqual(
    rows.map((row) => row.label),
    ["Nom", "Langue", "Catégorie", "Statut", "Questions"],
  )
  assert.equal(rows.find((row) => row.label === "Langue")?.value, "Français")
  assert.equal(rows.find((row) => row.label === "Statut")?.value, "Brouillon")
  assert.equal(rows.find((row) => row.label === "Questions")?.value, "2")
})

test("LOT18 — sanitizeAssistantMessage unwraps accidental JSON envelopes", () => {
  assert.equal(
    sanitizeAssistantMessage('{"message":"Bien sûr, je peux vous aider.","tools":[]}'),
    "Bien sûr, je peux vous aider.",
  )
  assert.equal(sanitizeAssistantMessage("Réponse claire."), "Réponse claire.")
})

test("LOT18 — tool labels stay human", () => {
  assert.equal(toolLabel("create_scorecard_draft"), "Créer une scorecard brouillon")
  assert.equal(toolLabel("list_scorecards"), "Lister les scorecards")
})

test("LOT18 — SUCCESS flash only after apply path in view", () => {
  assert.match(view, /pulseFlash\("success"\)/)
  const applyBlock = view.slice(view.indexOf("async function apply"), view.indexOf("const workspaceEmpty"))
  assert.match(applyBlock, /pulseFlash\("success"\)/)
  assert.doesNotMatch(
    view.slice(view.indexOf("async function send"), view.indexOf("async function apply")),
    /pulseFlash\("success"\)/,
  )
})
