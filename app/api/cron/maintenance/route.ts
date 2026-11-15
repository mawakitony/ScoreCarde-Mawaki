import { NextResponse } from "next/server"
import { isMaintenanceDryRun } from "@/lib/cron/maintenance-auth"
import { runMaintenance } from "@/lib/maintenance/jobs"

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get("authorization")
  return Boolean(secret && header === `Bearer ${secret}`)
}

async function run(request: Request) {
  if (!authorize(request)) return unauthorized()

  if (isMaintenanceDryRun(request)) {
    if (request.method === "HEAD") return new NextResponse(null, { status: 200 })
    return NextResponse.json({ ok: true, dry_run: true })
  }

  try {
    await runMaintenance()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}

export const GET = run
export const POST = run
export const HEAD = run
