import Link from "next/link"
import { TERMS_VERSION } from "@/lib/onboarding/catalog"

export const metadata = { title: "Conditions générales d’utilisation" }

export default function CguPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Version {TERMS_VERSION}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#071039]">Conditions générales d’utilisation</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#5E6D7E]">
        Ce document définit les conditions d’utilisation de WOLOYEM Score. En créant un compte, vous acceptez ces
        conditions. Le texte juridique définitif sera publié ici ; la version horodatée ci-dessus est celle enregistrée
        lors de votre consentement.
      </p>
      <p className="mt-6">
        <Link href="/signup" className="font-medium text-[#2E5DE6] underline-offset-4 hover:underline">
          Retour à l’inscription
        </Link>
      </p>
    </main>
  )
}
