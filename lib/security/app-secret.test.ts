import assert from "node:assert/strict"
import test from "node:test"
import {
  APP_SECRET_SALT,
  classifyIntegrationsSecretFormat,
  deriveAppSecret,
  INTEGRATIONS_SECRET_MIN_LENGTH,
  integrationsSecretStatus,
  isIntegrationsSecretError,
  readIntegrationsSecret,
} from "@/lib/security/app-secret"
import { openProof, openSecretValue, sealProof, sealSecretValue } from "@/lib/auth/first-access"
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto"

const MASTER = "a".repeat(INTEGRATIONS_SECRET_MIN_LENGTH)

test("INTEGRATIONS_SECRET status fails closed when missing or too short", () => {
  assert.equal(integrationsSecretStatus(undefined).ok, false)
  assert.equal(integrationsSecretStatus("").code, "INTEGRATIONS_SECRET_MISSING")
  assert.equal(integrationsSecretStatus("short").code, "INTEGRATIONS_SECRET_TOO_SHORT")
  assert.equal(integrationsSecretStatus(MASTER).ok, true)
  assert.equal(classifyIntegrationsSecretFormat("ab".repeat(32)), "hex64")
  assert.throws(() => readIntegrationsSecret({}), (error: unknown) => {
    assert.equal(isIntegrationsSecretError(error), true)
    return isIntegrationsSecretError(error) && error.code === "INTEGRATIONS_SECRET_MISSING"
  })
  assert.throws(() => readIntegrationsSecret({ INTEGRATIONS_SECRET: "too-short" }), (error: unknown) => {
    return isIntegrationsSecretError(error) && error.code === "INTEGRATIONS_SECRET_TOO_SHORT"
  })
})

test("HKDF derives distinct 32-byte keys per purpose from INTEGRATIONS_SECRET", () => {
  const seal = deriveAppSecret("first-access-seal", MASTER)
  const cookie = deriveAppSecret("first-access-cookie", MASTER)
  const integrations = deriveAppSecret("integrations", MASTER)
  assert.equal(seal.length, 32)
  assert.equal(cookie.length, 32)
  assert.equal(integrations.length, 32)
  assert.equal(seal.equals(cookie), false)
  assert.equal(seal.equals(integrations), false)
  assert.equal(cookie.equals(integrations), false)
  assert.equal(deriveAppSecret("first-access-seal", MASTER).equals(seal), true)
  assert.equal(APP_SECRET_SALT.includes("woloyem"), true)
})

test("first-access seal/open uses HKDF seal key and rejects the wrong purpose", () => {
  const seal = deriveAppSecret("first-access-seal", MASTER)
  const wrong = deriveAppSecret("first-access-cookie", MASTER)
  const code = "7K4P-82QM"
  const packed = sealSecretValue(code, seal)
  assert.equal(packed.startsWith("enc:"), true)
  assert.equal(packed.includes(code), false)
  assert.equal(openSecretValue(packed, seal), code)
  assert.equal(openSecretValue(packed, wrong), null)
  assert.throws(() => deriveAppSecret("first-access-seal", "x"), (error: unknown) => isIntegrationsSecretError(error))
})

test("first-access cookie HMAC uses HKDF cookie key only", () => {
  const cookie = deriveAppSecret("first-access-cookie", MASTER)
  const seal = deriveAppSecret("first-access-seal", MASTER)
  const id = "11111111-1111-4111-8111-111111111111"
  const now = 1_700_000_000_000
  const proof = sealProof(id, cookie, now)
  assert.equal(openProof(proof, cookie, now)?.invitationId, id)
  assert.equal(openProof(proof, seal, now), null)
})

test("integrations credentials use HKDF integrations key", () => {
  const key = deriveAppSecret("integrations", MASTER)
  const packed = encryptSecret("brevo-key", key)
  assert.equal(packed.includes("brevo-key"), false)
  assert.equal(decryptSecret(packed, key), "brevo-key")
  assert.throws(() => decryptSecret(packed, deriveAppSecret("first-access-seal", MASTER)))
})
