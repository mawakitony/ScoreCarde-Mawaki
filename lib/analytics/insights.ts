import { completionRate, ctaConversionRate } from "@/lib/analytics/kpis"
import { displayResultLabel } from "@/lib/dashboard/result-labels"
import { periodDelta, share } from "@/lib/leads/metrics"

export type AnalyticsInsight = {
  id: string
  tone: "info" | "positive" | "attention"
  title: string
  observation: string
  explanation: string
  action?: string
  href?: string
}

type InsightInput = {
  current: {
    started: number
    completed: number
    cta_clicks: number
    leads: number
    hot_leads: number
  }
  previous: {
    started: number
    completed: number
    cta_clicks: number
    leads: number
  }
  scorecards: {
    id: string
    name: string
    starts: number
    completed: number
    cta_clicks: number
    leads: number
  }[]
  sources: { name: string; leads: number }[]
  result_distribution: { label: string; count: number }[]
}

const MIN_SAMPLE = 5

/** Deterministic, explainable insights — not marketed as AI. */
export function buildAnalyticsInsights(input: InsightInput): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = []
  const { current, previous, scorecards, sources, result_distribution } = input

  if (current.started < MIN_SAMPLE && current.leads < MIN_SAMPLE) {
    return []
  }

  const completion = completionRate(current.started, current.completed)
  const prevCompletion = completionRate(previous.started, previous.completed)
  const completionDelta = periodDelta(completion, prevCompletion)

  if (current.started >= MIN_SAMPLE && completion < 40) {
    insights.push({
      id: "low-completion",
      tone: "attention",
      title: "Taux de complétion bas",
      observation: `${completion} % des évaluations démarrées sont terminées`,
      explanation: "Un taux inférieur à 40 % suggère des frictions dans le parcours (longueur, clarté, friction mobile).",
      action: "Revoir les questions les plus abandonnées dans le builder.",
      href: "/dashboard/scorecards",
    })
  }

  if (completionDelta !== null && completionDelta >= 15 && previous.started >= MIN_SAMPLE) {
    insights.push({
      id: "completion-up",
      tone: "positive",
      title: "Complétion en hausse",
      observation: `+${completionDelta} % vs période précédente`,
      explanation: "Plus de participants terminent leurs évaluations sur cette période.",
    })
  }

  const topSource = [...sources].sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name))[0]
  const sourceTotal = sources.reduce((sum, row) => sum + row.leads, 0)
  if (topSource && sourceTotal >= MIN_SAMPLE && topSource.leads > 0) {
    const pct = share(topSource.leads, sourceTotal)
    if (pct >= 35) {
      insights.push({
        id: "dominant-source",
        tone: "info",
        title: "Source dominante",
        observation: `${topSource.name} apporte ${pct} % des leads`,
        explanation: "Concentrez vos efforts sur ce canal ou diversifiez pour réduire la dépendance.",
        action: "Comparer les performances par source dans le CRM.",
        href: "/dashboard/leads",
      })
    }
  }

  const resultTotal = result_distribution.reduce((sum, row) => sum + row.count, 0)
  const topResult = [...result_distribution].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))[0]
  if (topResult && resultTotal >= MIN_SAMPLE) {
    const pct = share(topResult.count, resultTotal)
    if (pct >= 45) {
      insights.push({
        id: "dominant-result",
        tone: "info",
        title: "Résultat prédominant",
        observation: `${displayResultLabel(topResult.label)} représente ${pct} % des résultats`,
        explanation: "Une catégorie dominante peut indiquer un positionnement fort ou un barème à recalibrer.",
      })
    }
  }

  const weakCard = [...scorecards]
    .filter((row) => row.starts >= MIN_SAMPLE)
    .map((row) => ({
      ...row,
      rate: completionRate(row.starts, row.completed),
      cta: ctaConversionRate(row.cta_clicks, row.completed),
    }))
    .sort((a, b) => a.rate - b.rate || b.starts - a.starts)[0]

  if (weakCard && weakCard.rate < 45) {
    insights.push({
      id: "weak-scorecard",
      tone: "attention",
      title: "Scorecard à renforcer",
      observation: `${weakCard.name} : ${weakCard.rate} % de complétion (${weakCard.starts} démarrages)`,
      explanation: "Cette scorecard convertit moins bien les démarrages en évaluations terminées.",
      action: "Ouvrir ses analytics dédiées.",
      href: `/dashboard/scorecards/${weakCard.id}/analytics`,
    })
  }

  const highVolumeLowCta = [...scorecards]
    .filter((row) => row.completed >= MIN_SAMPLE)
    .map((row) => ({ ...row, cta: ctaConversionRate(row.cta_clicks, row.completed) }))
    .filter((row) => row.cta < 10 && row.completed >= 10)
    .sort((a, b) => b.completed - a.completed)[0]

  if (highVolumeLowCta) {
    insights.push({
      id: "low-cta",
      tone: "attention",
      title: "Volume élevé, CTA faible",
      observation: `${highVolumeLowCta.name} : ${highVolumeLowCta.cta} % de clics CTA sur ${highVolumeLowCta.completed} terminées`,
      explanation: "Les participants terminent mais cliquent peu sur l’appel à l’action — vérifier l’offre et le placement du CTA.",
      href: `/dashboard/scorecards/${highVolumeLowCta.id}/builder`,
    })
  }

  if (current.hot_leads > 0 && current.leads >= MIN_SAMPLE) {
    const hotShare = share(current.hot_leads, current.leads)
    if (hotShare >= 25) {
      insights.push({
        id: "hot-share",
        tone: "positive",
        title: "Bonne part de leads chauds",
        observation: `${hotShare} % des leads sont qualifiés chauds`,
        explanation: "Priorisez le suivi commercial sur ces contacts depuis le CRM.",
        href: "/dashboard/leads",
      })
    }
  }

  return insights.slice(0, 6)
}
