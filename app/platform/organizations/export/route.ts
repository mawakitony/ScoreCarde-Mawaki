import { requirePlatformAdmin } from "@/lib/platform/auth"
import { toCsv } from "@/lib/leads/csv"
import { getActiveSupportScope } from "@/lib/platform/support-scope"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const actor = await requirePlatformAdmin("platform.organizations.read")
  const supportScope = await getActiveSupportScope(actor.userId)
  const admin = createAdminClient()
  let request = admin.from("organizations").select("name, slug, country, created_at").order("created_at", { ascending: false }).limit(1000)
  if (supportScope) request = request.eq("id", supportScope.organizationId)
  const { data } = await request
  const csv = toCsv(["name", "slug", "country", "created_at"], (data ?? []).map((row) => [row.name, row.slug, row.country, row.created_at]))
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=organizations.csv" } })
}
