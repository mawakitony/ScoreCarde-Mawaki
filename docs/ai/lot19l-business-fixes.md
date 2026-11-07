# LOT 19L — Corrections métier finales (Patterns Fabric)

**Date :** 2026-10-25  
**LIVE LLM CALLS :** **ZERO**  
**HUMAN REVIEW :** **PENDING**  
**PRODUCTION CHANGES :** **NONE**  
**LOT 20 :** **NOT STARTED**

Sources : revue indépendante LOT 19K (recommandations REWORK draft / OK analyze / REWORK ciblé plan) — **non officielle**.

---

## 1. Problèmes constatés

| Zone | Défaut (revue 19K / 19J) | Gravité |
|------|--------------------------|---------|
| Draft A1 PMP | Biais fréquence de reporting / outil = maturité | Métier |
| Draft A2 PMO | Autonomie max / automatisation récompensées | Métier |
| Draft A3 B2B | Points pour la seule présence de contraintes sécu/conformité | Métier |
| Analyze | Avis favorable — pas de refonte | — |
| Plan C1 | `requiresArbitration` sur simple « budget limité » | Métier |
| Plan | % chiffrés non marqués « à valider » ; horizons vs J+N | Métier |
| Plan C4 | Arbitrage exclusif à conserver | OK à préserver |

---

## 2. Fichiers modifiés

| Fichier | Rôle |
|---------|------|
| `lib/ai/fabric-prototype/patterns/generate-scorecard-draft.ts` | Prompt anti-biais + **v1.3.1** |
| `lib/ai/fabric-prototype/patterns/generate-action-plan.ts` | Arbitrage exclusif, calendrier, % à valider + **v1.3.1** |
| `lib/ai/fabric-prototype/patterns/analyze-scorecard-results.ts` | **Non modifié** (reste **v1.3.0**) |
| `lib/ai/fabric-prototype/business-guards.ts` | Arbitrage exclusif ; horizon ; % non validés ; heuristiques biais draft |
| `lib/ai/fabric-prototype/runner.ts` | Gardes horizon / % non validés ; force arbitrage seulement si exclusif |
| `lib/ai/fabric-prototype/fixtures/mock-responses.ts` | Mocks PMP / PMO / B2B alignés |
| `lib/ai/fabric-prototype/tests/lot19l-business-fixes.test.ts` | Tests mock ciblés |
| Tests 19c–19i / package.json | Assertions versions `1.3.x` |

---

## 3. Corrections apportées

### `generate_scorecard_draft` → **1.3.1**

- Section **ANTI-BIAIS MÉTIER** : PMP (efficacité / utilité décisionnelle, pas fréquence/outil seuls), PMO (gouvernance adaptée, pas autonomie max / automatisation auto), B2B (contraintes ≠ points ; scorer la couverture ; pas de contact auto).
- Exemple prompt + mocks : reporting scoré sur utilité décisionnelle ; contraintes B2B en `short_text` non scorée + échelle de couverture.
- Pondérations / scores restent **indicatifs** jusqu’à validation métier.
- Clarification ambiguë inchangée (`needs_clarification`).

### `analyze_scorecard_results` → **1.3.0** (inchangé)

- Conservation scores officiels, `facts` / `interpretations`, limites, prudence écarts.
- Tests de non-régression ajoutés dans LOT 19L.

### `generate_action_plan` → **1.3.1**

- Arbitrage si contrainte **exclusive** (budget unique / un seul chantier / mutuellement exclusif) — **pas** si seul « budget limité ».
- Séparation explicite faits / hypothèses / missingInformation.
- % uniquement comme cible proposée à valider (sinon rejet runner).
- Cohérence `horizon` ↔ échéances `J+N` / « sous X jours » (rejet runner si incohérent).
- C4 (budget un seul chantier) toujours forcé en arbitrage si le modèle omet le flag.

---

## 4. Tests exécutés

| Suite | Résultat |
|-------|----------|
| Fabric (lot19 + 19a–19f + 19i + **19l**) | **79/79 PASS** |
| `npm run typecheck` | **PASS** |
| `eslint lib/ai/fabric-prototype` | **PASS** |
| `npm run build` | **PASS** |

Couverture mock 19L : PMP sans biais fréquence, PMO sans biais auto, B2B contraintes non scorées, clarification, analyse intégrité, budget limité sans arbitrage, budget exclusif avec arbitrage, horizon, % non validés, régression LOT19A.

---

## 5. Résultats

```
SCORECARD FIXES: PASS (code + tests mock)
ANALYSIS NON-REGRESSION: PASS (v1.3.0 intacte)
ACTION PLAN FIXES: PASS (code + tests mock)
LIVE LLM CALLS: ZERO
```

Les corrections **ne sont pas prouvées LIVE** (aucun appel Groq dans ce LOT).

---

## 6. Risques résiduels

1. Groq peut encore ignorer les anti-biais — gardes heuristiques draft ne sont pas toutes enforced en runner (trop de faux positifs) ; retest LIVE requis.
2. Heuristique `findDraftScoringBiasSignals` est indicative (tests), pas un filtre exhaustif LIVE.
3. Arbitrage « décision impossible faute de données » reste surtout piloté par le prompt (hors regex exclusive).
4. HUMAN REVIEW toujours PENDING — pas de statut APPROVED / CANDIDATE.

---

## 7. Versions après correction

| Pattern | Avant | Après |
|---------|-------|-------|
| `generate_scorecard_draft` | 1.3.0 | **1.3.1** |
| `analyze_scorecard_results` | 1.3.0 | **1.3.0** |
| `generate_action_plan` | 1.3.0 | **1.3.1** |

Artefacts LIVE 19J restent étiquetés **1.3.0** — non réétiquetés.

---

## 8. Recommandation LOT 19M

Préparer un **retest LIVE ciblé** (sans l’exécuter sans autorisation) sur :

1. A1 PMP / A2 PMO / A3 B2B (anti-biais)  
2. A4 clarification  
3. B2 high (non-régression analyze)  
4. C1 budget limité **sans** arbitrage injustifié  
5. C4 budget exclusif **avec** arbitrage  

Plafond suggéré : ≤ 8–10 HTTP, budget USD bas, version candidate **1.3.1** (draft/plan) + **1.3.0** (analyze).  
Puis revue humaine sur les nouvelles sorties — **ne pas démarrer LOT 20**.
