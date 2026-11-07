# LOT 19R — Corrections post-LIVE (après LOT 19N)

**Date :** 2026-10-25  
**LIVE LLM calls :** ZERO  
**Production / commit / deploy / LOT 20 :** NONE / NOT STARTED  
**Human review :** PENDING (aucune note inventée)

Artefacts LIVE 19N (référence) :

- `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-full.json`
- `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-traces.json`
- `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-human-review.json`
- `docs/ai/lot19n-live-final-results.md`

---

## 1. Cause exacte A1 (`d19m_draft_pmp`)

| Élément | Détail |
|--------|--------|
| Sous-chaîne détectée | `certification officielle pmi` |
| Champ(s) | `description` (« …sans prétention de certification officielle PMI ») et/ou `disclaimers` (« Ne constitue pas une certification PMI… ») |
| Règle | `expectations.forbiddenSubstrings` → `hasForbiddenSubstring` (`deterministic-scorer`) via `String.includes` naïf |
| Contexte | Négation / disclaimer anti-affiliation, aligné avec la consigne d’entrée |

**Verdict diagnostic :** **faux positif du validateur** (référence informative / exclusion acceptable), pas une affirmation trompeuse d’affiliation PMI.

Le modèle n’a pas inventé une certification officielle ; le check lexical traitait toute occurrence de la sous-chaîne comme échec.

---

## 2. Cause exacte C4 (`d19m_plan_competing`)

| Élément | Détail |
|--------|--------|
| Erreur runner | `output_invalid` — message opaque « Sortie invalide (Zod). » |
| JSON validé | Absent (`validatedOutput` non persisté car `runOk=false`) |
| Corps brut LLM | **Non persisté** dans les artefacts 19N → impossible de rejouer le flatten Zod exact |
| Indices | `outputChars≈4119`, `completionTokens=1452`, HTTP OK, JSON parsé puis rejet Zod |
| Schéma | `generateActionPlanOutputSchema` : enums `horizon`/`priority` stricts, longueurs max, `topPriorities.length===3`, `disclaimers.min(1)`, `requiresArbitration` boolean |

**Verdict diagnostic :** incompatibilité **génération ↔ schéma Zod** (aliases d’enum type « 30 jours » / « high », dépassements de longueur, ou booléen string), **pas** un assouplissement métier de l’arbitrage.

L’échec Zod empêche toute preuve de `requiresArbitration=true` sur ce run LIVE — **aucune réussite C4 inventée**.

---

## 3. Corrections réalisées

### A1 — validateur (draft reste **1.3.1**)

- `findMisleadingPmiCertificationClaim` dans `business-guards.ts` : détecte les claims PMI trompeurs ; ignore les négations explicites (`sans prétention de…`, `ne constitue pas…`, `sans prétendre à…`).
- `hasForbiddenSubstring` : pour les needles PMI+certification, délègue à ce détecteur (plus de `includes` naïf).
- Pas de changement de prompt draft (pas d’affiliation inventée côté modèle).

### C4 — schéma / normalize / prompt / diagnostics (plan → **1.3.2**)

- Normalisation `horizon` / `priority` / coerce boolean `requiresArbitration`.
- Clip des champs texte aux max Zod (sans inventer de contenu).
- Prompt plan **1.3.2** : tokens d’enum exacts + limites de longueur rappelées.
- Message Zod enrichi (`fieldErrors` tronqués) pour les prochains runs.
- **Conservé :** `requiresArbitration=true` obligatoire si budget / chantier exclusif (`shouldRequireArbitration`).

---

## 4. Versions après correction

| Pattern | Avant 19R | Après 19R |
|---------|-----------|-----------|
| `generate_scorecard_draft` | 1.3.1 | **1.3.1** |
| `analyze_scorecard_results` | 1.3.0 | **1.3.0** |
| `generate_action_plan` | 1.3.1 | **1.3.2** |

Dataset / campagne 19M : `expectedPatternVersion` plan et `versionsRequired.generate_action_plan` → **1.3.2**.

