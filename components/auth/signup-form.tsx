"use client"

import { useState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { signUp } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TurnstileField } from "@/components/auth/turnstile-field"
import { passwordStrengthHints } from "@/lib/onboarding/validators"
import { cn } from "@/lib/utils"

const fieldClass = cn(
  "h-14 w-full rounded-[13px] border-border bg-muted/40 px-3.5 text-[14px] text-foreground",
  "shadow-[0_1px_2px_rgba(7,16,57,0.04)] transition-[border-color,box-shadow,background-color] duration-200",
  "placeholder:text-muted-foreground/80",
  "hover:border-[#B8C6D4] hover:bg-muted/55",
  "focus-visible:border-[#2E5DE6] focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/25",
  "dark:border-[#2A3A4A] dark:bg-[#141E28] dark:hover:border-[#3A4E60]",
  "dark:focus-visible:border-[#6E92F2] dark:focus-visible:ring-[#6E92F2]/25",
)

const labelClass = "text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]"

export function SignupForm({
  configured,
  next,
  defaultEmail,
  countries,
  turnstileSiteKey,
}: {
  configured: boolean
  next: string
  defaultEmail?: string
  countries: { code: string; name: string }[]
  turnstileSiteKey: string | null
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const strength = passwordStrengthHints(password)

  return (
    <form
      action={async (formData) => {
        formData.set("next", next)
        const result = await signUp(formData)
        if (result?.error) toast.error(result.error)
        if (result?.message) setMessage(result.message)
      }}
    >
      <fieldset disabled={!configured} className="space-y-4 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className={labelClass}>
              Prénom
            </Label>
            <Input id="firstName" name="firstName" autoComplete="given-name" required className={fieldClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className={labelClass}>
              Nom
            </Label>
            <Input id="lastName" name="lastName" autoComplete="family-name" required className={fieldClass} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className={labelClass}>
            E-mail
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@entreprise.com"
              className={cn(fieldClass, "pl-11")}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className={labelClass}>
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              className={cn(fieldClass, "pl-11 pr-11")}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-hints"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none"
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={visible}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <ul id="password-hints" className="grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
            <li className={strength.length ? "text-emerald-700 dark:text-emerald-300" : undefined}>8 caractères min.</li>
            <li className={strength.upper ? "text-emerald-700 dark:text-emerald-300" : undefined}>1 majuscule</li>
            <li className={strength.lower ? "text-emerald-700 dark:text-emerald-300" : undefined}>1 minuscule</li>
            <li className={strength.digit ? "text-emerald-700 dark:text-emerald-300" : undefined}>1 chiffre</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className={labelClass}>
            Pays
          </Label>
          <select id="country" name="country" required defaultValue="TG" className={fieldClass}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[#3A4A5C] dark:text-[#B8C4D0]">
            <input id="acceptTerms" name="acceptTerms" type="checkbox" value="true" required className="mt-1 size-4" />
            <span>
              J&apos;accepte les{" "}
              <Link href="/legal/cgu" className="font-semibold text-[#2E5DE6] underline-offset-2 hover:underline" target="_blank">
                CGU
              </Link>{" "}
              et la{" "}
              <Link
                href="/legal/confidentialite"
                className="font-semibold text-[#2E5DE6] underline-offset-2 hover:underline"
                target="_blank"
              >
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-[13px] leading-relaxed text-[#3A4A5C] dark:text-[#B8C4D0]">
            <input id="marketingConsent" name="marketingConsent" type="checkbox" value="true" className="mt-1 size-4" />
            <span>J&apos;accepte de recevoir des informations produit (facultatif).</span>
          </label>
        </div>

        {turnstileSiteKey ? <TurnstileField siteKey={turnstileSiteKey} /> : null}

        <Submit />
        {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
      </fieldset>
      {configured ? null : (
        <p className="mt-4 text-sm text-destructive">
          Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.
        </p>
      )}
    </form>
  )
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="mt-2 h-14 w-full rounded-[13px] bg-[#2E5DE6] text-[15px] font-semibold text-white hover:bg-[#1A3BB0]"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Créer le compte
      {!pending ? <ArrowRight className="size-4" /> : null}
    </Button>
  )
}
