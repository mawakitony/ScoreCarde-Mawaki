# LOT 19I — Corrections métier finales et préparation à l’intégration

**Date:** 2026-10-24  
**LIVE LLM CALLS:** **ZERO**  
**PRODUCTION CHANGES:** **NONE**  
**HUMAN REVIEW:** **PENDING**  
**OVERALL:** **READY FOR TARGETED RETEST**

---

## 1. Diagnostic initial

Sources lues (sans les traiter comme validation humaine officielle) :

- `docs/ai/lot19g-final-business-validation.md`
- `docs/ai/lot19h-human-review-package.md`
- `docs/ai/lot19h-final-decision.md`
- `docs/ai/lot19g-human-review.csv`
- `docs/ai/lot19e-quality-and-tpm-report.md`
- `docs/ai/lot19f-action-plan-retest.md`

État code avant correction : Patterns **v1.2.1**, schémas draft monovalués (`status: draft_suggestion` obligatoire), pas de branche clarification, pas de garde anti-contact / anti-% garantis, analyze sans champs `facts` / `interpretations` explicites, plan sans `requiresArbitration` / `missingInformation`.

Les notes ChatGPT / moyennes LOT 19E–19F restent **provisoires**. Aucune note humaine n’a été inventée ni modifiée.

---

## 2. Défauts corrigés

| Pattern | Défaut 19H / revue technique | Correction 19I |
|---------|------------------------------|----------------|
| Draft PMP | Questions trop générales / échelles peu explicites | Mock + prompt : questions jalons / risques / suivi avec signification 1–5 |
| Draft PMO | Question e-mail hors maturité | Garde `findOffTopicContactQuestions` + prompt ; mock PMO sans contact |
| Draft Prospects | Mélange qualification / décideur / collecte | Mock orienté besoin / maturité d’achat / fit ; pas d’email |
| Draft ambigu | Hybride leadership+ventes sans clarification | Union Zod `needs_clarification` + mock + prompt |
| Analyze | Utilité / distinction faits vs interprétation | Champs `facts` + `interpretations` ; prompt écarts sans causes inventées |
| Plan | % inventés comme résultats prévisibles | Garde anti-garantie + prompt ; objectifs indicatifs seulement |
| Plan concurrent | Choix arbitraire sous budget unique | `requiresArbitration` + `arbitrationQuestion` (+ forçage runner) |

---

## 3. Modifications par Pattern

### `generate_scorecard_draft` → **1.3.0**

- Contrat discriminé `status`: `draft_suggestion` | `needs_clarification`
- Clarification : `clarifyingQuestion`, `options[]`, `rationale?`, `disclaimers` — **pas** de questions/catégories, **pas** de persistence
- Prompt : ambiguïté obligatoire → clarification ; échelles explicites ; anti-contact ; anti-certification
- Runner : rejet contact hors besoin ; rejet `maxQuestions` / `maxCategories`

### `analyze_scorecard_results` → **1.3.0**

- Sortie enrichie : `facts[]`, `interpretations[]` (défaut `[]` pour compat parse)
- Prompt : distinction faits / interprétations / recommandations ; écarts en amplitude ; limites échantillon / seuils / catégorie unique
- Intégrité scores inchangée : echo forcé depuis l’entrée ; mismatch → échec

### `generate_action_plan` → **1.3.0**

- `missingInformation[]`, `requiresArbitration`, `arbitrationQuestion?`
- Prompt : interdiction des % garantis ; arbitrage si budget unique + ≥2 chantiers
- Runner : rejet des formulations type « réduira de X % » / « garanti » ; forçage `requiresArbitration` si contrainte détectée

---

## 4. Versions

| Pattern | Version précédente (code) | Nouvelle | Sorties LIVE historiques |
|---------|---------------------------|----------|---------------------------|
| `generate_scorecard_draft` | 1.2.1 | **1.3.0** | restent **1.2.0** (19D) — non réétiquetées |
| `analyze_scorecard_results` | 1.2.1 | **1.3.0** | restent **1.2.0** (19D) |
| `generate_action_plan` | 1.2.1 | **1.3.0** | restent **1.2.1** (19F) |

