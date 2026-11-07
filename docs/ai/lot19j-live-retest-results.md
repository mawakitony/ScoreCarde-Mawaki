# LOT 19J — Retest LIVE contrôlé (Patterns v1.3.0)

**Date d’exécution :** 2026-10-25  
**Campagne :** `lot19j-v130-retest`  
**Artefacts :** `tmp/lot19j-live/`  
**HUMAN REVIEW / BUSINESS REVIEW :** **PENDING**  
**PRODUCTION CHANGES :** **NONE**

---

## Synthèse exécutive

| Indicateur | Valeur |
|------------|--------|
| VERSION TESTÉE | **1.3.0** (les 3 Patterns) |
| SCÉNARIOS | **12 PASS / 0 FAIL / 0 NOT RUN** |
| TENTATIVES HTTP | **12 / 18** (0 retry) |
| COÛT ESTIMÉ | **$0.012203 / $0.02** |
| VALIDATION ZOD | **12/12 PASS** |
| SCORING INTEGRITY | **4/4 PASS** |
| SCORECARD CLARIFICATION | **PASS** (`needs_clarification` sur A4) |
| ACTION PLAN ARBITRATION | **PASS** sur C4 ; note : C1 a aussi levé `requiresArbitration` (prudent) |
| OVERALL | **READY FOR HUMAN REVIEW** |

**TECHNICAL PASS ≠ validation humaine.** Aucune note métier humaine n’a été inventée.

---

## Phase 1 — Préflight

| Contrôle | Résultat |
|----------|----------|
| Docs 19I / 19H lus | OK |
| Patterns = 1.3.0 | OK |
| 68 tests Fabric | **68/68 PASS** |
| Données synthétiques | OK (`d19j_*`) |
| Clé Groq présente | OK (jamais affichée) |
| Comptage HTTP + retries | OK (`live-client` incrémente chaque tentative) |
| Plafond 18 HTTP | OK |
| Suivi USD cumulatif + projection avant appel | OK (`budget.ts` + `projectedUsdPerScenario=0.0025`) |
| Flags LIVE posés uniquement pour ce run | OK |

---

## Phase 2 — Résultats par scénario

Légende statut : **TECHNICAL** uniquement. Qualité métier = **BUSINESS REVIEW PENDING**.

### Pattern 1 — `generate_scorecard_draft` v1.3.0

| ID | TECHNICAL | HTTP | Latence ms | Tokens | Coût $ | Contrôles auto | Notes |
|----|-----------|------|------------|--------|--------|----------------|-------|
| `d19j_draft_pmp` | PASS | 1 | 5736 | 3640 | 0.001516 | Zod ; ≤12q/4c ; anti-PMI substring | `draft_suggestion` ; 12q / 4c ; types scale/choice/yes_no |
| `d19j_draft_pmo` | PASS | 1 | 34170 | 3470 | 0.001339 | Zod ; anti-contact | Aucun email/phone détecté |
| `d19j_draft_prospects` | PASS | 1 | 30965 | 2838 | 0.001034 | Zod ; anti-contact | 10q / 4c ; pas de contact |
| `d19j_draft_ambiguous` | PASS | 1 | 24222 | 1865 | 0.000460 | `needs_clarification` | *« Souhaitez-vous que la scorecard porte sur le leadership, les ventes, ou les deux ? »* — pas de `questions` |

### Pattern 2 — `analyze_scorecard_results` v1.3.0

| ID | TECHNICAL | HTTP | Latence ms | Tokens | Coût $ | Contrôles auto | Notes |
|----|-----------|------|------------|--------|--------|----------------|-------|
| `d19j_analyze_low` | PASS | 1 | 18370 | 2115 | 0.000791 | Echo 27 % ; facts/interp | facts≥1 ; limits présentes |
| `d19j_analyze_high` | PASS | 1 | 20936 | 2253 | 0.000816 | Echo 88 % | Revue humaine : nuances écarts &lt;5 pts |
| `d19j_analyze_imbalanced` | PASS | 1 | 21032 | 1982 | 0.000713 | Echo 54 % | Amplitude décrite (revue humaine sur causes) |
| `d19j_analyze_partial` | PASS | 1 | 18326 | 1747 | 0.000589 | Echo 61 % ; 1 catégorie | limits×3 |

### Pattern 3 — `generate_action_plan` v1.3.0

