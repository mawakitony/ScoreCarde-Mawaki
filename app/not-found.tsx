import Link from "next/link"
import { CircleHelp } from "lucide-react"
import { Logo } from "@/components/brand/logo"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <Logo />
      <div className="mt-8 inline-flex size-12 items-center justify-center rounded-2xl bg-[#071039]/8 text-[#071039] dark:bg-[#2E5DE6]/20 dark:text-[#AFC5F8]">
        <CircleHelp className="size-6" aria-hidden />
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#071039] dark:text-[#F5F7FA]">
        Page introuvable
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#5E6D7E] dark:text-[#A8B4C0]">
        Cette adresse n&apos;existe pas, ou la scorecard n&apos;est pas publiée.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl bg-[#071039] px-4 text-[14px] font-semibold text-white hover:bg-[#071039] dark:bg-[#2E5DE6]"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-[14px] font-semibold hover:bg-muted/60"
        >
          Connexion
        </Link>
      </div>
    </main>
  )
}
