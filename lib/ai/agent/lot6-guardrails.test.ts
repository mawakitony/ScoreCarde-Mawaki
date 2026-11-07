import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { assistantModeSchema } from "./schemas.ts"
import { can } from "../../auth/permissions.ts"

test("assistant default UI mode is prepare and tab switch does not call apply", () => {
  const source = readFileSync(new URL("../../../components/assistant/assistant-view.tsx", import.meta.url), "utf8")
  assert.match(source, /useState<AssistantMode>\("prepare"\)/)
  assert.match(source, /setMode\(item\.id\)/)
  assert.doesNotMatch(source, /onClick=\{\(\) => \{\s*setMode\([^)]+\);\s*void apply/)
  assert.equal(assistantModeSchema.parse("prepare"), "prepare")
})

test("billing manage stays owner-only; view is owner/admin/analyst", () => {
  assert.equal(can({ role: "owner" }, "billing.manage"), true)
  assert.equal(can({ role: "admin" }, "billing.manage"), false)
  assert.equal(can({ role: "admin" }, "billing.view"), true)
  assert.equal(can({ role: "analyst" }, "billing.view"), true)
  assert.equal(can({ role: "viewer" }, "billing.view"), false)
  assert.equal(can({ role: "viewer" }, "billing.manage"), false)
})

test("builder setup landing and lead remount on revision after sync", () => {
  const shell = readFileSync(new URL("../../../components/scorecard-builder/builder-shell.tsx", import.meta.url), "utf8")
  assert.match(shell, /key=\{`\$\{bundle\.scorecard\.id\}-setup-\$\{revision\}`\}/)
  assert.match(shell, /key=\{`\$\{bundle\.scorecard\.id\}-landing-\$\{revision\}`\}/)
  assert.match(shell, /key=\{`\$\{bundle\.scorecard\.id\}-lead-\$\{revision\}`\}/)
  assert.match(shell, /revision=\{revision\}/)
})
