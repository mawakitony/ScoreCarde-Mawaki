import assert from "node:assert/strict"
import test from "node:test"
import { isE2eSignupNoEmailEnabled } from "./e2e-signup-no-email.ts"

test("E2E_SIGNUP_NO_EMAIL is off when unset", () => {
  assert.equal(isE2eSignupNoEmailEnabled({}), false)
  assert.equal(isE2eSignupNoEmailEnabled({ E2E_SIGNUP_NO_EMAIL: "0" }), false)
})

test("E2E_SIGNUP_NO_EMAIL works only outside production", () => {
  assert.equal(
    isE2eSignupNoEmailEnabled({ E2E_SIGNUP_NO_EMAIL: "1", NODE_ENV: "development" }),
    true,
  )
  assert.equal(
    isE2eSignupNoEmailEnabled({ E2E_SIGNUP_NO_EMAIL: "1", VERCEL_ENV: "preview" }),
    true,
  )
})

test("E2E_SIGNUP_NO_EMAIL is ignored when NODE_ENV=production even if set", () => {
  assert.equal(
    isE2eSignupNoEmailEnabled({
      E2E_SIGNUP_NO_EMAIL: "1",
      NODE_ENV: "production",
    }),
    false,
  )
})

test("E2E_SIGNUP_NO_EMAIL is ignored when VERCEL_ENV=production even if set", () => {
  assert.equal(
    isE2eSignupNoEmailEnabled({
      E2E_SIGNUP_NO_EMAIL: "1",
      NODE_ENV: "development",
      VERCEL_ENV: "production",
    }),
    false,
  )
  assert.equal(
    isE2eSignupNoEmailEnabled({
      E2E_SIGNUP_NO_EMAIL: "1",
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    }),
    false,
  )
})
