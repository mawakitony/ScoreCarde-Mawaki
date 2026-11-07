# LOT 19A — Évaluation LLM des Patterns Fabric

**Date:** 2026-10-23  
**Mode exécuté:** MOCK + **LIVE autorisé le 2026-10-24**  
**LIVE LLM:** **RUN** — voir `docs/ai/lot19a-live-results.md`

---

## 1. Architecture du banc d'essai

```
scripts/lot19a-eval.mjs  (CLI locale, pas de route HTTP publique)
        │
        ▼
lib/ai/fabric-prototype/eval/
  dataset.ts              30 scénarios synthétiques
  deterministic-scorer.ts contrôles mécaniques (≠ pertinence)
  quality-rubric.ts       grille 0–5 (revue humaine)
  live-gate.ts            triple verrou LIVE
  budget.ts               plafond d'appels / tokens
  harness.ts              orchestrateur mock|live
  assistant-baseline.ts   chemin comparable sans tools
        │
        ▼
runFabricPattern + adapter mock|live (injectable)
```

**Garanties**

- Aucune route publique
- Aucune donnée client / CRM / multi-tenant
- Aucune écriture DB / Server Action métier
- LIVE désactivé par défaut
- Triple lock LIVE : `FABRIC_PROTOTYPE_ENABLED=1` + `FABRIC_PROTOTYPE_LIVE=1` + `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM`

---

## 2. Modèle utilisé / prévu

| Champ | Valeur constatée (local `.env.local`, secrets masqués) |
|-------|--------------------------------------------------------|
| Fournisseur | **groq** |
| Endpoint | `https://api.groq.com/openai/v1` (configuré) |
| Modèle | **openai/gpt-oss-120b** |
| Clé API | présente (non loggée) |
| Flags Fabric | **unset** → LIVE impossible |
| Confirm eval | **unset** |

Le banc **prévoit** d’utiliser ce même provider/modèle en LIVE via `activeAiProvider().generateChatJson`, sans tools.

---

## 3. Dataset

30 scénarios synthétiques (`eval/dataset.ts`) :

| Pattern | Happy | Edge | Security | Total |
|---------|-------|------|----------|-------|
| `generate_scorecard_draft` | 7 | 2 | 1 | 10 |
| `analyze_scorecard_results` | 4 | 5 | 1 | 10 |
| `generate_action_plan` | 7 | 2 | 1 | 10 |

Aucun PII / CRM réel.

---

## 4. Méthodologie

1. **Déterministe (automatique)** : JSON/Zod, rejets attendus, intégrité des scores, absences de clés d’effet de bord, latence, tokens estimés.  
2. **Qualitatif (humain, 0–5)** : 8 critères (`quality-rubric.ts`) — **pending** jusqu’à revue.  
3. **Ne pas** confondre validité JSON et pertinence métier.  
4. **Benchmark Assistant** : chemin isolé `generateChatJson` (pas `runAssistantTurn`) — **NOT RUN** sans LIVE autorisé.  
5. **LLM-as-judge** : optionnel, non lancé (coûterait des appels supplémentaires).

---

## 5. Résultats déterministes (MOCK)

Exécution : `npm run eval:fabric` (2026-10-23)

| Métrique | Valeur |
|----------|--------|
| Scénarios | 30 |
| deterministicPass | **30** |
| deterministicFail | **0** |
| rejectedAsExpected | 3 (injections + input court) |
| scoringIntegrityPass | **10** / 10 |
| scoringIntegrityFail | 0 |
| avgLatencyMs | ~0 (mock) |

Ces résultats **ne mesurent pas** la qualité sémantique du modèle.

---

## 6. Résultats qualitatifs

**NOT EVALUATED** — grille prête, scores humains non renseignés.  
Statut par scénario : `pending_human`.

---

## 7. Comparaison avec l’Assistant existant

| | Assistant production | Patterns Fabric |
|--|---------------------|-----------------|
| Chemin | `runAssistantTurn` + tools | `runFabricPattern` read-only |
| LIVE benchmark | Non exécuté | Non exécuté |
| Comparaison équitable | Requiert LIVE sur `generateChatJson` seul | Idem |

