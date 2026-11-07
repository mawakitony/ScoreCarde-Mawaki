import assert from "node:assert/strict"
import test from "node:test"
import { forceLightPath } from "./paths.ts"

test("dashboard stays themeable", () => {
  assert.equal(forceLightPath("/dashboard"), false)
  assert.equal(forceLightPath("/dashboard/templates"), false)
  assert.equal(forceLightPath("/dashboard/scorecards/x/builder"), false)
})

test("public scoreapps and catalog demos force light", () => {
  assert.equal(forceLightPath("/theme-preview/digital-experience"), true)
  assert.equal(forceLightPath("/s/pmp-readiness"), true)
  assert.equal(forceLightPath("/r/token"), true)
  assert.equal(forceLightPath("/e2e/theme-preview-host.html"), true)
})
