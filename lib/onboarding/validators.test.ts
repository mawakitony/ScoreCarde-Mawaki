import assert from "node:assert/strict"
import test from "node:test"
import { isE164Phone, isHttpsUrl, isValidSiret, createOrgOnboardingSchema, signupOnboardingSchema } from "./validators.ts"
import { isOrgProfileComplete, orgProfileMissingFields } from "./profile-complete.ts"

test("E.164 phone validation", () => {
  assert.equal(isE164Phone("+22890123456"), true)
  assert.equal(isE164Phone("+33123456789"), true)
  assert.equal(isE164Phone("90123456"), false)
  assert.equal(isE164Phone("+0123"), false)
})

test("SIRET Luhn", () => {
  assert.equal(isValidSiret("73282932000074"), true)
  assert.equal(isValidSiret("73282932000075"), false)
  assert.equal(isValidSiret("123"), false)
})

test("URL validation", () => {
  assert.equal(isHttpsUrl("https://example.com"), true)
  assert.equal(isHttpsUrl("not-a-url"), false)
})

test("signup requires terms", () => {
  const bad = signupOnboardingSchema.safeParse({
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    password: "Secret1x",
    country: "FR",
    acceptTerms: false,
  })
  assert.equal(bad.success, false)
})

test("create org requires phone and city", () => {
  const bad = createOrgOnboardingSchema.safeParse({
    name: "Acme",
    slug: "acme-co",
    country: "TG",
    city: "",
    sector: "tech",
    headcountBand: "2-10",
    jobTitle: "dirigeant",
    phoneE164: "bad",
    primaryObjective: "recruter",
    currency: "XOF",
    language: "fr",
    timezone: "Africa/Lome",
  })
  assert.equal(bad.success, false)
})

test("incomplete org profile banner helpers", () => {
  const missing = orgProfileMissingFields({ name: "A" })
  assert.ok(missing.includes("ville"))
  assert.equal(isOrgProfileComplete({ profile_completed_at: "2026-01-01" }), true)
})
