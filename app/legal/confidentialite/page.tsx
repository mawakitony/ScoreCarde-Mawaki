import Link from "next/link"
import { PRIVACY_VERSION } from "@/lib/onboarding/catalog"

export const metadata = { title: "Politique de confidentialité" }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Version {PRIVACY_VERSION}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#071039]">Politique de confidentialité</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#5E6D7E]">
        Nous traitons vos données pour fournir le service WOLOYEM Score (compte, organisation, évaluations). Le détail
        des traitements et de vos droits sera publié dans cette page. La version horodatée ci-dessus est celle
        enregistrée lors de votre consentement.
      </p>
      <p className="mt-6">
        <Link href="/signup" className="font-medium text-[#2E5DE6] underline-offset-4 hover:underline">
          Retour à l’inscription
        </Link>
      </p>
    </main>
  )
}
