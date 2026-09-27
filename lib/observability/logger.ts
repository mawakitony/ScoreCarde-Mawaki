type Level = "debug" | "info" | "warn" | "error"

const SECRET = /token|password|secret|api[_-]?key|authorization/i
const ACCESS_CODE = /\b[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}\b/g

export function redactInvitePath(value: string) {
  return value.replace(/\/invite\/[A-Za-z0-9_-]+/g, "/invite/[REDACTED]")
}

export function redactAccessCode(value: string) {
  return value.replace(ACCESS_CODE, "[CODE]")
}

export function redact(fields: Record<string, string | number | null | undefined>) {
  const safe: Record<string, string | number | null> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (SECRET.test(key) || /^code$/i.test(key) || value === undefined) continue
    safe[key] = typeof value === "string" ? redactAccessCode(redactInvitePath(value)).slice(0, 180) : value
  }
  return safe
}

export function log(level: Level, event: string, fields: Record<string, string | number | null | undefined> = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...redact(fields) })
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else if (level === "debug") return
  else console.info(line)
}
