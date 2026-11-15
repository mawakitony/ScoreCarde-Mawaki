"use client"

import { useMemo, useState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createOrganization } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  HEADCOUNT_BANDS,
  JOB_FUNCTIONS,
  PRIMARY_OBJECTIVES,
  REFERRAL_SOURCES,
  SECTORS,
} from "@/lib/onboarding/catalog"
import { countryDefaults, toE164 } from "@/lib/onboarding/country-defaults"
import { cn } from "@/lib/utils"

const fieldClass = cn(
  "h-14 w-full rounded-[13px] border border-border bg-muted/40 px-3.5 text-[14px] text-foreground",
  "focus-visible:border-[#2E5DE6] focus-visible:ring-[3px] focus-visible:ring-[#2E5DE6]/25 focus-visible:outline-none",
)

const labelClass = "text-[13px] font-medium text-[#3A4A5C] dark:text-[#B8C4D0]"

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

export function OrgOnboardingForm({
  countries,
  defaultCountry,
}: {
  countries: { code: string; name: string }[]
  defaultCountry: string
}) {
  const [country, setCountry] = useState(defaultCountry || "TG")
  const defaults = useMemo(() => countryDefaults(country), [country])
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [sector, setSector] = useState("formation")
  const [phoneNational, setPhoneNational] = useState("")
  const [currency, setCurrency] = useState(defaults.currency)
  const [language, setLanguage] = useState<"fr" | "en">(defaults.language)
  const [timezone, setTimezone] = useState(defaults.timezone)
  const [step, setStep] = useState<1 | 2>(1)
  const [pending, startTransition] = useTransition()

  function onCountryChange(code: string) {
    setCountry(code)
    const next = countryDefaults(code)
    setCurrency(next.currency)
    setLanguage(next.language)
    setTimezone(next.timezone)
  }

  const phoneE164 = toE164(defaults.dial, phoneNational)

  return (
    <form
      className="mt-6 space-y-6"
      action={(formData) => {
        startTransition(async () => {
          const result = await createOrganization(formData)
          if (result && "error" in result && result.error) toast.error(result.error)
        })
      }}
    >
      <ol className="flex gap-2" aria-label="Progression du formulaire">
        {[
          { n: 1 as const, label: "Votre entreprise" },
          { n: 2 as const, label: "Vous" },
        ].map((item) => (
          <li
            key={item.n}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] font-medium",
              step === item.n
                ? "border-[#2E5DE6]/40 bg-[#2E5DE6]/10 text-[#071039]"
                : step > item.n
                  ? "border-border bg-muted/40"
                  : "border-dashed border-border text-muted-foreground",
            )}
          >
            <span className="font-semibold tabular-nums">{item.n}</span>
            {item.label}
          </li>
        ))}
      </ol>

      <section className={cn("space-y-4", step !== 1 && "hidden")} aria-labelledby="block-company">
        <h2 id="block-company" className="text-lg font-semibold text-[#071039] dark:text-[#F5F7FA]">
          Votre entreprise
        </h2>
        <div className="space-y-2">
          <Label htmlFor="name" className={labelClass}>
            Raison sociale
          </Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            className={fieldClass}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug" className={labelClass}>
            Identifiant (slug)
          </Label>
          <Input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={fieldClass}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country" className={labelClass}>
              Pays
            </Label>
            <select
              id="country"
              name="country"
              required
              className={fieldClass}
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className={labelClass}>
              Ville
            </Label>
            <Input id="city" name="city" required minLength={2} className={fieldClass} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sector" className={labelClass}>
            Secteur
          </Label>
          <select
            id="sector"
            name="sector"
            required
            className={fieldClass}
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            {SECTORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {sector === "autre" ? (
          <div className="space-y-2">
            <Label htmlFor="sectorOther" className={labelClass}>
              Précisez le secteur
            </Label>
            <Input id="sectorOther" name="sectorOther" required minLength={2} className={fieldClass} />
          </div>
        ) : (
          <input type="hidden" name="sectorOther" value="" />
        )}
        <div className="space-y-2">
          <Label htmlFor="headcountBand" className={labelClass}>
            Effectif
          </Label>
          <select id="headcountBand" name="headcountBand" required className={fieldClass} defaultValue="2-10">
            {HEADCOUNT_BANDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency" className={labelClass}>
              Devise
            </Label>
            <select
              id="currency"
              name="currency"
              className={fieldClass}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
            >
              {["XOF", "EUR", "CAD", "USD"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language" className={labelClass}>
              Langue
            </Label>
            <select
              id="language"
              name="language"
              className={fieldClass}
              value={language}
              onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone" className={labelClass}>
              Fuseau horaire
            </Label>
            <Input id="timezone" name="timezone" className={fieldClass} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website" className={labelClass}>
            Site web (facultatif)
          </Label>
          <Input id="website" name="website" type="url" placeholder="https://" className={fieldClass} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalId" className={labelClass}>
            {defaults.legalIdLabel} (facultatif)
          </Label>
          <Input id="legalId" name="legalId" className={fieldClass} />
          <input type="hidden" name="legalIdType" value={defaults.legalIdType} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referralSource" className={labelClass}>
            Comment nous avez-vous connus ? (facultatif)
          </Label>
          <select id="referralSource" name="referralSource" className={fieldClass} defaultValue="">
            <option value="">—</option>
            {REFERRAL_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" className="h-12 w-full rounded-[13px]" onClick={() => setStep(2)}>
          Continuer
        </Button>
      </section>

      <section className={cn("space-y-4", step !== 2 && "hidden")} aria-labelledby="block-you">
        <h2 id="block-you" className="text-lg font-semibold text-[#071039] dark:text-[#F5F7FA]">
          Vous
        </h2>
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className={labelClass}>
            Votre fonction
          </Label>
          <select id="jobTitle" name="jobTitle" required className={fieldClass} defaultValue="dirigeant">
            {JOB_FUNCTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNational" className={labelClass}>
            Téléphone professionnel
          </Label>
          <div className="flex gap-2">
            <span className="inline-flex h-14 items-center rounded-[13px] border border-border bg-muted/40 px-3 text-sm tabular-nums">
              {defaults.dial}
            </span>
            <Input
              id="phoneNational"
              inputMode="tel"
              required
              className={fieldClass}
              placeholder="90 12 34 56"
              value={phoneNational}
              onChange={(e) => setPhoneNational(e.target.value)}
              aria-describedby="phone-hint"
            />
          </div>
          <input type="hidden" name="phoneE164" value={phoneE164} />
          <p id="phone-hint" className="text-[12px] text-muted-foreground">
            Format international : {phoneE164 || `${defaults.dial}…`}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryObjective" className={labelClass}>
            Objectif principal
          </Label>
          <select id="primaryObjective" name="primaryObjective" required className={fieldClass} defaultValue="evaluer_competences">
            {PRIMARY_OBJECTIVES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="h-12 flex-1 rounded-[13px]" onClick={() => setStep(1)}>
            Retour
          </Button>
          <Submit pending={pending} />
        </div>
      </section>
    </form>
  )
}

function Submit({ pending }: { pending: boolean }) {
  const status = useFormStatus()
  const busy = pending || status.pending
  return (
    <Button type="submit" disabled={busy} className="h-12 flex-1 rounded-[13px] bg-[#2E5DE6] text-white hover:bg-[#1A3BB0]">
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      Créer et continuer
    </Button>
  )
}
