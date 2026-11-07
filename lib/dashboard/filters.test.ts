import assert from "node:assert/strict"
import test from "node:test"
import { resolveRange } from "../analytics/range.ts"

test("dashboard period filters resolve to real windows", () => {
  const today = resolveRange({ range: "today" })
  const week = resolveRange({ range: "7d" })
  const month = resolveRange({ range: "30d" })
  const quarter = resolveRange({ range: "90d" })
  assert.equal(today.key, "today")
  assert.equal(week.key, "7d")
  assert.equal(month.key, "30d")
  assert.equal(quarter.key, "90d")
  assert.ok(week.from < week.to)
  assert.ok(month.from.getTime() <= week.from.getTime())
})

test("custom period requires valid from/to or falls back", () => {
  const ok = resolveRange({ range: "custom", from: "2026-01-01", to: "2026-01-31" })
  assert.equal(ok.key, "custom")
  assert.equal(ok.fromInput, "2026-01-01")
  const bad = resolveRange({ range: "custom", from: "nope", to: "nope" })
  assert.equal(bad.key, "30d")
})
