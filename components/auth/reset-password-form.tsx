"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { updatePasswordFromRecovery } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PASSWORD_MIN_LENGTH, passwordMeetsPolicy, passwordsMatch } from "@/lib/auth/password-reset"
import { cn } from "@/lib/utils"

const fieldClass = cn(
  "h-14 rounded-[13px] border-border bg-muted/40 pl-11 text-[14px] text-foreground",
  "shadow-[0_1px_2px_rgba(7,16,57,0.04)] transition-[border-color,box-shadow,background-color] duration-200",
  "placeholder:text-muted-foreground/80",
  "hover:border-[#B8C6D4] hover:bg-muted/55",
  "focus-visible:border-[#2E5DE6] focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/25",
  "dark:border-[#2A3A4A] dark:bg-[#141E28] dark:hover:border-[#3A4E60] dark:hover:bg-[#182430]",
  "dark:focus-visible:border-[#6E92F2] dark:focus-visible:bg-[#141E28] dark:focus-visible:ring-[#6E92F2]/25",
)

const labelClass = "text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]"

export function ResetPasswordForm({ mfaRequiredInitially }: { mfaRequiredInitially: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [mfaRequired, setMfaRequired] = useState(mfaRequiredInitially)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const lengthOk = passwordMeetsPolicy(password)
  const matchOk = confirm.length > 0 && passwordsMatch(password, confirm)
  const canSubmit = useMemo(() => lengthOk && matchOk, [lengthOk, matchOk])

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          setError(null)
          const result = await updatePasswordFromRecovery(formData)
          if (!result) return
          if (result.expired) {
            router.replace("/forgot-password?error=expired")
            return
          }
          if (result.mfaRequired) setMfaRequired(true)
          if (result.error) setError(result.error)
        })
      }}
      className="space-y-4"
    >
      <PasswordInput
        id="password"
        name="password"
        label="Nouveau mot de passe"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmer le mot de passe"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
      />

      <ul className="space-y-1.5 text-[13px]" aria-live="polite">
        <Rule ok={lengthOk}>Au moins {PASSWORD_MIN_LENGTH} caractères</Rule>
        <Rule ok={matchOk}>Les deux champs correspondent</Rule>
      </ul>

      {mfaRequired ? (
        <div className="space-y-2">
          <Label htmlFor="mfaCode" className={labelClass}>
            Code MFA (6 chiffres)
          </Label>
          <Input
            id="mfaCode"
            name="mfaCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            className={cn(fieldClass, "pl-3.5")}
            aria-describedby={error ? "reset-error" : undefined}
          />
        </div>
      ) : null}

      <Submit disabled={!canSubmit} />

      {error ? (
        <p id="reset-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
      <span className="sr-only">{ok ? "OK : " : "À faire : "}</span>
      {children}
    </li>
  )
}

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  value,
  onChange,
}: {
  id: string
  name: string
  label: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClass}>
        {label}
      </Label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(fieldClass, "pr-11")}
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
        <button
          type="button"
          className={cn(
            "absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground",
            "transition-colors duration-200 hover:bg-muted hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none",
          )}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "group mt-2 h-14 w-full rounded-[13px] bg-[#2E5DE6] text-[15px] font-semibold text-white",
        "shadow-[0_12px_28px_-16px_rgba(7,16,57,0.45)] transition-[transform,box-shadow,background-color] duration-200",
        "hover:-translate-y-px hover:bg-[#1A3BB0]",
        "focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/35",
        "disabled:translate-y-0 disabled:opacity-70",
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Enregistrement...
        </>
      ) : (
        <>
          Enregistrer le mot de passe
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </>
      )}
    </Button>
  )
}
