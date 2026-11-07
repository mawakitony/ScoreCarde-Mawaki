/** Real-scale bar width. Zero leads → 0% (never a fake stub bar). */
export function scorecardBarPercent(leads: number, maxLeads: number) {
  if (!Number.isFinite(leads) || leads <= 0) return 0
  if (!Number.isFinite(maxLeads) || maxLeads <= 0) return 0
  return Math.min(100, (leads / maxLeads) * 100)
}

/** Detect duplicate display names so UI can keep identity via id. */
export function scorecardNameIsDuplicate(name: string, names: string[]) {
  const target = name.trim().toLowerCase()
  return names.filter((item) => item.trim().toLowerCase() === target).length > 1
}
