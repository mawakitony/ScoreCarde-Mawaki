import { NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/platform/auth"
import { createAdminClient } from "@/lib/supabase/admin"

function csvEscape(value: string | null | undefined) {
  const raw = String(value ?? "")
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`
  return raw
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin("platform.organizations.read")
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
  ].map(csvEscape)

  const body = `${headers.join(",")}\n${row.join(",")}\n`
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="org-${org.slug}.csv"`,
    },
  })
}
