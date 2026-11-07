import assert from "node:assert/strict"
import test from "node:test"
import { stripeTestModeReady } from "./stripe-ready.ts"

test("stripeTestModeReady rejects live and missing keys", () => {
  assert.equal(stripeTestModeReady({}).ready, false)
  assert.match(stripeTestModeReady({}).reason ?? "", /STRIPE_SECRET_KEY/)
  assert.equal(
    stripeTestModeReady({ STRIPE_SECRET_KEY: "sk_live_x" }).ready,
    false,
  )
  assert.equal(
    stripeTestModeReady({
      STRIPE_SECRET_KEY: "sk_test_x",
      STRIPE_WEBHOOK_SECRET: "whsec_x",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_x",
      STRIPE_PRICE_STARTER_MONTHLY: "price_x",
    }).ready,
    true,
  )
})
