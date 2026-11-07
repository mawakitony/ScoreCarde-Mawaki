import assert from "node:assert/strict"
import test from "node:test"
import { dashboardShortcutsForRole } from "./shortcuts.ts"

test("viewer shortcuts exclude scorecard creation", () => {
  const ids = dashboardShortcutsForRole("viewer").map((item) => item.id)
  assert.ok(!ids.includes("create-scorecard"))
  assert.ok(ids.includes("leads"))
  assert.ok(ids.includes("analytics"))
  assert.ok(ids.includes("templates"))
})

test("editor shortcuts include scorecard creation", () => {
  const ids = dashboardShortcutsForRole("editor").map((item) => item.id)
  assert.ok(ids.includes("create-scorecard"))
})

test("unknown role gets no permissioned shortcuts except public ones", () => {
  const ids = dashboardShortcutsForRole(null).map((item) => item.id)
  assert.deepEqual(ids, ["templates"])
})