| ID | TECHNICAL | HTTP | Latence ms | Tokens | Coût $ | Contrôles auto | Notes |
|----|-----------|------|------------|--------|--------|----------------|-------|
| `d19j_plan_skills` | PASS | 1 | 18120 | 3284 | 0.001150 | Zod ; 3 priorités ; anti-% garantis | `requiresArbitration=true` (budget formation limité) — **à revoir humainement** (pas exigé par le scénario) |
| `d19j_plan_pmo` | PASS | 1 | 30102 | 3512 | 0.001285 | Zod ; anti-% | `requiresArbitration=false` ; missingInformation×3 |
| `d19j_plan_digital` | PASS | 1 | 31198 | 3224 | 0.001114 | Zod ; anti-% | `requiresArbitration=false` |
| `d19j_plan_competing` | PASS | 1 | 30265 | 3690 | 0.001396 | Zod ; **mustRequireArbitration** | Question d’arbitrage présente ; 5 actions ; missing×4 |

---

## Totaux campagne

| Métrique | Valeur |
|----------|--------|
| Appels LLM HTTP | **12** |
| Retries | **0** |
| Prompt tokens | 17 410 |
| Completion tokens | 16 210 |
| Cached tokens | 1 792 |
| Coût estimé cumulé | **$0.012203** |
| Plafond HTTP | 18 |
| Plafond USD | $0.02 |
| Stop reason | none |
| Latence moy. / max | 23 620 ms / 34 170 ms |

---

## Distinctions obligatoires

| Couche | Statut |
|--------|--------|
| **TECHNICAL PASS** (Zod, echo scores, clarification, anti-contact, anti-% garantis, arbitrage C4) | **12/12** |
| **BUSINESS REVIEW** (pertinence métier subjective) | **PENDING** |
| **HUMAN REVIEW** | **PENDING** |

Un PASS technique ne constitue pas une validation humaine ni un feu vert production / LOT 20.

---

## Anomalies / points pour revue humaine

1. **C1 (`plan_skills`)** : `requiresArbitration=true` alors que la contrainte était seulement « Budget formation limité » (pas « budget unique pour un seul chantier »). Comportement prudent, non bloquant techniquement.
2. **B2 high** : vérifier manuellement l’absence de sur-interprétation des petits écarts (défaut historique 19H).
3. **Drafts PMP/PMO/Prospects** : revue qualitative des libellés et doublons (non couverte par les checks déterministes).

Aucune anomalie de sécurité (secrets) détectée dans les artefacts persistés.

---

## Artefacts locaux

| Fichier | Rôle |
|---------|------|
| `tmp/lot19j-live/*-full.json` | Rapport complet + sorties validées |
| `tmp/lot19j-live/*-traces.json` | Traces par scénario |
| `tmp/lot19j-live/*-human-review.json` | Grille (scores humains vides) |
| `tmp/lot19j-live/*-slim.json` | Résumé |
| `tmp/lot19j-live/lot19j-scenario-extras.json` | Annotations 19J (coût, anomalies) |

**Les sorties LOT 19D / 19F n’ont pas été réétiquetées.**

---

## Non-régression production

| Élément | Statut |
|---------|--------|
| Supabase / migrations / RLS | **NONE** |
| Scoring engine | **NONE** |
| Stripe | **NONE** |
| WOLOYEM AI / robot animé / UI prod | **NONE** |
| Déploiement | **NONE** |
| Commit / push | **NONE** (non effectués) |

Modifications code de ce LOT (outil d’évaluation uniquement) : dataset/campagne/script 19J, suivi USD cumulatif dans `budget.ts` / `harness.ts`. Feature flags Fabric restent OFF hors run contrôlé.

---

## Statuts finaux

```
VERSION TESTÉE: 1.3.0
SCÉNARIOS PASS / FAIL / NOT RUN: 12 / 0 / 0
TENTATIVES HTTP / 18: 12 / 18
COÛT ESTIMÉ / 0,02 USD: 0.012203 / 0.02
VALIDATION ZOD: PASS (12/12)
SCORING INTEGRITY: PASS (4/4)
SCORECARD CLARIFICATION: PASS
ACTION PLAN ARBITRATION: PASS (C4) — note C1 arbitration prudent
HUMAN REVIEW: PENDING
PRODUCTION CHANGES: NONE
OVERALL: READY FOR HUMAN REVIEW
```

**LOT 20 non démarré.** Attente de nouvelles instructions.
