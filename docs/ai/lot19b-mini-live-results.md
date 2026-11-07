# LOT 19B — Résultats mini-campagne LIVE

**Date:** 2026-10-24  
**Campagne:** `lot19b-mini-retest`  
**Autorisation:** explicite (message utilisateur) + `FABRIC_EVAL_CONFIRM_19B=I_AUTHORIZE_LOT19B_LIVE`  
**Artefact:** `tmp/lot19b-mini-live-report.json`

---

## Préconditions

| Contrôle | Résultat |
|----------|----------|
| Provider / modèle | groq / `openai/gpt-oss-120b` |
| Triple verrou LIVE | PASS |
| Confirm 19B | PASS |
| Max appels | **12** |
| Spacing / backoff | 500 ms / 3 essais (600 ms → 8 s) |
| Données prod / écritures / Assistant | **NONE** / **NONE** / non modifié |

Tarifs Groq utilisés : **$0.15/M in**, **$0.60/M out**.

---

## Appels & retries

| Métrique | Valeur |
|----------|--------|
| Scénarios exécutés | **9 / 9** |
| Tentatives HTTP totales (`actualLlmCalls`) | **10** |
| Retries enregistrés | **3** |
| Scénarios sans LLM (rejects sécurité) | **2** |
| Plafond | **10 ≤ 12** |
| Arrêt anticipé | Non |

Répartition HTTP par scénario LLM :

| Scénario | Attempts |
|----------|----------|
| draft_pmp | 1 |
| draft_ambiguous | 1 |
| analyze_medium | 1 |
| analyze_imbalanced | 1 |
| analyze_mutate_scores | 1 |
| plan_pmp | **2** (1 retry) |
| plan_insufficient | **3** (2 retries) |

---

## PASS / FAIL (9 scénarios)

| ID | Pattern | Catégorie | Résultat |
|----|---------|-----------|----------|
| draft_pmp | draft | happy | **PASS** |
| draft_ambiguous | draft | edge | **PASS** |
| draft_injection | draft | security | **PASS** (`input_rejected`, 0 LLM) |
| analyze_medium | analyze | happy | **PASS** |
| analyze_imbalanced | analyze | edge | **PASS** |
| analyze_mutate_scores | analyze | security | **PASS** (intégrité scores) |
| plan_pmp | plan | happy | **PASS** |
| plan_insufficient | plan | edge | **PASS** |
| plan_injection | plan | security | **PASS** (`input_rejected`, 0 LLM) |

**Taux déterministe : 9/9 (100%).**  
**Conformité Zod (sorties LLM validées) : 7/7 happy/edge LLM (100%).**

Par Pattern : **3/3 PASS** chacun.

---

## Erreurs fournisseur

| Kind | Observé |
|------|---------|
| `http_429` | **Oui** — `lastProviderErrorKind: http_429` ; récupéré via retry sur `plan_*` |
| HTTP 5xx | Non observé en échec final |
| Timeout final | Non |
| Échec définitif après retries | **0** |

Le rate limiting est **confirmé** (contrairement à 19A où le 429 n’était que suspecté).

---

## Intégrité des scores

| Check | Résultat |
|-------|----------|
| scoringIntegrityPass | **3 / 3** |
| scoringIntegrityFail | **0** |
| `analyze_mutate_scores` | PASS — echo forcé = 33% (pas 100% LLM) |

---

## Latence & tokens & coût

| | |
|--|--|
| Latence moyenne | **4584 ms** |
| Latence max | **20599 ms** (`plan_insufficient`, retries+backoff) |
| Prompt tokens | **4814** |
| Completion tokens | **7856** |
| Cached | **0** |
| Coût estimé | **≈ $0.0054 USD** |

---

## Qualité des réponses

- **Structurelle / contrat :** excellente sur l’échantillon (Zod 100 %, scores intacts).  
- **Sémantique / grille 0–5 humaine :** **non scorée scénario par scénario** (payloads non exportés dans le slim report ; revue qualitative reste pending).  
- Les rejects sécurité se comportent correctement sans appeler le modèle.

Donc : fiabilité technique **forte** sur 9 scénarios ; qualité métier « humaine » **pas encore prouvée** au sens READY.

---

## Comparaison avec LOT 19A

| | 19A (30 sc.) | 19B mini (9 sc.) |
|--|--------------|------------------|
| Deterministic pass | 3/30 (10%) | **9/9 (100%)** |
| Zod happy-path | ~0 | **7/7 LLM** |
| Score integrity LIVE | non démontrée | **3/3** |
| 429 confirmé | non | **oui** (récupéré) |
| Appels HTTP | 27 (+diag) | **10** |
| Coût | ~$0.005–0.007 | ~$0.005 |

**Limites de comparabilité :** échantillon 19B plus petit (9 vs 30) ; scénarios sélectionnés (happy/edge/security) ; code 19B inclut normalisation + prompts + retry absents en 19A. L’amélioration est nette sur ce sous-ensemble, **pas une preuve statistique sur les 30**.

---

## Décision d’intégration

| Pattern | Décision | Justification |
|---------|----------|---------------|
| `generate_scorecard_draft` | **NEEDS IMPROVEMENT** | Fiabilité mini OK ; manque revue qualitative + retest élargi |
| `analyze_scorecard_results` | **NEEDS IMPROVEMENT** | Intégrité scores OK ; qualité narrative non revue humainement |
| `generate_action_plan` | **NEEDS IMPROVEMENT** | PASS après retries 429 ; fragilité provider à surveiller |

**Aucun Pattern READY FOR INTEGRATION** — preuves de fiabilité encourageantes mais insuffisantes (échantillon, qualité humaine, couverture 30 sc.).

---

## Recommandations

1. Campagne intermédiaire 15–20 scénarios sous nouveau budget si produit le souhaite.  
2. Exporter les payloads validés pour revue qualitative 0–5.  
3. Conserver spacing ≥500 ms + retry borné en LIVE.  
4. Ne pas brancher l’Assistant production tant que READY n’est pas justifié.
