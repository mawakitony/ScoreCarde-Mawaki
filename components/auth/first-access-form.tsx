"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { createAccessPassword, joinExistingAccess, verifyFirstAccess } from "@/actions/first-access"
import { cn } from "@/lib/utils"

const fieldClass = cn(
  "h-14 w-full rounded-[13px] border border-border bg-muted/40 px-3.5 text-[14px] text-foreground",
  "shadow-[0_1px_2px_rgba(7,16,57,0.04)] transition-[border-color,box-shadow,background-color] duration-200",
  "placeholder:text-muted-foreground/80",
  "hover:border-[#B8C6D4] hover:bg-muted/55",
  "focus-visible:border-[#2E5DE6] focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/25 focus-visible:outline-none",
  "dark:border-[#2A3A4A] dark:bg-[#141E28] dark:hover:border-[#3A4E60]",
  "dark:focus-visible:border-[#6E92F2] dark:focus-visible:ring-[#6E92F2]/25",
)

const labelClass = "text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]"

const submitClass = cn(
  "group mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[13px] bg-[#2E5DE6] text-[15px] font-semibold text-white",
  "shadow-[0_12px_28px_-16px_rgba(7,16,57,0.45)] transition-[transform,box-shadow,background-color] duration-200",
  "hover:-translate-y-px hover:bg-[#1A3BB0]",
  "focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none",
  "disabled:translate-y-0 disabled:opacity-70",
  "dark:bg-[#2E5DE6] dark:hover:bg-[#1A3BB0]",
)

export function FirstAccessForm({ step, email }: { step: "code" | "password" | "login"; email: string }) {
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setError("")
    const action =
      step === "password" ? createAccessPassword : step === "login" ? joinExistingAccess : verifyFirstAccess
    const result = await action(formData)
    if (result && "error" in result && result.error) setError(result.error)
    setPending(false)
  }

  return (
    <form action={submit} className="mt-7 space-y-4 sm:mt-8">
      {step === "code" ? (
        <>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="code">
              Code de première connexion
            </label>
            <input
              id="code"
              name="code"
              required
              autoComplete="one-time-code"
              spellCheck={false}
              className={cn(fieldClass, "uppercase tracking-[0.2em]")}
            />
          </div>
          <button className={submitClass} type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Vérification…
              </>
            ) : (
              <>
                Continuer
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <p className="text-[14px] text-[#5E6D7E] dark:text-[#A8B4C0]">
            Créez votre mot de passe pour <span className="font-medium text-foreground">{email}</span>.
          </p>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="password">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="confirm">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className={fieldClass}
            />
          </div>
          <button className={submitClass} type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Création…
              </>
            ) : (
              <>
                Créer mon accès
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
        </>
      ) : null}

      {step === "login" ? (
        <>
          <p className="text-[14px] text-[#5E6D7E] dark:text-[#A8B4C0]">
            Un compte existe déjà avec cette adresse.
          </p>
          <p className="rounded-xl bg-muted/50 px-3 py-2 text-[14px] font-medium text-foreground">{email}</p>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              className={fieldClass}
            />
          </div>
          <button className={submitClass} type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Connexion…
              </>
            ) : (
              <>
                Se connecter et rejoindre l&apos;organisation
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
        </>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
