import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import {
  buildMetricSentence,
  detectRequestedMetric,
  finalizeAssistantReply,
  formatFrNumber,
  looksLikeProgressMessage,
  synthesizeFactualReply,
} from "./factual-reply.ts"
import { presentReadResult, sanitizeAssistantMessage } from "./present.ts"

const runtime = readFileSync(new URL("./runtime.ts", import.meta.url), "utf8")

const dashboard = {
  leads: 19,
  started: 40,
  completed: 20,
  conversionRate: 51.6,
  averageScore: 55.4,
  ctaClicks: 8,
  pageViews: 120,
}

test("LOT18B — detects factual metric intents", () => {
  assert.equal(detectRequestedMetric("Donne-moi le nombre total de leads"), "leads")
  assert.equal(detectRequestedMetric("Quel est mon taux de conversion ?"), "conversionRate")
  assert.equal(detectRequestedMetric("Quel est mon score moyen ?"), "averageScore")
  assert.equal(detectRequestedMetric("Combien d'évaluations complétées ?"), "completed")
})

test("LOT18B — synthesizes leads count including zero", () => {
  const reply = synthesizeFactualReply({
    userMessage: "Donne-moi le nombre total de leads",
    llmMessage: "Voici le nombre total de leads dans votre compte",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: dashboard }],
  })
  assert.equal(reply, "Vous avez actuellement 19 leads dans votre compte.")

  const zero = synthesizeFactualReply({
    userMessage: "Combien ai-je de leads ?",
    llmMessage: "Je récupère vos leads",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: { ...dashboard, leads: 0 } }],
  })
  assert.equal(zero, "Vous avez actuellement 0 leads dans votre compte.")
})

test("LOT18B — synthesizes conversion rate with French decimal", () => {
  const reply = synthesizeFactualReply({
    userMessage: "Quel est mon taux de conversion ?",
    llmMessage: "Je récupère votre taux de conversion...",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: dashboard }],
  })
  assert.equal(reply, `Votre taux de conversion actuel est de ${formatFrNumber(51.6)} %.`)
  assert.match(reply!, /51[,.]6/)
})

test("LOT18B — average score without inventing percent unit", () => {
  const reply = synthesizeFactualReply({
    userMessage: "Quel est mon score moyen ?",
    llmMessage: "Voici votre score moyen",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: dashboard }],
  })
  assert.equal(
    reply,
    `Votre score moyen est de ${formatFrNumber(55.4)}, selon l'unité définie pour cet indicateur.`,
  )
  assert.doesNotMatch(reply!, /%/)
})

test("LOT18B — null and missing metrics", () => {
  const missing = synthesizeFactualReply({
    userMessage: "Quel est mon score moyen ?",
    llmMessage: "Je regarde",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: { leads: 3 } }],
  })
  assert.match(missing!, /pas disponible/i)

  const nullable = synthesizeFactualReply({
    userMessage: "Quel est mon score moyen ?",
    llmMessage: "Je regarde",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: { averageScore: null } }],
  })
  assert.match(nullable!, /Aucune valeur/i)
})

test("LOT18B — tool error becomes final answer", () => {
  const reply = synthesizeFactualReply({
    userMessage: "Combien de leads ?",
    llmMessage: "Je récupère",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: { error: "Permission refusée." } }],
  })
  assert.equal(reply, "Permission refusée.")
})

test("LOT18B — does not override write plans", () => {
  const reply = synthesizeFactualReply({
    userMessage: "Donne-moi le nombre total de leads",
    llmMessage: "Je propose une création",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: dashboard }],
    hasWritePlan: true,
  })
  assert.equal(reply, null)
})

test("LOT18B — finalize prefers factual synthesis over progress copy", () => {
  const final = finalizeAssistantReply({
    userMessage: "Quel est mon taux de conversion ?",
    llmMessage: "Je récupère votre taux de conversion...",
    readResults: [{ tool: "get_dashboard_metrics", summary: "Métriques", result: dashboard }],
  })
  assert.match(final, /51/)
  assert.doesNotMatch(final, /récupère/i)
  assert.equal(looksLikeProgressMessage("Je récupère votre taux de conversion..."), true)
  assert.equal(looksLikeProgressMessage(`Votre taux est de ${formatFrNumber(51.6)} %.`), false)
})

test("LOT18B — completed assessments wording", () => {
  assert.match(buildMetricSentence("completed", 1), /1 évaluation complétée/)
  assert.match(buildMetricSentence("completed", 20), /20 évaluations complétées/)
})

test("LOT18B — presentReadResult shows French metric labels with values", () => {
  const presented = presentReadResult("get_dashboard_metrics", "Tableau de bord", dashboard)
  assert.ok(presented.lines.some((line) => line.includes("Leads") && line.includes("19")))
  assert.ok(presented.lines.some((line) => /conversion/i.test(line) && /51/.test(line) && /%/.test(line)))
})

test("LOT18B — sanitization does not strip numeric answers", () => {
  const text = "Vous avez actuellement 19 leads dans votre compte."
  assert.equal(sanitizeAssistantMessage(text), text)
})

test("LOT18B — runtime wires finalizeAssistantReply after reads", () => {
  assert.match(runtime, /finalizeAssistantReply/)
  assert.match(runtime, /readResults/)
  assert.match(runtime, /hasWritePlan/)
})
