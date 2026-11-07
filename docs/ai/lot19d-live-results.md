# LOT 19D — Résultats LIVE qualitative

**Date d’exécution:** 2026-10-24  
**Autorisation:** explicite (message utilisateur LOT 19D LIVE) + `FABRIC_EVAL_CONFIRM_19D=I_AUTHORIZE_LOT19D_LIVE`  
**Campagne:** `lot19d-qualitative-live`  
**Artefacts:** `tmp/lot19d-live/` (gitignored)

---

## A. Exécution

| Item | Valeur |
|------|--------|
| Provider / modèle | groq / `openai/gpt-oss-120b` |
| Patterns | **v1.2.0** (prompts/schémas non modifiés) |
| Scénarios planifiés | **12** |
| Scénarios exécutés | **9** |
| Scénarios non exécutés | **3** (`d19d_plan_pmo`, `d19d_plan_digital`, `d19d_plan_competing`) |
| Tentatives HTTP | **16 / 16** (plafond atteint) |
| Retries | **7** |
| Stop | `max LLM calls reached before remaining scenarios` |
| Dernière erreur provider | `http_429` (TPM 8000) |
| Coût estimé | **≈ $0.00747 USD** (dans la fourchette 0,004–0,02) |
| Prompt / completion tokens | **8188** / **10403** (cached **0**) |

