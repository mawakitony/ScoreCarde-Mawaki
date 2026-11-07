import { test } from "@playwright/test"
import { loadE2eEnvFiles } from "./helpers/load-env"
import { stripeTestModeReady } from "./helpers/stripe-ready"

loadE2eEnvFiles()
const stripe = stripeTestModeReady()

test.skip(
  true,
  `BLOCKED: Stripe Checkout/webhook E2E not executed. ${stripe.reason ?? "Configure sk_test_ + prices + isolated Supabase, then move coverage into tests/e2e/isolated/saas-trial-lock.spec.ts"}`,
)
test("checkout webhook changes the plan @billing", async () => {})
