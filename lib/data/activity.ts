import "server-only"

import { isActivityAction } from "@/lib/audit/activity"
import { ensureMembership } from "@/lib/data/membership"
import { createClient } from "@/lib/supabase/server"

export type ActivityRow = {
  id: string
  actorId: string | null
  action: string
  metadata: unknown
  createdAt: string
}

function dayStart(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return `${value}T00:00:00.000Z`
}

function dayEnd(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString()
}

export async function listActivity(input: { actorId: string | null; action: string | null; from: string | null; to: string | null }) {
  const membership = await ensureMembership()
  if (!membership) return { error: "Accès refusé." as const, rows: [] as ActivityRow[] }
  const supabase = await createClient()
  let request = supabase
    .from("audit_logs")
    .select("id, actor_id, action, metadata, created_at")
    .eq("organization_id", membership.organization.id)
    .order("created_at", { ascending: false })
    .limit(100)
  if (input.actorId) request = request.eq("actor_id", input.actorId)
  if (input.action && isActivityAction(input.action)) request = request.eq("action", input.action)
  const from = dayStart(input.from)
  const to = dayEnd(input.to)
  if (from) request = request.gte("created_at", from)
  if (to) request = request.lt("created_at", to)
  const { data, error } = await request
  if (error) return { error: "Impossible de charger le journal d'activité." as const, rows: [] as ActivityRow[] }
  return {
    error: null,
    rows: (data ?? []).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.created_at,
    })),
  }
}
