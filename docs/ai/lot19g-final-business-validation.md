# LOT 19G — Validation métier finale et décision d’intégration (sans intégration)

**Date:** 2026-10-24  
**LIVE LLM CALLS:** **ZERO**  
**PRODUCTION CHANGES:** **NONE**  
**HUMAN REVIEW:** **PENDING**

---

## 1. Inventaire des 12 réponses LIVE évaluables

Sources : `tmp/lot19d-live/` (8 drafts+analyze) + `tmp/lot19f-plan-live/` (4 plans).  
Scan secrets : **aucun**. Données clients : **aucune**.

| # | ID | Pattern | Version LIVE | Campagne | Zod | Tokens in/out | Latence ms | Coût (partagé) |
|---|----|---------|--------------|----------|-----|---------------|------------|----------------|
| 1 | `d19d_draft_pmp` | draft | **1.2.0** | 19D | OK | 1175/1930 | 4754 | ⊂ ~$0.0075 campagne 19D |
| 2 | `d19d_draft_pmo` | draft | **1.2.0** | 19D | OK | 1171/1934 | 5363 | ⊂ 19D |
| 3 | `d19d_draft_prospects` | draft | **1.2.0** | 19D | OK | 1174/1938 | 4845 | ⊂ 19D |
| 4 | `d19d_draft_ambiguous` | draft | **1.2.0** | 19D | OK | 1164/1410 | 10301 | ⊂ 19D |
| 5 | `d19d_analyze_low` | analyze | **1.2.0** | 19D | OK | 889/785 | 23406 | ⊂ 19D |
| 6 | `d19d_analyze_high` | analyze | **1.2.0** | 19D | OK | 888/953 | 13319 | ⊂ 19D |
| 7 | `d19d_analyze_imbalanced` | analyze | **1.2.0** | 19D | OK | 885/816 | 13242 | ⊂ 19D |
| 8 | `d19d_analyze_partial` | analyze | **1.2.0** | 19D | OK | 842/637 | 12553 | ⊂ 19D |
| 9 | `d19f_plan_skills` | plan | **1.2.1** | 19F | OK | 968/1072 | 3187 | ⊂ ~$0.0033 campagne 19F |
| 10 | `d19f_plan_pmo` | plan | **1.2.1** | 19F | OK | 971/1402 | 20413 | ⊂ 19F |
| 11 | `d19f_plan_digital` | plan | **1.2.1** | 19F | OK | 969/1197 | 23496 | ⊂ 19F |
| 12 | `d19f_plan_competing` | plan | **1.2.1** | 19F | OK | 962/996 | 20270 | ⊂ 19F |

Hors inventaire qualité (non évaluables) : `d19d_plan_skills` FAIL 429 ; 3 plans 19D NOT RUN.

**Version runtime actuelle du code :** les trois Patterns sont en **v1.2.1**.

### Différence de version (critique)

| Pattern | Sorties LIVE | Code actuel | Implication |
|---------|--------------|-------------|-------------|
| draft | **1.2.0 seulement** | 1.2.1 | Corrections (titre provisoire, anti-email, catégories FR, tokens) **non revalidées LIVE** |
| analyze | **1.2.0 seulement** | 1.2.1 | Règle écarts &lt;5 pts **non revalidée LIVE** |
| plan | **1.2.1** | 1.2.1 | Aligné code ↔ preuves LIVE |

**Les sorties draft/analyze 19D ne prouvent pas automatiquement la qualité de v1.2.1.**

---

## 2. Évaluation déterministe

| Contrôle | Résultat |
|----------|----------|
| Zod sur 12 sorties | **12/12 PASS** |
| Intégrité scores (analyze 19D) | **4/4 PASS** |
| Scores non recalculés (runner force echo) | **PASS** |
| Écritures DB / prod | **NONE** |
| Isolation Fabric | **PASS** (tests) |
| Prompt injection rejects (suites mock) | **PASS** |

---

## 3. Synthèse observations métier (PROVISIONAL)

