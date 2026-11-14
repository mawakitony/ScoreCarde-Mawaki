import { hkdfSync } from "node:crypto"

/** Preferred: 64 hex chars from `openssl rand -hex 32` (32 bytes). Minimum accepted length: 32. */
export const INTEGRATIONS_SECRET_MIN_LENGTH = 32

export const APP_SECRET_SALT = "woloyem-app-secret-v1"

export type AppSecretPurpose = "first-access-seal" | "first-access-cookie" | "integrations"

export class IntegrationsSecretError extends Error {
  readonly code: "INTEGRATIONS_SECRET_MISSING" | "INTEGRATIONS_SECRET_TOO_SHORT"

  constructor(code: IntegrationsSecretError["code"], message: string) {
    super(message)
    this.name = "IntegrationsSecretError"
    this.code = code
  }
}

export function integrationsSecretStatus(raw: string | undefined | null) {
  const value = raw?.trim() ?? ""
  if (!value) return { ok: false as const, code: "INTEGRATIONS_SECRET_MISSING" as const, length: 0, format: "missing" as const }
  const format = classifyIntegrationsSecretFormat(value)
  if (value.length < INTEGRATIONS_SECRET_MIN_LENGTH) {
    return { ok: false as const, code: "INTEGRATIONS_SECRET_TOO_SHORT" as const, length: value.length, format }
  }
  return { ok: true as const, length: value.length, format }
}

export function classifyIntegrationsSecretFormat(value: string) {
  if (/^[0-9a-f]+$/i.test(value) && value.length === 64) return "hex64" as const
  if (/^[0-9a-f]+$/i.test(value) && value.length >= INTEGRATIONS_SECRET_MIN_LENGTH) return "hex" as const
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(value) && value.length >= 43) return "base64ish" as const
  return "opaque" as const
}

export function readIntegrationsSecret(env: Record<string, string | undefined> = process.env) {
  const status = integrationsSecretStatus(env.INTEGRATIONS_SECRET)
  if (!status.ok && status.code === "INTEGRATIONS_SECRET_MISSING") {
    throw new IntegrationsSecretError("INTEGRATIONS_SECRET_MISSING", "INTEGRATIONS_SECRET is missing")
  }
  if (!status.ok) {
    throw new IntegrationsSecretError(
      "INTEGRATIONS_SECRET_TOO_SHORT",
      `INTEGRATIONS_SECRET is too short (min ${INTEGRATIONS_SECRET_MIN_LENGTH} characters)`,
    )
  }
  return env.INTEGRATIONS_SECRET!.trim()
}

/** HKDF-SHA-256 → 32-byte key, distinct per purpose label. Never log the result. */
export function deriveAppSecret(purpose: AppSecretPurpose, master?: string) {
  const source = master === undefined ? readIntegrationsSecret() : master
  const status = integrationsSecretStatus(source)
  if (!status.ok) {
    throw new IntegrationsSecretError(
      status.code,
      status.code === "INTEGRATIONS_SECRET_MISSING"
        ? "INTEGRATIONS_SECRET is missing"
        : `INTEGRATIONS_SECRET is too short (min ${INTEGRATIONS_SECRET_MIN_LENGTH} characters)`,
    )
  }
  return Buffer.from(hkdfSync("sha256", source.trim(), APP_SECRET_SALT, purpose, 32))
}

export function isIntegrationsSecretError(error: unknown): error is IntegrationsSecretError {
  return error instanceof IntegrationsSecretError
}
