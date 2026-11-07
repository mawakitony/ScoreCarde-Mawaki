import assert from "node:assert/strict"
import test from "node:test"
import { buildKpiSnapshot, completionRate, progressPercent } from "./kpis.ts"

test("completion rate is zero when nothing started", () => {
  assert.equal(completionRate(0, 5), 0)
  assert.equal(completionRate(10, 5), 50)
})

test("progress percent never invents a stub for zero", () => {
  assert.equal(progressPercent(0, 100), 0)
  assert.equal(progressPercent(50, 100), 50)
  assert.equal(progressPercent(12, 0), 0)
})

test("kpi snapshot exposes deltas without fabricating trends", () => {
  const snap = buildKpiSnapshot(
    {
      leads: 20,
      new_leads: 8,
      page_views: 100,
      started: 40,
      captured: 20,
      completed: 20,
      viewed: 18,
      cta_clicks: 4,
      average_score: 72,
      hot_leads: 5,
    },
    {
      leads: 10,
      new_leads: 4,
      page_views: 80,
      started: 20,
      captured: 10,
      completed: 10,
      viewed: 9,
      cta_clicks: 2,
      average_score: 70,
      hot_leads: 2,
    },
  )
  assert.equal(snap.completion.value, 50)
  assert.equal(snap.leads.value, 20)
  assert.ok(snap.leads.delta !== null)
})
