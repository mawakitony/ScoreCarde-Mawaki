import assert from "node:assert/strict"
import test from "node:test"
import { getOrganizationAccessState } from "./entitlements.ts"
import {
  formatTrialDaysLabel,
  isBillingExemptPath,
  isTrialActiveAt,
  isWorkspaceLocked,
  isWorkspaceOperational,
  trialDaysRemaining,
  TRIAL_EXPIRED_MESSAGE,
} from "./workspace-access-policy.ts"
import { DEFAULT_TRIAL_DAYS, GRACE_PERIOD_DAYS } from "./plans.ts"

const DAY = 24 * 60 * 60 * 1000

test("workspace lock policy: restricted/suspended lock; grace stays operational", () => {
  assert.equal(isWorkspaceLocked("restricted"), true)
  assert.equal(isWorkspaceLocked("suspended"), true)
  assert.equal(isWorkspaceLocked("active"), false)
  assert.equal(isWorkspaceLocked("grace_period"), false)
  assert.equal(isWorkspaceOperational("grace_period"), true)
  assert.equal(isWorkspaceOperational("restricted"), false)
})

test("billing exempt paths allow portal/checkout while locked", () => {
  assert.equal(isBillingExemptPath("/dashboard/settings/billing"), true)
  assert.equal(isBillingExemptPath("/dashboard/settings/billing?checkout=return"), true)
  assert.equal(isBillingExemptPath("/dashboard/billing/required"), true)
  assert.equal(isBillingExemptPath("/dashboard"), false)
  assert.equal(isBillingExemptPath("/dashboard/scorecards"), false)
  assert.equal(isBillingExemptPath("/dashboard/settings/organization"), false)
  assert.equal(isBillingExemptPath("/dashboard/settings/team"), false)
})

test("14-day trial: day 13 active, exact trialEnd boundary expires", () => {
  const started = Date.parse("2026-01-01T00:00:00.000Z")
  const trialEnd = new Date(started + DEFAULT_TRIAL_DAYS * DAY).toISOString()
  const day13 = started + 13 * DAY
  const atEnd = Date.parse(trialEnd)
  const afterEnd = atEnd + 1

  assert.equal(isTrialActiveAt(trialEnd, day13), true)
  assert.equal(isTrialActiveAt(trialEnd, atEnd - 1), true)
  assert.equal(isTrialActiveAt(trialEnd, atEnd), false)
  assert.equal(isTrialActiveAt(trialEnd, afterEnd), false)

  const active = getOrganizationAccessState(
    {
      plan: "starter",
      status: "trialing",
      trialEnd,
      currentPeriodEnd: null,
      pastDueAt: null,
      cancelAtPeriodEnd: false,
    },
    day13,
  )
  assert.equal(active.access, "active")
  assert.equal(isWorkspaceLocked(active.access), false)

  const expired = getOrganizationAccessState(
    {
      plan: "starter",
      status: "trialing",
      trialEnd,
      currentPeriodEnd: null,
      pastDueAt: null,
      cancelAtPeriodEnd: false,
    },
    afterEnd,
  )
  assert.equal(expired.access, "restricted")
  assert.equal(isWorkspaceLocked(expired.access), true)
})

test("paid active restores access; canceled keeps access until period end", () => {
  const now = Date.parse("2026-09-22T00:00:00.000Z")
  const paid = getOrganizationAccessState(
    {
      plan: "starter",
      status: "active",
      trialEnd: null,
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      pastDueAt: null,
      cancelAtPeriodEnd: false,
    },
    now,
  )
  assert.equal(paid.access, "active")

  const canceledStillPaid = getOrganizationAccessState(
    {
      plan: "pro",
      status: "canceled",
      trialEnd: null,
      currentPeriodEnd: "2026-10-01T00:00:00.000Z",
      pastDueAt: null,
      cancelAtPeriodEnd: true,
    },
    now,
  )
  assert.equal(canceledStillPaid.access, "active")

  const canceledExpired = getOrganizationAccessState(
    {
      plan: "pro",
      status: "canceled",
      trialEnd: null,
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
      pastDueAt: null,
      cancelAtPeriodEnd: true,
    },
    now,
  )
  assert.equal(canceledExpired.access, "restricted")
})

test("trial expired message is the product copy", () => {
  assert.match(TRIAL_EXPIRED_MESSAGE, /14 jours/)
  assert.match(TRIAL_EXPIRED_MESSAGE, /abonnement mensuel/i)
})

test("renaming org fields is orthogonal to trial timestamps (contract note)", () => {
  // saveOrganization must never write trial_used_at / trial_end — covered by action comments + DB columns
  // remaining independent: access state depends only on subscription view.
  const view = {
    plan: "starter" as const,
    status: "trialing" as const,
    trialEnd: "2026-09-01T00:00:00.000Z",
    currentPeriodEnd: null,
    pastDueAt: null,
    cancelAtPeriodEnd: false,
  }
  const before = getOrganizationAccessState(view, Date.parse("2026-09-22T00:00:00.000Z"))
  const afterRename = getOrganizationAccessState(view, Date.parse("2026-09-22T00:00:00.000Z"))
  assert.deepEqual(before, afterRename)
  assert.equal(before.access, "restricted")
})

test("past_due stays grace_period for 7 days then locks", () => {
  const pastDueAt = Date.parse("2026-09-01T00:00:00.000Z")
  const insideGrace = pastDueAt + (GRACE_PERIOD_DAYS - 1) * DAY
  const afterGrace = pastDueAt + GRACE_PERIOD_DAYS * DAY + 1
  const view = {
    plan: "pro" as const,
    status: "past_due" as const,
    trialEnd: null,
    currentPeriodEnd: "2026-09-01T00:00:00.000Z",
    pastDueAt: new Date(pastDueAt).toISOString(),
    cancelAtPeriodEnd: false,
  }
  const grace = getOrganizationAccessState(view, insideGrace)
  assert.equal(grace.access, "grace_period")
  assert.equal(isWorkspaceLocked(grace.access), false)
  const locked = getOrganizationAccessState(view, afterGrace)
  assert.equal(locked.access, "restricted")
  assert.equal(isWorkspaceLocked(locked.access), true)
})

test("unpaid and incomplete lock immediately; cancel at period end then restrict", () => {
  const now = Date.parse("2026-09-22T00:00:00.000Z")
  for (const status of ["unpaid", "incomplete", "paused"] as const) {
    const state = getOrganizationAccessState(
      {
        plan: "starter",
        status,
        trialEnd: null,
        currentPeriodEnd: "2026-10-01T00:00:00.000Z",
        pastDueAt: null,
        cancelAtPeriodEnd: false,
      },
      now,
    )
    assert.equal(state.access, "restricted", status)
  }
})

test("trialDaysRemaining uses controlled clock without waiting 14 days", () => {
  const trialEnd = "2026-01-15T00:00:00.000Z"
  const start = Date.parse("2026-01-01T00:00:00.000Z")
  assert.equal(trialDaysRemaining(trialEnd, start), 14)
  assert.equal(trialDaysRemaining(trialEnd, start + 13 * DAY), 1)
  assert.equal(trialDaysRemaining(trialEnd, Date.parse(trialEnd)), 0)
  assert.equal(trialDaysRemaining(null, start), null)
  assert.equal(formatTrialDaysLabel(14), "14 jours d'essai restants")
  assert.equal(formatTrialDaysLabel(1), "1 jour d'essai restant")
  assert.equal(formatTrialDaysLabel(0), "Essai terminé")
})
