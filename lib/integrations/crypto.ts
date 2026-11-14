// Credentials are encrypted with AES-256-GCM before storage.
// Production key material: HKDF(INTEGRATIONS_SECRET, label "integrations") → 32 bytes.
// String secrets (tests) still hash with SHA-256 for a 32-byte AES key.
// The plaintext never goes in a column, a log, or a Client Component.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

function aesKey(material: string | Buffer) {
  if (Buffer.isBuffer(material)) {
    if (material.length !== 32) throw new Error("credential_key_invalid")
    return material
  }
  return createHash("sha256").update(material).digest()
}

export function encryptSecret(plain: string, secret: string | Buffer) {
  const key = aesKey(secret)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptSecret(packed: string, secret: string | Buffer) {
  const [ivRaw, tagRaw, dataRaw] = packed.split(".")
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error("credential_invalid")
  const key = aesKey(secret)
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64url"))
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"))
  return Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8")
}
