"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { ArrowRight, Loader2, Mail } from "lucide-react"
import { requestPasswordReset } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
const COOLDOWN_SECONDS = 60

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          setError(null)
          const result = await requestPasswordReset(formData)
          if (result?.error) {
            setError(result.error)
            if ("rateLimited" in result && result.rateLimited) setCooldown(COOLDOWN_SECONDS)
            return
          }
          if (result?.message) {
            setMessage(result.message)
            setCooldown(COOLDOWN_SECONDS)
          }
        })
      }}
    >
      <fieldset disabled={!configured || pending || cooldown > 0} className="space-y-4 disabled:opacity-60">
        <div className="space-y-2">
          <Label htmlFor="email" className={labelClass}>
            Email
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@entreprise.com"
              className={fieldClass}
              required
              aria-describedby={error ? "forgot-error" : message ? "forgot-message" : undefined}
            />
          </div>
        </div>

        <Submit cooldown={cooldown} />
      </fieldset>

      {error ? (
        <p id="forgot-error" className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p id="forgot-message" className="mt-4 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {!configured ? (
        <p className="mt-4 text-sm text-destructive">
          Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.
        </p>
      ) : null}

      <p className="mt-7 text-center text-[14px] text-muted-foreground">
        <Link
          href="/login"
          className="font-semibold text-[#071039] underline-offset-4 transition-colors hover:text-[#2E5DE6] hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none dark:text-[#AFC5F8] dark:hover:text-white"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}

function Submit({ cooldown }: { cooldown: number }) {
  const { pending } = useFormStatus()
  const disabled = pending || cooldown > 0
  return (
    <Button
      type="submit"
      disabled={disabled}
      className={cn(
        "group mt-2 h-14 w-full rounded-[13px] bg-[#2E5DE6] text-[15px] font-semibold text-white",
        "shadow-[0_12px_28px_-16px_rgba(7,16,57,0.45)] transition-[transform,box-shadow,background-color] duration-200",
        "hover:-translate-y-px hover:bg-[#1A3BB0] hover:shadow-[0_16px_32px_-14px_rgba(26,59,176,0.55)]",
        "focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/35",
        "disabled:translate-y-0 disabled:opacity-70",
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Envoi en cours...
        </>
      ) : cooldown > 0 ? (
        `Renvoyer dans ${cooldown}s`
      ) : (
        <>
          Envoyer le lien
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </>
      )}
    </Button>
  )
}
