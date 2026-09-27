"use client"

import { useState } from "react"
import { createAccessPassword, joinExistingAccess, verifyFirstAccess } from "@/actions/first-access"

export function FirstAccessForm({ step, email }: { step: "code" | "password" | "login"; email: string }) {
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    setPending(true)
    setError("")
    const action = step === "password" ? createAccessPassword : step === "login" ? joinExistingAccess : verifyFirstAccess
    const result = await action(formData)
    if (result && "error" in result && result.error) setError(result.error)
    setPending(false)
  }

  return (
    <form action={submit} className="mt-8 space-y-4">
      {step === "code" ? (
        <>
          <label className="block text-sm" htmlFor="email">Adresse email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="h-11 w-full rounded-xl border px-3" />
          <label className="block text-sm" htmlFor="code">Code de première connexion</label>
          <input id="code" name="code" required autoComplete="one-time-code" spellCheck={false} className="h-11 w-full rounded-xl border px-3 uppercase tracking-[0.2em]" />
          <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee]" type="submit" disabled={pending}>Continuer</button>
        </>
      ) : null}
      {step === "password" ? (
        <>
          <p className="text-sm">Créez votre mot de passe pour {email}.</p>
          <label className="block text-sm" htmlFor="password">Nouveau mot de passe</label>
          <input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} className="h-11 w-full rounded-xl border px-3" />
          <label className="block text-sm" htmlFor="confirm">Confirmer le mot de passe</label>
          <input id="confirm" name="confirm" type="password" required autoComplete="new-password" minLength={8} className="h-11 w-full rounded-xl border px-3" />
          <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee]" type="submit" disabled={pending}>Créer mon accès</button>
        </>
      ) : null}
      {step === "login" ? (
        <>
          <p className="text-sm">Un compte existe déjà avec cette adresse.</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <label className="block text-sm" htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" minLength={8} className="h-11 w-full rounded-xl border px-3" />
          <button className="h-11 rounded-xl bg-[#16324F] px-4 text-sm text-[#f7f4ee]" type="submit" disabled={pending}>Se connecter et rejoindre l&apos;organisation</button>
        </>
      ) : null}
      {error ? <p className="text-sm">{error}</p> : null}
    </form>
  )
}
