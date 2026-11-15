import { NextResponse } from "next/server"
import { toCsv } from "@/lib/leads/csv"
import { requirePlatformAdminApi } from "@/lib/platform/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdminApi("platform.organizations.read")
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { id } = await context.params
  const admin = createAdminClient()
  const { data: org } = await admin
    .from("organizations")
    .select(
      "id, name, slug, country, city, sector, sector_other, headcount_band, currency, default_language, timezone, website, primary_objective, referral_source, profile_completed_at, created_at",
    )
    .eq("id", id)
    .maybeSingle()
  if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const { data: sensitive } = await admin
    .from("organization_sensitive")
    .select("phone_e164, legal_id, legal_id_type")
    .eq("organization_id", id)
    .maybeSingle()

  const headers = [
    "id",
    "name",
    "slug",
    "country",
    "city",
    "sector",
    "sector_other",
    "headcount_band",
    "currency",
    "language",
    "timezone",
    "website",
    "primary_objective",
    "referral_source",
    "phone_e164",
    "legal_id",
    "legal_id_type",
    "profile_completed_at",
    "created_at",
  ]
  const row = [
    org.id,
    org.name,
    org.slug,
    org.country,
    org.city,
    org.sector,
    org.sector_other,
    org.headcount_band,
    org.currency,
    org.default_language,
    org.timezone,
    org.website,
    org.primary_objective,
    org.referral_source,
    sensitive?.phone_e164,
    sensitive?.legal_id,
    sensitive?.legal_id_type,
    org.profile_completed_at,
    org.created_at,
  ]

  const body = toCsv(headers, [row])
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="org-${org.slug}.csv"`,
    },
  })
}