Campagnes 19D/19F conservent leurs `patternVersionRequired` historiques. Le runtime 1.3.0 n’est **pas** rétro-labelisé sur les artefacts `tmp/`.

---

## 5. Évolution des schémas

| Schéma | Compatibilité |
|--------|----------------|
| Draft output | **Breaking soft** : consommateurs doivent lire `status`. Anciens payloads sans clarification restent valides s’ils portent `status: "draft_suggestion"`. |
| Analyze output | **Additive** : `facts` / `interpretations` avec défauts. |
| Plan output | **Additive** : `missingInformation` (défaut `[]`), `requiresArbitration` (défaut `false`), `arbitrationQuestion` optionnel. |

Aucun changement au moteur de scoring WOLOYEM Score, Builder, Assistant production, RLS, Stripe.

---

## 6. Tests

- Nouveau : `lib/ai/fabric-prototype/tests/lot19i-business-corrections.test.ts`
- Mises à jour : lot19, lot19c, lot19e, lot19f (versions 1.3.0), dataset ambiguous → `mustClarify`, competing → `mustRequireArbitration`
- Couverture déterministe : PMP, PMO, sales, ambigu, incomplet, limites taille, contact hors sujet, Zod union, scores, faits/interprétations, % garantis, arbitrage, isolation
- **Limite** : fixtures mock ≠ preuve que Groq suivra les prompts 1.3.0 → retest LIVE requis (plan séparé)

---

## 7. Non-régression

| Contrôle | Attendu |
|----------|---------|
| Feature flags Fabric | OFF par défaut |
| Assistant / robot / UI prod | non touchés |
| Routes publiques Fabric | aucune ajoutée |
| Supabase / migrations / deploy | aucun |
| Appels Groq | **ZERO** |
| Notes humaines LOT 19G CSV | non modifiées |

---

## 8. Risques restants

1. Le LLM LIVE peut encore ignorer la clarification ou inventer un contact — gardes runner mitigent mais ne remplacent pas la revue.
2. `requiresArbitration` forcé côté runner si contrainte détectée ; formulations de contrainte hors regex peuvent passer.
3. Objectifs chiffrés « indicatifs » mal phrasés peuvent encore apparaître sans déclencher la regex anti-garantie.
4. Compat consommateurs draft : code qui suppose toujours `questions` sans lire `status` cassera sur clarification.
5. HUMAN REVIEW toujours PENDING — pas de statut CANDIDATE / READY.

---

## 9. Limites de validation

- Validé : contrats Zod, gardes, mocks, harness mock, typecheck/lint/build selon scripts.
- **Non validé** : comportement Groq 1.3.0 LIVE ; qualité métier subjective ; revue humaine.

---

## 10. Préconditions d’intégration

Avant toute intégration dans WOLOYEM AI (LOT 20+) :

1. Retest LIVE ciblé 1.3.0 autorisé explicitement (voir `lot19i-targeted-retest-plan.md`)
2. Revue humaine COMPLETED sur les sorties 1.3.0
3. Consommateurs draft gèrent `needs_clarification` sans persistence
4. Feature flags et isolation production inchangés jusqu’à go produit
5. Scoring engine reste seule source de vérité des scores

**Ne pas déclarer les Patterns prêts pour la production.**

---

## Statuts finaux

| Statut | Valeur |
|--------|--------|
| SCORECARD CORRECTIONS | **PASS** (code + tests mock) |
| ANALYSIS CORRECTIONS | **PASS** (code + tests mock) |
| ACTION PLAN CORRECTIONS | **PASS** (code + tests mock) |
| ZOD CONTRACTS | **PASS** |
| SCORING INTEGRITY | **PASS** |
| NON-REGRESSION | **PASS** |
| HUMAN REVIEW | **PENDING** |
| LIVE LLM CALLS | **ZERO** |
| PRODUCTION CHANGES | **NONE** |
| OVERALL | **READY FOR TARGETED RETEST** |
