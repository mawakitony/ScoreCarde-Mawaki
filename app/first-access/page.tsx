import { FirstAccessForm } from "@/components/auth/first-access-form"
import { firstAccessStep } from "@/actions/first-access"

export const metadata = { title: "Première connexion" }

export default async function FirstAccessPage() {
  const state = await firstAccessStep()

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <p className="text-sm tracking-[0.16em] text-[#8a7340] uppercase">WOLOYEM Score</p>
      <h1 className="font-display mt-3 text-4xl">{state.step === "password" ? "Créez votre mot de passe" : state.step === "login" ? "Rejoindre l'organisation" : "Première connexion"}</h1>
      {state.step === "code" ? (
        <p className="mt-3 text-sm text-muted-foreground">Saisissez l&apos;adresse email invitée et le code reçu. Aucun mot de passe temporaire n&apos;est envoyé.</p>
      ) : null}
      <FirstAccessForm step={state.step} email={state.email} />
    </main>
  )
}
