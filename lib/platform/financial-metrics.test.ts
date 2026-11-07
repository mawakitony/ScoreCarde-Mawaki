import assert from "node:assert/strict"
import test from "node:test"
import {
  cataloguePrice,
  computeCohortTrialConversion,
  computeLegacyHybridRates,
  computePeriodLogoChurn,
  formatCalculableMrr,
  formatMetricRate,
  partitionActivePaidMrr,
} from "./financial-metrics.ts"

const NOW = Date.parse("2026-10-28T21:00:00.000Z")

test("cataloguePrice never invents null-priced plans", () => {
  assert.equal(cataloguePrice("starter", "monthly")?.amountCents, 1000)
  assert.equal(cataloguePrice("pro", "monthly"), null)
  assert.equal(cataloguePrice("enterprise", "yearly"), null)
})

test("partitionActivePaidMrr keeps unknown prices out of revenue", () => {
  const part = partitionActivePaidMrr([
    { plan: "starter", status: "active", billing_interval: "monthly", organization_id: "a" },
    { plan: "pro", status: "active", billing_interval: "monthly", organization_id: "b", provider: "manual" },
    { plan: "starter", status: "trialing", billing_interval: "monthly", organization_id: "c" },
    { plan: "internal", status: "active", organization_id: "d" },
  ])
  assert.equal(part.includedActivePaid, 1)
  assert.equal(part.undeterminedActivePaid, 1)
  assert.deepEqual(part.undeterminedPlans, ["pro"])
  assert.equal(part.byCurrency[0]?.mrrCents, 1000)
  assert.equal(part.undetermined[0]?.reason.includes("non compté"), true)
  assert.equal(formatCalculableMrr(part.byCurrency, part.undeterminedActivePaid), "10.00 USD")
})

test("MRR with only undetermined actives is not shown as 0 dollars", () => {
  const part = partitionActivePaidMrr([
    { plan: "pro", status: "active", billing_interval: "monthly", organization_id: "b", provider: "manual" },
  ])
  assert.equal(part.includedActivePaid, 0)
  assert.equal(part.undeterminedActivePaid, 1)
  assert.deepEqual(part.byCurrency, [])
  assert.equal(formatCalculableMrr(part.byCurrency, part.undeterminedActivePaid), "Données insuffisantes")
})

test("cohort trial conversion requires closed trials in the window", () => {
  const open = computeCohortTrialConversion(
    [{ plan: "starter", status: "trialing", trial_end: "2026-11-11T00:00:00.000Z", created_at: "2026-10-28T00:00:00.000Z" }],
    30,
    NOW,
  )
  assert.equal(open.availability, "insufficient")
  assert.equal(open.rate, null)
  assert.equal(formatMetricRate(open), "Données insuffisantes")

  const closed = computeCohortTrialConversion(
    [
      { plan: "starter", status: "active", trial_end: "2026-10-20T00:00:00.000Z", organization_id: "1" },
      { plan: "starter", status: "canceled", trial_end: "2026-10-15T00:00:00.000Z", organization_id: "2" },
      { plan: "starter", status: "trialing", trial_end: "2026-11-01T00:00:00.000Z", organization_id: "3" },
    ],
    30,
    NOW,
  )
  assert.equal(closed.availability, "ok")
  assert.equal(closed.numerator, 1)
  assert.equal(closed.denominator, 2)
  assert.equal(closed.rate, 0.5)
})

test("period logo churn uses distinct paid orgs and paid cancel metadata", () => {
  const formula = computePeriodLogoChurn(
    [
      { organization_id: "stay", plan: "starter", status: "active", created_at: "2026-09-01T00:00:00.000Z" },
      { organization_id: "new", plan: "starter", status: "active", created_at: "2026-10-20T00:00:00.000Z" },
    ],
    [
      {
        action: "subscription.canceled",
        organization_id: "gone",
        created_at: "2026-10-10T00:00:00.000Z",
        metadata: { plan: "starter" },
      },
      {
        action: "subscription.canceled",
        organization_id: "gone",
        created_at: "2026-10-11T00:00:00.000Z",
        metadata: { plan: "starter" },
      },
      {
        action: "subscription.canceled",
        organization_id: "freebie",
        created_at: "2026-10-12T00:00:00.000Z",
        metadata: { plan: "free" },
      },
    ],
    30,
    NOW,
  )
  assert.equal(formula.availability, "ok")
  assert.equal(formula.numerator, 1)
  assert.equal(formula.denominator, 2) // stay + gone
  assert.equal(formula.rate, 0.5)
})

test("legacy hybrid remains available for audit and is marked deprecated", () => {
  const legacy = computeLegacyHybridRates(
    [
      { plan: "starter", status: "trialing" },
      { plan: "starter", status: "active" },
    ],
    14,
    7,
    30,
  )
  assert.match(legacy.conversion.note, /DEPRECATED/)
  assert.match(legacy.churn.note, /DEPRECATED/)
  assert.equal(legacy.conversion.rate, 14 / 15)
  assert.equal(legacy.churn.rate, 7 / 8)
})
