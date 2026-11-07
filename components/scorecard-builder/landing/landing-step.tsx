"use client"

import { useState } from "react"
import { saveLanding } from "@/actions/builder"
import { LandingView, type LandingContent } from "@/components/assessment/landing-view"
import { AssetField } from "@/components/scorecard-builder/asset-field"
import { AreaField, TextField, ToggleField } from "@/components/scorecard-builder/editor-fields"
import { ScoreAppSurface } from "@/components/theme/scoreapp-surface"
import { ScaledInlinePreview } from "@/components/templates/scaled-inline-preview"
import { Button } from "@/components/ui/button"
import { useAutosave } from "@/hooks/use-autosave"
import { landingSchema, type LandingInput } from "@/lib/validators/builder"
import type { BuilderPage } from "@/types/builder"

export function LandingStep({
  page,
  privacyText,
  organizationId,
  scorecardId,
  preview,
  revision = 0,
  onChange,
}: {
  page: BuilderPage
  privacyText: string
  organizationId: string
  scorecardId: string
  preview: LandingContent
  revision?: number
  onChange: (value: LandingInput) => void
}) {
  const [value, setValue] = useState<LandingInput>({
    eyebrow: page.eyebrow,
    title: page.title,
    subtitle: page.subtitle,
    description: page.description,
    heroImageUrl: page.heroImageUrl,
    ctaLabel: page.ctaLabel,
    estimatedTimeLabel: page.estimatedTimeLabel,
    showEstimatedTime: page.showEstimatedTime,
    showQuestionCount: page.showQuestionCount,
    showPrivacy: page.showPrivacy,
    privacyText,
    benefits: page.benefits,
    testimonial: page.testimonial,
    landingTheme: page.landingTheme ?? "classic",
    highlightText: page.highlightText ?? "",
    secondaryCtaLabel: page.secondaryCtaLabel ?? "",
    trustLabel: page.trustLabel ?? "",
    backgroundColor: page.backgroundColor ?? "",
    accentColor: page.accentColor ?? "",
    demoStats: page.demoStats ?? [],
  })

  useAutosave(value, async (current) => {
    const parsed = landingSchema.safeParse(current)
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides.", quiet: true }
    return saveLanding(scorecardId, parsed.data)
  }, revision)

  function update(next: LandingInput) {
    setValue(next)
    onChange(next)
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Page d&apos;accueil</h2>
          <p className="mt-2 text-sm text-muted-foreground">Page d&apos;accueil structurée, sans constructeur libre.</p>
        </div>
        {value.landingTheme !== "classic" ? (
          <p className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            Thème visuel : <span className="font-semibold text-foreground">{value.landingTheme}</span> — les textes et couleurs ci-dessous personnalisent ce modèle sans modifier la bibliothèque.
          </p>
        ) : null}
        <TextField id="landing-eyebrow" label="Surtitre" value={value.eyebrow} onChange={(eyebrow) => update({ ...value, eyebrow })} />
        <TextField id="landing-title" label="Titre" value={value.title} onChange={(title) => update({ ...value, title })} />
        <TextField
          id="landing-highlight"
          label="Segment mis en évidence"
          value={value.highlightText}
          onChange={(highlightText) => update({ ...value, highlightText })}
        />
        <TextField id="landing-subtitle" label="Sous-titre" value={value.subtitle} onChange={(subtitle) => update({ ...value, subtitle })} />
        <AreaField id="landing-description" label="Description" value={value.description} onChange={(description) => update({ ...value, description })} />
        <AssetField
          id="landing-hero"
          label="Image héro"
          value={value.heroImageUrl}
          organizationId={organizationId}
          scorecardId={scorecardId}
          kind="hero"
          onChange={(heroImageUrl) => update({ ...value, heroImageUrl })}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField id="landing-cta" label="Libellé du bouton" value={value.ctaLabel} onChange={(ctaLabel) => update({ ...value, ctaLabel })} />
          <TextField
            id="landing-secondary-cta"
            label="Libellé secondaire"
            value={value.secondaryCtaLabel}
            onChange={(secondaryCtaLabel) => update({ ...value, secondaryCtaLabel })}
          />
          <TextField
            id="landing-time"
            label="Libellé de durée"
            value={value.estimatedTimeLabel}
            onChange={(estimatedTimeLabel) => update({ ...value, estimatedTimeLabel })}
          />
          <TextField
            id="landing-trust"
            label="Bandeau de confiance"
            value={value.trustLabel}
            onChange={(trustLabel) => update({ ...value, trustLabel })}
          />
          <TextField
            id="landing-accent"
            label="Couleur d'accent (#hex)"
            value={value.accentColor}
            onChange={(accentColor) => update({ ...value, accentColor })}
          />
          <TextField
            id="landing-bg"
            label="Couleur de fond (#hex)"
            value={value.backgroundColor}
            onChange={(backgroundColor) => update({ ...value, backgroundColor })}
          />
        </div>
        <div className="flex flex-col gap-3">
          <ToggleField label="Afficher la durée" checked={value.showEstimatedTime} onChange={(showEstimatedTime) => update({ ...value, showEstimatedTime })} />
          <ToggleField label="Afficher le nombre de questions" checked={value.showQuestionCount} onChange={(showQuestionCount) => update({ ...value, showQuestionCount })} />
          <ToggleField label="Afficher le message de confidentialité" checked={value.showPrivacy} onChange={(showPrivacy) => update({ ...value, showPrivacy })} />
        </div>
        <AreaField id="landing-privacy" label="Message de confidentialité" value={value.privacyText} onChange={(privacyText) => update({ ...value, privacyText })} />
        <div className="space-y-4 rounded-[var(--radius-panel)] border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">Bénéfices</h3>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => update({ ...value, benefits: [...value.benefits, { title: "Nouveau bénéfice", description: "", icon: "" }] })}
            >
              Ajouter
            </Button>
          </div>
          {value.benefits.length === 0 ? <p className="text-sm text-muted-foreground">Aucun bénéfice pour le moment.</p> : null}
          {value.benefits.map((benefit, index) => (
            <div key={index} className="grid gap-3 rounded-[var(--radius-control)] bg-muted/40 p-3">
              <TextField
                id={`benefit-title-${index}`}
                label="Titre"
                value={benefit.title}
                onChange={(title) => {
                  const benefits = value.benefits.map((item, itemIndex) => (itemIndex === index ? { ...item, title } : item))
                  update({ ...value, benefits })
                }}
              />
              <TextField
                id={`benefit-description-${index}`}
                label="Description"
                value={benefit.description}
                onChange={(description) => {
                  const benefits = value.benefits.map((item, itemIndex) => (itemIndex === index ? { ...item, description } : item))
                  update({ ...value, benefits })
                }}
              />
              <TextField
                id={`benefit-icon-${index}`}
                label="Icône (optionnelle)"
                value={benefit.icon}
                onChange={(icon) => {
                  const benefits = value.benefits.map((item, itemIndex) => (itemIndex === index ? { ...item, icon } : item))
                  update({ ...value, benefits })
                }}
              />
              <Button
                type="button"
                variant="ghost"
                className="justify-start"
                onClick={() => update({ ...value, benefits: value.benefits.filter((_, itemIndex) => itemIndex !== index) })}
              >
                Retirer ce bénéfice
              </Button>
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-[var(--radius-panel)] border border-border p-4">
          <h3 className="font-medium">Témoignage</h3>
          <AreaField
            id="testimonial-quote"
            label="Citation"
            rows={3}
            value={value.testimonial.quote}
            onChange={(quote) => update({ ...value, testimonial: { ...value.testimonial, quote } })}
          />
          <TextField
            id="testimonial-author"
            label="Auteur"
            value={value.testimonial.author}
            onChange={(author) => update({ ...value, testimonial: { ...value.testimonial, author } })}
          />
          <TextField
            id="testimonial-role"
            label="Rôle"
            value={value.testimonial.role}
            onChange={(role) => update({ ...value, testimonial: { ...value.testimonial, role } })}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-[#E8ECF1] shadow-[var(--shadow-panel)] xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-auto">
        {/*
          Side panel is ~360–480px. Without a design-width scale, container queries
          collapse Digital Experience into a left-stuck mobile column. Scale a
          1180px composition uniformly into the panel instead.
        */}
        <ScoreAppSurface className="w-full">
          <ScaledInlinePreview designWidth={1180} className="w-full bg-card">
            <LandingView content={{ ...preview, ...landingPreview(value, preview) }} />
          </ScaledInlinePreview>
        </ScoreAppSurface>
      </div>
    </div>
  )
}

function landingPreview(value: LandingInput, preview: LandingContent): LandingContent {
  return {
    ...preview,
    eyebrow: value.eyebrow,
    title: value.title,
    subtitle: value.subtitle,
    description: value.description,
    heroImageUrl: value.heroImageUrl,
    ctaLabel: value.ctaLabel,
    estimatedTimeLabel: value.estimatedTimeLabel,
    showEstimatedTime: value.showEstimatedTime,
    showQuestionCount: value.showQuestionCount,
    showPrivacy: value.showPrivacy,
    privacyText: value.privacyText,
    benefits: value.benefits,
    testimonial: value.testimonial,
    landingTheme: value.landingTheme,
    highlightText: value.highlightText,
    secondaryCtaLabel: value.secondaryCtaLabel,
    trustLabel: value.trustLabel,
    backgroundColor: value.backgroundColor,
    accentColor: value.accentColor || preview.primaryColor,
    demoStats: value.demoStats,
  }
}
