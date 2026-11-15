import { z } from "zod"
import {
  HEADCOUNT_BANDS,
  JOB_FUNCTIONS,
  PRIMARY_OBJECTIVES,
  REFERRAL_SOURCES,
  SECTORS,
} from "@/lib/onboarding/catalog"
import { isCountryCode } from "@/lib/geo/countries"
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-reset"

const sectorValues = SECTORS.map((s) => s.value) as [string, ...string[]]
const headcountValues = HEADCOUNT_BANDS.map((s) => s.value) as [string, ...string[]]
const jobValues = JOB_FUNCTIONS.map((s) => s.value) as [string, ...string[]]
const objectiveValues = PRIMARY_OBJECTIVES.map((s) => s.value) as [string, ...string[]]
const referralValues = REFERRAL_SOURCES.map((s) => s.value) as [string, ...string[]]

/** E.164: + then 8–15 digits total after +. */
export function isE164Phone(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value.trim())
}

/** French SIRET: 14 digits + Luhn. */
export function isValidSiret(raw: string) {
  const digits = raw.replace(/\s+/g, "")
  if (!/^\d{14}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 14; i += 1) {
    let n = Number(digits[i])
    if (i % 2 === 0) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

const passwordRules = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Au moins ${PASSWORD_MIN_LENGTH} caractères.`)
  .regex(/[A-Z]/, "Au moins une majuscule.")
  .regex(/[a-z]/, "Au moins une minuscule.")
  .regex(/[0-9]/, "Au moins un chiffre.")

export const signupOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(60),
  lastName: z.string().trim().min(1, "Indiquez votre nom.").max(60),
  email: z.string().trim().email("Indiquez un e-mail valide."),
  password: passwordRules,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isCountryCode, "Choisissez un pays dans la liste."),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter les CGU et la politique de confidentialité.",
  }),
  marketingConsent: z.boolean().default(false),
  turnstileToken: z.string().optional(),
})

export const createOrgOnboardingSchema = z
  .object({
    name: z.string().trim().min(2, "Indiquez la raison sociale.").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Identifiant invalide (lettres minuscules, chiffres, tirets).")
      .refine((s) => s !== "woloyem", "Cet identifiant est réservé."),
    country: z.string().trim().toUpperCase().refine(isCountryCode, "Pays invalide."),
    city: z.string().trim().min(2, "Indiquez la ville.").max(80),
    sector: z.enum(sectorValues, { errorMap: () => ({ message: "Choisissez un secteur." }) }),
    sectorOther: z.string().trim().max(80).optional().default(""),
    headcountBand: z.enum(headcountValues, { errorMap: () => ({ message: "Choisissez un effectif." }) }),
    jobTitle: z.enum(jobValues, { errorMap: () => ({ message: "Choisissez votre fonction." }) }),
    phoneE164: z.string().trim().refine(isE164Phone, "Téléphone au format international requis (ex. +22890123456)."),
    primaryObjective: z.enum(objectiveValues, { errorMap: () => ({ message: "Choisissez un objectif." }) }),
    website: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((v) => !v || isHttpsUrl(v), "URL du site invalide."),
    legalId: z.string().trim().max(40).optional().default(""),
    legalIdType: z.enum(["RCCM", "NCC", "SIRET", "NEQ", "OTHER"]).optional().default("OTHER"),
    referralSource: z.union([z.enum(referralValues), z.literal("")]).default(""),
    currency: z.enum(["XOF", "EUR", "CAD", "USD"]),
    language: z.enum(["fr", "en"]),
    timezone: z.string().trim().min(1).max(80),
  })
  .superRefine((value, ctx) => {
    if (value.sector === "autre" && value.sectorOther.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["sectorOther"], message: "Précisez le secteur." })
    }
    if (value.legalIdType === "SIRET" && value.legalId && !isValidSiret(value.legalId)) {
      ctx.addIssue({ code: "custom", path: ["legalId"], message: "SIRET invalide (14 chiffres)." })
    }
  })

export type SignupOnboardingInput = z.infer<typeof signupOnboardingSchema>
export type CreateOrgOnboardingInput = z.infer<typeof createOrgOnboardingSchema>

export function passwordStrengthHints(password: string) {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  }
}
