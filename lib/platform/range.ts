/** Shared Platform Admin time-range parsing (URL `?range=`). */

export const PLATFORM_RANGES = [
  { id: "1", label: "Aujourd'hui", days: 1 },
  { id: "7", label: "7 jours", days: 7 },
  { id: "30", label: "30 jours", days: 30 },
  { id: "90", label: "90 jours", days: 90 },
  { id: "365", label: "12 mois", days: 365 },
] as const

export type PlatformRangeId = (typeof PLATFORM_RANGES)[number]["id"]

export function parsePlatformRange(value: string | undefined): { id: PlatformRangeId; days: number } {
  const match = PLATFORM_RANGES.find((row) => row.id === value)
  if (match) return { id: match.id, days: match.days }
  return { id: "30", days: 30 }
}

/** Chart resolution: daily for ≤90d, monthly for 12 months. */
export function chartBucketMode(days: number): "day" | "month" {
  return days > 90 ? "month" : "day"
}