Notes issues de LOT 19E / 19F — **étiquette PROVISIONAL**, pas validation humaine.

| Pattern | n | Moy. provisoire | Observations clés |
|---------|---|-----------------|-------------------|
| draft (1.2.0) | 4 | **≈ 4.2** | Prospects excellent ; PMO email inutile ; ambigu trop assertif ; cats EN |
| analyze (1.2.0) | 4 | **≈ 4.6** | Intégrité forte ; partial exemplaire ; high trop pedantic |
| plan (1.2.1) | 4 | **≈ 4.6** | Actions mesurables ; contraintes respectées ; hyp. parfois affirmatives |

Grille exploitable : [`docs/ai/lot19g-human-review.csv`](./lot19g-human-review.csv)  
Colonnes de notes humaines **vides** — à remplir par un réviseur.

---

## 4. Grille de revue humaine

Fichier : `docs/ai/lot19g-human-review.csv`

Champs : 10 notes 0–5, commentaires, défauts critiques, `reviewer_id`, `review_date`, `human_decision`.

Statut : **PENDING** (aucune ligne human_decision ≠ PENDING).

---

## 5–7. Validation par Pattern

### `generate_scorecard_draft`

| | |
|--|--|
| Points forts | Titres spécifiques ; disclaimer anti-PMI ; types Builder ; prospects très exploitables |
| Défauts (1.2.0 LIVE) | Email hors besoin ; ambigu sans « provisoire » ; catégories EN ; sorties longues |
| Corrections code 1.2.1 | Présentes, **non prouvées LIVE** |
| SCORECARD QUALITY | **PENDING** (humaine) / provisoire NEEDS IMPROVEMENT→amélioré en code |
| Décision LOT 19G | **PENDING HUMAN REVIEW** |

### `analyze_scorecard_results`

| | |
|--|--|
| Points forts | Echo exact ; citations % ; prudence partial ; pas de mutation scores |
| Défauts (1.2.0 LIVE) | Sur-interprétation écarts 1–3 pts (high) |
| Corrections code 1.2.1 | Règle &lt;5 pts |
| ANALYSIS QUALITY | **PENDING** (humaine) / provisoire forte |
| SCORING INTEGRITY | **PASS** |
| Décision LOT 19G | **PENDING HUMAN REVIEW** |

### `generate_action_plan`

| | |
|--|--|
| Points forts (1.2.1 LIVE) | Priorisation ; indicateurs datés ; respect contraintes ; 4/4 Zod ; 0×429 |
| Défauts | Hypothèses parfois trop affirmatives ; digital un peu générique |
| ACTION PLAN QUALITY | **PENDING** (humaine) / provisoire ≈4.6 |
| Décision LOT 19G | **PENDING HUMAN REVIEW** |

---

## 8. Comparaison des trois Patterns

| | draft | analyze | plan |
|--|-------|---------|------|
| Version LIVE testée | 1.2.0 | 1.2.0 | **1.2.1** |
| Version code | 1.2.1 | 1.2.1 | 1.2.1 |
| n réponses | 4 | 4 | 4 |
| Zod | 100 % | 100 % | 100 % |
| Intégrité scores | n/a | 100 % | n/a |
| Qualité provisoire | ≈4.2 | ≈4.6 | ≈4.6 |
| Qualité humaine | **PENDING** | **PENDING** | **PENDING** |
| Latence typique | 5–10 s | 12–23 s* | 3–23 s* |
| Coût / appel utile | faible | faible | faible |
| Risque principal | Version gap 1.2.1 | Version gap 1.2.1 | Hypothèses |
| Recommandation | PENDING HUMAN REVIEW | PENDING HUMAN REVIEW | PENDING HUMAN REVIEW |

\*Inclut waits TPM / retries 19D — provider pur souvent 2–5 s.

**Limite :** échantillons différents (campagnes, versions, budgets) — ne pas sur-généraliser.

---

## 9. Critères d’acceptation (seuils 19C — statut)

