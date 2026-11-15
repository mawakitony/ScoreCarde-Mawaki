import Link from "next/link"
import { TERMS_VERSION } from "@/lib/onboarding/catalog"

export const metadata = { title: "Conditions générales d’utilisation" }

export default function CguPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p
        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
        role="status"
      >
        Document en cours de validation — page provisoire, sans valeur juridique définitive.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">Version {TERMS_VERSION}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#071039]">Conditions générales d’utilisation</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#5E6D7E]">
        Le texte juridique définitif des conditions d’utilisation de WOLOYEM Score sera publié ici après validation.
        Cette page provisoire permet uniquement d’ancrer la version de consentement ({TERMS_VERSION}) enregistrée lors
        de l’inscription. Aucun contenu juridique n’est inventé ici.
      </p>
      <p className="mt-6">
        <Link href="/signup" className="font-medium text-[#2E5DE6] underline-offset-4 hover:underline">
          Retour à l’inscription
        </Link>
      </p>
    </main>
  )
}
