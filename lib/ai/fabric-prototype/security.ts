const INJECTION = [
  /ignore\s+(toutes?\s+les\s+)?(regles|instructions|permissions)/i,
  /ignore\s+all\s+(rules|instructions|permissions)/i,
  /disregard\s+(previous|system)/i,
  /\[\s*system\s*\]\s*:/i,
  /system\s*:/i,
  /you\s+are\s+now\s+/i,
  /tu\s+es\s+maintenant/i,
]

const SECRET_PROBE = [
  /AI_API_KEY/i,
  /SUPABASE_SERVICE_ROLE/i,
  /sk_(live|test)_/i,
  /Bearer\s+[A-Za-z0-9._\-]+/i,
  /service_role/i,
  /reveal\s+(the\s+)?(secret|api\s*key|prompt)/i,
  /montre\s+(le\s+)?(secret|cle\s*api|prompt\s*systeme)/i,
]

const CROSS_TENANT = [
  /autre\s+tenant/i,
  /other\s+tenant/i,
  /organizationId\s*[:=]\s*\S{8,}/i,
  /acces\s+(a\s+)?(toutes?\s+les\s+)?organisations/i,
  /access\s+all\s+organizations/i,
]

/** Fields that must never appear in pattern output as executable actions. */
export const FORBIDDEN_OUTPUT_KEYS = [
  "serverAction",
  "sql",
  "supabase",
  "write",
  "delete",
  "publish",
  "billing",
  "stripe",
  "executeTool",
  "toolCall",
  "mutation",
] as const

function normalizeText(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "")
}

export function redactSecrets(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "[redacted]")
    .replace(/sk_(live|test)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/service_role/gi, "[redacted]")
    .replace(/AI_API_KEY\s*=\s*\S+/gi, "AI_API_KEY=[redacted]")
    .replace(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/gi, "SUPABASE_SERVICE_ROLE_KEY=[redacted]")
}

export function looksLikePromptInjection(text: string) {
  const normalized = normalizeText(text)
  return INJECTION.some((pattern) => pattern.test(normalized))
}

export function looksLikeSecretProbe(text: string) {
  const normalized = normalizeText(text)
  return SECRET_PROBE.some((pattern) => pattern.test(normalized))
}

export function looksLikeCrossTenantProbe(text: string) {
  const normalized = normalizeText(text)
  return CROSS_TENANT.some((pattern) => pattern.test(normalized))
}

export function stringifyForScan(value: unknown): string {
  try {
    return typeof value === "string" ? value : JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function rejectUnsafeInput(raw: unknown, maxChars: number): { ok: true; text: string } | { ok: false; reason: string } {
  const text = redactSecrets(stringifyForScan(raw))
  if (text.length > maxChars) {
    return { ok: false, reason: `Entrée trop longue (max ${maxChars} caractères).` }
  }
  if (looksLikeSecretProbe(text)) {
    return { ok: false, reason: "Demande de secrets refusée." }
  }
  if (looksLikeCrossTenantProbe(text)) {
    return { ok: false, reason: "Accès cross-tenant refusé." }
  }
  // Injection: do not treat prompt alone as security boundary — still allow
  // benign drafting text that mentions "ignore" in domain sense only when
  // combined with secret/tenant probes above. Hard-reject classic jailbreaks.
  if (looksLikePromptInjection(text) && /(secret|api\s*key|tenant|publie|delete|sql|supabase)/i.test(normalizeText(text))) {
    return { ok: false, reason: "Entrée potentiellement malveillante refusée." }
  }
  if (looksLikePromptInjection(text) && /system\s*prompt|ignore\s+all\s+instructions/i.test(normalizeText(text))) {
    return { ok: false, reason: "Tentative de contournement des instructions refusée." }
  }
  return { ok: true, text }
}

export function stripForbiddenOutputKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripForbiddenOutputKeys)
  if (!value || typeof value !== "object") return value
  const out: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if ((FORBIDDEN_OUTPUT_KEYS as readonly string[]).includes(key)) continue
    out[key] = stripForbiddenOutputKeys(nested)
  }
  return out
}

export function extractJsonObject(content: string): string {
  const trimmed = content.trim()
  if (trimmed.startsWith("{")) return trimmed
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}
