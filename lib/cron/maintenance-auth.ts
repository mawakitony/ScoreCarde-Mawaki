/** Auth-only probe for /api/cron/maintenance — never runs jobs. */
export function isMaintenanceDryRun(request: { method: string; url: string }) {
  if (request.method === "HEAD") return true
  try {
    return new URL(request.url).searchParams.get("dry_run") === "1"
  } catch {
    return false
  }
}
