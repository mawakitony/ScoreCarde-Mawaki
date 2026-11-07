import assert from "node:assert/strict"
import test from "node:test"
import { chartBucketMode, parsePlatformRange } from "./range.ts"

test("parsePlatformRange defaults to 30 days", () => {
  assert.deepEqual(parsePlatformRange(undefined), { id: "30", days: 30 })
  assert.deepEqual(parsePlatformRange("nope"), { id: "30", days: 30 })
  assert.deepEqual(parsePlatformRange("7"), { id: "7", days: 7 })
  assert.deepEqual(parsePlatformRange("365"), { id: "365", days: 365 })
})

test("chartBucketMode switches to month for 12m", () => {
  assert.equal(chartBucketMode(30), "day")
  assert.equal(chartBucketMode(90), "day")
  assert.equal(chartBucketMode(365), "month")
})
