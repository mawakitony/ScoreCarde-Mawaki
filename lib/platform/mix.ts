/** Pure subscription-mix helpers — safe for client and server. */

export type MixSlice = { id: string; label: string; value: number; tone: string; percent?: number }

export function buildSubscriptionMix(input: {
  trialing: number
  activePaid: number
  pastDue: number
  canceled: number
  suspended: number
  expired: number
}): MixSlice[] {
  const slices = [
    { id: "trialing", label: "Essai", value: input.trialing, tone: "#38BDF8" },
    { id: "active", label: "Actif", value: input.activePaid, tone: "#10B981" },
    { id: "past_due", label: "En retard", value: input.pastDue, tone: "#F59E0B" },
    { id: "expired", label: "Expiré / restreint", value: input.expired, tone: "#F97316" },
    { id: "suspended", label: "Suspendu", value: input.suspended, tone: "#EF4444" },
    { id: "canceled", label: "Annulé", value: input.canceled, tone: "#94A3B8" },
  ].filter((row) => row.value > 0)
  return attachMixPercents(slices)
}

/**
 * Largest-remainder percentages so slices always sum to 100 when total > 0.
 * Example: 1 + 1 → 50 % / 50 % (never 5 % / 5 % against a hidden denominator).
 */
export function attachMixPercents(slices: MixSlice[]): MixSlice[] {
  const total = slices.reduce((sum, row) => sum + row.value, 0)
  if (total <= 0) return slices.map((row) => ({ ...row, percent: 0 }))

  const raw = slices.map((row) => ({
    ...row,
    exact: (row.value / total) * 100,
  }))
  const floored = raw.map((row) => ({ ...row, percent: Math.floor(row.exact) }))
  let remainder = 100 - floored.reduce((sum, row) => sum + row.percent, 0)
  const ranked = [...floored].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))
  for (const row of ranked) {
    if (remainder <= 0) break
    row.percent += 1
    remainder -= 1
  }
  const byId = new Map(ranked.map((row) => [row.id, row.percent]))
  return slices.map((row) => ({ ...row, percent: byId.get(row.id) ?? 0 }))
}

export function mixTotal(slices: MixSlice[]) {
  return slices.reduce((sum, row) => sum + row.value, 0)
}
