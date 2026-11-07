import assert from "node:assert/strict"
import test from "node:test"
import { isBrevoActivationFailure, isBrevoTransactionalConfigured } from "../email/brevo-ready.ts"
import { renderEmail } from "../email/templates.ts"
import { canPlatform, normalizePlatformRole } from "./permissions.ts"
import { TRIAL_REMINDER_OFFSETS } from "./reminder-policy.ts"
import { summarizeMrr } from "./rules.ts"
import { accessStateLabel, daysRemaining, subscriptionStatusLabel } from "./status-labels.ts"

test("trial reminder ladder covers J-7 J-3 J-1 J-0 without duplicate templates", () => {
  assert.deepEqual(
    TRIAL_REMINDER_OFFSETS.map((row) => row.days),
    [7, 3, 1, 0],
  )
  const templates = TRIAL_REMINDER_OFFSETS.map((row) => row.template)
  assert.equal(new Set(templates).size, templates.length)
})

test("subscription and access labels stay aligned with existing states", () => {
  assert.equal(subscriptionStatusLabel("trialing"), "Essai")
  assert.equal(subscriptionStatusLabel("past_due"), "En retard")
  assert.equal(accessStateLabel("grace_period", false), "En retard (grâce)")
  assert.equal(accessStateLabel("active", true), "Suspendu")
  assert.equal(accessStateLabel("restricted", false), "Expiré / restreint")
})

test("days remaining ceil from ISO deadlines", () => {
  const now = Date.parse("2026-10-28T12:00:00.000Z")
  assert.equal(daysRemaining("2026-10-30T00:00:00.000Z", now), 2)
  assert.equal(daysRemaining(null, now), null)
})

test("Brevo readiness helpers", () => {
  assert.equal(isBrevoActivationFailure("Unable to send email. Your SMTP account is not yet activated."), true)
  assert.equal(isBrevoActivationFailure("temporary network"), false)
  const before = process.env.BREVO_API_KEY
  const beforeSender = process.env.BREVO_SENDER_EMAIL
  delete process.env.BREVO_API_KEY
  delete process.env.BREVO_SENDER_EMAIL
  assert.equal(isBrevoTransactionalConfigured(), false)
  if (before !== undefined) process.env.BREVO_API_KEY = before
  if (beforeSender !== undefined) process.env.BREVO_SENDER_EMAIL = beforeSender
})

test("trial reminder templates include billing link when provided", () => {
  const rendered = renderEmail({
    template: "trial_ending_j7",
    locale: "fr",
    payload: { organizationName: "Atelier", date: "2026-11-01", billingUrl: "https://example.com/billing" },
  })
  assert.match(rendered.subject, /7 jours/i)
  assert.match(rendered.text, /Gérer la facturation/)
})

test("org owner string is not a privileged platform role", () => {
  assert.equal(normalizePlatformRole("owner"), "support")
  assert.equal(canPlatform({ role: "support" }, "platform.organizations.manage"), false)
  assert.equal(canPlatform({ role: "super_admin" }, "platform.organizations.manage"), true)
})

test("catalogue MRR must not be poisoned by null-priced active plans", () => {
  // summarizeMrr still nulls a bucket if null amountCents is fed — feeder must never do that.
  const ok = summarizeMrr([
    { currency: "usd", amountCents: 1000, interval: "monthly", plan: "starter", status: "active" },
  ])
  assert.equal(ok.find((row) => row.currency === "USD")?.mrrCents, 1000)

  const poisoned = summarizeMrr([
    { currency: "usd", amountCents: 1000, interval: "monthly", plan: "starter", status: "active" },
    { currency: "usd", amountCents: null, interval: "monthly", plan: "pro", status: "active" },
  ])
  assert.equal(poisoned.find((row) => row.currency === "USD")?.mrrCents, null)
})
