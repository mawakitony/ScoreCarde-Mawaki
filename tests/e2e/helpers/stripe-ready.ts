/**
 * Honest Stripe E2E readiness. Never treat missing keys as a green path.
 * Live keys always block.
 */
export function stripeTestModeReady(env: Record<string, string | undefined> = process.env): {
  ready: boolean
  reason: string | null
} {
  const secret = env.STRIPE_SECRET_KEY?.trim()
  const webhook = env.STRIPE_WEBHOOK_SECRET?.trim()
  const publishable = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  const starter = env.STRIPE_PRICE_STARTER_MONTHLY?.trim()
  if (secret?.startsWith("sk_live_")) {
    return { ready: false, reason: "STRIPE_SECRET_KEY is live — blocked" }
  }
  if (publishable?.startsWith("pk_live_")) {
    return { ready: false, reason: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is live — blocked" }
  }
  if (!secret?.startsWith("sk_test_")) {
    return { ready: false, reason: "STRIPE_SECRET_KEY missing or not sk_test_" }
  }
  if (!webhook?.startsWith("whsec_")) {
    return { ready: false, reason: "STRIPE_WEBHOOK_SECRET missing" }
  }
  if (!publishable?.startsWith("pk_test_")) {
    return { ready: false, reason: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing or not pk_test_" }
  }
  if (!starter?.startsWith("price_")) {
    return { ready: false, reason: "STRIPE_PRICE_STARTER_MONTHLY missing" }
  }
  return { ready: true, reason: null }
}
