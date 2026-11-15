/** Pure helpers: incomplete org profile → dashboard banner. */

export type OrgProfileFields = {
  name?: string | null
  country?: string | null
  city?: string | null
  sector?: string | null
  headcount_band?: string | null
  primary_objective?: string | null
  currency?: string | null
  profile_completed_at?: string | null
  phone_e164?: string | null
}

export function orgProfileMissingFields(org: OrgProfileFields) {
  const missing: string[] = []
  if (!org.name?.trim() || org.name.trim().length < 2) missing.push("raison sociale")
  if (!org.country?.trim()) missing.push("pays")
  if (!org.city?.trim()) missing.push("ville")
  if (!org.sector?.trim()) missing.push("secteur")
  if (!org.headcount_band?.trim()) missing.push("effectif")
  if (!org.primary_objective?.trim()) missing.push("objectif")
  if (!org.currency?.trim()) missing.push("devise")
  if (!org.phone_e164?.trim()) missing.push("téléphone")
  return missing
}

export function isOrgProfileComplete(org: OrgProfileFields) {
  if (org.profile_completed_at) return true
  return orgProfileMissingFields(org).length === 0
}
