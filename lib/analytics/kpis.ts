import { conversionRate, periodDelta, share } from "@/lib/leads/metrics"

export type AnalyticsCounts = {
  leads: number
  new_leads: number
  page_views: number
  started: number
  captured: number
  completed: number
  viewed: number
  cta_clicks: number
  average_score: number | null
  hot_leads: number
}

/** Completion rate = completed / started (never invents data). */
export function completionRate(started: number, completed: number) {
  if (started <= 0) return 0
  return share(completed, started)
}

/** CTA conversion among completed assessments. */
export function ctaConversionRate(ctaClicks: number, completed: number) {
  return conversionRate(ctaClicks, completed)
}

export function kpiDelta(current: number, previous: number) {
  return periodDelta(current, previous)
}

export function scorecardCompletionRate(starts: number, completed: number) {
  return completionRate(starts, completed)
}

/** Zero stays zero — never a decorative minimum bar. */
export function progressPercent(value: number, max: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (!Number.isFinite(max) || max <= 0) return 0
  return Math.min(100, (value / max) * 100)
}

export function buildKpiSnapshot(current: AnalyticsCounts, previous: AnalyticsCounts) {
  return {
    leads: { value: current.leads, delta: kpiDelta(current.leads, previous.leads) },
    started: { value: current.started, delta: kpiDelta(current.started, previous.started) },
    completed: { value: current.completed, delta: kpiDelta(current.completed, previous.completed) },
    completion: {
      value: completionRate(current.started, current.completed),
      delta: kpiDelta(
        completionRate(current.started, current.completed),
        completionRate(previous.started, previous.completed),
      ),
    },
    averageScore: current.average_score,
    ctaRate: {
      value: ctaConversionRate(current.cta_clicks, current.completed),
      delta: kpiDelta(
        ctaConversionRate(current.cta_clicks, current.completed),
        ctaConversionRate(previous.cta_clicks, previous.completed),
      ),
    },
    hotLeads: { value: current.hot_leads, delta: kpiDelta(current.hot_leads, previous.hot_leads) },
  }
}
