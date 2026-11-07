/**
 * Post-Zod business guards for Fabric patterns (LOT 19I / 19L).
 * Fail closed on clear off-topic / overclaim / calendar issues — never mutates scoring engine.
 */

const CONTACT_NEED_RE =
  /\b(email|e-mail|courriel|téléphone|telephone|phone|coordonn|contact|adresse mail)\b/i

const CONTACT_QUESTION_RE =
  /\b(email|e-mail|courriel|téléphone|telephone|phone|@)\b/i

const GUARANTEED_PCT_RE =
  /\b(réduira|réduiront|garant(?:it|ie)|assurera|obtiendra|atteindra)\b[\s\S]{0,40}\d+\s*%|\d+\s*%[\s\S]{0,40}\b(garanti|assuré|certain)\b/i

/** Percent present without an explicit "proposed / to validate" marker. */
const BARE_PCT_RE = /\d+\s*%/
const PCT_VALIDATED_RE = /indicatif|à valider|a valider|cible propos|proposée? à valider|non validé|hypothèse/i

/** Exclusive single-chantier / mutually exclusive resource — NOT mere "budget limité". */
const EXCLUSIVE_CONSTRAINT_RE =
  /budget unique|un seul chantier|un seul projet|un seul chantier majeur|choix exclusif|mutuellement exclusifs?|ne (permet|permettent) (qu'|que )un|pour un seul chantier/i

const LIMITED_BUT_NOT_EXCLUSIVE_RE =
  /budget (formation )?limité|ressources? limitées?|budget serré|capacité limitée/i

export function inputAllowsContactFields(description: string): boolean {
  return CONTACT_NEED_RE.test(description)
}

/** Reject draft questions that collect contact without an explicit need. */
export function findOffTopicContactQuestions(
  description: string,
  questions: Array<{ title?: string; type?: string }>,
): string | null {
  if (inputAllowsContactFields(description)) return null
  for (const q of questions) {
    const type = q.type ?? ""
    if (type === "email" || type === "phone") {
      return `question_contact_type:${type}`
    }
    if (q.title && CONTACT_QUESTION_RE.test(q.title)) {
      return `question_contact_title:${q.title.slice(0, 80)}`
    }
  }
  return null
}

/** Reject action-plan language that presents invented % as guaranteed outcomes. */
export function findGuaranteedPercentClaims(plan: {
  actions?: Array<{ description?: string; expectedOutcome?: string; successIndicator?: string }>
  recommendations?: string[]
  situationSynthesis?: string
}): string | null {
  const chunks: string[] = []
  if (plan.situationSynthesis) chunks.push(plan.situationSynthesis)
  for (const a of plan.actions ?? []) {
    if (a.description) chunks.push(a.description)
    if (a.expectedOutcome) chunks.push(a.expectedOutcome)
    if (a.successIndicator) chunks.push(a.successIndicator)
  }
  for (const r of plan.recommendations ?? []) chunks.push(r)
  for (const chunk of chunks) {
    if (GUARANTEED_PCT_RE.test(chunk)) return chunk.slice(0, 120)
  }
  return null
}

/**
 * Percent targets must be marked as proposed / to validate — not as settled objectives.
 */
export function findUnvalidatedPercentTargets(plan: {
  actions?: Array<{ description?: string; expectedOutcome?: string; successIndicator?: string }>
  recommendations?: string[]
}): string | null {
  const chunks: string[] = []
  for (const a of plan.actions ?? []) {
    if (a.expectedOutcome) chunks.push(a.expectedOutcome)
    if (a.successIndicator) chunks.push(a.successIndicator)
  }
  for (const r of plan.recommendations ?? []) chunks.push(r)
  for (const chunk of chunks) {
    if (BARE_PCT_RE.test(chunk) && !PCT_VALIDATED_RE.test(chunk) && !GUARANTEED_PCT_RE.test(chunk)) {
      return chunk.slice(0, 120)
    }
  }
  return null
}

/**
 * Detect misleading PMI / official-certification claims.
 * Allows negated / disclaimer phrasing (e.g. "sans prétention de certification officielle PMI").
 * Does not treat an unrelated nearby "sans" as negation (LOT 19R / LIVE 19N A1).
 * LOT 19S: also catches "certifié par PMI" / "PMI approuve officiellement" and
 * "sans prétendre être une certification…".
 */
export function findMisleadingPmiCertificationClaim(value: unknown): string | null {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "")
  const lower = text.toLowerCase()
  const claimRe =
    /certification\s+(officielle\s+)?pmi|certification\s+pmi\s+officielle|officielle\s+certification\s+pmi|(?:certifi[ée]e?|accr[ée]dit[ée]e?)\s+(?:par\s+)?(?:le\s+)?pmi\b|officiellement\s+certifi[ée]e?\s+par\s+(?:le\s+)?pmi\b|pmi\s+approuve\s+officiellement|approuv[ée]e?\s+officiellement\s+par\s+(?:le\s+)?pmi\b/gi
  const negationBeforeClaim =
    /(sans\s+pr[ée]tention\s+de\s*|sans\s+pr[ée]tendre\s+(?:[àa]\s+|être\s+)(?:une\s+)?|ne\s+constitue\s+pas\s+(?:une\s+)?|n['’]est\s+pas\s+(?:une\s+)?|pas\s+une\s+|aucune\s+|pas\s+de\s+|hors\s+|ne\s+pas\s+[^\n.]{0,48}?)$/i
  let match: RegExpExecArray | null
  while ((match = claimRe.exec(lower))) {
    const start = Math.max(0, match.index - 90)
    const window = lower.slice(start, match.index)
    if (negationBeforeClaim.test(window)) continue
    return match[0]
  }
  return null
}

/**
 * Soft PMI phrasing that is neither a clear negation nor an explicit official claim.
 * Deterministic validators should not auto-PASS quality; humans decide.
 */
export function isAmbiguousPmiAffiliationPhrase(value: unknown): boolean {
  const text = (typeof value === "string" ? value : JSON.stringify(value ?? "")).toLowerCase()
  if (findMisleadingPmiCertificationClaim(text)) return false
  return (
    /\balign[ée]e?\s+(?:sur|avec)\s+(?:les\s+)?(?:standards?|exigences?)\s+pmi\b/.test(text) ||
    /\breconnu\s+pmi\b/.test(text) ||
    /\bconforme\s+pmi\b/.test(text) ||
    /\bpmi[\s-]*compliant\b/.test(text)
  )
}

export function hasExclusiveResourceConstraint(constraints: string[]): boolean {
  const text = (constraints ?? []).join(" ")
  if (!text.trim()) return false
  if (EXCLUSIVE_CONSTRAINT_RE.test(text)) return true
  // "limité" alone is NOT exclusive.
  if (LIMITED_BUT_NOT_EXCLUSIVE_RE.test(text) && !EXCLUSIVE_CONSTRAINT_RE.test(text)) return false
  return false
}

/**
 * Competing priorities with an *exclusive* single-budget / single-chantier constraint.
 * A merely "limited" budget must NOT trigger arbitration by itself.
 */
export function shouldRequireArbitration(input: {
  gaps?: string[]
  constraints?: string[]
}): boolean {
  const gaps = input.gaps ?? []
  return hasExclusiveResourceConstraint(input.constraints ?? []) && gaps.length >= 2
}

const HORIZON_MAX_DAYS: Record<string, number> = {
  immédiat: 14,
  "30_jours": 45,
  "90_jours": 120,
  "6_mois": 210,
}

const HORIZON_MIN_DAYS: Record<string, number> = {
  immédiat: 0,
  "30_jours": 0,
  "90_jours": 46,
  "6_mois": 121,
}

function extractDeadlineDays(text: string): number | null {
  const jPlus = text.match(/\bJ\s*\+\s*(\d+)\b/i)
  if (jPlus) return Number(jPlus[1])
  const sous = text.match(/\bsous\s+(\d+)\s*jours?\b/i)
  if (sous) return Number(sous[1])
  const days = text.match(/\bdans\s+(\d+)\s*jours?\b/i)
  if (days) return Number(days[1])
  if (/\bsous\s+7\s*jours?\b/i.test(text) || /\ben\s+une\s+semaine\b/i.test(text)) return 7
  return null
}

/**
 * Flag horizon vs embedded deadlines (e.g. horizon=6_mois but "à J+60").
 */
export function findHorizonInconsistencies(
  actions: Array<{
    title?: string
    horizon?: string
    description?: string
    expectedOutcome?: string
    successIndicator?: string
  }>,
): string | null {
  for (const action of actions) {
    const horizon = action.horizon ?? ""
    const blob = [action.description, action.expectedOutcome, action.successIndicator]
      .filter(Boolean)
      .join(" ")
    const days = extractDeadlineDays(blob)
    if (days == null || !horizon) continue
    const max = HORIZON_MAX_DAYS[horizon]
    const min = HORIZON_MIN_DAYS[horizon]
    if (typeof max === "number" && days > max) {
      return `${action.title ?? "action"}: horizon=${horizon} but deadline≈J+${days}`
    }
    if (typeof min === "number" && days < min && days > 0) {
      return `${action.title ?? "action"}: horizon=${horizon} but deadline≈J+${days}`
    }
  }
  return null
}

/**
 * Heuristic draft scoring biases (used by tests; optional runner soft-check).
 * Detects clear anti-patterns from LOT 19K / 19L review.
 */
export function findDraftScoringBiasSignals(
  questions: Array<{
    title?: string
    description?: string
    type?: string
    options?: Array<{ label?: string; score?: number }>
  }>,
): string[] {
  const hits: string[] = []
  for (const q of questions) {
    const title = `${q.title ?? ""} ${q.description ?? ""}`.toLowerCase()
    const options = q.options ?? []

    // Frequency alone rewarded as maturity (scale implying higher frequency = better without effectiveness).
    if (
      /fréquence|frequence|combien de fois|hebdomadaire|quotidien/.test(title) &&
      (q.type === "scale_5" || q.type === "scale_10") &&
      /indicateurs?|efficacité|efficacite|qualité|qualite|décision|decision|valeur/.test(title) === false &&
      /1\s*=/.test(q.description ?? "") &&
      /hebdomadaire|quotidien|plus fréquent|plus frequent/.test(q.description ?? "")
    ) {
      hits.push(`frequency_bias:${(q.title ?? "").slice(0, 60)}`)
    }

    // Tool/software ownership as sole maturity proxy with binary high score.
    if (/logiciel|outil de|outil collaboratif|ms project|jira|monday/.test(title) && q.type === "yes_no") {
      const yes = options.find((o) => /^oui$/i.test(o.label ?? ""))
      const no = options.find((o) => /^non$/i.test(o.label ?? ""))
      if (yes && no && (yes.score ?? 0) >= 15 && (no.score ?? 0) === 0) {
        hits.push(`tool_ownership_bias:${(q.title ?? "").slice(0, 60)}`)
      }
    }

    // Autonomy max rewarded without "adequate / fit" framing.
    if (/autonomie/.test(title) && (q.type === "scale_5" || q.type === "scale_10")) {
      if (/maximale|plus d'autonomie|totale/.test(q.description ?? "") && !/adaptée|adequate|adéquate|juste/.test(q.description ?? "")) {
        hits.push(`autonomy_max_bias:${(q.title ?? "").slice(0, 60)}`)
      }
    }

    // Automation of reporting rewarded as always better.
    if (/automatisation|reporting automatisé|reporting automatise/.test(title)) {
      const high = options.filter((o) => (o.score ?? 0) >= 15)
      if (high.some((o) => /automat|100\s*%|entièrement/.test(o.label ?? ""))) {
        hits.push(`automation_bias:${(q.title ?? "").slice(0, 60)}`)
      }
    }

    // Having security/compliance constraints scored as positive qualification.
    if (
      /(contrainte|exigence).*(sécurité|securite|conformité|conformite|rgpd|iso)/.test(title) ||
      /(sécurité|securite|conformité|conformite).*(contrainte|exigence)/.test(title)
    ) {
      const yesHigh = options.find(
        (o) => /oui|élevé|eleve|forte|nombreuses/.test(o.label ?? "") && (o.score ?? 0) >= 10,
      )
      if (yesHigh && !/capacité|capacite|répond|repond|couverture|adéquation|adequation/.test(title)) {
        hits.push(`constraint_as_positive:${(q.title ?? "").slice(0, 60)}`)
      }
    }
  }
  return hits
}
