import { expect, test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { e2eAdminClient, seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { stripeTestModeReady } from "../helpers/stripe-ready"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()
const stripe = stripeTestModeReady()
const skipReason = e2eIsolatedBlockReason() ?? "E2E isolation not ready"

/**
 * Controlled-clock trial lock: expire trial via subscription.trial_end in the past.
 * Does not wait 14 days. Does not mock Stripe Checkout as success.
 */
test.describe("SaaS trial lock (clocked)", () => {
  test.skip(!ready, `BLOCKED: ${skipReason}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(120_000)

  let fixtures: E2eFixtureBundle

  test.beforeAll(async () => {
    fixtures = await seedIsolatedFixtures()
  })

  test.afterAll(async () => {
    if (!ready || !fixtures) return
    const admin = e2eAdminClient()
    await admin.from("subscriptions").upsert(
      {
        organization_id: fixtures.organizationId,
        provider: "manual",
        plan: "pro",
        billing_interval: "monthly",
        status: "active",
        trial_end: null,
        current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      },
      { onConflict: "organization_id" },
    )
  })

  test("expired trial locks private pages and keeps billing reachable", async ({ page }) => {
    const admin = e2eAdminClient()
    await admin.from("subscriptions").upsert(
      {
        organization_id: fixtures.organizationId,
        provider: "manual",
        plan: "starter",
        billing_interval: "monthly",
        status: "trialing",
        trial_end: new Date(Date.now() - 60_000).toISOString(),
        current_period_end: null,
      },
      { onConflict: "organization_id" },
    )

    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/scorecards")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Activer mon abonnement" })).toBeVisible()

    await page.goto("/dashboard/leads")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toBeVisible()

    await page.goto(`/dashboard/scorecards/${fixtures.scorecardId}`)
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toBeVisible()

    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText("Abonnement actuel")).toBeVisible()
    await expect(page.getByText(/espace métier est en pause|essai/i).first()).toBeVisible()
  })

  test("reactivating subscription restores dashboard access", async ({ page }) => {
    const admin = e2eAdminClient()
    await admin.from("subscriptions").upsert(
      {
        organization_id: fixtures.organizationId,
        provider: "manual",
        plan: "starter",
        billing_interval: "monthly",
        status: "active",
        trial_end: null,
        current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      },
      { onConflict: "organization_id" },
    )

    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: /Bonjour|Bienvenue/ })).toBeVisible()
    await page.goto("/dashboard/scorecards")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toHaveCount(0)
  })

  test("Stripe test-mode keys are ready for Checkout E2E", async () => {
    test.skip(!stripe.ready, `BLOCKED: ${stripe.reason}`)
    // Live Checkout + webhook path is covered by saas-stripe.spec.ts when ready.
    expect(stripe.ready).toBe(true)
  })
})
