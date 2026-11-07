# LOT 19C — Évaluation qualitative, optimisation des Patterns et préparation à l’intégration

**Date:** 2026-10-24  
**LIVE LLM CALLS:** **ZERO**  
**Périmètre:** Patterns Fabric isolés (`lib/ai/fabric-prototype/`) — Assistant production **non modifié**

---

## 1. Inventaire des sorties LIVE disponibles

### Artefacts inspectés

| Source | Contenu utile |
|--------|----------------|
| `docs/ai/lot19a-live-results.md` | Métriques / PASS-FAIL déterministes 30 sc. |
| `docs/ai/lot19b-mini-live-results.md` | 9/9 PASS + latences / tokens / 429 |
| `docs/ai/lot19b-reliability-report.md` | Causes racines Zod / provider |
| `tmp/lot19a-live-report.json` | Résultats slim : scénario + checks — **pas de `data` modèle** |
| `tmp/lot19b-mini-live-report.json` | Idem — clés : `scenario`, `deterministic`, `qualitative`, `invokedLlm`, `httpAttempts` |
| `lib/ai/fabric-prototype/` | Patterns v1.1.0 → **v1.2.0** (ce LOT) |

### Neuf scénarios mini-LIVE 19B (tous PASS déterministes)

| ID | Pattern | Entrée (synthétique) | Sortie modèle persistée ? | Zod | Intégrité scores |
|----|---------|----------------------|---------------------------|-----|------------------|
| `draft_pmp` | draft | Compétences PMP | **NON** | OK (rapport) | n/a |
| `draft_ambiguous` | draft | Besoin ambigu | **NON** | OK | n/a |
| `draft_injection` | draft | Injection (reject, 0 LLM) | n/a | reject attendu | n/a |
| `analyze_medium` | analyze | Score moyen | **NON** | OK | OK |
| `analyze_imbalanced` | analyze | Déséquilibre | **NON** | OK | OK |
| `analyze_mutate_scores` | analyze | Tentative mutation | **NON** | OK | **OK** (echo forcé) |
| `plan_pmp` | plan | Plan PMP | **NON** | OK | n/a |
| `plan_insufficient` | plan | Diagnostic insuffisant | **NON** | OK | n/a |
| `plan_injection` | plan | Injection (reject, 0 LLM) | n/a | reject attendu | n/a |

### Verdict inventaire

**Les sorties textuelles / JSON métier du modèle n’ont pas été conservées** dans les rapports slim 19A/19B.

Conformément au cahier des charges LOT 19C : **aucune reconstruction artificielle** des réponses LIVE.

**LIVE OUTPUT REVIEW: NOT AVAILABLE**

Correction prospectively : le harness persiste désormais `validatedOutput` lorsque `runOk` (pour les prochaines campagnes LIVE autorisées).

---

## 2. Méthode d’évaluation

### Grille 0–5 (10 critères)

| # | Critère | Mode |
|---|---------|------|
| 1 | Pertinence | Jugement humain |
| 2 | Précision | Jugement humain |
| 3 | Cohérence métier | Jugement humain |
| 4 | Clarté | Jugement humain |
| 5 | Utilité des recommandations | Jugement humain |
| 6 | Respect des données fournies | **Déterministe** (possible sans texte libre) |
| 7 | Absence d’inventions | Jugement humain (nécessite le texte) |
| 8 | Qualité de la structure | **Déterministe** (Zod + checks) |
| 9 | Adaptation au contexte | Jugement humain |
| 10 | Exploitabilité WOLOYEM Score | Jugement humain |

Implémentation : `lib/ai/fabric-prototype/eval/quality-rubric.ts`.

Règles :

- Un Zod PASS **ne vaut pas** 5/5 automatique.
- Les moyennes ne comptent que les critères **effectivement scorés** (`unevaluable` exclus) ; sinon `null`.
- Sans payload LIVE : revue qualitative = `not_available`, pas de note inventée.

### Ce qui est évaluable sans payload

| Critère | Preuve 19B |
|---------|------------|
| Respect des données / intégrité scores | 3/3 PASS (`analyze_*`) |
| Qualité de structure (contrat) | 7/7 sorties LLM Zod OK ; rejects sécurité OK |
| Critères humains 1–5, 7, 9–10 | **Non évaluables rétrospectivement** |

---

## 3. Notes qualitatives justifiées

| Pattern | Notes calculées 0–5 | Justification |
|---------|---------------------|---------------|
| `generate_scorecard_draft` | **null** (non scorée) | Texte LIVE absent |
| `analyze_scorecard_results` | **null** (non scorée) | Texte LIVE absent ; intégrité scores seule prouvée |
| `generate_action_plan` | **null** (non scorée) | Texte LIVE absent |

**Aucune moyenne qualitative globale n’est publiée** pour éviter de confondre conformité technique et intelligence métier.

**QUALITATIVE EVALUATION: PENDING HUMAN REVIEW** (bloquée par absence de payloads ; grille prête)

---

