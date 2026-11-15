import { NextResponse } from "next/server"
import {
  buildMagicLinkRedirectTo,
  buildPasswordResetRedirectTo,
} from "@/lib/auth/password-reset"
import { getAppUrl } from "@/lib/env"

/**
 * Temporary protected probe: confirms the baked NEXT_PUBLIC_APP_URL / getAppUrl()
 * used by Auth email redirectTo (reset + magic link). Remove after prod verify.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get("authorization")
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const appUrl = getAppUrl()
  return NextResponse.json({
    appUrl,
    passwordResetRedirectTo: buildPasswordResetRedirectTo(appUrl),
    magicLinkRedirectTo: buildMagicLinkRedirectTo(appUrl, "/dashboard"),
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  })
}
