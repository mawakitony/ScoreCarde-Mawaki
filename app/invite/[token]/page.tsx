import Link from "next/link"
import { AlertCircle, Building2, CheckCircle2, LogIn, UserPlus } from "lucide-react"
import { acceptInvitation } from "@/actions/organization"
import { signOutToLogin } from "@/actions/auth"
import { AuthStage } from "@/components/auth/auth-stage"
import { Logo } from "@/components/brand/logo"
import { emailsMatch, inviteReturnPath } from "@/lib/auth/invitation-flow"
import { loadInvitePreview } from "@/lib/auth/invite-lookup"
import { getUser } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

export const metadata = { title: "Invitation" }

const reasons: Record<string, string> = {
  email: "Cette invitation est destinée à une autre adresse e-mail.",
  expired: "Cette invitation a expiré.",
  used: "Cette invitation a déjà été acceptée.",
  invalid: "Invitation invalide.",
  quota: "La limite de membres du plan est atteinte.",
  tenant: "Ce compte appartient déjà à une organisation.",
}

const btnPrimary = cn(
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#2E5DE6] px-4 text-[15px] font-semibold text-white",
  "shadow-[0_12px_28px_-16px_rgba(7,16,57,0.45)] transition-[transform,box-shadow,background-color] duration-200",
  "hover:-translate-y-px hover:bg-[#1A3BB0]",
  "focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none",
  "dark:bg-[#2E5DE6] dark:hover:bg-[#1A3BB0]",
)

const linkClass =
  "font-semibold text-[#071039] underline-offset-4 hover:text-[#2E5DE6] hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none dark:text-[#AFC5F8]"

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ reason?: string }>
}) {
  const { token } = await params
  const query = await searchParams
  const preview = await loadInvitePreview(token)
  const user = await getUser()
  const back = inviteReturnPath(token)
  const next = encodeURIComponent(back)
  const statusMessage = preview.status === "valid" ? null : reasons[preview.status]
  const reasonMessage = query.reason ? reasons[query.reason] ?? null : null
  const emailMismatch = preview.status === "valid" && user ? !emailsMatch(preview.email, user.email) : false
  const message = emailMismatch ? reasons.email : statusMessage ?? reasonMessage

  return (
    <AuthStage>
      <div className="flex items-center">
        <Logo />
      </div>

      <div className="mt-6 inline-flex size-11 items-center justify-center rounded-2xl bg-[#071039]/8 text-[#071039] dark:bg-[#2E5DE6]/20 dark:text-[#AFC5F8]">
        {preview.status === "valid" && !message ? (
          <Building2 className="size-5" aria-hidden />
        ) : (
          <AlertCircle className="size-5" aria-hidden />
        )}
      </div>

      <h1 className="mt-4 text-[2rem] leading-[1.2] font-semibold tracking-tight text-[#071039] sm:text-[2.15rem] dark:text-[#F5F7FA]">
        Rejoindre l&apos;organisation
      </h1>

      {preview.status === "valid" ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-border bg-muted/40 p-4 text-[14px]">
          <p className="text-muted-foreground">Vous êtes invité à rejoindre</p>
          <p className="text-2xl font-semibold tracking-tight text-[#071039] dark:text-[#F5F7FA]">
            {preview.organizationName}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-card px-3 py-2.5">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Rôle</p>
              <p className="mt-1 font-medium text-foreground">{preview.roleLabel}</p>
            </div>
            {preview.maskedEmail ? (
              <div className="rounded-xl bg-card px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Invitation
                </p>
                <p className="mt-1 font-medium text-foreground">{preview.maskedEmail}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className="mt-5 inline-flex items-start gap-2 rounded-xl border border-border bg-muted/70 px-4 py-3 text-sm text-foreground"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          {message}
        </p>
      ) : null}

      {preview.status === "valid" && emailMismatch ? (
        <form action={signOutToLogin} className="mt-6">
          <input type="hidden" name="next" value={back} />
          <button className={btnPrimary} type="submit">
            <LogIn className="size-4" aria-hidden />
            Se connecter avec une autre adresse
          </button>
        </form>
      ) : null}

      {preview.status === "valid" && !user ? (
        <div className="mt-6 space-y-4 text-[14px]">
          <p className="text-[#5E6D7E] dark:text-[#A8B4C0]">
            Pas encore de compte ? Créez-le pour rejoindre {preview.organizationName}.
          </p>
          <Link href={`/signup?next=${next}`} className={btnPrimary}>
            <UserPlus className="size-4" aria-hidden />
            Créer un compte
          </Link>
          <p className="text-center text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href={`/login?next=${next}`} className={linkClass}>
              Se connecter
            </Link>
          </p>
        </div>
      ) : null}

      {preview.status === "valid" && user && !emailMismatch ? (
        <form action={acceptInvitation.bind(null, token)} className="mt-6">
          <button className={btnPrimary} type="submit">
            <CheckCircle2 className="size-4" aria-hidden />
            Accepter l&apos;invitation
          </button>
        </form>
      ) : null}

      {preview.status !== "valid" ? (
        <p className="mt-6 text-center text-[14px] text-muted-foreground">
          <Link href="/login" className={linkClass}>
            Retour à la connexion
          </Link>
        </p>
      ) : null}
    </AuthStage>
  )
}
