import assert from "node:assert/strict"
import test from "node:test"
import { scorecardBarPercent } from "./scorecard-bars.ts"
import { funnelRates } from "../leads/metrics.ts"

test("funnel zero step renders zero-width bar", () => {
  assert.equal(scorecardBarPercent(0, 120), 0)
})

test("funnel max step is full width", () => {
  assert.equal(scorecardBarPercent(120, 120), 100)
})

test("funnel rates preserve real step-to-step conversion", () => {
  const rates = funnelRates([100, 50, 25, 0, 0])
  assert.equal(rates[0]!.rate, null)
  assert.equal(rates[1]!.rate, 50)
  assert.equal(rates[2]!.rate, 50)
  assert.equal(rates[3]!.rate, 0)
  assert.equal(rates[4]!.count, 0)
})

test("empty funnel has no fake maximum", () => {
  const values = [0, 0, 0, 0, 0]
  const max = Math.max(...values, 0)
  assert.equal(max, 0)
  assert.equal(scorecardBarPercent(0, max), 0)
})