| Seuil | Cible | Preuve actuelle |
|-------|-------|-----------------|
| Sécurité critique | 0 défaut | **OK** (échantillon) |
| Intégrité scores | 100 % | **OK** sur 4/4 analyze |
| Zod ≥95 % | ≥95 % | **OK** 12/12 sorties |
| Qualité humaine ≥4/5 | après revue | **NON ATTEINT** (PENDING) |
| Défaut métier bloquant | 0 | **Non tranché** sans humain |
| Latence UX | acceptable | **Partiel** (waits TPM) |
| Coût SaaS | OK | **OK** (~$0.001–0.0015 / appel utile) |

→ Candidature possible **après** revue humaine ; **pas** preuve de fiabilité production générale (n petit).

---

## 10. Plan d’intégration future (**non exécuté**)

### Scorecards
Assistant → draft Pattern (flag off) → aperçu Builder → **confirmation utilisateur** → save Builder existant (pas d’auto-publish).

### Analyses
Scores **moteur** → Pattern analyze (lecture seule) → UI explications → **jamais** écrire/modifier scores.

### Plans d’action
Diagnostic → Pattern plan → aperçu → export / confirmation selon action.

### Contrôles obligatoires
- Feature flags **OFF** by default  
- Permissions + isolation tenant  
- Zod + quotas + erreurs provider  
- Traçabilité / rollback  
- Tests non-régression  
- Spot LIVE draft+analyze v1.2.1 recommandé avant activation large  

Pas de nouvelle route publique ; pas de branchement prod dans ce LOT.

---

## 11. Performance & coûts consolidés

| Campagne | HTTP | Coût est. | Note |
|----------|------|-----------|------|
| 19D | 16 | ≈ $0.0075 | 8 sorties utiles + 429 |
| 19F | 4 | ≈ $0.0033 | 4/4 plans, 0 retry |
| **Total observé** | 20 | ≈ **$0.011** | hors futurs appels |

---

## 12. Résultats des tests (LOT 19G)

| Commande | Résultat |
|----------|----------|
| Suites Fabric 19–19F | **PASS** (58/58) |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors) |
| `npm run build` | **PASS** |
| Appels Groq | **0** |

---

## 13. Risques restants

1. Draft/analyze v1.2.1 non retestés LIVE.  
2. Revue humaine non faite → pas de seuil ≥4/5 « officiel ».  
3. Échantillon n=4/pattern — insuffisant pour SLA production.  
4. TPM 8000 org reste contrainte UX.  
5. Intégration Assistant non conçue en détail UX (confirmations).  

---

## 14. Décisions

| Pattern | Décision LOT 19G |
|---------|------------------|
| `generate_scorecard_draft` | **PENDING HUMAN REVIEW** |
| `analyze_scorecard_results` | **PENDING HUMAN REVIEW** |
| `generate_action_plan` | **PENDING HUMAN REVIEW** |

Aucun **CANDIDATE FOR INTEGRATION** sans revue humaine complétée.  
Aucun **READY FOR INTEGRATION**.

Après revue humaine favorable (≥4/5, 0 défaut bloquant) + spot-check LIVE draft/analyze 1.2.1 → alors seulement **CANDIDATE FOR INTEGRATION** / planning feature-flag.

---

## STATUTS

| Item | Status |
|------|--------|
| LIVE OUTPUT REVIEW | **PASS** (12/12 évaluables inventoriées) |
| HUMAN REVIEW | **PENDING** |
| SCORECARD QUALITY | **PENDING** |
| ANALYSIS QUALITY | **PENDING** |
| ACTION PLAN QUALITY | **PENDING** |
| SCORING INTEGRITY | **PASS** |
| SECURITY | **PASS** |
| NON-REGRESSION | **PASS** |
| LIVE LLM CALLS | **ZERO** |
| PRODUCTION CHANGES | **NONE** |
| **OVERALL** | **HUMAN REVIEW REQUIRED** |

---

## Arrêt

LOT 19G terminé. **Aucune intégration démarrée.** Prochaine étape attendue : revue humaine via `lot19g-human-review.csv`.
