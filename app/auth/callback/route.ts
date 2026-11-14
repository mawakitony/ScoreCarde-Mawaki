import { NextResponse } from "next/server"
import { invitationKeepsSession } from "@/lib/auth/invite-session"
import { isPasswordResetNext } from "@/lib/auth/password-reset"
import { safeNextPath } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = safeNextPath(url.searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Recovery PKCE landing: skip org bootstrap, go set the new password.
      if (isPasswordResetNext(next)) {
        return NextResponse.redirect(new URL("/reset-password", url.origin))
      }

      const { error: bootError } = await supabase.rpc("bootstrap_membership")
      if (bootError) {
        if (await invitationKeepsSession(next)) return NextResponse.redirect(new URL(next, url.origin))
        if (/organisation_required/i.test(bootError.message)) {
          return NextResponse.redirect(new URL("/onboarding", url.origin))
        }
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL("/login?error=invite", url.origin))
      }
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  // token_hash recovery links may land here if the template uses Site URL + callback by mistake.
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type")
  if (tokenHash && type === "recovery") {
    const confirm = new URL("/auth/confirm", url.origin)
    confirm.searchParams.set("token_hash", tokenHash)
    confirm.searchParams.set("type", type)
    confirm.searchParams.set("next", "/reset-password")
    return NextResponse.redirect(confirm)
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin))
}
