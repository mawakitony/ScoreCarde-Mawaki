import assert from "node:assert/strict"
import test from "node:test"
import { competitionRanks, scorecardDetailHref } from "./scorecard-links.ts"
import { scorecardBarPercent, scorecardNameIsDuplicate } from "./scorecard-bars.ts"

test("scorecardDetailHref uses real id", () => {
  assert.equal(scorecardDetailHref("sc-1"), "/dashboard/scorecards/sc-1")
  assert.equal(scorecardDetailHref(""), null)
})

test("zero bar remains zero; max is full width", () => {
  assert.equal(scorecardBarPercent(0, 12), 0)
  assert.equal(scorecardBarPercent(12, 12), 100)
})

test("competition ranks do not invent order for ties", () => {
  assert.deepEqual(competitionRanks([10, 10, 5]), [1, 1, 3])
  assert.deepEqual(competitionRanks([8, 4, 4, 1]), [1, 2, 2, 4])
})

test("duplicate names keep distinct identity via id key", () => {
  assert.equal(scorecardNameIsDuplicate("Alpha", ["Alpha", "Alpha"]), true)
  assert.equal(scorecardDetailHref("id-a"), "/dashboard/scorecards/id-a")
  assert.equal(scorecardDetailHref("id-b"), "/dashboard/scorecards/id-b")
})
