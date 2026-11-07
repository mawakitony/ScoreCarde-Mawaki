/** Presentation-only mapping — never mutates stored keys or scoring rules. */
const TECHNICAL_RESULT_LABELS: Record<string, string> = {
  needs_preparation: "Préparation nécessaire",
  not_yet_eligible: "Pas encore éligible",
  probably_eligible: "Probablement éligible",
  eligible: "Éligible",
}

/**
 * Display label for a result_distribution entry.
 * Known technical keys → French copy. Otherwise keep the configured / human label as-is.
 */
export function displayResultLabel(raw: string | null | undefined) {
  const value = (raw ?? "").trim()
  if (!value) return "Sans libellé"
  const mapped = TECHNICAL_RESULT_LABELS[value] ?? TECHNICAL_RESULT_LABELS[value.toLowerCase()]
  if (mapped) return mapped
  return value
}

export function withDisplayResultLabels<T extends { label: string; count: number }>(rows: T[]) {
  return rows.map((row) => ({
    ...row,
    /** Original key / stored label (for React keys & color stability). */
    key: row.label,
    label: displayResultLabel(row.label),
  }))
}
