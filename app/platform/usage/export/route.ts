import { requirePlatformAdmin } from "@/lib/platform/auth"
import { toCsv } from "@/lib/leads/csv"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const admin = createAdminClient()
  let request = admin
    .from("usage_counters")
    .select("organization_id, metric, period_start, value")
    .order("period_start", { ascending: false })
    .limit(2000)
  if (supportScope) request = request.eq("organization_id", supportScope.organizationId)
  const { data } = await request
  const csv = toCsv(
    ["organization_id", "metric", "period_start", "value"],
    (data ?? []).map((row) => [row.organization_id, row.metric, row.period_start, row.value]),
  )
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=usage.csv" },
  })
}
