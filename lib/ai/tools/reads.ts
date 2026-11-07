import { wrapUntrustedData } from "@/lib/ai/agent/security"
import { AGENT_LIMITS } from "@/lib/ai/agent/limits"
import { toolArgsSchemas } from "@/lib/ai/agent/schemas"
import { resolveRange } from "@/lib/analytics/range"
import { queryLeads } from "@/lib/data/crm"
import { getCommercialAnalytics, getQuestionStats } from "@/lib/data/crm"
import { getOverview } from "@/lib/data/overview"
import { listScorecards } from "@/lib/data/scorecards"
import { createClient } from "@/lib/supabase/server"

function clip(value: unknown) {
  const text = JSON.stringify(value)
  if (text.length <= AGENT_LIMITS.toolResultMaxChars) return value
  return { truncated: true, preview: text.slice(0, AGENT_LIMITS.toolResultMaxChars) }
}

export async function runReadTool(
  tool: keyof typeof toolArgsSchemas,
  rawArgs: unknown,
  organizationId: string,
) {
  if (tool === "list_scorecards") {
    const args = toolArgsSchemas.list_scorecards.parse(rawArgs ?? {})
    const listed = await listScorecards(organizationId, args.query)
    if (listed.error) return { error: listed.error }
    return clip(listed.scorecards.map((row) => ({ id: row.id, name: row.name, slug: row.slug, status: row.status })))
  }

  if (tool === "get_scorecard") {
    const args = toolArgsSchemas.get_scorecard.parse(rawArgs)
    const supabase = await createClient()
    const { data } = await supabase
      .from("scorecards")
      .select("id, name, slug, status, description, language, category, estimated_minutes")
      .eq("id", args.scorecardId)
      .eq("organization_id", organizationId)
      .maybeSingle()
    if (!data) return { error: "Scorecard introuvable." }
    const [{ data: pages }, { count: questions }] = await Promise.all([
      supabase.from("scorecard_pages").select("title, subtitle, description, cta_text").eq("scorecard_id", data.id).maybeSingle(),
      supabase.from("questions").select("id", { count: "exact", head: true }).eq("scorecard_id", data.id).is("archived_at", null),
    ])
    return clip({
      ...data,
      page: pages,
      questionCount: questions ?? 0,
    })
  }

  if (tool === "list_questions") {
    const args = toolArgsSchemas.list_questions.parse(rawArgs)
    const supabase = await createClient()
    const owned = await supabase.from("scorecards").select("id").eq("id", args.scorecardId).eq("organization_id", organizationId).maybeSingle()
    if (!owned.data) return { error: "Scorecard introuvable." }
    const { data } = await supabase
      .from("questions")
      .select("id, title, type, is_required, is_scored, position, question_category_id, scoring_category_id")
      .eq("scorecard_id", args.scorecardId)
      .is("archived_at", null)
      .order("position")
    return clip(wrapUntrustedData("questions", data ?? []))
  }

  if (tool === "search_leads") {
    const args = toolArgsSchemas.search_leads.parse(rawArgs ?? {})
    const range = resolveRange({ range: args.days && args.days <= 7 ? "7d" : args.days && args.days <= 30 ? "30d" : "90d" })
    const result = await queryLeads({
      query: args.query ?? "",
      scorecardId: args.scorecardId ?? null,
      status: null,
      temperature: args.temperature ?? null,
      country: null,
      tagId: null,
      resultRangeId: null,
      scoreMin: null,
      scoreMax: null,
      from: args.days ? range.fromInput : null,
      to: args.days ? range.toInput : null,
      utmSource: null,
      utmCampaign: null,
      cta: null,
      sort: "newest",
      page: 1,
      size: 25,
      ids: [],
    })
    const rows = (result.error ? [] : result.rows).slice(0, args.limit)
    return clip(wrapUntrustedData("leads", rows.map((lead) => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      score: lead.score,
      status: lead.status,
      temperature: lead.temperature,
      scorecardId: lead.scorecard_id,
    }))))
  }

  if (tool === "get_lead") {
    const args = toolArgsSchemas.get_lead.parse(rawArgs)
    const supabase = await createClient()
    const { data } = await supabase
      .from("leads")
      .select("id, status, score, temperature, scorecard_id, company, created_at, respondent:respondents(first_name, last_name, email)")
      .eq("id", args.leadId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle()
    if (!data) return { error: "Lead introuvable." }
    return clip(wrapUntrustedData("lead", data))
  }

  if (tool === "get_dashboard_metrics") {
    const args = toolArgsSchemas.get_dashboard_metrics.parse(rawArgs ?? {})
    const range = resolveRange({ range: args.days <= 7 ? "7d" : args.days <= 30 ? "30d" : "90d" })
    const overview = await getOverview(range)
    if ("error" in overview) return overview
    return clip({
      leads: overview.data.leads,
      started: overview.data.started,
      completed: overview.data.completed,
      conversionRate: overview.data.conversion_rate,
      averageScore: overview.data.average_score,
      ctaClicks: overview.data.cta_clicks,
      pageViews: overview.data.page_views,
    })
  }

  if (tool === "get_scorecard_analytics") {
    const args = toolArgsSchemas.get_scorecard_analytics.parse(rawArgs)
    const supabase = await createClient()
    const owned = await supabase.from("scorecards").select("id, name").eq("id", args.scorecardId).eq("organization_id", organizationId).maybeSingle()
    if (!owned.data) return { error: "Scorecard introuvable." }
    const range = resolveRange({ range: args.days <= 7 ? "7d" : args.days <= 30 ? "30d" : "90d" })
    const [commercial, questions] = await Promise.all([
      getCommercialAnalytics(range, args.scorecardId),
      getQuestionStats(args.scorecardId, range),
    ])
    return clip({
      scorecard: owned.data,
      commercial: "error" in commercial ? null : commercial.data,
      questions: "error" in questions ? null : wrapUntrustedData("question_stats", questions.data),
    })
  }

  if (tool === "get_report_summary") {
    const args = toolArgsSchemas.get_report_summary.parse(rawArgs)
    const supabase = await createClient()
    const { data: lead } = await supabase.from("leads").select("id").eq("id", args.leadId).eq("organization_id", organizationId).is("deleted_at", null).maybeSingle()
    if (!lead) return { error: "Lead introuvable." }
    const { data } = await supabase
      .from("assessment_reports")
      .select("id, status, report_type, ai_status, created_at")
      .eq("lead_id", args.leadId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(3)
    return clip({ reports: data ?? [] })
  }

  return { error: "Tool de lecture inconnu." }
}
