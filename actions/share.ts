"use server"

import { ensureMembership } from "@/lib/data/membership"
import { getAppUrl } from "@/lib/env"
import { scorecardShareTarget } from "@/lib/share/scorecard"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type ShareTarget = ReturnType<typeof scorecardShareTarget>

export type ScorecardShareResult =
  | { ok: false; error: string }
  | ({ ok: true } & Extract<ShareTarget, { shareable: false }>)
  | ({ ok: true } & Extract<ShareTarget, { shareable: true }>)

const refused = { ok: false as const, error: "Impossible de préparer le partage." }

export async function loadScorecardShare(scorecardId: string): Promise<ScorecardShareResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scorecardId)) return refused
  const membership = await ensureMembership()
  if (!membership) return refused
  const supabase = await createClient()
  const selected = await supabase
    .from("scorecards")
    .select("id, name, slug, status")
    .eq("id", scorecardId)
    .eq("organization_id", membership.organization.id)
    .maybeSingle()
  if (selected.error || !selected.data) return refused
  const domain = await verifiedDomain(membership.organization.id)
  const target = scorecardShareTarget({
    appUrl: getAppUrl(),
    slug: selected.data.slug,
    name: selected.data.name,
    status: selected.data.status,
    organizationId: membership.organization.id,
    domain,
  })
  if (!target.shareable) return { ok: true, shareable: false, message: target.message }
  return { ok: true, ...target }
}

async function verifiedDomain(organizationId: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("custom_domains")
      .select("domain, status, organization_id")
      .eq("organization_id", organizationId)
      .eq("status", "verified")
      .limit(1)
      .maybeSingle()
    if (!data || data.organization_id !== organizationId || data.status !== "verified") return null
    return { domain: data.domain, organizationId: data.organization_id, status: data.status }
  } catch {
    return null
  }
}
