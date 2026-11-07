import assert from "node:assert/strict"
import test from "node:test"
import { readSidebarCollapsed, writeSidebarCollapsed } from "./sidebar.ts"

test("sidebar collapsed persistence round-trip", () => {
  assert.equal(readSidebarCollapsed(null), false)
  assert.equal(readSidebarCollapsed("0"), false)
  assert.equal(readSidebarCollapsed("1"), true)
  assert.equal(readSidebarCollapsed("true"), true)
  assert.equal(writeSidebarCollapsed(true), "1")
  assert.equal(writeSidebarCollapsed(false), "0")
  assert.equal(readSidebarCollapsed(writeSidebarCollapsed(true)), true)
})
