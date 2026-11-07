import { LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import { FirstAccessForm } from "@/components/auth/first-access-form"
import { AuthStage } from "@/components/auth/auth-stage"
import { Logo } from "@/components/brand/logo"
import { firstAccessStep } from "@/actions/first-access"

export const metadata = { title: "Première connexion" }

const copy = {
  code: {
    title: "Première connexion",
    description: "Saisissez l'adresse email invitée et le code reçu. Aucun mot de passe temporaire n'est envoyé.",
    Icon: Mail,
  },
  password: {
    title: "Créez votre mot de passe",
    description: "Choisissez un mot de passe sécurisé pour finaliser votre accès WOLOYEM Score.",
    Icon: LockKeyhole,
  },
  login: {
    title: "Rejoindre l'organisation",
    description: "Un compte existe déjà avec cette adresse. Connectez-vous pour accepter l'invitation.",
    Icon: ShieldCheck,
  },
} as const

export default async function FirstAccessPage() {
  const state = await firstAccessStep()
  const current = copy[state.step]
  const Icon = current.Icon

  return (
    <AuthStage>
      <div className="flex items-center">
        <Logo />
      </div>

      <div className="mt-6 inline-flex size-11 items-center justify-center rounded-2xl bg-[#071039]/8 text-[#071039] dark:bg-[#2E5DE6]/20 dark:text-[#AFC5F8]">
        <Icon className="size-5" aria-hidden />
      </div>

      <h1 className="mt-4 text-[2rem] leading-[1.2] font-semibold tracking-tight text-[#071039] sm:text-[2.15rem] dark:text-[#F5F7FA]">
        {current.title}
      </h1>
      <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed text-[#5E6D7E] dark:text-[#A8B4C0]">
        {current.description}
      </p>

      <FirstAccessForm step={state.step} email={state.email} />
    </AuthStage>
  )
}
