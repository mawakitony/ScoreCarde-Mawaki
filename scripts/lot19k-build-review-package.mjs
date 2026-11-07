/**
 * LOT 19K — build business review package from tmp/lot19j-live/*-full.json
 * Offline only. No Groq calls.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  QUALITY_CRITERIA,
  RUBRIC_GUIDE,
  SCORE_ANCHORS,
} from "../lib/ai/fabric-prototype/eval/quality-rubric.ts"

const dir = "tmp/lot19j-live"
const fullName = readdirSync(dir).find((f) => f.endsWith("-full.json"))
if (!fullName) {
  console.error("No *-full.json in tmp/lot19j-live/")
  process.exit(1)
}

const extras = JSON.parse(readFileSync(join(dir, "lot19j-scenario-extras.json"), "utf8"))
const extrasById = Object.fromEntries(extras.map((e) => [e.id, e]))
const report = JSON.parse(readFileSync(join(dir, fullName), "utf8"))

const HIGHLIGHT = {
  d19j_draft_pmp: "PRIORITÉ REVUE — A1 (pertinence questions / échelles)",
  d19j_draft_pmo: "PRIORITÉ REVUE — A2 (anti-contact / maturité PMO)",
  d19j_draft_prospects: "PRIORITÉ REVUE — A3 (qualification B2B sans confusion CRM)",
  d19j_analyze_high: "PRIORITÉ REVUE — B2 (petits écarts / sur-interprétation)",
  d19j_plan_skills: "PRIORITÉ REVUE — C1 (requiresArbitration prudent non exigé + qualité du plan)",
}

const PATTERN_LABEL = {
  generate_scorecard_draft: "Génération de scorecard (`generate_scorecard_draft`)",
  analyze_scorecard_results: "Analyse des résultats (`analyze_scorecard_results`)",
  generate_action_plan: "Plan d'action (`generate_action_plan`)",
}

const CRITERION_LABEL = {
  pertinence: "Pertinence",
  precision: "Précision",
  coherence_metier: "Cohérence métier",
  clarte: "Clarté",
  utilite_recommandations: "Utilité des recommandations",
  respect_donnees: "Respect des données",
  absence_inventions: "Absence d'inventions",
  qualite_structure: "Qualité de structure",
  adaptation_contexte: "Adaptation au contexte",
  exploitabilite_woloyem: "Exploitabilité WOLOYEM",
}

const criterionRows = QUALITY_CRITERIA.map(
  (c) => `| ${CRITERION_LABEL[c]} (\`${c}\`) (0-5) |  |`,
).join("\n")

const guideLines = QUALITY_CRITERIA.map((c) => `- **${c}** — ${RUBRIC_GUIDE[c]}`).join("\n")
const anchorLines = Object.entries(SCORE_ANCHORS)
  .map(([k, v]) => `- **${k}** — ${v}`)
  .join("\n")

const lines = []
lines.push("# LOT 19K — Package de revue métier finale (Patterns v1.3.0)")
lines.push("")
lines.push("**HUMAN REVIEW :** **PENDING**")
lines.push("")
lines.push(
  "**TECHNICAL PASS (LOT 19J) ≠ APPROVED.** Aucune note humaine n'est préremplie. Aucun statut APPROVED n'est attribué.",
)
lines.push("")
lines.push(`**Source LIVE :** \`${fullName}\``)
lines.push("")
lines.push(`**Campagne :** \`${report.campaignId || "lot19j-v130-retest"}\``)
lines.push("")
lines.push("**LIVE LLM CALLS (ce LOT) :** **ZERO** — préparation de revue uniquement.")
lines.push("")
lines.push("**PRODUCTION CHANGES :** **NONE**")
lines.push("")
lines.push("---")
lines.push("")
lines.push("## Mode d'emploi")
lines.push("")
lines.push("1. Lire l'entrée synthétique complète.")
lines.push("2. Lire la **réponse Groq intégrale** (JSON) sans se fier aux seuls contrôles techniques.")
lines.push("3. Noter les **10 critères** de 0 à 5 (ancrages ci-dessous).")
lines.push("4. Lister tout défaut bloquant.")
lines.push(
  "5. Décision humaine : `OK` / `REWORK` / `REJECT` — **ne pas utiliser APPROVED automatiquement**.",
)
lines.push("")
lines.push("### Scénarios à mettre en évidence")
lines.push("")
lines.push("| ID | Focus |")
lines.push("|----|-------|")
lines.push("| `d19j_draft_pmp` (A1) | Pertinence questions / échelles |")
lines.push("| `d19j_draft_pmo` (A2) | Anti-contact / maturité PMO |")
lines.push("| `d19j_draft_prospects` (A3) | Qualification B2B |")
lines.push("| `d19j_analyze_high` (B2) | Petits écarts / sur-interprétation |")
lines.push("| `d19j_plan_skills` (C1) | Arbitrage prudent non exigé ; qualité du plan |")
lines.push("")
lines.push("### Les 10 critères (LOT 19H / rubric partagée)")
lines.push("")
lines.push(guideLines)
lines.push("")
lines.push("### Ancrages de note")
lines.push("")
lines.push(anchorLines)
lines.push("")
lines.push("### Totaux techniques LOT 19J (rappel)")
lines.push("")
lines.push("| | |")
lines.push("|--|--|")
lines.push("| Version Patterns | **1.3.0** |")
lines.push("| TECHNICAL | 12 PASS / 0 FAIL / 0 NOT RUN |")
lines.push("| HTTP | 12 / 18 |")
lines.push(`| Coût estimé | $${report.summary.estimatedCostUsd} / $0.02 |`)
lines.push("| Zod | 12/12 |")
lines.push("| Scoring integrity | 4/4 |")
lines.push("")
lines.push("---")
lines.push("")

report.results.forEach((r, idx) => {
  const ex = extrasById[r.scenario.id] || {}
  const highlight = HIGHLIGHT[r.scenario.id]
  lines.push(`## Fiche ${idx + 1} — \`${r.scenario.id}\``)
  lines.push("")
  if (highlight) {
    lines.push(`> **${highlight}**`)
    lines.push("")
  }
  lines.push("| | |")
  lines.push("|--|--|")
  lines.push(`| Pattern | ${PATTERN_LABEL[r.scenario.patternId]} |`)
  lines.push(`| Version testée LIVE | **${r.patternVersion || "1.3.0"}** |`)
  lines.push(`| Modèle | ${r.model || "openai/gpt-oss-120b"} |`)
  lines.push(
    `| TECHNICAL (19J) | **${ex.technicalStatus || (r.deterministic.allRequiredPassed ? "PASS" : "FAIL")}** |`,
  )
  const zodPass =
    r.deterministic.checks.some((c) => (c.id === "zod_ok" || c.id === "json_ok") && c.pass) ||
    r.deterministic.runOk
  lines.push(`| Zod / structure | ${zodPass ? "PASS" : "FAIL"} |`)
  lines.push(`| HTTP attempts | ${r.httpAttempts ?? 0} |`)
  lines.push(
    `| Tokens (in/out/cached) | ${r.usage?.promptTokens ?? "?"} / ${r.usage?.completionTokens ?? "?"} / ${r.usage?.cachedTokens ?? 0} |`,
  )
  lines.push(`| Latence | ${r.deterministic.latencyMs} ms |`)
  lines.push(`| Coût estimé scénario | ${ex.costUsd != null ? `$${ex.costUsd}` : "n/a"} |`)
  lines.push("| HUMAN REVIEW | **PENDING** |")
  lines.push("")

  lines.push("### Entrée synthétique complète")
  lines.push("")
  lines.push("```json")
  lines.push(JSON.stringify(r.syntheticInput, null, 2))
  lines.push("```")
  lines.push("")

  lines.push("### Contrôles techniques déterministes")
  lines.push("")
  lines.push("| Check | Pass | Détail |")
  lines.push("|-------|------|--------|")
  for (const c of r.deterministic.checks) {
    lines.push(
      `| \`${c.id}\` | ${c.pass ? "PASS" : "FAIL"} | ${String(c.detail).replace(/\|/g, "\\|")} |`,
    )
  }
  lines.push("")
  if ((ex.anomalies || []).length) {
    lines.push(`**Anomalies extras 19J :** ${ex.anomalies.join(" ; ")}`)
  } else {
    lines.push("**Anomalies extras 19J :** aucune")
  }
  lines.push("")

  lines.push("### Réponse Groq intégrale (sans reformulation)")
  lines.push("")
  lines.push("```json")
  lines.push(JSON.stringify(r.validatedOutput, null, 2))
  lines.push("```")
  lines.push("")

  lines.push("### Grille de notation métier (vierge — 10 critères LOT 19H)")
  lines.push("")
  lines.push("| Critère | Note |")
  lines.push("|---------|------|")
  lines.push(criterionRows)
  lines.push("")
  lines.push("**Moyenne humaine :** _(à calculer uniquement après saisie des 10 notes)_")
  lines.push("")

  lines.push("### Zone décision humaine")
  lines.push("")
  lines.push("| Champ | Valeur |")
  lines.push("|-------|--------|")
  lines.push("| Défauts bloquants |  |")
  lines.push("| Commentaires |  |")
  lines.push("| Reviewer ID |  |")
  lines.push("| Date de revue |  |")
  lines.push("| Décision humaine (`OK` / `REWORK` / `REJECT`) |  |")
  lines.push(
    "| Statut APPROVED | **NON ATTRIBUÉ** (interdit tant que HUMAN REVIEW = PENDING) |",
  )
  lines.push("")
  lines.push("---")
  lines.push("")
})

lines.push("## Synthèse package")
lines.push("")
lines.push("| Item | Statut |")
lines.push("|------|--------|")
lines.push("| 12 fiches avec entrée + réponse intégrale | Prêt |")
lines.push("| Grilles 10 critères | Vierges |")
lines.push("| Notes humaines | **Aucune** |")
lines.push("| HUMAN REVIEW | **PENDING** |")
lines.push("| APPROVED auto | **Aucun** |")
lines.push("| LIVE calls LOT 19K | **ZERO** |")
lines.push("| LOT 20 | **Non démarré** |")
lines.push("")
lines.push("_Fin du package LOT 19K._")
lines.push("")

const outPath = "docs/ai/lot19k-business-review-package.md"
const md = lines.join("\n")
writeFileSync(outPath, md, "utf8")
console.log(
  JSON.stringify(
    {
      outPath,
      bytes: Buffer.byteLength(md, "utf8"),
      lines: lines.length,
      scenarios: report.results.length,
      highlighted: Object.keys(HIGHLIGHT),
      source: fullName,
    },
    null,
    2,
  ),
)
