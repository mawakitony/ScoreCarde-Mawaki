/** Scorecard hub page — uses real scorecards.id. Org isolation is enforced by the page loader. */
export function scorecardDetailHref(scorecardId: string | null | undefined) {
  const id = scorecardId?.trim()
  if (!id) return null
  return `/dashboard/scorecards/${encodeURIComponent(id)}`
}

/**
 * Competition ranks for a list already ordered by metric desc.
 * Equal metrics share the same rank; the next distinct value skips (1,1,3).
 */
export function competitionRanks(metrics: number[]) {
  const ranks: number[] = []
  for (let i = 0; i < metrics.length; i += 1) {
    if (i > 0 && metrics[i] === metrics[i - 1]) {
      ranks.push(ranks[i - 1]!)
    } else {
      ranks.push(i + 1)
    }
  }
  return ranks
}
