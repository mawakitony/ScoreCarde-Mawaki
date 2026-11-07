import assert from "node:assert/strict"
import test from "node:test"
import { buildAnalyticsInsights } from "./insights.ts"

const empty = {
  current: { started: 0, completed: 0, cta_clicks: 0, leads: 0, hot_leads: 0 },
  previous: { started: 0, completed: 0, cta_clicks: 0, leads: 0 },
  scorecards: [],
  sources: [],
  result_distribution: [],
}

test("insufficient data yields no insights", () => {
  assert.deepEqual(buildAnalyticsInsights(empty), [])
})

test("low completion produces an attention insight", () => {
  const insights = buildAnalyticsInsights({
    ...empty,
    current: { started: 20, completed: 4, cta_clicks: 1, leads: 10, hot_leads: 1 },
    previous: { started: 10, completed: 5, cta_clicks: 1, leads: 5 },
  })
  assert.ok(insights.some((row) => row.id === "low-completion"))
})

test("dominant source is reported with real share", () => {
  const insights = buildAnalyticsInsights({
    ...empty,
    current: { started: 20, completed: 12, cta_clicks: 3, leads: 20, hot_leads: 4 },
    previous: { started: 15, completed: 9, cta_clicks: 2, leads: 12 },
    sources: [
      { name: "LinkedIn", leads: 14 },
      { name: "Email", leads: 6 },
    ],
  })
  const source = insights.find((row) => row.id === "dominant-source")
  assert.ok(source)
  assert.match(source!.observation, /LinkedIn/)
})
