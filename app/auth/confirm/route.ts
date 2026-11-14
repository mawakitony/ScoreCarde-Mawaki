import { NextResponse } from "next/server"
import { isPasswordResetNext } from "@/lib/auth/password-reset"
import { safeNextPath } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
])

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nextRaw = url.searchParams.get("next")
  const next = safeNextPath(nextRaw)
  const tokenHash = url.searchParams.get("token_hash")
  const typeParam = url.searchParams.get("type")
  const code = url.searchParams.get("code")

  const supabase = await createClient()

  if (tokenHash && typeParam && OTP_TYPES.has(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as EmailOtpType,
      token_hash: tokenHash,
    })
    if (error) {
      return NextResponse.redirect(new URL("/forgot-password?error=expired", url.origin))
    }
    return finishAuth(supabase, next, url.origin)
  }

  // PKCE fallback (same mechanism as magic link /auth/callback).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL("/forgot-password?error=expired", url.origin))
    }
    return finishAuth(supabase, next, url.origin)
  }

  return NextResponse.redirect(new URL("/forgot-password?error=expired", url.origin))
}

async function finishAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  next: string,
  origin: string,
) {
  if (isPasswordResetNext(next)) {
    return NextResponse.redirect(new URL("/reset-password", origin))
  }

  const { error: bootError } = await supabase.rpc("bootstrap_membership")
  if (bootError) {
    if (/organisation_required/i.test(bootError.message)) {
      return NextResponse.redirect(new URL("/onboarding", origin))
    }
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=invite", origin))
  }
  return NextResponse.redirect(new URL(next, origin))
}
