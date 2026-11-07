"use client"

import { useMemo, useState } from "react"
import { Eye, Monitor, Smartphone } from "lucide-react"
import { LandingView, type LandingContent } from "@/components/assessment/landing-view"
import { QuestionCard, answerIsEmpty, emptyAnswer, type LocalAnswer } from "@/components/assessment/question-card"
import { ResultView } from "@/components/assessment/result-view"
import { DevicePreviewStage } from "@/components/templates/device-preview-stage"
import { ScoreAppSurface } from "@/components/theme/scoreapp-surface"
import { Button } from "@/components/ui/button"
import { isQuestionVisible, pruneHiddenAnswers, type VisibilityQuestion } from "@/lib/assessment/visibility"
import { toEngineQuestion } from "@/lib/scoring/from-builder"
import { resolveAssessment } from "@/lib/scoring/outcome"
import { WS_FOCUS, WS_ICON_CHIP } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"
import type { BuilderBundle } from "@/types/builder"
import { leadFieldKeys } from "@/lib/validators/builder"

type Screen = "landing" | "lead" | "questions" | "results"

const SCREENS: { id: Screen; label: string }[] = [
  { id: "landing", label: "Accueil" },
  { id: "questions", label: "Questions" },
  { id: "lead", label: "Lead" },
  { id: "results", label: "Résultats" },
]

