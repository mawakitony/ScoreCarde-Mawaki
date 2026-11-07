"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { sendMagicLink, signIn, signUp } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  return (
    <Tabs defaultValue="password" className="gap-0">
      <TabsList
        className={cn(
          "grid h-12 w-full grid-cols-2 rounded-[14px] border border-border bg-muted/70 p-1",
          "dark:border-[#243140] dark:bg-[#141E28]",
        )}
      >
        <TabsTrigger
          value="password"
          className="rounded-[10px] text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 data-active:bg-card data-active:font-semibold data-active:text-foreground data-active:shadow-sm dark:data-active:bg-[#1C2A38]"
        >
          Mot de passe
        </TabsTrigger>
        <TabsTrigger
          value="magic"
          className="rounded-[10px] text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200 data-active:bg-card data-active:font-semibold data-active:text-foreground data-active:shadow-sm dark:data-active:bg-[#1C2A38]"
        >
          Lien magique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="password" className="mt-6 space-y-0">
        <AuthForm
          configured={configured}
          action={async (formData) => {
            formData.set("next", next)
            const result = await signIn(formData)
            if (result?.error) toast.error(result.error)
          }}
        >
          <EmailField />
          <PasswordField autoComplete="current-password" />
          <Submit label="Se connecter" withArrow />
        </AuthForm>
      </TabsContent>

      <TabsContent value="magic" className="mt-6">
        <AuthForm
          configured={configured}
          action={async (formData) => {
            formData.set("next", next)
            const result = await sendMagicLink(formData)
            if (result?.error) toast.error(result.error)
            if (result?.message) toast.success(result.message)
          }}
        >
          <EmailField />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Nous envoyons un lien à usage unique sur votre boîte email. Aucun mot de passe n’est requis.
          </p>
          <Submit label="Recevoir le lien" withArrow />
        </AuthForm>
      </TabsContent>
    </Tabs>
  )
}

export function SignupForm({ configured, next, defaultEmail }: { configured: boolean; next: string; defaultEmail?: string }) {
  const [message, setMessage] = useState<string | null>(null)

  return (
    <AuthForm
      configured={configured}
      action={async (formData) => {
        formData.set("next", next)
        const result = await signUp(formData)
        if (result?.error) toast.error(result.error)
        if (result?.message) setMessage(result.message)
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fullName" className={labelClass}>
          Nom
        </Label>
        <Input id="fullName" name="fullName" className={cn(fieldClass, "pl-3.5")} required />
      </div>
      <EmailField defaultValue={defaultEmail} />
      <PasswordField autoComplete="new-password" />
      <Submit label="Créer le compte" withArrow />
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </AuthForm>
  )
}

function AuthForm({
  action,
  children,
  configured,
}: {
  action: (formData: FormData) => Promise<void>
  children: React.ReactNode
  configured: boolean
}) {
  return (
    <form action={action}>
      <fieldset disabled={!configured} className="space-y-4 disabled:opacity-60">
        {children}
      </fieldset>
      {configured ? null : (
        <p className="mt-4 text-sm text-destructive">
          Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.
        </p>
      )}
    </form>
  )
}

function EmailField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className={labelClass}>
        Email
      </Label>
      <div className="relative">
        <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@entreprise.com"
          className={fieldClass}
          required
          defaultValue={defaultValue}
        />
      </div>
    </div>
  )
}

function PasswordField({ autoComplete }: { autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
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
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={cn(fieldClass, "pr-11")}
          required
          minLength={8}
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
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function Submit({ label, withArrow }: { label: string; withArrow?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className={cn(
        "group mt-2 h-14 w-full rounded-[13px] bg-[#2E5DE6] text-[15px] font-semibold text-white",
        "shadow-[0_12px_28px_-16px_rgba(7,16,57,0.45)] transition-[transform,box-shadow,background-color] duration-200",
        "hover:-translate-y-px hover:bg-[#1A3BB0] hover:shadow-[0_16px_32px_-14px_rgba(26,59,176,0.55)]",
        "active:translate-y-0 active:shadow-[0_10px_22px_-16px_rgba(7,16,57,0.45)]",
        "focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/35",
        "dark:bg-[#2E5DE6] dark:hover:bg-[#6E92F2]",
        "disabled:translate-y-0 disabled:opacity-70",
      )}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Veuillez patienter...
        </>
      ) : (
        <>
          {label}
          {withArrow ? (
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          ) : null}
        </>
      )}
    </Button>
  )
}
