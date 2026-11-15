import { countryChoices, countryName, isCountryCode } from "@/lib/geo/countries"
import { SIGNUP_PRIORITY_COUNTRIES } from "@/lib/onboarding/catalog"

export type OrgCurrency = "XOF" | "EUR" | "CAD" | "USD"
export type LegalIdType = "RCCM" | "NCC" | "SIRET" | "NEQ" | "OTHER"

type CountryDefaults = {
  dial: string
  currency: OrgCurrency
  language: "fr" | "en"
  timezone: string
  legalIdType: LegalIdType
  legalIdLabel: string
}

const DEFAULTS: Record<string, CountryDefaults> = {
  TG: { dial: "+228", currency: "XOF", language: "fr", timezone: "Africa/Lome", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  CI: { dial: "+225", currency: "XOF", language: "fr", timezone: "Africa/Abidjan", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  SN: { dial: "+221", currency: "XOF", language: "fr", timezone: "Africa/Dakar", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  BJ: { dial: "+229", currency: "XOF", language: "fr", timezone: "Africa/Porto-Novo", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  FR: { dial: "+33", currency: "EUR", language: "fr", timezone: "Europe/Paris", legalIdType: "SIRET", legalIdLabel: "SIRET (14 chiffres)" },
  CA: { dial: "+1", currency: "CAD", language: "fr", timezone: "America/Toronto", legalIdType: "NEQ", legalIdLabel: "NEQ (Québec) / identifiant légal" },
  BE: { dial: "+32", currency: "EUR", language: "fr", timezone: "Europe/Brussels", legalIdType: "OTHER", legalIdLabel: "Identifiant légal" },
  CH: { dial: "+41", currency: "EUR", language: "fr", timezone: "Europe/Zurich", legalIdType: "OTHER", legalIdLabel: "Identifiant légal" },
  ML: { dial: "+223", currency: "XOF", language: "fr", timezone: "Africa/Bamako", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  BF: { dial: "+226", currency: "XOF", language: "fr", timezone: "Africa/Ouagadougou", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  NE: { dial: "+227", currency: "XOF", language: "fr", timezone: "Africa/Niamey", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  GN: { dial: "+224", currency: "XOF", language: "fr", timezone: "Africa/Conakry", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  CM: { dial: "+237", currency: "XOF", language: "fr", timezone: "Africa/Douala", legalIdType: "RCCM", legalIdLabel: "RCCM / NCC" },
  US: { dial: "+1", currency: "USD", language: "en", timezone: "America/New_York", legalIdType: "OTHER", legalIdLabel: "Identifiant légal" },
  GB: { dial: "+44", currency: "EUR", language: "en", timezone: "Europe/London", legalIdType: "OTHER", legalIdLabel: "Identifiant légal" },
}

const FALLBACK: CountryDefaults = {
  dial: "+228",
  currency: "XOF",
  language: "fr",
  timezone: "UTC",
  legalIdType: "OTHER",
  legalIdLabel: "Identifiant légal",
}

export function countryDefaults(code: string): CountryDefaults {
  const upper = code.trim().toUpperCase()
  return DEFAULTS[upper] ?? FALLBACK
}

export function signupCountryChoices() {
  const all = countryChoices()
  const priority = SIGNUP_PRIORITY_COUNTRIES.filter((code) => isCountryCode(code)).map((code) => ({
    code,
    name: countryName(code),
  }))
  const rest = all.filter((row) => !(SIGNUP_PRIORITY_COUNTRIES as readonly string[]).includes(row.code))
  return [...priority, ...rest]
}

export function toE164(dial: string, national: string) {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "")
  const prefix = dial.replace(/\D/g, "")
  if (!digits) return ""
  return `+${prefix}${digits}`
}
