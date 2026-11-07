import { requirePlatformAdmin } from "@/lib/platform/auth"
import { toCsv } from "@/lib/leads/csv"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const actor = await requirePlatformAdmin("platform.billing.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const admin = createAdminClient()
  let request = admin
    .from("subscriptions")
    .select("organization_id, plan, billing_interval, status, provider_customer_id, provider_subscription_id")
    .limit(1000)
  if (supportScope) request = request.eq("organization_id", supportScope.organizationId)
  const { data } = await request
  const csv = toCsv(
    ["organization_id", "plan", "interval", "status", "customer", "subscription"],
    (data ?? []).map((row) => [
      row.organization_id,
      row.plan,
      row.billing_interval,
      row.status,
      row.provider_customer_id,
      row.provider_subscription_id,
    ]),
  )
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=subscriptions.csv" },
  })
}