export function PreviewStep({ bundle }: { bundle: BuilderBundle }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [screen, setScreen] = useState<Screen>("landing")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({})
  const family = toPreviewVisibility(bundle.questions)
  const drafts = Object.entries(answers).map(([questionId, answer]) => ({
    questionId,
    optionIds: answer.optionIds,
    scaleValue: answer.scaleValue,
    valueText: answer.text,
  }))
  const questions = bundle.questions.filter((question) => {
    const item = family.find((entry) => entry.id === question.id)
    return item ? isQuestionVisible(item, family, drafts) : true
  })
  const question = questions[index]
  const content = toLanding(bundle)

  const score = useMemo(() => {
    return resolveAssessment({
      questions: bundle.questions.map(toEngineQuestion),
      answers: bundle.questions.map((item) => ({
        questionId: item.id,
        optionIds: answers[item.id]?.optionIds ?? [],
        scaleValue: answers[item.id]?.scaleValue,
        valueText: answers[item.id]?.text,
      })),
      categories: bundle.scoringCategories.map((category) => ({ id: category.id, weight: category.weight })),
      ranges: bundle.ranges.map((range) => ({
        id: range.id,
        minPercent: range.minPercent,
        maxPercent: range.maxPercent,
        label: range.label,
      })),
      caps: bundle.caps.map((cap) => ({ ruleType: "cap", config: { maxPercent: cap.maxPercent } })),
      rules: bundle.rules,
    })
  }, [answers, bundle.caps, bundle.questions, bundle.ranges, bundle.rules, bundle.scoringCategories])

  const matched = bundle.ranges.find((range) => range.id === score.finalRange?.id) ?? null
  const currentAnswer = question ? answers[question.id] ?? emptyAnswer() : emptyAnswer()
  const blocked = question ? question.isRequired && answerIsEmpty(question, currentAnswer) : false

  function goNext() {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1)
      return
    }
    setScreen(bundle.leadForm.timing === "before_results" || bundle.leadForm.timing === "during" ? "lead" : "results")
  }

  function jumpTo(next: Screen) {
    setScreen(next)
    if (next === "questions") setIndex(0)
    if (next === "landing") {
      setIndex(0)
      setAnswers({})
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn(WS_ICON_CHIP, "size-10 rounded-2xl")}>
            <Eye className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-[1.2rem] font-semibold tracking-tight text-foreground">Aperçu</h2>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              Brouillon local uniquement — aucune session n&apos;est créée. Les thèmes publics restent inchangés.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div
            className="flex rounded-xl border border-border bg-muted/40 p-1"
            role="group"
            aria-label="Écran d'aperçu"
          >
            {SCREENS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={screen === item.id}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  WS_FOCUS,
                  screen === item.id
                    ? "bg-[color:var(--brand-950)] text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => jumpTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="flex rounded-xl border border-border bg-muted/40 p-1"
            role="group"
            aria-label="Format d'aperçu"
          >
            {(
              [
                { id: "desktop" as const, label: "Desktop", Icon: Monitor },
                { id: "mobile" as const, label: "Mobile", Icon: Smartphone },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={device === id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  WS_FOCUS,
                  device === id
                    ? "bg-[color:var(--brand-500)]/15 text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setDevice(id)}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DevicePreviewStage device={device}>
        <ScoreAppSurface>
          {screen === "landing" ? (
            <LandingView
              content={{
                ...content,
                questionCount: questions.length,
                previewBanner: bundle.scorecard.status !== "published",
              }}
              onStart={() => setScreen(bundle.leadForm.timing === "before" ? "lead" : "questions")}
            />
          ) : null}
          {screen === "lead" ? (
            <LeadPreview
              bundle={bundle}
              onContinue={() =>
                setScreen(
                  bundle.leadForm.timing === "before"
                    ? "questions"
                    : bundle.leadForm.timing === "after_results"
                      ? "landing"
                      : "results",
                )
              }
              onBack={() => setScreen(bundle.leadForm.timing === "before" ? "landing" : "questions")}
            />
          ) : null}
          {screen === "questions" && question ? (
            <div>
              <QuestionCard
                question={{
                  id: question.id,
                  type: question.type,
                  title: question.title,
                  description: question.description,
                  isRequired: question.isRequired,
                  position: question.position,
                  scaleFrom: question.settings.scaleFrom,
                  scaleTo: question.settings.scaleTo,
                  options: question.options.map((option) => ({
                    id: option.id,
                    label: option.label,
                    value: option.value,
                  })),
                  displayRule: question.displayRule,
                }}
                index={index}
                total={questions.length}
                answer={currentAnswer}
                primaryColor={bundle.scorecard.primary_color}
                onChange={(answer) => {
                  const next = { ...answers, [question.id]: answer }
                  const pruned = pruneHiddenAnswers(
                    family,
                    Object.entries(next).map(([questionId, value]) => ({
                      questionId,
                      optionIds: value.optionIds,
                      scaleValue: value.scaleValue,
                      valueText: value.text,
                    })),
                  )
                  const kept: Record<string, LocalAnswer> = {}
                  for (const item of pruned.answers) {
                    const current = next[item.questionId]
                    if (current) kept[item.questionId] = current
                  }
                  if (question && !kept[question.id]) kept[question.id] = answer
                  setAnswers(kept)
                  const stillVisible = bundle.questions.filter((item) => {
                    const entry = family.find((candidate) => candidate.id === item.id)
                    const nextDrafts = Object.entries(kept).map(([questionId, value]) => ({
                      questionId,
                      optionIds: value.optionIds,
                      scaleValue: value.scaleValue,
                      valueText: value.text,
                    }))
                    return entry ? isQuestionVisible(entry, family, nextDrafts) : true
                  })
                  if (index >= stillVisible.length) setIndex(Math.max(0, stillVisible.length - 1))
                }}
              />
              <div className="flex justify-between px-5 pb-8">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => {
                    if (index === 0) setScreen(bundle.leadForm.timing === "before" ? "lead" : "landing")
                    else setIndex((value) => value - 1)
                  }}
                >
                  Précédent
                </Button>
                <Button type="button" className="h-10 rounded-xl" disabled={blocked} onClick={goNext}>
                  {index === questions.length - 1 ? "Voir le résultat" : "Continuer"}
                </Button>
              </div>
            </div>
          ) : null}
          {screen === "questions" && !question ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              <p>Aucune question à prévisualiser.</p>
              <Button type="button" variant="outline" className="mt-4 h-10 rounded-xl" onClick={() => setScreen("landing")}>
                Retour
              </Button>
            </div>
          ) : null}
          {screen === "results" ? (
            <div>
              <ResultView
                percentage={score.officialPercent}
                range={matched}
                categories={bundle.scoringCategories}
                categoryScores={score.categoryScores}
                primaryColor={bundle.scorecard.primary_color}
                disclaimer={bundle.scorecard.privacy_text ?? undefined}
              />
              <div className="flex justify-between px-5 pb-8">
                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setScreen("questions")}>
                  Précédent
                </Button>
                {bundle.leadForm.timing === "after_results" ? (
                  <Button type="button" className="h-10 rounded-xl" onClick={() => setScreen("lead")}>
                    Continuer
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => {
                      setScreen("landing")
                      setIndex(0)
                      setAnswers({})
                    }}
                  >
                    Recommencer
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </ScoreAppSurface>
      </DevicePreviewStage>
    </div>
  )
}

function LeadPreview({
  bundle,
  onContinue,
  onBack,
}: {
  bundle: BuilderBundle
  onContinue: () => void
  onBack: () => void
}) {
  const fields = leadFieldKeys.filter((key) => bundle.leadForm.fields[key].enabled)
  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Vos coordonnées</h2>
      <p className="mt-2 text-sm text-muted-foreground">Aperçu local. Rien n&apos;est envoyé.</p>
      <div className="mt-6 space-y-4">
        {fields.map((key) => {
          const field = bundle.leadForm.fields[key]
          return (
            <label key={key} className="block text-sm">
              {field.label}
              {field.required ? " *" : ""}
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3"
                placeholder={field.placeholder}
                readOnly
              />
            </label>
          )
        })}
        {bundle.leadForm.consentRequired ? (
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" disabled />
            <span>
              {bundle.leadForm.consentLabel}
              {bundle.leadForm.privacyPolicyUrl ? (
                <>
                  {" "}
                  <a className="underline" href={bundle.leadForm.privacyPolicyUrl}>
                    Politique de confidentialité
                  </a>
                </>
              ) : null}
            </span>
          </label>
        ) : null}
      </div>
      <div className="mt-6 flex justify-between">
        <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onBack}>
          Précédent
        </Button>
        <Button type="button" className="h-10 rounded-xl" onClick={onContinue}>
          Continuer
        </Button>
      </div>
    </div>
  )
}

function toPreviewVisibility(questions: BuilderBundle["questions"]): VisibilityQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    position: question.position,
    type: question.type,
    options: question.options.map((option) => ({ id: option.id, label: option.label, value: option.value })),
    displayRule: question.displayRule,
  }))
}