---

## 5. Tests ajoutés

`lib/ai/fabric-prototype/tests/lot19r-post-live-fixes.test.ts` (MOCK, sorties 19N anonymisées) :

- A1 mention PMI légitime (négation)
- A1 fausse affiliation PMI
- A1 « sans » non lié n’excuse pas un claim réel
- C4 JSON/Zod invalide → `DETERMINISTIC_FAIL` (pas de succès inventé)
- C4 JSON valide + aliases + arbitrage obligatoire
- C1 sans arbitrage injustifié
- B2 scores echo inchangés
- A4 clarification (`needs_clarification`)

Inclus dans `package.json` → script `test`.

---

## 6. Résultats de régression (offline)

| Suite | Résultat |
|-------|----------|
| Fabric (19 → 19R + 19M/O/L/I/…, 142 tests) | **PASS** |
| Security (lot6 + lot19m-security + adversarial) | **PASS** |
| Typecheck (`tsc --noEmit`) | **PASS** |
| Lint (`eslint`) | **PASS** |
| Build (`next build`) | **PASS** |

Aucune clé Groq / aucun appel LIVE pendant 19R.

---

## 7. Phase 4 — Préparation revue métier (sans notes)

Réponses LIVE **valides Zod** à examiner humainement (scores = `null` / PENDING) :

| Scénario | Zod 19N | Fichier de lecture |
|----------|---------|-------------------|
| A1 `d19m_draft_pmp` | OK (mais FAIL lexical corrigé en 19R) | `full.json` → `validatedOutput` A1 |
| A2 `d19m_draft_pmo` | OK | idem |
| A3 `d19m_draft_prospects` | OK | idem |
| A4 `d19m_draft_ambiguous` | OK (`needs_clarification`) | idem |
| B2 `d19m_analyze_high` | OK (echo 88/92/85/87) | idem |
| C1 `d19m_plan_skills` | OK (`requiresArbitration=false`) | idem |
| C2 `d19m_plan_pmo` | OK | idem |
| C4 `d19m_plan_competing` | **FAIL Zod** — **non évaluable métier** sur ce run | traces uniquement (erreur) |

Grilles vides à remplir : `docs/ai/lot19q-live-validation-grid.md`, `docs/ai/lot19m-human-review-grid.md`, artefact `*-human-review.json`.

**Interdit / non fait :** attribuer des notes humaines ; déclarer A2/A3/B2/C1/C2 « APPROVED » parce que les validateurs déterministes ont réussi.

---

## 8. Risques résiduels

1. Cause Zod C4 19N non rejouable byte-à-byte (corps brut absent) — fix basé sur causes les plus probables + robustesse ; un retest LIVE reste nécessaire.
2. A1 anti-biais (fréquence / automatisation) toujours **HUMAN_REVIEW_REQUIRED**.
3. Qualité métier A2/A3/C1/C2/B2 non prouvée par l’automatisation.
4. Clip de chaînes trop longues peut tronquer une phrase en fin de champ (pas d’invention, mais perte de queue).

---

## 9. Scénarios nécessitant un nouveau test LIVE

Sous **nouvelle autorisation** (pas dans ce LOT) :

1. **`d19m_plan_competing` (C4)** — priorité : Zod + `requiresArbitration=true` sur plan **1.3.2**
2. **`d19m_draft_pmp` (A1)** — confirmer anti-PMI lexical OK + revue anti-biais

Optionnel selon revue humaine : A2, A3, C2.

---

## 10. Synthèse

| Item | Statut |
|------|--------|
| A1 root cause | Faux positif validateur PMI |
| A1 fix | Détecteur de claim trompeur + négations |
| C4 root cause | Échec Zod (sortie non validée ; corps brut non persisté) |
| C4 fix | Normalize enum/bool/clip + prompt 1.3.2 + message Zod détaillé |
| LIVE | ZERO |
| Human APPROVED | NONE / PENDING |
| Overall | **READY FOR TARGETED RETEST** (après autorisation) |
