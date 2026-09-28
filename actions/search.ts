"use server"

import { normalizeAccessRole } from "@/lib/auth/permissions"
import { ensureMembership } from "@/lib/data/membership"
import {
  belongsToOrganization,
  displayEmail,
  isActiveLead,
  leadHref,
  leadMatches,
  limitHits,
  memberHref,
  memberMatches,
  planSearch,
  roleLabel,
  scorecardHref,
  scorecardMatches,
  searchAccess,
  statusLabel,
} from "@/lib/search/global"
import { createClient } from "@/lib/supabase/server"

export type SearchHit = { id: string; href: string; title: string; meta: string }

export type SearchResult = {
  ok: true
  skipped: boolean
  query: string
  scorecards: SearchHit[]
  leads: SearchHit[]
  members: SearchHit[]
} | { ok: false; error: string }

const empty = { scorecards: [] as SearchHit[], leads: [] as SearchHit[], members: [] as SearchHit[] }
const FETCH_CAP = 20

export async function searchWorkspace(query: string): Promise<SearchResult> {
  const plan = planSearch(typeof query === "string" ? query : "")
  if (!plan) return { ok: true, skipped: true, query: "", ...empty }
  const membership = await ensureMembership()
  if (!membership) return { ok: false, error: "Impossible d'effectuer la recherche. Réessayez." }
  const access = searchAccess(membership.role)
  const supabase = await createClient()
  const organizationId = membership.organization.id
  try {
    const [scorecards, leads, members] = await Promise.all([
      access.scorecards ? searchScorecards(supabase, organizationId, plan.term) : Promise.resolve([]),
      access.leads ? searchLeads(supabase, organizationId, plan.term, access.phone, access.fullEmail) : Promise.resolve([]),
      access.members ? searchMembers(supabase, organizationId, plan.term) : Promise.resolve([]),
    ])
    return { ok: true, skipped: false, query: plan.term, scorecards, leads, members }
  } catch {
    return { ok: false, error: "Impossible d'effectuer la recherche. Réessayez." }
  }
}

function likeFilter(columns: string[], term: string) {
  const safe = term.replace(/[%_,]/g, " ")
  return columns.map((column) => `${column}.ilike.%${safe}%`).join(",")
}

async function searchScorecards(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  term: string,
) {
  const { data, error } = await supabase
    .from("scorecards")
    .select("id, name, slug, status, organization_id")
    .eq("organization_id", organizationId)
    .or(likeFilter(["name", "slug"], term))
    .order("name")
    .limit(FETCH_CAP)
  if (error) throw new Error("scorecards")
  return limitHits(
    (data ?? [])
      .filter((card) => belongsToOrganization(organizationId, card.organization_id) && scorecardMatches(card, term))
      .map((card) => ({
        id: card.id,
        href: scorecardHref(card.id),
        title: card.name,
        meta: statusLabel(card.status),
      })),
  )
}

async function searchLeads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  term: string,
  phone: boolean,
  fullEmail: boolean,
) {
  const columns = ["first_name", "last_name", "email", "company", ...(phone ? ["phone"] : [])]
  const { data: people, error } = await supabase
    .from("respondents")
    .select("id, first_name, last_name, email, phone, company, organization_id")
    .eq("organization_id", organizationId)
    .or(likeFilter(columns, term))
    .limit(FETCH_CAP)
  if (error) throw new Error("respondents")
  const matched = (people ?? []).filter((person) => belongsToOrganization(organizationId, person.organization_id) && leadMatches(person, term, phone))
  const ids = matched.map((person) => person.id)
  if (ids.length === 0) return []
  const { data: leads, error: leadError } = await supabase
    .from("leads")
    .select("id, respondent_id, scorecard_id, organization_id, deleted_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .in("respondent_id", ids)
    .limit(FETCH_CAP)
  if (leadError) throw new Error("leads")
  const scorecardIds = [...new Set((leads ?? []).flatMap((lead) => (lead.scorecard_id ? [lead.scorecard_id] : [])))]
  const titles = new Map<string, string>()
  if (scorecardIds.length > 0) {
    const cards = await supabase.from("scorecards").select("id, name").eq("organization_id", organizationId).in("id", scorecardIds)
    if (cards.error) throw new Error("lead-scorecards")
    for (const card of cards.data ?? []) titles.set(card.id, card.name)
  }
  const byRespondent = new Map(matched.map((person) => [person.id, person]))
  return limitHits(
    (leads ?? []).flatMap((lead) => {
      if (!lead.respondent_id || !belongsToOrganization(organizationId, lead.organization_id) || !isActiveLead(lead.deleted_at)) return []
      const person = byRespondent.get(lead.respondent_id)
      if (!person) return []
      const name = [person.first_name, person.last_name].filter(Boolean).join(" ").trim() || "Lead"
      const email = displayEmail(person.email, fullEmail)
      const scorecard = lead.scorecard_id ? titles.get(lead.scorecard_id) ?? null : null
      return [{
        id: lead.id,
        href: leadHref(lead.id),
        title: name,
        meta: [email, scorecard].filter(Boolean).join(" · "),
      }]
    }),
  )
}

async function searchMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  term: string,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, access_role, organization_id, profile:profiles(full_name, email)")
    .eq("organization_id", organizationId)
  if (error) throw new Error("members")
  return limitHits(
    (data ?? []).flatMap((row) => {
      if (!belongsToOrganization(organizationId, row.organization_id)) return []
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
      const fullName = profile?.full_name ?? null
      const email = profile?.email ?? null
      if (!memberMatches({ fullName, email }, term)) return []
      return [{
        id: row.user_id,
        href: memberHref(row.user_id),
        title: fullName || "Membre",
        meta: roleLabel(normalizeAccessRole(row.access_role || row.role)),
      }]
    }),
  )
}
