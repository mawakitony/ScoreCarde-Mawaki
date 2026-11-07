import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { attachMixPercents, buildSubscriptionMix, mixTotal } from "@/lib/platform/mix"

describe("subscription mix percentages", () => {
  it("gives 50/50 for two equal slices", () => {
    const mix = buildSubscriptionMix({
      trialing: 1,
      activePaid: 1,
      pastDue: 0,
      canceled: 0,
      suspended: 0,
      expired: 0,
    })
    assert.equal(mixTotal(mix), 2)
    assert.deepEqual(
      mix.map((row) => ({ id: row.id, value: row.value, percent: row.percent })),
      [
        { id: "trialing", value: 1, percent: 50 },
        { id: "active", value: 1, percent: 50 },
      ],
    )
  })

  it("never reports 5% when only two of twenty are active statuses — canceled must appear", () => {
    const mix = buildSubscriptionMix({
      trialing: 1,
      activePaid: 1,
      pastDue: 0,
      canceled: 18,
      suspended: 0,
      expired: 0,
    })
    assert.equal(mixTotal(mix), 20)
    const trial = mix.find((row) => row.id === "trialing")
    const active = mix.find((row) => row.id === "active")
    const canceled = mix.find((row) => row.id === "canceled")
    assert.equal(trial?.percent, 5)
    assert.equal(active?.percent, 5)
    assert.equal(canceled?.percent, 90)
    assert.equal(mix.reduce((sum, row) => sum + (row.percent ?? 0), 0), 100)
  })

  it("largest-remainder percentages always sum to 100", () => {
    const mix = attachMixPercents([
      { id: "a", label: "A", value: 1, tone: "#000" },
      { id: "b", label: "B", value: 1, tone: "#111" },
      { id: "c", label: "C", value: 1, tone: "#222" },
    ])
    assert.equal(mix.reduce((sum, row) => sum + (row.percent ?? 0), 0), 100)
  })
})
