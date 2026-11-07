"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronDown, Send, Sparkles, Wrench } from "lucide-react"
import { applyAssistantPlan, chatWithAssistant } from "@/actions/assistant"
import { AnimatedAiRobot, type AiRobotState } from "@/components/assistant/animated-ai-robot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssistantMode, ExecutionPlan } from "@/lib/ai/agent/schemas"
import {
  humanizePlanArguments,
  planActionTitle,
  presentReadResult,
  sanitizeAssistantMessage,
  toolLabel,
} from "@/lib/ai/agent/present"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { enterDelayMs, scrollBehavior } from "@/lib/ui/motion"
import { WS_FOCUS, WS_LINK, WS_PANEL } from "@/lib/ui/workspace-surface"
import { cn } from "@/lib/utils"

const suggestions = [
  "Créer une scorecard",
  "Générer des questions",
  "Analyser une scorecard",
  "Analyser mes leads",
  "Résumer mes statistiques",
  "Configurer mon scoring",
]

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  plan?: ExecutionPlan | null
  reads?: { tool: string; summary: string; result: unknown }[]
}

const modes: { id: AssistantMode; label: string; help: string }[] = [
  { id: "advise", label: "Conseiller", help: "Répond et analyse sans modifier les données." },
  { id: "prepare", label: "Préparer", help: "Prépare les modifications et affiche le résultat avant application." },
  { id: "execute", label: "Exécuter", help: "Peut appliquer les actions V1 autorisées, uniquement après confirmation." },
]

