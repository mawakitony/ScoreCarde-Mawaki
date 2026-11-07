import { planFromPriceId, type BillingInterval, type PlanId } from "./plans"
import type { SubscriptionStatus } from "./entitlements"

export type BillingSnapshot = {
  plan: PlanId
  status: SubscriptionStatus
  billingInterval: BillingInterval
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  trialEnd: string | null
  pastDueAt: string | null
  customerId: string | null
  subscriptionId: string | null
}

export type AppliedStripeEvent =
  | { id: string; type: "checkout.session.completed"; organizationId: string; customerId: string | null; subscriptionId: string | null }
  | {
      id: string
      type: "customer.subscription.created" | "customer.subscription.updated"
      organizationId: string
      customerId: string | null
      subscriptionId: string
      stripeStatus: string
      priceId: string | null
      cancelAtPeriodEnd: boolean
      periodStart: string | null
      periodEnd: string | null
      trialEnd: string | null
    }
  | { id: string; type: "customer.subscription.deleted"; organizationId: string; periodEnd: string | null }
  | { id: string; type: "invoice.paid"; organizationId: string; customerId?: string | null; subscriptionId?: string | null }
  | { id: string; type: "invoice.payment_failed"; organizationId: string; at: string; customerId?: string | null; subscriptionId?: string | null }

const STRIPE_STATUS: Record<string, SubscriptionStatus> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "unpaid",
  incomplete: "incomplete",
  incomplete_expired: "incomplete",
  paused: "paused",
}

export function rememberStripeEvent(seen: ReadonlySet<string>, eventId: string) {
  if (seen.has(eventId)) return { duplicate: true as const, seen }
  const next = new Set(seen)
  next.add(eventId)
  return { duplicate: false as const, seen: next }
}

/**
 * Prefer the stronger subscription status when concurrent Stripe webhooks race
 * (Checkout + subscription.created + invoice.paid often arrive within the same second).
 */
export function preferBillingStatus(current: SubscriptionStatus, next: SubscriptionStatus): SubscriptionStatus {
  if (current === next) return next
  if (next === "canceled" || next === "unpaid") return next
  if (current === "active" && (next === "trialing" || next === "incomplete")) return current
  if (current === "past_due" && next === "trialing") return current
  return next
}

export function applyStripeEvent(current: BillingSnapshot, event: AppliedStripeEvent): BillingSnapshot {
  if (event.type === "checkout.session.completed") {
    // Paid Checkout must unlock the workspace even if subscription.created raced earlier/later.
    const paid = Boolean(event.subscriptionId)
    return {
      ...current,
      customerId: event.customerId ?? current.customerId,
      subscriptionId: event.subscriptionId ?? current.subscriptionId,
      status: paid ? preferBillingStatus(current.status, "active") : current.status,
      pastDueAt: paid ? null : current.pastDueAt,
      trialEnd: paid ? null : current.trialEnd,
    }
  }
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const mapped = planFromPriceId(event.priceId)
    const mappedStatus = STRIPE_STATUS[event.stripeStatus] ?? current.status
    const status = preferBillingStatus(current.status, mappedStatus)
    return {
      ...current,
      plan: mapped?.plan ?? current.plan,
      billingInterval: mapped?.interval ?? current.billingInterval,
      status,
      cancelAtPeriodEnd: event.cancelAtPeriodEnd,
      currentPeriodStart: event.periodStart,
      currentPeriodEnd: event.periodEnd,
      trialEnd: event.trialEnd,
      customerId: event.customerId ?? current.customerId,
      subscriptionId: event.subscriptionId ?? current.subscriptionId,
      pastDueAt: status === "past_due" ? current.pastDueAt : null,
    }
  }
  if (event.type === "customer.subscription.deleted") {
    return { ...current, status: "canceled", cancelAtPeriodEnd: true, currentPeriodEnd: event.periodEnd ?? current.currentPeriodEnd }
  }
  if (event.type === "invoice.paid") {
    const withIds = {
      ...current,
      customerId: event.customerId ?? current.customerId,
      subscriptionId: event.subscriptionId ?? current.subscriptionId,
    }
    if (
      current.status === "past_due" ||
      current.status === "unpaid" ||
      current.status === "incomplete" ||
      current.status === "trialing"
    ) {
      return { ...withIds, status: "active" as const, pastDueAt: null, trialEnd: null }
    }
    return withIds
  }
  if (event.type === "invoice.payment_failed") {
    return {
      ...current,
      status: "past_due",
      pastDueAt: current.pastDueAt ?? event.at,
      customerId: event.customerId ?? current.customerId,
      subscriptionId: event.subscriptionId ?? current.subscriptionId,
    }
  }
  return current
}
