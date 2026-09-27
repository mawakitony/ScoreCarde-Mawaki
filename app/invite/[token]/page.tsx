import Link from "next/link"
import { acceptInvitation } from "@/actions/organization"
import { signOutToLogin } from "@/actions/auth"
import { emailsMatch, inviteReturnPath } from "@/lib/auth/invitation-flow"
import { loadInvitePreview } from "@/lib/auth/invite-lookup"
import { getUser } from "@/lib/auth/session"

export const metadata = { title: "Invitation" }

const reasons: Record<string, string> = {
  email: "Cette invitation est destinée à une autre adresse e-mail.",
  expired: "Cette invitation a expiré.",
  used: "Cette invitation a déjà été acceptée.",
  invalid: "Invitation invalide.",
  quota: "La limite de membres du plan est atteinte.",
  tenant: "Ce compte appartient déjà à une organisation.",
}

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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <p className="text-sm tracking-[0.16em] text-[#8a7340] uppercase">WOLOYEM Score</p>
      <h1 className="font-display mt-3 text-4xl">Rejoindre l&apos;organisation</h1>
      {preview.status === "valid" ? (
        <div className="mt-6 space-y-2 text-sm">
          <p>Vous êtes invité à rejoindre</p>
          <p className="font-display text-3xl">{preview.organizationName}</p>
          <p>Rôle proposé</p>
          <p className="text-base">{preview.roleLabel}</p>
          {preview.maskedEmail ? <p>Invitation envoyée à : {preview.maskedEmail}</p> : null}
        </div>
      ) : null}
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
      {preview.status === "valid" && emailMismatch ? (
        <form action={signOutToLogin} className="mt-6">
          <input type="hidden" name="next" value={back} />
          <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee]" type="submit">
            Se connecter avec une autre adresse
          </button>
        </form>
      ) : null}
      {preview.status === "valid" && !user ? (
        <div className="mt-6 space-y-3 text-sm">
          <p>Pas encore de compte ? Créez-le pour rejoindre {preview.organizationName}.</p>
          <p>
            <Link className="underline" href={`/signup?next=${next}`}>
              Créer un compte
            </Link>
          </p>
          <p>Vous avez déjà un compte ?</p>
          <p>
            <Link className="underline" href={`/login?next=${next}`}>
              Se connecter
            </Link>
          </p>
        </div>
      ) : null}
      {preview.status === "valid" && user && !emailMismatch ? (
        <form action={acceptInvitation.bind(null, token)} className="mt-6">
          <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee]" type="submit">
            Accepter l&apos;invitation
          </button>
        </form>
      ) : null}
    </main>
  )
}