## 4. Points forts et faiblesses

### Points forts (preuves existantes)

- Fiabilité contrat après LOT 19B (Zod + normalisation title/options).
- Intégrité des scores officiels forcée côté runner (non négociable).
- Rejects injection sans appel LLM.
- Retry/backoff face au 429 confirmé.
- Isolation : pas d’écriture DB, pas d’Assistant prod.

### Faiblesses / risques qualité

- Qualité rédactionnelle et pertinence métier **non prouvées** sur sorties réelles.
- Latence max 20,6 s dominée par retries/backoff (expérience UX fragile).
- Échantillon LIVE 9 scénarios insuffisant pour READY.
- Risque de recommandations génériques / titres fades / claims certification — adressé en **prompts v1.2.0** (non encore re-validé LIVE).

---

## 5. Analyse par Pattern

### 5.1 `generate_scorecard_draft`

| Dimension | Statut |
|-----------|--------|
| Titres / objectifs / catégories | Non scorés (pas de texte LIVE) |
| Diversité questions / options | Non scorés |
| Pondérations | Non scorés |
| Compatibilité Builder | Contrat Zod + types OK (déterministe) |
| Claims PMI / organismes | Mitigé en prompt v1.2 (disclaimer + interdiction explicite) |

**SCORECARD QUALITY: NOT EVALUATED** (texte) / **structure: PASS** (19B)

Problèmes récurrents **anticipés** (diagnostics 19A + bonnes pratiques, pas lecture LIVE) :

- Alias `text`/`question` → corrigé 19B.
- Options string → corrigé 19B.
- Risque de scorecards « génériques » et de validation organique implicite → durci v1.2.

### 5.2 `analyze_scorecard_results`

| Dimension | Statut |
|-----------|--------|
| Fidélité scores officiels | **PASS** (déterministe 19B + mocks) |
| Interprétation / forces / faiblesses | Non scorées |
| Prudence données insuffisantes | Renforcée en prompt v1.2 |
| Affirmations non démontrées | Non scorées |

**RESULTS ANALYSIS QUALITY: NOT EVALUATED** (narratif) / **intégrité: PASS**

### 5.3 `generate_action_plan`

| Dimension | Statut |
|-----------|--------|
| Priorités / actions concrètes | Non scorées |
| Indicateurs de suivi | Exemple + consignes v1.2 (contre formulations vagues) |
| Faisabilité / délais | Non scorés |
| Promesses irréalistes | Interdites (contrat + prompt) |

**ACTION PLAN QUALITY: NOT EVALUATED** (texte)

---

## 6. Améliorations réalisées (sans LLM payant)

| Élément | Changement |
|---------|------------|
| Patterns | **v1.1.0 → v1.2.0** |
| Draft | Qualité titres/catégories/diversité ; anti-PMI ; `maxOutputChars` 16k→14k |
| Analyze | Citer % fournis ; prudence échantillon ; `maxOutputChars` 12k→10k |
| Plan | Actions concrètes vs formulations vagues ; indicateurs observables ; 12k→10k |
| Rubrique | 10 critères + modes déterministe / humain |
| Acceptance | Seuils proposés (`acceptance-criteria.ts`) |
| Harness | Persistance `validatedOutput` pour revues futures |
| Tests | `lot19c-quality.test.ts` + non-régression mock 30 sc. |

**Schémas Zod métier conservés** (normalisations 19B inchangées dans l’esprit).  
**PROMPT OPTIMIZATION: PASS** (versionnée, justifiée par diagnostics — revalidation LIVE requise ensuite)

---

## 7. Analyse des performances (métriques existantes uniquement)

### Mini-LIVE 19B

| Métrique | Valeur |
|----------|--------|
| Latence moyenne | **4 584 ms** |
| Latence max | **20 599 ms** (`plan_insufficient`, retries + backoff) |
| HTTP attempts | 10 (plafond 12) |
| Retries | 3 |
| 429 | Confirmé, récupéré |
| Prompt / completion tokens | 4 814 / 7 856 |
| Coût estimé | ≈ **$0.0054** |

### Décomposition (limites de mesure)

| Composante | Séparée ? |
|------------|-----------|
| Latence modèle pure | **Non** (timer bout-en-bout) |
| Réseau | **Non** |
| Attente rate-limit / backoff | **Partielle** (corrélée aux retries 429 sur `plan_*`) |
| Validation Zod / normalize | **Négligeable** vs secondes LLM (non chronométrée à part) |

**PERFORMANCE ANALYSIS: PARTIAL**

### Optimisations proposées (sans retirer les gardes)

1. Conserver spacing ≥ 500 ms + retry borné (déjà en place).
2. Limites de sortie légèrement réduites en v1.2 (moins de tokens completion).
3. Prompts recentrés qualité (éviter remplissage verbeux).
4. Persister payloads pour revue humaine **avant** toute hausse de concurrence.
5. Ne pas augmenter le parallélisme LIVE tant que 429 est fréquent.
6. UX future : indiquer « génération en cours / retry » plutôt que supprimer le backoff.