**BENCHMARK: NOT RUN** — inventer des scores de qualité serait frauduleux.

---

## 8–10. Latence / Tokens / Coûts

| | MOCK | LIVE (prévu) |
|--|------|--------------|
| Latence | ~0 ms | estimé 1–8 s / appel |
| Appels | 30 (mock) | plafond **32** |
| Tokens | heuristique chars/4 | à mesurer LIVE |
| Coût USD | 0 | **non chiffré** (tarif Groq non figé dans le dépôt) |

Budget soft : `LIVE_BUDGET_DEFAULTS` (32 calls, 120k in / 80k out tokens estimés).

---

## 11. Sécurité

| Contrôle | MOCK |
|----------|------|
| Prompt injection (draft/plan) | reject PASS |
| Secrets / cross-tenant heuristics | reject PASS |
| Intégrité scores officiels | PASS (forcé + scoré) |
| Side-effect keys | bloquées |
| Capacités d’écriture Pattern | **aucune** |
| LIVE sans confirm | **bloqué** (tests) |

---

## 12. Limitations

- Mocks ≠ qualité modèle.
- Pas de revue humaine encore.
- Pas de benchmark Assistant réel.
- Estimation tokens approximative.
- Coût $ non affirmé sans grille tarifaire figée.

---

## 13. Recommandations

1. Autoriser un **LIVE contrôlé** (voir demande ci-dessous) sur les 30 scénarios.  
2. Compléter la grille qualitative humaine.  
3. Lancer le baseline Assistant (`generateChatJson` only) sous le même budget.  
4. Ne **pas** intégrer à `assistant-view` avant décision post-LIVE.  
5. Conserver le triple verrou et le plafond d’appels.

---

## Décision d’intégration (état actuel)

| Pattern | Décision | Raison |
|---------|----------|--------|
| `generate_scorecard_draft` | **NOT EVALUATED** | LIVE + qualitatif manquants |
| `analyze_scorecard_results` | **NOT EVALUATED** | idem (intégrité mock OK seulement) |
| `generate_action_plan` | **NOT EVALUATED** | idem |

`READY FOR INTEGRATION` ne peut pas être attribué sans LIVE + revue humaine + sign-off produit.

---

## Demande d’autorisation LIVE (obligatoire avant tout crédit)

Avant le **premier** appel réel, confirmation humaine requise.

**Proposition d’exécution LIVE**

| Item | Valeur |
|------|--------|
| Fournisseur | groq |
| Modèle | openai/gpt-oss-120b |
| Appels max | **32** (30 scénarios + marge) |
| Données | dataset synthétique LOT19A uniquement |
| Tokens estimés (ordre de grandeur) | ~15k–40k total (heuristique) |
| Coût estimé USD | **non affirmé** — vérifier console Groq |
| Écritures / CRM / tenants | **aucune** |
| Activation | `FABRIC_PROTOTYPE_ENABLED=1` `FABRIC_PROTOTYPE_LIVE=1` `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM` |
| Commande | `npm run eval:fabric -- --mode=live` |

**Ce document et le prompt LOT 19A ne constituent pas une autorisation.**

Répondre explicitement (ex. « J’autorise le LIVE LOT 19A ») pour débloquer les appels payants.

---

## Tableau de statut

| Item | Status |
|------|--------|
| FABRIC ENGINE | **PASS** |
| EVALUATION DATASET | **PASS** |
| MOCK TESTS | **PASS** |
| LIVE MODE SAFETY | **PASS** |
| LIVE LLM EVALUATION | **PASS** (exécutée — qualité insuffisante) |
| BENCHMARK | **NOT RUN** |
| OUTPUT QUALITY | **FAIL** (LIVE) |
| SCORING INTEGRITY | **PASS** (mock) / **FAIL** (LIVE non démontrée) |
| PROMPT INJECTION | **PASS** |
| PERFORMANCE | **PARTIAL** |
| COST CONTROL | **PASS** |
| PRODUCTION DATA ACCESS | **NONE** |
| DATABASE WRITES | **NONE** |
| NON-REGRESSION | **PASS** |
| **OVERALL STATUS** | **EVALUATED — NOT READY FOR INTEGRATION** |
