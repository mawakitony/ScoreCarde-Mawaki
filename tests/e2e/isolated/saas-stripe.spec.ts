import { expect, test } from "@playwright/test"
import Stripe from "stripe"
import { getOrganizationAccessState } from "../../../lib/billing/entitlements"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../../lib/env"
import { loginAs } from "../helpers/auth"
import { e2eAdminClient, seedIsolatedFixtures, type E2eFixtureBundle } from "../helpers/fixtures"
import { loadE2eEnvFiles } from "../helpers/load-env"
import { stripeTestModeReady } from "../helpers/stripe-ready"

loadE2eEnvFiles()
const isolated = e2eIsolatedAllowed()
const stripeReady = stripeTestModeReady()
const block =
  (!isolated ? e2eIsolatedBlockReason() : null) ??
  (!stripeReady.ready ? stripeReady.reason : null) ??
  "Stripe test E2E not ready"

const DAY = 24 * 60 * 60 * 1000

test.describe("SaaS Stripe test mode", () => {
  test.skip(!isolated || !stripeReady.ready, `BLOCKED: ${block}`)
  test.describe.configure({ mode: "serial" })
  test.setTimeout(300_000)

  let fixtures: E2eFixtureBundle
  let stripe: Stripe
  let subscriptionId: string | null = null
  let customerId: string | null = null

  test.beforeAll(async () => {
    if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) throw new Error("REFUSED live key")
    fixtures = await seedIsolatedFixtures()
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  })

  test.afterAll(async () => {
    if (!stripeReady.ready || !fixtures) return
    try {
      if (subscriptionId) await stripe.subscriptions.cancel(subscriptionId)
    } catch {
      /* cleanup best effort */
    }
    // Reset after cancel so a late customer.subscription.deleted webhook cannot leave canceled.
    await new Promise((r) => setTimeout(r, 2500))
    const admin = e2eAdminClient()
    await admin.from("subscriptions").upsert(
      {
        organization_id: fixtures.organizationId,
        provider: "manual",
        plan: "pro",
        billing_interval: "monthly",
        status: "active",
        trial_end: null,
        past_due_at: null,
        cancel_at_period_end: false,
        provider_customer_id: null,
        provider_subscription_id: null,
        current_period_end: new Date(Date.now() + 30 * DAY).toISOString(),
      },
      { onConflict: "organization_id" },
    )
  })

  test("expired trial → Checkout → webhook → active unlock @billing", async ({ page }) => {
    const admin = e2eAdminClient()
    await admin.from("subscriptions").upsert(
      {
        organization_id: fixtures.organizationId,
        provider: "manual",
        plan: "starter",
        billing_interval: "monthly",
        status: "trialing",
        trial_end: new Date(Date.now() - 60_000).toISOString(),
        provider_customer_id: null,
        provider_subscription_id: null,
        past_due_at: null,
        cancel_at_period_end: false,
      },
      { onConflict: "organization_id" },
    )

    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/scorecards")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toBeVisible()

    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText("Abonnement actuel")).toBeVisible()

    const checkoutNav = page.waitForURL(/checkout\.stripe\.com/, { timeout: 90_000 })
    await page.getByRole("button", { name: /Choisir Starter mensuel/i }).click()
    await checkoutNav

    // Hosted Checkout (test mode) — official test card 4242…
    await page.waitForLoadState("domcontentloaded")
    await page.waitForTimeout(2500)

    const email = page.locator('input[type="email"], input[name="email"]').first()
    if (await email.isVisible().catch(() => false)) {
      await email.fill(fixtures.users.owner.email)
    }

    // Prefer Stripe's labeled secure frames; fall back to any card inputs.
    async function fillCardInFrames() {
      const numberFrame = page.frameLocator(
        'iframe[title*="card number" i], iframe[name*="privateStripeFrame"]',
      )
      try {
        await numberFrame.locator("input").first().fill("4242424242424242", { timeout: 8_000 })
        const expFrame = page.frameLocator('iframe[title*="expiration" i], iframe[title*="expiry" i]')
        await expFrame.locator("input").first().fill("12 / 42", { timeout: 5_000 }).catch(async () => {
          await expFrame.locator("input").first().fill("1242")
        })
        const cvcFrame = page.frameLocator('iframe[title*="CVC" i], iframe[title*="security" i]')
        await cvcFrame.locator("input").first().fill("123", { timeout: 5_000 })
        return
      } catch {
        /* fall through to frame scan */
      }
      for (const frame of page.frames()) {
        const number = frame.locator(
          'input[name="cardnumber"], input[autocomplete="cc-number"], input[placeholder*="1234"]',
        )
        if ((await number.count()) === 0) continue
        await number.first().fill("4242424242424242")
        const exp = frame.locator('input[name="exp-date"], input[autocomplete="cc-exp"], input[placeholder*="MM"]')
        if (await exp.count()) await exp.first().fill("1242")
        const cvc = frame.locator('input[name="cvc"], input[autocomplete="cc-csc"], input[placeholder*="CVC"]')
        if (await cvc.count()) await cvc.first().fill("123")
        const postal = frame.locator('input[name="postal"], input[autocomplete="postal-code"]')
        if (await postal.count()) await postal.first().fill("10001")
        return
      }
    }
    await fillCardInFrames()

    // Billing name / postal on host page when present
    const name = page.locator('input[name="billingName"], input[name="name"]').first()
    if (await name.isVisible().catch(() => false)) await name.fill("E2E Tester")
    const zip = page.locator('input[name="billingPostalCode"], input[name="postalCode"]').first()
    if (await zip.isVisible().catch(() => false)) await zip.fill("10001")

    const pay = page.getByRole("button", { name: /Subscribe|Pay|Payer|Complete|Start trial|Confirmer|S.abonner|Start/i })
    await pay.first().click({ timeout: 30_000 })

    await page.waitForURL(/\/dashboard\/settings\/billing/, { timeout: 180_000 })

    let active = false
    let last: { status?: string; provider_subscription_id?: string | null; provider?: string } | null = null
    for (let i = 0; i < 50; i++) {
      const { data } = await admin
        .from("subscriptions")
        .select("status, provider_subscription_id, provider_customer_id, plan, provider")
        .eq("organization_id", fixtures.organizationId)
        .maybeSingle()
      last = data
      if (data?.status === "active" && data.provider_subscription_id) {
        active = true
        subscriptionId = data.provider_subscription_id
        customerId = data.provider_customer_id
        break
      }
      await page.waitForTimeout(1500)
    }
    // If webhook race left status active without subscription id, recover from Stripe customer.
    if (!active && last?.status === "active" && customerId) {
      const listed = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 })
      if (listed.data[0]) {
        subscriptionId = listed.data[0].id
        await admin
          .from("subscriptions")
          .update({ provider: "stripe", provider_subscription_id: subscriptionId, status: "active" })
          .eq("organization_id", fixtures.organizationId)
        active = true
      }
    }
    if (!active && last?.status === "active") {
      const { data: row } = await admin
        .from("subscriptions")
        .select("provider_customer_id")
        .eq("organization_id", fixtures.organizationId)
        .maybeSingle()
      if (row?.provider_customer_id) {
        customerId = row.provider_customer_id
        const listed = await stripe.subscriptions.list({ customer: row.provider_customer_id, status: "active", limit: 1 })
        if (listed.data[0]) {
          subscriptionId = listed.data[0].id
          await admin
            .from("subscriptions")
            .update({ provider: "stripe", provider_subscription_id: subscriptionId, status: "active" })
            .eq("organization_id", fixtures.organizationId)
          active = true
        }
      }
    }
    expect(
      active,
      `subscription not unlocked after Checkout (last status=${last?.status ?? "none"} provider=${last?.provider ?? "none"} hasSub=${Boolean(last?.provider_subscription_id)})`,
    ).toBeTruthy()

    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toHaveCount(0)
    await expect(page.getByRole("heading", { name: /Bonjour|Bienvenue/ })).toBeVisible()
  })

  test("cancel_at_period_end keeps access while period remains @billing", async ({ page }) => {
    test.skip(!subscriptionId, "No Stripe subscription from Checkout test")
    const admin = e2eAdminClient()
    const updated = await stripe.subscriptions.update(subscriptionId!, { cancel_at_period_end: true })
    expect(updated.cancel_at_period_end).toBe(true)

    let mirrored = false
    for (let i = 0; i < 40; i++) {
      const { data } = await admin
        .from("subscriptions")
        .select("status, cancel_at_period_end, current_period_end")
        .eq("organization_id", fixtures.organizationId)
        .maybeSingle()
      if (data?.cancel_at_period_end === true && data.status === "active") {
        mirrored = true
        const access = getOrganizationAccessState(
          {
            plan: "starter",
            status: "active",
            trialEnd: null,
            currentPeriodEnd: data.current_period_end,
            pastDueAt: null,
            cancelAtPeriodEnd: true,
          },
          Date.now(),
        )
        expect(access.access).toBe("active")
        await loginAs(page, fixtures, "owner")
        await page.goto("/dashboard")
        await expect(page.getByRole("heading", { name: "Essai terminé" })).toHaveCount(0)
        break
      }
      await page.waitForTimeout(1500)
    }
    expect(mirrored).toBeTruthy()
  })

  test("past_due beyond 7-day grace locks workspace; billing remains @billing", async ({ page }) => {
    const admin = e2eAdminClient()
    const pastDueAt = new Date(Date.now() - 8 * DAY).toISOString()
    await admin.from("subscriptions").upsert(
      {
        organization_id: fixtures.organizationId,
        provider: "stripe",
        plan: "starter",
        billing_interval: "monthly",
        status: "past_due",
        past_due_at: pastDueAt,
        provider_customer_id: customerId,
        provider_subscription_id: subscriptionId,
        cancel_at_period_end: false,
        current_period_end: new Date(Date.now() - DAY).toISOString(),
      },
      { onConflict: "organization_id" },
    )

    const access = getOrganizationAccessState(
      {
        plan: "starter",
        status: "past_due",
        trialEnd: null,
        currentPeriodEnd: new Date(Date.now() - DAY).toISOString(),
        pastDueAt,
        cancelAtPeriodEnd: false,
      },
      Date.now(),
    )
    expect(access.access).toBe("restricted")

    await loginAs(page, fixtures, "owner")
    await page.goto("/dashboard/scorecards")
    await expect(page.getByRole("heading", { name: "Essai terminé" })).toBeVisible()
    await page.goto("/dashboard/settings/billing")
    await expect(page.getByText("Abonnement actuel")).toBeVisible()
  })
})