Tarifs utilisés : $0.15/M in, $0.60/M out ([docs Groq](https://console.groq.com/docs/model/openai/gpt-oss-120b)).

---

## B. Résultats techniques

### PASS / FAIL / NOT RUN

| ID | Pattern | Résultat | Zod | Attempts | Latence ms | Erreur |
|----|---------|----------|-----|----------|------------|--------|
| `d19d_draft_pmp` | draft | **PASS** | OK | 1 | 4754 | — |
| `d19d_draft_pmo` | draft | **PASS** | OK | 1 | 5363 | — |
| `d19d_draft_prospects` | draft | **PASS** | OK | 1 | 4845 | — |
| `d19d_draft_ambiguous` | draft | **PASS** | OK | 2 | 10301 | 429 récupéré |
| `d19d_analyze_low` | analyze | **PASS** | OK | 3 | 23406 | 429 × retries |
| `d19d_analyze_high` | analyze | **PASS** | OK | 2 | 13319 | 429 récupéré |
| `d19d_analyze_imbalanced` | analyze | **PASS** | OK | 3 | 13242 | 429 × retries |
| `d19d_analyze_partial` | analyze | **PASS** | OK | 2 | 12553 | 429 récupéré |
| `d19d_plan_skills` | plan | **FAIL** | n/a | 1 | 730 | `llm_error` / **http_429** (plafond, pas de retry restant) |
| `d19d_plan_pmo` | plan | **NOT RUN** | — | 0 | — | budget HTTP épuisé |
| `d19d_plan_digital` | plan | **NOT RUN** | — | 0 | — | budget HTTP épuisé |
| `d19d_plan_competing` | plan | **NOT RUN** | — | 0 | — | budget HTTP épuisé |

**Synthèse déterministe :** 8 PASS / 1 FAIL / 3 NOT RUN → **8/12 PASS** sur le dataset nominal.

### Conformité Zod

- Sorties LLM validées : **8 / 8 (100 %)**  
- Échec `plan_skills` : **erreur fournisseur** (429), pas un rejet Zod de contenu.

**ZOD VALIDATION: PASS** (sur les sorties obtenues) / couverture campagne **PARTIAL** (3 non exécutés).

### Intégrité des scores

| Check | Résultat |
|-------|----------|
| scoringIntegrityPass | **4 / 4** |
| scoringIntegrityFail | **0** |
| Echo forcé = scores d’entrée | Confirmé sur low / high / imbalanced / partial |

**SCORING INTEGRITY: PASS**

### Classification des erreurs

| Classe | Observation |
|--------|-------------|
| Fournisseur (429 TPM) | Dominant — retries + `Retry-After` ; plafond consommé |
| Format JSON | Aucun échec Zod structure sur sorties OK |
| Validation métier Zod | Aucun sur les 8 OK |
| Défaut de contenu | **Non scorés qualitativement** (revue humaine pending) |
| Non exécutés | 3 plans — **plafond HTTP**, pas anomalie sécurité |

### Contraintes / écritures

- Pas d’écriture DB / Supabase / CRM  
- Pas d’accès prod  
- Patterns isolés ; Assistant / robot inchangés  

---

## C. Réponses réelles

### Emplacement

| Fichier | Rôle |
|---------|------|
| `tmp/lot19d-live/lot19d-qualitative-live-2026-10-24T20-18-54-235Z-full.json` | Rapport complet sanitizé |
| `…-traces.json` | Input synthétique + **validatedOutput** + métriques |
| `…-human-review.json` | Grille 0–5 **vide** (scores `null`) |
| `…-slim.json` | Résumé déterministe |

Secrets scannés dans les artefacts : **aucun** (`sk-` / Bearer absents).

### Tableau de revue humaine (à noter 0–5)

Critères : pertinence, précision, cohérence_métier, clarté, utilité_recommandations, respect_données, absence_inventions, qualité_structure, adaptation_contexte, exploitabilité_woloyem.

| Scénario | Pattern | Zod | Aperçu réponse (ne pas confondre avec une note) | Notes humaines |
|----------|---------|-----|--------------------------------------------------|----------------|
| draft_pmp | draft | OK | Titre PMP brouillon ; 4 cats ; 11 questions ; disclaimer anti-PMI | _à noter_ |
| draft_pmo | draft | OK | « Diagnostic de maturité PMO » | _à noter_ |
| draft_prospects | draft | OK | Qualification prospects B2B mid-market | _à noter_ |
| draft_ambiguous | draft | OK | Combine leadership + vente ; signale provisoire | _à noter_ |
| analyze_low | analyze | OK | Cite 27 % / Gouvernance 18 % ; prudence échantillon | _à noter_ |
| analyze_high | analyze | OK | Cite 88 % bande Élevé | _à noter_ |
| analyze_imbalanced | analyze | OK | Communication 82 % vs Délégation 28 % | _à noter_ |
| analyze_partial | analyze | OK | Forces/faiblesses vides ; limites explicites | _à noter_ |
| plan_skills | plan | FAIL | Pas de sortie (429) | n/a |
| plan_pmo / digital / competing | plan | — | Non exécutés | n/a |

Fichier prêt à remplir : `…-human-review.json`.

### Exemples représentatifs (extraits)

**Draft PMP** — disclaimer conforme : *« Ne constitue pas une certification PMI… »* ; catégories Initiation / Planning / Execution / Monitoring & Controlling.

**Analyze low** — fidélité scores : echo exact 27 / 18 / 32 / 30 ; forces relatives Livraison/Reporting ; faiblesse Gouvernance ; limites sur `respondentCount=1`.

**Analyze partial** — prudence : strengths/improvementAreas vides ; analysisLimits sur mono-catégorie.

**Plan skills** — aucune réponse métier à évaluer (échec provider).

---

## D. Qualité (observation technique — **pas** de notes 0–5 automatiques)

### Points forts observables

- Drafts : titres spécifiques, disclaimers anti-certification présents sur l’échantillon.
- Analyze : citations explicites des % fournis ; ton prudent si données limitées ; intégrité echo.
- Structure JSON alignée Builder / contrat Zod après normalisation 19B.

### Défauts / risques

- Couverture **plan d’action quasi absente** (1 FAIL + 3 NOT RUN) — impossible de juger la qualité v1.2 du Pattern plan sur cet échantillon LIVE.
- Ambiguous draft fusionne leadership **et** vente (peut être pertinent ou trop large — jugement humain requis).
- Latence élevée surtout via **attentes 429** (~56 s de wait cumulé mesuré), pas uniquement via le modèle (~26 s provider cumulé).

### Critères nécessitant notation humaine

Tous les critères 1–5, 7, 9–10 de la grille 19C sur les **8** sorties disponibles.  
Critères structure / respect_données déjà largement couverts déterministiquement pour analyze.

### Limites de l’échantillon

- 9/12 exécutés ; 0 plan réussi.  
- Rate limit TPM 8000 org — budget retries a consommé le plafond.  
- N=1 répondant synthétique — analyses volontairement prudentes.

**QUALITATIVE REVIEW: PENDING**

---

## E. Performance

| Métrique | Valeur |
|----------|--------|
| Latence moyenne (exécutés) | **9835 ms** |
| Latence max | **23406 ms** (`analyze_low`) |
| Provider latency cumulée (traces) | **≈ 26,1 s** |
| Retry/backoff wait cumulé | **≈ 56,0 s** |
| Spacing inclus dans waits | oui (mesuré à part côté client : `spacingWaitMs`) |
| Retries | **7** |
| HTTP 429 | **Oui** (confirmé, message TPM + `retry-after`) |
| Tokens in/out | 8188 / 10403 |
| Coût | **≈ $0.00747** |

Validation locale : généralement **&lt; 500 ms** (négligeable vs provider/waits).

---

## F. Sécurité & non-régression

| Contrôle | Résultat |
|----------|----------|
| Données production | **NONE** |
| Écritures DB | **NONE** |
| Permissions / RLS / Stripe / scoring | **inchangés** |
| Assistant IA / robot | **inchangés** |
| Déploiement / commit | **aucun** |
| Secrets dans artefacts | **NONE** |
| Intégration production Patterns | **non réalisée** |

**SECURITY: PASS**  
**PRODUCTION DATA ACCESS: NONE**  
**DATABASE WRITES: NONE**  
**NON-REGRESSION: PASS** (pas de changement prod ; flags LIVE retirés après run)

---

## G. Décision par Pattern

| Pattern | Décision | Justification |
|---------|----------|---------------|
| `generate_scorecard_draft` | **PENDING HUMAN REVIEW** | 4/4 PASS Zod ; réponses persistées ; qualité métier non notée |
| `analyze_scorecard_results` | **PENDING HUMAN REVIEW** | 4/4 PASS + intégrité scores 4/4 ; qualité narrative à noter |
| `generate_action_plan` | **NEEDS IMPROVEMENT** | 0 sortie utile (1× 429 sans retry budget + 3 non exécutés) — **retest LIVE plan requis** sous budget retries plus large ou spacing plus élevé |

**Aucun Pattern READY FOR INTEGRATION.**

---

## STATUTS FINAUX

| Item | Status |
|------|--------|
| LIVE EXECUTION | **PARTIAL** |
| SCENARIOS | **8/12 PASS** (1 FAIL, 3 NOT RUN) |
| HTTP ATTEMPTS | **16/16** |
| ZOD VALIDATION | **PASS** (8/8 sorties) / couverture **PARTIAL** |
| SCORING INTEGRITY | **PASS** |
| OUTPUT PERSISTENCE | **PASS** |
| QUALITATIVE REVIEW | **PENDING** |
| SECURITY | **PASS** |
| PRODUCTION DATA ACCESS | **NONE** |
| DATABASE WRITES | **NONE** |
| NON-REGRESSION | **PASS** |
| **OVERALL STATUS** | **READY FOR HUMAN REVIEW** |

---

## Suite recommandée

1. Remplir `…-human-review.json` (8 sorties) — grille 0–5.  
2. Retest **plan-only** sous nouvelle autorisation (plafond HTTP dédié, spacing ↑) pour obtenir 4 sorties plan.  
3. Ne brancher aucun Pattern dans l’Assistant tant que READY n’est pas justifié par notes ≥ seuils 19C + couverture plan.
