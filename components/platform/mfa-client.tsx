"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function browserClient() {
  return createClient()
}

export function PlatformMfaClient({ initialStep }: { initialStep: "enroll" | "verify" }) {
  const router = useRouter()
  const [step, setStep] = useState<"enroll" | "verify">(initialStep)
  const [factorId, setFactorId] = useState("")
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function enroll() {
    start(async () => {
      setError(null)
      const supabase = browserClient()
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "WOLOYEM Platform" })
      if (enrollError || !data) {
        setError(enrollError?.message ?? "Enrôlement impossible.")
        return
      }
      setFactorId(data.id)
      setQr(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStep("verify")
    })
  }

  function verify() {
    start(async () => {
      setError(null)
      const supabase = browserClient()
      let id = factorId
      if (!id) {
        const factors = await supabase.auth.mfa.listFactors()
        id = factors.data?.totp?.[0]?.id ?? ""
      }
      if (!id) {
        setError("Aucun facteur TOTP. Relancez l'enrôlement.")
        return
      }
      const challenge = await supabase.auth.mfa.challenge({ factorId: id })
      if (challenge.error || !challenge.data) {
        setError(challenge.error?.message ?? "Challenge MFA impossible.")
        return
      }
      const verified = await supabase.auth.mfa.verify({
        factorId: id,
        challengeId: challenge.data.id,
        code: code.trim(),
      })
      if (verified.error) {
        setError(verified.error.message)
        return
      }
      router.replace("/platform")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 text-sm">
      {step === "enroll" ? (
        <button
          type="button"
          disabled={pending}
          onClick={enroll}
          className="rounded-xl bg-[#071039] px-4 py-2 text-[#f7f4ee] disabled:opacity-60"
        >
          Activer le MFA (TOTP)
        </button>
      ) : (
        <div className="space-y-3">
          {qr ? (
            <div>
              <p className="mb-2">Scannez ce QR code avec votre application d&apos;authentification :</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR MFA" className="h-48 w-48 rounded-xl border bg-white p-2" />
              {secret ? <p className="mt-2 break-all text-xs text-[#5e6d7e]">Secret : {secret}</p> : null}
            </div>
          ) : (
            <p>Saisissez le code de votre application d&apos;authentification déjà enregistrée.</p>
          )}
          <label className="block">
            Code à 6 chiffres
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-1 h-10 w-full rounded-xl border px-3"
            />
          </label>
          <button
            type="button"
            disabled={pending || code.trim().length < 6}
            onClick={verify}
            className="rounded-xl bg-[#071039] px-4 py-2 text-[#f7f4ee] disabled:opacity-60"
          >
            Vérifier et continuer
          </button>
          {!qr ? (
            <button type="button" className="block underline" onClick={enroll} disabled={pending}>
              Ré-enrôler un facteur
            </button>
          ) : null}
        </div>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  )
}
