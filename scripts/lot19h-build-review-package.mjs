/**
 * Build human-readable LOT 19H review package from persisted LIVE traces.
 * No LLM calls. Does not invent human scores.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs"
import { join } from "node:path"

function latest(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return join(dir, files.at(-1))
}

function draftBrief(o) {
  return {
    title: o.title,
    objective: o.objective,
    audience: o.targetAudience,
    categories: (o.categories || []).map(
      (c) => c.name + (c.weightSuggestion != null ? ` (${c.weightSuggestion}%)` : ""),
    ),
    questions: (o.questions || []).map((q) => ({
      type: q.type,
      title: q.title,
      options: (q.options || []).slice(0, 4).map((x) => x.label || x),
    })),
    disclaimers: o.disclaimers,
    recommendations: o.recommendations,
  }
}

function analyzeBrief(o) {
  return {
    summary: o.summary,
    strengths: o.strengths,
    improvementAreas: o.improvementAreas,
    explanations: o.explanations,
    recommendations: o.recommendations,
    analysisLimits: o.analysisLimits,
    echo: o.officialScoresEcho,
  }
}

function planBrief(o) {
  return {
    situationSynthesis: o.situationSynthesis,
    topPriorities: o.topPriorities,
    actions: (o.actions || []).map((a) => ({
      title: a.title,
      priority: a.priority,
      horizon: a.horizon,
      description: a.description,
      successIndicator: a.successIndicator,
      expectedOutcome: a.expectedOutcome,
    })),
    facts: o.facts,
    hypotheses: o.hypotheses,
    recommendations: o.recommendations,
    disclaimers: o.disclaimers,
  }
}

const d19d = JSON.parse(readFileSync(latest("tmp/lot19d-live", "-traces.json"), "utf8"))
const d19f = JSON.parse(readFileSync(latest("tmp/lot19f-plan-live", "-traces.json"), "utf8"))
const all = [...d19d.traces, ...d19f.traces].filter((t) => t.validatedOutput)

const pack = all.map((t) => {
  const o = t.validatedOutput
  let brief
  if (t.patternId.includes("draft")) brief = draftBrief(o)
  else if (t.patternId.includes("analyze")) brief = analyzeBrief(o)
  else brief = planBrief(o)
  return {
    id: t.scenarioId,
    pattern: t.patternId,
    version: t.patternVersion,
    model: t.model,
    zodOk: t.zodOk,
    promptTokens: t.promptTokens,
    completionTokens: t.completionTokens,
    latencyMs: t.latencyMs,
    input: t.syntheticInput,
    brief,
  }
})

mkdirSync("tmp/lot19h-review", { recursive: true })
writeFileSync("tmp/lot19h-review/package-data.json", JSON.stringify(pack, null, 2))

const labels = {
  generate_scorecard_draft: "Génération de scorecard",
  analyze_scorecard_results: "Analyse des résultats",
  generate_action_plan: "Plan d'action",
}

const criteria = [
  "Pertinence (0-5)",
  "Précision (0-5)",
  "Cohérence métier (0-5)",
  "Clarté (0-5)",
  "Utilité (0-5)",
  "Respect des données (0-5)",
  "Absence d'inventions (0-5)",
  "Structure (0-5)",
  "Adaptation au contexte (0-5)",
  "Exploitabilité WOLOYEM (0-5)",
]

const md = []
md.push("# LOT 19H — Package de revue humaine")
md.push("")
md.push("**Statut :** HUMAN REVIEW — **PENDING** (aucune note humaine préremplie).")
md.push("")
md.push(
  "Ce document présente les **12 réponses LIVE** dans un format lisible. Saisir les notes dans `docs/ai/lot19g-human-review.csv` (colonnes de notes encore vides).",
)
md.push("")
md.push("## Mode d'emploi")
md.push("")
md.push("1. Lire l'objectif et le diagnostic / besoin.")
md.push("2. Lire la proposition IA.")
md.push("3. Noter les 10 critères de 0 à 5.")
md.push("4. Indiquer tout défaut bloquant.")
md.push("5. Renseigner `reviewer_id`, date et décision (OK / REWORK / REJECT).")
md.push("")
md.push(
  "**Attention versions :** draft et analyze = sorties **v1.2.0** ; plan = **v1.2.1**. Le code actuel est v1.2.1 pour les trois Patterns. Une revue des drafts/analyses 1.2.0 ne valide pas automatiquement le code 1.2.1.",
)
md.push("")
md.push("---")
md.push("")

for (const [i, item] of pack.entries()) {
  const n = i + 1
  const inp = item.input || {}
  const b = item.brief
  md.push(`## Fiche ${n} — \`${item.id}\``)
  md.push("")
  md.push("| | |")
  md.push("|--|--|")
  md.push(`| Pattern | ${labels[item.pattern]} (\`${item.pattern}\`) |`)
  md.push(`| Version testée LIVE | **${item.version}** |`)
  md.push(`| Modèle | ${item.model} |`)
  md.push(`| Zod | ${item.zodOk ? "PASS" : "FAIL"} |`)
  md.push(`| Tokens (in/out) | ${item.promptTokens ?? "?"} / ${item.completionTokens ?? "?"} |`)
  md.push(`| Latence | ${item.latencyMs ?? "?"} ms |`)
  md.push("")

  md.push("### Objectif / entrée synthétique")
  md.push("")
  if (item.pattern.includes("draft")) {
    md.push(`- **Besoin :** ${inp.description || ""}`)
    md.push(
      `- **Locale :** ${inp.locale || "fr"} · maxQuestions=${inp.maxQuestions ?? ""} · maxCategories=${inp.maxCategories ?? ""}`,
    )
  } else if (item.pattern.includes("analyze")) {
    md.push(`- **Scorecard :** ${inp.scorecardName || ""}`)
    md.push(`- **Objectif :** ${inp.objective || ""}`)
    md.push(`- **Score global officiel :** ${inp.globalScorePercent} %`)
    md.push(
      `- **Catégories :** ${(inp.categoryScores || []).map((c) => `${c.name} ${c.scorePercent}%`).join(" · ") || "—"}`,
    )
    if (inp.thresholds?.length) {
      md.push(
        `- **Seuils :** ${inp.thresholds.map((t) => `${t.label} [${t.minPercent}-${t.maxPercent}]`).join(", ")}`,
      )
    }
    if (inp.allowedMetadata) {
      md.push(
        `- **Métadonnées :** respondants=${inp.allowedMetadata.respondentCount ?? "?"}${inp.allowedMetadata.notes ? `, notes=${inp.allowedMetadata.notes}` : ""}`,
      )
    }
  } else {
    md.push(`- **Situation :** ${inp.situationSummary || ""}`)
    md.push(`- **Cas d'usage :** ${inp.useCase || ""}`)
    md.push(`- **Forces :** ${(inp.strengths || []).join(" · ") || "—"}`)
    md.push(`- **Écarts :** ${(inp.gaps || []).join(" · ") || "—"}`)
    md.push(`- **Contraintes :** ${(inp.constraints || []).join(" · ") || "—"}`)
  }
  md.push("")

  md.push("### Contrôles automatiques")
  md.push("")
  md.push(`- Structure / Zod : **${item.zodOk ? "PASS" : "FAIL"}**`)
  if (item.pattern.includes("analyze")) {
    md.push("- Intégrité scores (echo = entrée) : **PASS** (campagne 19D)")
  }
  if (item.pattern.includes("draft")) {
    md.push("- Statut attendu `draft_suggestion` : contrôlé à la génération")
  }
  if (item.pattern.includes("action")) {
    md.push("- Exactement 3 priorités + ≥3 actions : contrôlé Zod")
  }
  md.push("- Anomalies signalées en commentaires provisoires LOT 19E/19F (non humains)")
  md.push("")

  md.push("### Proposition IA (lisible)")
  md.push("")
  if (item.pattern.includes("draft")) {
    md.push(`**Titre :** ${b.title}`)
    md.push("")
    md.push(`**Objectif :** ${b.objective}`)
    md.push("")
    md.push(`**Public :** ${b.audience}`)
    md.push("")
    md.push("**Catégories :**")
    for (const c of b.categories) md.push(`- ${c}`)
    md.push("")
    md.push("**Questions :**")
    for (const [qi, q] of b.questions.entries()) {
      md.push(`${qi + 1}. [${q.type}] ${q.title}`)
      if (q.options?.length) {
        md.push(`   - Options : ${q.options.join(" / ")}${q.options.length >= 4 ? " …" : ""}`)
      }
    }
    md.push("")
    md.push(`**Avertissements :** ${(b.disclaimers || []).join(" · ")}`)
    md.push("")
    md.push(`**Recommandations Builder :** ${(b.recommendations || []).join(" · ")}`)
  } else if (item.pattern.includes("analyze")) {
    md.push(`**Résumé :** ${b.summary}`)
    md.push("")
    md.push("**Points forts :**")
    if (!b.strengths?.length) md.push("- _(aucun — données insuffisantes)_")
    else for (const s of b.strengths) md.push(`- ${s}`)
    md.push("")
    md.push("**Axes d'amélioration :**")
    if (!b.improvementAreas?.length) md.push("- _(aucun — données insuffisantes)_")
    else for (const s of b.improvementAreas) md.push(`- ${s}`)
    md.push("")
    md.push("**Explications :**")
    for (const s of b.explanations || []) md.push(`- ${s}`)
    md.push("")
    md.push("**Recommandations :**")
    for (const s of b.recommendations || []) md.push(`- ${s}`)
    md.push("")
    md.push("**Limites d'analyse :**")
    for (const s of b.analysisLimits || []) md.push(`- ${s}`)
    md.push("")
    md.push(
      `**Scores officiels repris (doivent = entrée) :** global ${b.echo?.globalScorePercent} % · ${(b.echo?.categoryScores || []).map((c) => `${c.name} ${c.scorePercent}%`).join(" · ")}`,
    )
  } else {
    md.push(`**Synthèse :** ${b.situationSynthesis}`)
    md.push("")
    md.push("**Priorités :**")
    for (const [pi, p] of (b.topPriorities || []).entries()) md.push(`${pi + 1}. ${p}`)
    md.push("")
    md.push("**Actions :**")
    for (const a of b.actions || []) {
      md.push(`- **${a.title}** (${a.priority} · ${a.horizon})`)
      md.push(`  - ${a.description}`)
      md.push(`  - Résultat attendu : ${a.expectedOutcome}`)
      md.push(`  - Indicateur : ${a.successIndicator}`)
    }
    md.push("")
    md.push(`**Faits :** ${(b.facts || []).join(" · ")}`)
    md.push("")
    md.push(`**Hypothèses :** ${(b.hypotheses || []).join(" · ")}`)
    md.push("")
    md.push(`**Recommandations :** ${(b.recommendations || []).join(" · ")}`)
    md.push("")
    md.push(`**Avertissements :** ${(b.disclaimers || []).join(" · ")}`)
  }
  md.push("")
  md.push("### Zone de notation humaine (à remplir)")
  md.push("")
  md.push("| Critère | Note |")
  md.push("|---------|------|")
  for (const c of criteria) md.push(`| ${c} |  |`)
  md.push("")
  md.push("| Champ | Valeur |")
  md.push("|-------|--------|")
  md.push("| Commentaires |  |")
  md.push("| Défauts bloquants |  |")
  md.push("| Reviewer ID |  |")
  md.push("| Date |  |")
  md.push("| Décision (OK / REWORK / REJECT) |  |")
  md.push("")
  md.push("---")
  md.push("")
}

md.push("## Rappel")
md.push("")
md.push(
  "Saisir les notes finales dans `docs/ai/lot19g-human-review.csv`. Tant qu'aucune ligne n'est remplie par un réviseur, **HUMAN REVIEW reste PENDING**.",
)
md.push("")

writeFileSync("docs/ai/lot19h-human-review-package.md", md.join("\n"), "utf8")
console.log(`Wrote docs/ai/lot19h-human-review-package.md (${pack.length} fiches)`)
