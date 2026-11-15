/** Closed lists + consent versions for signup / org onboarding (FR). */

export const TERMS_VERSION = "2026-11-15"
export const PRIVACY_VERSION = "2026-11-15"
export const MARKETING_CONSENT_VERSION = "2026-11-15"

export const SIGNUP_PRIORITY_COUNTRIES = ["TG", "CI", "SN", "BJ", "FR", "CA"] as const

export const SECTORS = [
  { value: "formation", label: "Formation / éducation" },
  { value: "conseil", label: "Conseil / services" },
  { value: "tech", label: "Tech / digital" },
  { value: "rh", label: "RH / recrutement" },
  { value: "industrie", label: "Industrie / production" },
  { value: "sante", label: "Santé" },
  { value: "finance", label: "Finance / assurance" },
  { value: "commerce", label: "Commerce / distribution" },
  { value: "ong", label: "ONG / association" },
  { value: "secteur_public", label: "Secteur public" },
  { value: "autre", label: "Autre" },
] as const

export const HEADCOUNT_BANDS = [
  { value: "1", label: "1 personne" },
  { value: "2-10", label: "2 – 10" },
  { value: "11-50", label: "11 – 50" },
  { value: "51-200", label: "51 – 200" },
  { value: "201-1000", label: "201 – 1 000" },
  { value: "1000+", label: "Plus de 1 000" },
] as const

export const JOB_FUNCTIONS = [
  { value: "dirigeant", label: "Dirigeant / fondateur" },
  { value: "direction", label: "Direction générale" },
  { value: "rh", label: "RH / formation" },
  { value: "commercial", label: "Commercial / marketing" },
  { value: "operations", label: "Opérations" },
  { value: "it", label: "IT / digital" },
  { value: "finance", label: "Finance" },
  { value: "autre", label: "Autre" },
] as const

export const PRIMARY_OBJECTIVES = [
  { value: "evaluer_competences", label: "Évaluer des compétences" },
  { value: "recruter", label: "Recruter / sélectionner" },
  { value: "former", label: "Former / accompagner" },
  { value: "diagnostiquer", label: "Diagnostiquer une organisation" },
  { value: "autre", label: "Autre" },
] as const

export const REFERRAL_SOURCES = [
  { value: "recherche", label: "Recherche web" },
  { value: "recommandation", label: "Recommandation" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "evenement", label: "Événement / salon" },
  { value: "partenaire", label: "Partenaire" },
  { value: "autre", label: "Autre" },
] as const

export type SectorValue = (typeof SECTORS)[number]["value"]
export type HeadcountBand = (typeof HEADCOUNT_BANDS)[number]["value"]
export type JobFunction = (typeof JOB_FUNCTIONS)[number]["value"]
export type PrimaryObjective = (typeof PRIMARY_OBJECTIVES)[number]["value"]
export type ReferralSource = (typeof REFERRAL_SOURCES)[number]["value"]
