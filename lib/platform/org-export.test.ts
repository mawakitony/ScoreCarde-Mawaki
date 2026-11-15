import assert from "node:assert/strict"
import test from "node:test"
import { csvCell, needsCsvNeutralization, toCsv } from "../leads/csv.ts"
import { resolvePlatformApiAuth } from "./api-auth.ts"

test("org export API denies unauthenticated with 401", () => {
  const d = resolvePlatformApiAuth({
    hasSession: false,
    isPlatformAdmin: false,
    hasPermission: false,
    aal2: false,
    mfaEnrolled: false,
  })
  assert.equal(d.ok, false)
  if (!d.ok) {
    assert.equal(d.status, 401)
    assert.equal(d.error, "unauthenticated")
  }
})

test("org export API denies non-admin and missing permission with 403", () => {
  const notAdmin = resolvePlatformApiAuth({
    hasSession: true,
    isPlatformAdmin: false,
    hasPermission: false,
    aal2: true,
    mfaEnrolled: true,
  })
  assert.equal(notAdmin.ok, false)
  if (!notAdmin.ok) assert.equal(notAdmin.status, 403)

  const noPerm = resolvePlatformApiAuth({
    hasSession: true,
    isPlatformAdmin: true,
    hasPermission: false,
    aal2: true,
    mfaEnrolled: true,
  })
  assert.equal(noPerm.ok, false)
  if (!noPerm.ok) assert.equal(noPerm.status, 403)
})

test("org export API requires AAL2 (MFA) with 403", () => {
  const needVerify = resolvePlatformApiAuth({
    hasSession: true,
    isPlatformAdmin: true,
    hasPermission: true,
    aal2: false,
    mfaEnrolled: true,
  })
  assert.deepEqual(needVerify, { ok: false, status: 403, error: "aal2_required" })

  const needEnroll = resolvePlatformApiAuth({
    hasSession: true,
    isPlatformAdmin: true,
    hasPermission: true,
    aal2: false,
    mfaEnrolled: false,
  })
  assert.deepEqual(needEnroll, { ok: false, status: 403, error: "enroll_required" })
})

test("org export API allows platform admin with AAL2", () => {
  assert.deepEqual(
    resolvePlatformApiAuth({
      hasSession: true,
      isPlatformAdmin: true,
      hasPermission: true,
      aal2: true,
      mfaEnrolled: true,
    }),
    { ok: true },
  )
})

test("CSV injection neutralized for = + - @ tab CR", () => {
  assert.equal(needsCsvNeutralization("=cmd|' /C calc'!A0"), true)
  assert.equal(needsCsvNeutralization("+1+1"), true)
  assert.equal(needsCsvNeutralization("-2+3"), true)
  assert.equal(needsCsvNeutralization("@SUM(A1)"), true)
  assert.equal(needsCsvNeutralization("\t=HYPERLINK"), true)
  assert.equal(needsCsvNeutralization("\r=cmd"), true)
  assert.equal(needsCsvNeutralization("\n=cmd"), true)
  assert.equal(needsCsvNeutralization("safe name"), false)

  assert.equal(csvCell("=1+1"), "\"'=1+1\"")
  assert.equal(csvCell("+228"), "\"'+228\"")
  assert.equal(csvCell("-commande"), "\"'-commande\"")
  assert.equal(csvCell("@nom"), "\"'@nom\"")
  assert.equal(csvCell("\tformula"), "\"'\tformula\"")
  assert.equal(csvCell("\rformula"), "\"'\rformula\"")

  const csv = toCsv(["name", "note"], [["Acme", "=cmd"], ["Ok", "normal"]])
  assert.match(csv, /'=cmd/)
  assert.match(csv, /"normal"/)
  assert.doesNotMatch(csv, /(?<!')"=cmd/)
})