---

## 8. Résultats des tests (non-régression mock)

Exécuté le 2026-10-24 **avec flags LIVE explicitement désactivés** dans le shell de test (`FABRIC_PROTOTYPE_*` / `FABRIC_EVAL_CONFIRM*` retirés) — **aucun appel Groq intentionnel**.

| Commande | Résultat |
|----------|----------|
| Fabric suites 19 / 19A / 19B / 19C | **PASS** (41/41 après correctif path lot19c) |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors, 9 warnings préexistants hors Fabric) |
| `npm run build` | **PASS** |
| `npm test` (suite complète) | **341/343 PASS** — 2 échecs **hors périmètre Fabric** (préexistants) : `lot18a-visual-qa` (fixture « leads ») ; `reports.test` (« ai cannot change the official score ») |

Couverture Fabric mock :

- 30 scénarios LOT 19A réutilisés — déterministe OK
- Intégrité scores / injections / formats
- Versions Patterns = **1.2.0**
- `validatedOutput` présent sur runs OK
- Test live-mode durci pour ne pas démarrer d’éval LIVE si flags orphelins dans le shell

**NON-REGRESSION (Fabric / LOT 19C) : PASS**  
**Note :** la suite globale reste à 2 fails non liés ; non bloquants pour ce LOT.

---

## 9. Risques restants

1. Qualité sémantique v1.2 **non prouvée LIVE**.
2. Latence p95 élevée sous rate limit.
3. Confusion Zod ≠ qualité métier si product presse l’intégration.
4. Absence historique de payloads (les 9 sorties 19B restent inévaluables).
5. Pas de feature flag produit branché (volontaire — hors scope 19C).

---

## 10. Critères d’intégration future (proposés)

Voir `lib/ai/fabric-prototype/eval/acceptance-criteria.ts` :

| Seuil | Objectif |
|-------|----------|
| Sécurité / contraintes | **100 %** |
| Intégrité scores officiels | **100 %** |
| Conformité Zod (échantillon représentatif) | **≥ 95 %** |
| Note qualitative humaine moyenne | **≥ 4 / 5** |
| Défauts métier critiques | **0** |
| Latence | p50 ≈ 5 s ; p95 ≈ 12 s (hors pics backoff extrêmes) |
| Coût | Compatible quotas SaaS (ordre $0.001 / appel utile observé) |

**Ces seuils sont des objectifs, pas des résultats obtenus.**

### Préparation d’intégration (documentation seule — non réalisée)

| Surface | Usage envisagé | Contrôles |
|---------|----------------|-----------|
| Assistant IA | Proposer un draft / expliquer un score / plan | Feature flag, confirmation utilisateur, permissions tenant |
| Builder | Préremplir questions (brouillon) | Revue humaine obligatoire avant save |
| Analyse résultats | Narratif à côté des scores moteur | Scores toujours du moteur ; flag + rollback |
| Rapports | Sections « insights » optionnelles | Quotas, observabilité, isolation multi-tenant |

Prévoir : feature flags, rollback, gestion d’erreurs provider, métriques latence/tokens/429, quotas, confirmations, contrôles de permissions.  
**Aucune intégration ni modification Assistant dans ce LOT.**

---

## 11. Recommandation finale

1. **Ne pas** déclarer READY FOR INTEGRATION.
2. Lors de la **prochaine** campagne LIVE autorisée : exporter `validatedOutput`, faire une revue humaine 0–5 sur ≥ 15–20 scénarios, mesurer latence hors backoff.
3. Si moyenne qualitative ≥ 4 et seuils d’acceptance tenus → alors seulement envisager un flag d’intégration progressive.

---

## STATUTS

| Item | Status |
|------|--------|
| LIVE OUTPUT REVIEW | **NOT AVAILABLE** |
| QUALITATIVE EVALUATION | **PENDING HUMAN REVIEW** |
| SCORECARD QUALITY | **NOT EVALUATED** |
| RESULTS ANALYSIS QUALITY | **NOT EVALUATED** |
| ACTION PLAN QUALITY | **NOT EVALUATED** |
| PROMPT OPTIMIZATION | **PASS** |
| PERFORMANCE ANALYSIS | **PARTIAL** |
| SECURITY | **PASS** |
| SCORING INTEGRITY | **PASS** |
| NON-REGRESSION | **PASS** (Fabric) |
| LIVE LLM CALLS | **ZERO** (intentionnel ; flags LIVE retirés avant runs) |
| OVERALL STATUS | **READY FOR NEXT EVALUATION** |

### Note opérationnelle

Des variables `FABRIC_PROTOTYPE_ENABLED` / `LIVE` / `FABRIC_EVAL_CONFIRM*` étaient encore présentes dans le shell de session (reste LOT 19B). Elles ont été **désactivées** avant les tests 19C. Le test « live mode throws » force désormais un clear temporaire de ces variables pour éviter un démarrage accidentel d’éval payante.
