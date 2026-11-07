/** Shared chart series types — safe for client and server. */

export type SignupPoint = { key: string; label: string; organizations: number; cumulative: number }
export type BillingPoint = { key: string; label: string; created: number; canceled: number; net: number }
export type ActivityPoint = {
  key: string
  label: string
  scorecards: number
  assessments: number
  leads: number
}
export type EvolutionPoint = {
  key: string
  label: string
  organizations: number
  cumulative: number
  trials: number
  actives: number
}
export type ExpirationBucket = {
  id: "today" | "d3" | "d7" | "d30"
  label: string
  count: number
  organizations: { id: string; name: string; deadline: string; kind: "trial" | "period" }[]
}
export type HealthStat = { id: string; label: string; value: number | string; tone: "ok" | "warn" | "bad" | "neutral" }
