import assert from "node:assert/strict"
import test from "node:test"
import { scorecardBarPercent, scorecardNameIsDuplicate } from "./scorecard-bars.ts"

test("zero leads never produce a fake progress bar", () => {
  assert.equal(scorecardBarPercent(0, 10), 0)
  assert.equal(scorecardBarPercent(0, 0), 0)
  assert.equal(scorecardBarPercent(-1, 5), 0)
})

test("bar percent scales from real max", () => {
  assert.equal(scorecardBarPercent(5, 10), 50)
  assert.equal(scorecardBarPercent(10, 10), 100)
  assert.ok(scorecardBarPercent(1, 100) > 0)
  assert.ok(scorecardBarPercent(1, 100) < 8)
})

test("duplicate scorecard names are detected without losing identity", () => {
  assert.equal(scorecardNameIsDuplicate("Alpha", ["Alpha", "Beta"]), false)
  assert.equal(scorecardNameIsDuplicate("Alpha", ["Alpha", "alpha", "Beta"]), true)
})
