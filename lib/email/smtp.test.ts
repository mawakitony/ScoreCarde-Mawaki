import assert from "node:assert/strict"
import test from "node:test"
import type { Transporter } from "nodemailer"
import { getEmailProvider } from "./provider-name.ts"
import { evaluateEmailQuota, parseEmailDailyLimit, parseEmailRatePerMinute, readEmailRateLimits } from "./rate-limit.ts"
import { classifySmtpError } from "./smtp-error.ts"
import { isSmtpConfigured, sendSmtpEmail } from "./smtp.ts"

test("EMAIL_PROVIDER defaults to smtp and accepts brevo", () => {
  assert.equal(getEmailProvider({}), "smtp")
  assert.equal(getEmailProvider({ EMAIL_PROVIDER: "SMTP" }), "smtp")
  assert.equal(getEmailProvider({ EMAIL_PROVIDER: "brevo" }), "brevo")
  assert.equal(getEmailProvider({ EMAIL_PROVIDER: "other" }), "smtp")
})

test("rate limits parse defaults and custom values", () => {
  assert.equal(parseEmailDailyLimit({}), 400)
  assert.equal(parseEmailDailyLimit({ EMAIL_DAILY_LIMIT: "250" }), 250)
  assert.equal(parseEmailDailyLimit({ EMAIL_DAILY_LIMIT: "0" }), 400)
  assert.equal(parseEmailRatePerMinute({}), 5)
  assert.equal(parseEmailRatePerMinute({ EMAIL_RATE_PER_MINUTE: "3" }), 3)
  assert.deepEqual(readEmailRateLimits({ EMAIL_DAILY_LIMIT: "100", EMAIL_RATE_PER_MINUTE: "2" }), {
    daily: 100,
    perMinute: 2,
  })
})

test("quota evaluation defers daily and per-minute without failing", () => {
  const limits = { daily: 400, perMinute: 5 }
  assert.equal(evaluateEmailQuota({ sentToday: 10, sentLastMinute: 1, limits }).ok, true)
  const daily = evaluateEmailQuota({ sentToday: 400, sentLastMinute: 0, limits })
  assert.equal(daily.ok, false)
  if (!daily.ok) assert.equal(daily.reason, "rate_limited_daily")
  const minute = evaluateEmailQuota({ sentToday: 10, sentLastMinute: 5, limits })
  assert.equal(minute.ok, false)
  if (!minute.ok) assert.equal(minute.reason, "rate_limited_minute")
})

test("SMTP errors map to auth / quota / invalid recipient", () => {
  assert.equal(classifySmtpError({ responseCode: 535, message: "Invalid login" }).code, "smtp_auth_rejected")
  assert.equal(classifySmtpError({ responseCode: 535, message: "Invalid login" }).disposition, "retry")
  assert.equal(
    classifySmtpError({ responseCode: 421, message: "Daily user sending quota exceeded" }).code,
    "smtp_quota_exceeded",
  )
  assert.equal(
    classifySmtpError({ responseCode: 421, message: "Daily user sending quota exceeded" }).disposition,
    "pending",
  )
  assert.equal(
    classifySmtpError({ responseCode: 550, message: "User unknown" }).code,
    "smtp_invalid_recipient",
  )
  assert.equal(classifySmtpError({ responseCode: 550, message: "User unknown" }).disposition, "dead")
  assert.equal(classifySmtpError(new Error("socket hang up")).code, "smtp_error")
})

test("sendSmtpEmail uses injected transport and never needs a live SMTP host", async () => {
  const env = {
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_USER: "user@gmail.com",
    SMTP_PASSWORD: "app-password",
    EMAIL_FROM: "noreply@example.com",
    EMAIL_FROM_NAME: "Mawaki Score",
  }
  assert.equal(isSmtpConfigured(env), true)
  assert.equal(isSmtpConfigured({}), false)

  const transport = {
    async sendMail() {
      return { messageId: "<mock@localhost>" }
    },
  } as unknown as Transporter

  const ok = await sendSmtpEmail(
    { to: "tonyassiki05@gmail.com", subject: "t", text: "body" },
    { transport, env },
  )
  assert.equal(ok.configured, true)
  assert.equal(ok.ok, true)
  if (ok.configured && ok.ok) assert.equal(ok.messageId, "<mock@localhost>")

  const failing = {
    async sendMail() {
      const err = new Error("Username and Password not accepted") as Error & { responseCode: number }
      err.responseCode = 535
      throw err
    },
  } as unknown as Transporter

  const authFail = await sendSmtpEmail(
    { to: "tonyassiki05@gmail.com", subject: "t", text: "body" },
    { transport: failing, env },
  )
  assert.equal(authFail.configured, true)
  assert.equal(authFail.ok, false)
  if (authFail.configured && !authFail.ok) {
    assert.equal(authFail.code, "smtp_auth_rejected")
    assert.equal(authFail.disposition, "retry")
  }
})
