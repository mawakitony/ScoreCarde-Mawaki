import assert from "node:assert/strict"
import test from "node:test"
import { safeNextPath } from "../env.ts"
import { forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.ts"
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_NEUTRAL_MESSAGE,
  PASSWORD_UPDATED_LOGIN_MESSAGE,
  buildMagicLinkRedirectTo,
  buildPasswordResetRedirectTo,
  isPasswordResetNext,
  parseAuthConfirmSearchParams,
  passwordMeetsPolicy,
  passwordResetRateLimitMessage,
  passwordsMatch,
} from "./password-reset"

test("neutral reset message never reveals account existence", () => {
  assert.match(PASSWORD_RESET_NEUTRAL_MESSAGE, /Si un compte existe/i)
  assert.equal(PASSWORD_RESET_NEUTRAL_MESSAGE.includes("introuvable"), false)
  assert.equal(PASSWORD_RESET_NEUTRAL_MESSAGE.includes("n'existe pas"), false)
  assert.match(PASSWORD_UPDATED_LOGIN_MESSAGE, /Mot de passe modifié/i)
})

test("forgotPasswordSchema validates email only", () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success, true)
  assert.equal(forgotPasswordSchema.safeParse({ email: "bad" }).success, false)
})

test("resetPasswordSchema enforces length, match, and optional MFA", () => {
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
    }).success,
    true,
  )
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    }).success,
    false,
  )
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "abcdefgh",
      confirmPassword: "abcdefgH",
    }).success,
    false,
  )
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
      mfaCode: "12345",
    }).success,
    false,
  )
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
      mfaCode: "123456",
    }).success,
    true,
  )
})

test("live password rules helpers align with policy", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8)
  assert.equal(passwordMeetsPolicy("1234567"), false)
  assert.equal(passwordMeetsPolicy("12345678"), true)
  assert.equal(passwordsMatch("abc", "abc"), true)
  assert.equal(passwordsMatch("abc", "abd"), false)
})

test("rate-limit message is mapped without leaking internals", () => {
  assert.equal(passwordResetRateLimitMessage("rate limit exceeded"), "Trop de demandes. Réessayez dans une heure.")
  assert.equal(passwordResetRateLimitMessage("over_email_send_rate_limit"), "Trop de demandes. Réessayez dans une heure.")
  assert.equal(passwordResetRateLimitMessage("smtp failed"), null)
})

test("safeNextPath allows reset-password recovery landing", () => {
  assert.equal(safeNextPath("/reset-password"), "/reset-password")
  assert.equal(isPasswordResetNext("/reset-password"), true)
  assert.equal(safeNextPath("/forgot-password"), "/dashboard")
  assert.equal(safeNextPath("https://evil.test"), "/dashboard")
})

test("RedirectTo builders keep query so templates can append &token_hash", () => {
  const reset = buildPasswordResetRedirectTo("http://localhost:3000/")
  assert.equal(reset, "http://localhost:3000/auth/confirm?next=%2Freset-password")
  assert.equal(reset.includes("?"), true)
  const magic = buildMagicLinkRedirectTo("https://score-card-mawaki.vercel.app", "/dashboard")
  assert.equal(magic, "https://score-card-mawaki.vercel.app/auth/callback?next=%2Fdashboard")
})

test("confirm parses RedirectTo&token_hash&type recovery format", () => {
  const redirectTo = buildPasswordResetRedirectTo("http://localhost:3000")
  const href = `${redirectTo}&token_hash=abcTOKEN&type=recovery`
  const url = new URL(href)
  const parsed = parseAuthConfirmSearchParams(url.searchParams)
  assert.equal(parsed.next, "/reset-password")
  assert.equal(parsed.token_hash, "abcTOKEN")
  assert.equal(parsed.type, "recovery")
  assert.equal(safeNextPath(parsed.next), "/reset-password")
})
