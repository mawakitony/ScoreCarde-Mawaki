# LOT 19A — Résultats LIVE (campagne autorisée)

**Date d'exécution:** 2026-10-24  
**Autorisation:** explicite (message utilisateur LOT 19A LIVE)  
**Artefact brut:** `tmp/lot19a-live-report.json`

---

## Préconditions validées

| Contrôle | Résultat |
|----------|----------|
| Provider | **groq** |
| Modèle | **openai/gpt-oss-120b** |
| Tarifs vérifiés | **$0.15 / M input**, **$0.60 / M output**, cached input **$0.075 / M** ([docs Groq](https://console.groq.com/docs/model/openai/gpt-oss-120b)) |
| `FABRIC_PROTOTYPE_ENABLED` | 1 |
| `FABRIC_PROTOTYPE_LIVE` | 1 |
| `FABRIC_EVAL_CONFIRM` | `I_AUTHORIZE_LIVE_LLM` |
| Données production | **NONE** |
| Écritures DB | **NONE** |
| Assistant / UI / deploy | **non modifiés** |
| Plafond | 32 appels |

---

## Appels effectués

| Bucket | Appels LLM |
|--------|------------|
| Campagne 30 scénarios | **27** (3 scénarios rejetés avant LLM) |
| Diagnostics post-campagne (cause racine) | **2** |
| **Total** | **29 / 32** |

Aucun dépassement du plafond. Benchmark Assistant **non exécuté** (respect du budget Patterns).

---

## Scénarios — succès / échecs (déterministe)

| | Count |
|--|------:|
| Scénarios traités | 30 |
| Pass déterministe | **3** |
| Fail déterministe | **27** |
| Rejets sécurité/validation attendus (sans LLM) | **3** (`draft_incomplete`, `draft_injection`, `plan_injection`) |
| Intégrité scores (checks exécutés) | **0** (aucun analyze n’a produit une sortie Zod valide en campagne) |

### Par Pattern (campagne)

| Pattern | Pass | Fail | Notes |
|---------|-----:|-----:|-------|
| `generate_scorecard_draft` | 2 | 8 | 2 rejects OK ; 6× `output_invalid` ; 2× `llm_error` |
| `analyze_scorecard_results` | 0 | 10 | 10× `llm_error` (rafale / provider) |
| `generate_action_plan` | 1 | 9 | 1 reject OK ; 9× `llm_error` |

---

## Latence

| | ms |
|--|---:|
| Moyenne (tous scénarios campagne) | **780** |
| Max | **5198** (`draft_pmp`) |
| Échecs rapides `llm_error` | ~120–135 (typique d’erreur provider / rate limit, pas d’une génération complète) |

---

## Tokens & coût (campagne 27 appels, usage API Groq)

| | Valeur |
|--|--------|
| Prompt tokens | **2328** |
| Completion tokens | **8456** |
| Cached prompt tokens | **256** |
| Coût estimé (tarifs Groq ci-dessus) | **≈ $0.0054 USD** |
| Diagnostics (+2 appels) | +~1708 + ~776 tokens ≈ **+$0.0013** |
| **Coût campagne+diag (estim.)** | **≈ $0.0067 USD** |

---

## Qualité des réponses (par Pattern)

### `generate_scorecard_draft`

- Le modèle **génère du JSON riche et thématiquement pertinent** (ex. PMP : titre, audience, catégories, questions).
- **Échec Zod systématique** sur la forme :
  - questions sans champ `title` (alias type `text` / structure différente) ;
  - `options` renvoyées comme **strings** au lieu de `{ label, score }`.
- **Qualité sémantique brute :** prometteuse, mais **non exploitable** tant que le contrat de sortie n’est pas normalisé.
- Revue 0–5 humaine : non scorée scénario par scénario ; verdict global campagne = **insuffisante pour intégration**.

### `analyze_scorecard_results`

- En campagne : **0 succès** (rafale → `llm_error`).
- Diagnostic isolé après pause : JSON renvoyé, mais risque d’écart schéma (ex. `explanations` string vs array).
- **Intégrité des scores officiels :** non prouvée en LIVE campagne (pas de sortie validée). Le runner force l’echo **après** parse réussi — donc non exercé ici.

### `generate_action_plan`

- En campagne : presque uniquement `llm_error` après la rafale.
- Pas assez de sorties valides pour juger la qualité métier LIVE.

---

## Sécurité

| Test | Résultat |
|------|----------|
| Prompt injection draft/plan | **PASS** — `input_rejected` sans appel LLM |
| Input trop court | **PASS** — `input_invalid` |
| Pas d’écriture / tools métier | **PASS** |
| Anomalie sécurité (reject qui passe en ok) | **aucune** — pas d’arrêt anticipé |
| Fuite secrets dans métriques | non observée |

Les contrôles techniques (Zod + reject) ont tenu ; le prompt seul n’a pas été la frontière.

---

## Comparaison Assistant actuel

**NOT RUN** — plafond 32 réservé aux 30 scénarios Patterns (+ 2 diagnostics).  
Une comparaison équitable nécessiterait ~30 appels supplémentaires hors autorisation.

---

## Causes racines

1. **Schéma trop strict / non aligné** sur les habitudes du modèle (contrairement aux preprocess de `lib/ai/agent/schemas.ts`).
2. **Pas d’exemple JSON / schema inline** suffisant dans le system prompt.
3. **Rafale d’appels** sans backoff → majorité d’`llm_error` (forte présomption 429 / empty après rate limit).
4. Pas de retry sur erreurs provider dans le client LIVE d’évaluation.

---

## Classification d’intégration

| Pattern | Décision | Preuves |
|---------|----------|---------|
| `generate_scorecard_draft` | **NOT RECOMMENDED** | Pertinence partielle mais **0** happy-path Zod en LIVE campagne |
| `analyze_scorecard_results` | **NOT RECOMMENDED** | **0/10** pass LIVE campagne ; intégrité scores non démontrée LIVE |
| `generate_action_plan` | **NOT RECOMMENDED** | **0** happy-path LIVE campagne |

Aucun Pattern **READY FOR INTEGRATION** — preuves insuffisantes (et taux d’échec déterministe prohibitif).

---

## Recommandations

1. Ajouter des **preprocess Zod** (alias `title`/`text`, options string→`{label}`) alignés sur l’agent production — **sans** brancher l’UI.
2. Inclure un **exemple JSON minimal** + liste des clés obligatoires dans chaque Pattern.
3. Client LIVE : **retry/backoff** sur 429/5xx ; espacement ≥300–500 ms entre appels.
4. Rejouer une mini-campagne (≤10 appels) après durcissement schéma avant toute nouvelle campagne 30.
5. Ensuite seulement : grille qualitative humaine + benchmark Assistant isolé sous nouveau budget autorisé.
6. Ne pas intégrer à `assistant-view` / robot / tools writes.

---

## Statut campagne

| Item | Status |
|------|--------|
| LIVE MODE SAFETY | **PASS** |
| LIVE LLM EVALUATION | **PASS** (exécutée ; qualité insuffisante) |
| OUTPUT QUALITY | **FAIL** (contrat de sortie) |
| SCORING INTEGRITY (LIVE) | **FAIL** / non démontrée |
| PROMPT INJECTION | **PASS** |
| PERFORMANCE | **PARTIAL** (latence OK quand génération complète ; erreurs rafale) |
| COST CONTROL | **PASS** (29≤32, ≈$0.007) |
| BENCHMARK | **NOT RUN** |
| PRODUCTION DATA / DB WRITES | **NONE** |
| **OVERALL** | **EVALUATED — NOT READY FOR INTEGRATION** |