export function AssistantView({
  configured,
  pageContext,
}: {
  configured: boolean
  pageContext?: { route?: string; scorecardId?: string; scorecardName?: string; scorecardSlug?: string }
}) {
  const [mode, setMode] = useState<AssistantMode>("prepare")
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingPlan, setPendingPlan] = useState<ExecutionPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pane, setPane] = useState<"chat" | "work">("chat")
  const [inputFocused, setInputFocused] = useState(false)
  const [flash, setFlash] = useState<"responding" | "success" | "error" | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const flashTimer = useRef<number | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  function pulseFlash(next: "responding" | "success" | "error") {
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    if (reducedMotion) {
      setFlash(null)
      return
    }
    setFlash(next)
    flashTimer.current = window.setTimeout(() => setFlash(null), next === "success" ? 700 : 650)
  }

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  )
  const activeMode = modes.find((item) => item.id === mode) ?? modes[1]
  const latestPlan = [...messages].reverse().find((message) => message.plan)?.plan ?? null
  const workspacePlan = pendingPlan ?? latestPlan
  const latestReads = [...messages].reverse().find((message) => message.reads && message.reads.length > 0)?.reads ?? []
  const latestOutcome = [...messages].reverse().find((message) => message.role === "assistant" && !message.plan)

  const robotState: AiRobotState = flash
    ? flash
    : busy
      ? "thinking"
      : error
        ? "error"
        : inputFocused || input.trim().length > 0
          ? "listening"
          : "idle"

  useEffect(() => {
    const node = threadRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: scrollBehavior(reducedMotion) })
  }, [messages, busy, reducedMotion])

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  async function send(text: string) {
    const message = text.trim()
    if (message.length < 2 || busy) return
    setBusy(true)
    setError(null)
    setInput("")
    setPane("chat")
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: message }
    setMessages((current) => [...current, userMessage])
    try {
      const result = await chatWithAssistant({
        message,
        mode,
        pageContext,
        history,
      })
      if (!result.ok) {
        setError(result.error)
        pulseFlash("error")
        return
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: sanitizeAssistantMessage(result.message),
          plan: result.plan,
          reads: result.readResults,
        },
      ])
      setPendingPlan(result.plan)
      if (result.plan) setPane("work")
      pulseFlash("responding")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L'Assistant IA n'a pas pu répondre. Réessayez.")
      pulseFlash("error")
    } finally {
      setBusy(false)
    }
  }

  async function apply() {
    if (!pendingPlan || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await applyAssistantPlan(pendingPlan)
      if (!result.ok) {
        setError(result.error)
        pulseFlash("error")
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Je n'ai pas pu appliquer cette action : ${result.error}`,
          },
        ])
        return
      }
      const href = result.results.find(
        (item) =>
          item.tool === "create_scorecard_draft" &&
          item.result &&
          typeof item.result === "object" &&
          "href" in item.result,
      )
        ? String(
            (result.results.find((item) => item.tool === "create_scorecard_draft")?.result as { href?: string })
              .href ?? "",
          )
        : ""
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: href
            ? `${result.message} Vous pouvez ouvrir le brouillon pour le finaliser.`
            : result.message,
        },
      ])
      setPendingPlan(null)
      pulseFlash("success")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L'application a échoué.")
      pulseFlash("error")
    } finally {
      setBusy(false)
    }
  }

  const workspaceEmpty =
    !busy && !workspacePlan && latestReads.length === 0 && !latestOutcome && !error

  return (
    <div className="-mx-4 -my-5 flex h-[calc(100dvh-3.75rem)] min-h-[32rem] flex-col bg-[color:var(--surface)] md:-mx-6 md:-my-6">
      <div className="flex gap-1 px-3 pt-3 lg:hidden" role="tablist" aria-label="Panneaux de l'assistant">
        {(
          [
            { id: "chat" as const, label: "Conversation" },
            { id: "work" as const, label: "Espace de travail" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={pane === tab.id}
            className={cn(
              "h-9 flex-1 rounded-xl text-[13px] font-semibold transition-colors",
              WS_FOCUS,
              pane === tab.id
                ? "bg-[color:var(--brand-950)] text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
                : "bg-[color:var(--surface-elevated)] text-muted-foreground",
            )}
            onClick={() => setPane(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)]">
        <section
          className={cn(
            WS_PANEL,
            "flex min-h-0 flex-col overflow-hidden",
            pane === "work" && "hidden lg:flex",
          )}
          aria-label="Conversation"
        >
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-start gap-3">
              <AnimatedAiRobot state={robotState} size="md" reducedMotion={reducedMotion} />
              <div className="min-w-0 flex-1">
                <h1 className="text-[1.2rem] font-semibold tracking-tight text-foreground">Assistant IA</h1>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Copilote WOLOYEM · {messages.length} message{messages.length > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]" aria-live="polite">
                  {robotState === "thinking"
                    ? "Analyse en cours…"
                    : robotState === "listening"
                      ? "À l'écoute"
                      : robotState === "responding"
                        ? "Réponse en cours…"
                        : robotState === "success"
                          ? "Action confirmée"
                          : robotState === "error"
                            ? "Une erreur est survenue"
                            : "Prêt à vous aider"}
                </p>
              </div>
            </div>
            <div
              className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1"
              role="group"
              aria-label="Mode de l'assistant"
            >
              {modes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  aria-pressed={mode === item.id}
                  className={cn(
                    "h-8 rounded-lg text-[12px] font-semibold transition-colors",
                    WS_FOCUS,
                    mode === item.id
                      ? "bg-[color:var(--surface-elevated)] text-[color:var(--brand-950)] shadow-sm dark:text-[color:var(--brand-500)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{activeMode.help}</p>
            {!configured ? (
              <div className="mt-3 rounded-xl border border-[color:var(--brand-300)]/40 bg-[color:var(--brand-300)]/10 px-3 py-2 text-[13px]">
                <p className="font-semibold text-foreground">Assistant IA non configuré</p>
                <p className="mt-1 text-muted-foreground">
                  Une configuration du fournisseur IA est nécessaire. Aucune réponse n&apos;est simulée.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={busy}
                className={cn(
                  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[12px] font-medium text-foreground",
                  "hover:border-[color:var(--brand-500)]/35 hover:bg-muted/50 disabled:opacity-50",
                  WS_FOCUS,
                )}
                onClick={() => void send(suggestion)}
              >
                <Sparkles className="size-3 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>

          <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                <AnimatedAiRobot
                  state={robotState}
                  size="lg"
                  reducedMotion={reducedMotion}
                  className="mx-auto"
                />
                <p className="mt-4 text-[15px] font-medium text-foreground">Bonjour, je suis votre copilote</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  Posez une question ou choisissez une suggestion. Je clarifie si besoin, puis je prépare
                  les actions pour confirmation.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <article
                  key={message.id}
                  className={cn(
                    "flex gap-2.5",
                    message.role === "user" ? "justify-end" : "justify-start",
                    "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
                  )}
                  style={
                    reducedMotion ? undefined : { animationDelay: `${enterDelayMs(index, 20, 4)}ms` }
                  }
                >
                  {message.role === "assistant" ? (
                    <AnimatedAiRobot
                      state={
                        index === messages.length - 1 && !busy
                          ? flash === "success"
                            ? "success"
                            : flash === "responding"
                              ? "responding"
                              : flash === "error"
                                ? "error"
                                : "idle"
                          : "idle"
                      }
                      size="sm"
                      reducedMotion={reducedMotion}
                      className="mt-1 hidden shrink-0 sm:block"
                    />
                  ) : null}
                  <div
                    className={cn(
                      "min-w-0 max-w-[min(92%,28rem)] rounded-2xl px-3.5 py-3 text-[13px] leading-6",
                      message.role === "user"
                        ? "rounded-br-md bg-[color:var(--brand-950)] text-white dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]"
                        : "rounded-bl-md bg-muted/40 text-foreground ring-1 ring-border/60",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-semibold tracking-[0.12em] uppercase",
                        message.role === "user"
                          ? "opacity-70"
                          : "text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]",
                      )}
                    >
                      {message.role === "user" ? "Vous" : "Assistant"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                    {message.plan ? (
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        Une proposition est prête dans l&apos;espace de travail — rien n&apos;est écrit
                        avant votre confirmation.
                      </p>
                    ) : null}
                  </div>
                </article>
              ))
            )}
            {busy ? (
              <div className="flex items-center gap-3" aria-live="polite">
                <AnimatedAiRobot state="thinking" size="sm" reducedMotion={reducedMotion} />
                <p className="inline-flex items-center gap-2 text-[13px] font-medium text-[color:var(--brand-500)]">
                  <span className="inline-flex items-center gap-1" aria-hidden>
                    <span className="ai-think-dot size-1.5 rounded-full bg-[color:var(--brand-500)]" />
                    <span
                      className="ai-think-dot size-1.5 rounded-full bg-[color:var(--brand-500)]"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="ai-think-dot size-1.5 rounded-full bg-[color:var(--brand-500)]"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </span>
                  L&apos;assistant réfléchit…
                </p>
              </div>
            ) : null}
          </div>

          <form
            className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={(event) => {
              event.preventDefault()
              void send(input)
            }}
          >
            <label className="sr-only" htmlFor="assistant-input">
              Que souhaitez-vous faire ?
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <Input
                id="assistant-input"
                value={input}
                disabled={busy}
                placeholder="Que souhaitez-vous faire ?"
                autoComplete="off"
                className={cn(
                  "h-11 min-w-0 flex-1 rounded-xl border-border bg-background",
                  "focus-visible:border-[color:var(--brand-500)] focus-visible:ring-[color:var(--brand-500)]/25",
                )}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void send(input)
                  }
                }}
              />
              <Button
                type="submit"
                className={cn(
                  "h-11 shrink-0 rounded-xl bg-[color:var(--brand-950)] px-3 text-white sm:px-4",
                  "dark:bg-[color:var(--brand-300)] dark:text-[color:var(--brass-ink)]",
                )}
                disabled={busy || input.trim().length < 2}
                aria-label="Envoyer"
              >
                <Send className="size-4" aria-hidden />
                <span className="hidden sm:inline">Envoyer</span>
              </Button>
            </div>
            {pageContext?.scorecardId ? (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Contexte : {pageContext.scorecardName || pageContext.scorecardSlug || "scorecard"}
                {" · "}
                <Link
                  href={`/dashboard/scorecards/${pageContext.scorecardId}/builder`}
                  className={WS_LINK}
                >
                  Ouvrir le builder
                </Link>
              </p>
            ) : null}
          </form>
        </section>

        <section
          className={cn(
            WS_PANEL,
            "flex min-h-0 flex-col overflow-hidden",
            pane === "chat" && "hidden lg:flex",
          )}
          aria-label="Espace de travail"
        >
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground">
                <Wrench className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
                  WOLOYEM Score
                </p>
                <h2 className="mt-1 text-[1.15rem] font-semibold tracking-tight text-foreground">
                  Espace de travail
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Propositions, lectures et confirmations — sans bruit technique.
                </p>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {workspaceEmpty ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
                <AnimatedAiRobot state="idle" size="md" reducedMotion={reducedMotion} className="mx-auto" />
                <p className="mt-4 text-[13px] text-muted-foreground">
                  Aucune proposition pour le moment. Les actions préparées s&apos;afficheront ici, avec
                  confirmation avant toute écriture.
                </p>
              </div>
            ) : null}
            {error ? (
              <div
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <AnimatedAiRobot state="error" size="sm" reducedMotion={reducedMotion} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Impossible de terminer</p>
                    <p className="mt-1">{error}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-lg"
                      onClick={() => setError(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            {busy ? <AssistantThinking reducedMotion={reducedMotion} /> : null}
            {!busy && workspacePlan ? (
              <PlanCard plan={workspacePlan} pending={Boolean(pendingPlan)} />
            ) : null}
            {!busy && pendingPlan ? (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                <Button
                  type="button"
                  data-testid="assistant-apply"
                  className="rounded-xl"
                  disabled={busy}
                  onClick={() => void apply()}
                >
                  Confirmer
                </Button>
                <Button
                  type="button"
                  data-testid="assistant-modify"
                  variant="outline"
                  className="rounded-xl"
                  disabled={busy}
                  onClick={() => {
                    setInput("Modifie la proposition : ")
                    setPane("chat")
                  }}
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  data-testid="assistant-cancel"
                  variant="ghost"
                  className="rounded-xl"
                  disabled={busy}
                  onClick={() => setPendingPlan(null)}
                >
                  Annuler
                </Button>
                {pendingPlan.steps.some((step) => step.tool === "create_scorecard_draft") ? (
                  <p className="w-full text-[12px] text-muted-foreground">
                    Rien n&apos;est écrit avant confirmation. Après application, seule une scorecard brouillon
                    est créée.
                  </p>
                ) : null}
              </div>
            ) : null}
            {!busy && latestOutcome && !pendingPlan ? (
              <article className="rounded-2xl border border-border p-4 text-[13px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-[color:var(--brand-500)] uppercase">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Résultat
                </p>
                <p className="mt-2 whitespace-pre-wrap text-foreground">
                  {sanitizeAssistantMessage(latestOutcome.content)}
                </p>
              </article>
            ) : null}
            {!busy && latestReads.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Lectures
                </p>
                {latestReads.map((read) => (
                  <ReadCard key={read.tool + read.summary} tool={read.tool} summary={read.summary} result={read.result} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function AssistantThinking({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      className="rounded-2xl border border-[color:var(--brand-500)]/25 bg-[color:var(--brand-500)]/[0.04] p-5"
      role="status"
      aria-live="polite"
      aria-label="L'assistant analyse la demande"
    >
      <div className="flex items-center gap-4">
        <AnimatedAiRobot state="thinking" size="md" reducedMotion={reducedMotion} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[color:var(--brand-500)] uppercase">
            Analyse en cours
          </p>
          <p className="mt-1 text-[14px] font-medium text-foreground">
            L&apos;IA explore vos données et structure la réponse
            <span className="ml-0.5 inline-flex gap-0.5" aria-hidden>
              <span className={cn("inline-block", !reducedMotion && "ai-think-dot")}>.</span>
              <span
                className={cn("inline-block", !reducedMotion && "ai-think-dot")}
                style={{ animationDelay: "0.15s" }}
              >
                .
              </span>
              <span
                className={cn("inline-block", !reducedMotion && "ai-think-dot")}
                style={{ animationDelay: "0.3s" }}
              >
                .
              </span>
            </span>
          </p>
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "absolute inset-y-0 w-1/3 rounded-full bg-[linear-gradient(90deg,transparent,var(--brand-500),transparent)]",
                !reducedMotion && "ai-think-scan",
              )}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadCard({ tool, summary, result }: { tool: string; summary: string; result: unknown }) {
  const presented = presentReadResult(tool, summary, result)
  return (
    <article className="rounded-2xl border border-border p-4 text-[13px]">
      <p className="font-semibold text-foreground">{presented.title}</p>
      {typeof presented.count === "number" ? (
        <p className="mt-1 text-[12px] text-muted-foreground">{presented.count} résultat{presented.count > 1 ? "s" : ""}</p>
      ) : null}
      <ul className="mt-3 space-y-1.5 text-foreground">
        {presented.lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-[color:var(--brand-500)]" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <TechnicalDetails payload={{ tool, summary, result }} />
    </article>
  )
}

function PlanCard({ plan, pending }: { plan: ExecutionPlan; pending: boolean }) {
  const primary = plan.steps[0]
  const facts = primary ? humanizePlanArguments(primary.tool, primary.arguments) : []

  return (
    <article className="rounded-2xl border border-border p-4" data-testid="assistant-plan-card">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)] uppercase">
          Action proposée
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            pending
              ? "bg-[color:var(--brand-300)]/15 text-[color:var(--brand-700)] dark:text-[color:var(--brand-300)]"
              : "bg-[color:var(--brand-950)]/10 text-[color:var(--brand-950)] dark:text-[color:var(--brand-500)]",
          )}
        >
          {pending ? "En attente de confirmation" : "Consultation"}
        </span>
      </div>
      <h3 className="mt-2 text-base font-semibold text-foreground">{planActionTitle(plan)}</h3>
      {plan.preview?.subtitle ? (
        <p className="mt-1 text-[13px] text-muted-foreground">{plan.preview.subtitle}</p>
      ) : null}
      {plan.preview?.bullets && plan.preview.bullets.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-foreground">
          {plan.preview.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {facts.length > 0 ? (
        <dl className="mt-4 grid gap-2 rounded-xl bg-muted/30 p-3 text-[13px] sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[11px] font-medium text-muted-foreground">{fact.label}</dt>
              <dd className="mt-0.5 font-medium text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <ol className="mt-4 space-y-2">
        {plan.steps.map((step, index) => {
          const stepFacts = index > 0 ? humanizePlanArguments(step.tool, step.arguments) : []
          return (
            <li key={step.id} className="rounded-xl border border-border bg-muted/20 px-3 py-3 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums">
                  {index + 1}
                </span>
                <span className="font-medium text-foreground">{step.summary || toolLabel(step.tool)}</span>
                {step.writes ? (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                    Écriture
                  </span>
                ) : (
                  <span className="rounded-full bg-[color:var(--brand-500)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--brand-500)]">
                    Lecture
                  </span>
                )}
              </div>
              {stepFacts.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                  {stepFacts.map((fact) => (
                    <li key={fact.label}>
                      {fact.label} : {fact.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ol>

      {plan.diffs.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Avant / Après
          </p>
          {plan.diffs.map((diff) => (
            <p key={`${diff.label}-${diff.before}-${diff.after}`} className="text-[13px] text-foreground">
              <span className="font-medium">{diff.label}</span> : {diff.before} → {diff.after}
            </p>
          ))}
        </div>
      ) : null}

      <TechnicalDetails
        payload={{
          steps: plan.steps.map((step) => ({
            tool: step.tool,
            summary: step.summary,
            arguments: step.arguments,
            writes: step.writes,
          })),
        }}
      />
    </article>
  )
}

function TechnicalDetails({ payload }: { payload: unknown }) {
  return (
    <details className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/10 px-3 py-2 text-[12px]">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1.5 font-medium text-muted-foreground",
          WS_FOCUS,
          "rounded-md",
        )}
      >
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
        Voir les détails techniques
      </summary>
      <pre
        className="mt-2 max-h-48 max-w-full overflow-auto rounded-lg bg-muted/40 p-2 font-mono text-[11px] leading-4 text-muted-foreground"
        data-testid="assistant-technical-json"
      >
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  )
}