function toLanding(bundle: BuilderBundle): LandingContent {
  return {
    eyebrow: bundle.page.eyebrow,
    title: bundle.page.title,
    subtitle: bundle.page.subtitle,
    description: bundle.page.description,
    heroImageUrl: bundle.page.heroImageUrl,
    ctaLabel: bundle.page.ctaLabel,
    estimatedTimeLabel: bundle.page.estimatedTimeLabel,
    showEstimatedTime: bundle.page.showEstimatedTime,
    showQuestionCount: bundle.page.showQuestionCount,
    showPrivacy: bundle.page.showPrivacy,
    privacyText: bundle.scorecard.privacy_text ?? "",
    benefits: bundle.page.benefits,
    testimonial: bundle.page.testimonial,
    primaryColor: bundle.scorecard.primary_color,
    secondaryColor: bundle.scorecard.secondary_color,
    logoUrl: bundle.scorecard.logo_url ?? "",
    estimatedMinutes: bundle.scorecard.estimated_minutes,
    questionCount: bundle.questions.length,
    landingTheme: bundle.page.landingTheme,
    highlightText: bundle.page.highlightText,
    secondaryCtaLabel: bundle.page.secondaryCtaLabel,
    trustLabel: bundle.page.trustLabel,
    backgroundColor: bundle.page.backgroundColor,
    accentColor: bundle.page.accentColor || bundle.scorecard.primary_color,
    demoStats: bundle.page.demoStats,
  }
}
