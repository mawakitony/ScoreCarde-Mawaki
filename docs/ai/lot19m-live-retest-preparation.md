# LOT 19M — Préparation du retest LIVE ciblé (sans exécution)

**Statut campagne :** `PREPARED_NOT_RUN`  
**LIVE LLM CALLS (ce LOT) :** **ZERO**  
**HUMAN REVIEW :** **PENDING**  
**PRODUCTION CHANGES :** **NONE**  
**LOT 20 :** **NOT STARTED**

---

## 1. Versions ciblées

| Pattern | Version requise |
|---------|-----------------|
| `generate_scorecard_draft` | **1.3.1** |
| `analyze_scorecard_results` | **1.3.0** |
| `generate_action_plan` | **1.3.1** |

---

## 2. Les 8 scénarios (`d19m_*`)

| ID | Focus | Revue qualitative |
|----|-------|-------------------|
| `d19m_draft_pmp` (A1) | Anti-biais fréquence / outil ; efficacité | **HUMAN_REVIEW_REQUIRED** |
| `d19m_draft_pmo` (A2) | Gouvernance adaptée ; pas contact | **HUMAN_REVIEW_REQUIRED** |
| `d19m_draft_prospects` (A3) | B2B ; contraintes ≠ points | **HUMAN_REVIEW_REQUIRED** |
| `d19m_draft_ambiguous` (A4) | `needs_clarification` | Déterministe principal |
| `d19m_analyze_high` (B2) | Echo 88/92/85/87 ; prudence écarts | **HUMAN_REVIEW_REQUIRED** |
| `d19m_plan_skills` (C1) | Budget limité ≠ exclusif ; 3h/sem | **HUMAN_REVIEW_REQUIRED** |
| `d19m_plan_pmo` (C2) | Pas nouvel outil ; 3 personnes | **HUMAN_REVIEW_REQUIRED** |
| `d19m_plan_competing` (C4) | Budget unique → arbitrage | **HUMAN_REVIEW_REQUIRED** |

Dataset : `lib/ai/fabric-prototype/eval/lot19m-dataset.ts`.

---

## 3. Fichiers créés / modifiés

| Fichier | Rôle |
|---------|------|
| `lib/ai/fabric-prototype/eval/lot19m-dataset.ts` | 8 scénarios |
| `lib/ai/fabric-prototype/eval/lot19m-campaign.ts` | Budget, auth, préflight offline |
| `lib/ai/fabric-prototype/eval/lot19m-validators.ts` | Verdicts DETERMINISTIC_* / HUMAN_REVIEW_REQUIRED |
| `lib/ai/fabric-prototype/eval/deterministic-scorer.ts` | `mustNotRequireArbitration`, `expectedPatternVersion` |
| `lib/ai/fabric-prototype/eval/dataset.ts` | Champs d’expectations 19M |
| `scripts/lot19m-live.mjs` | Préflight + dry-run (défaut) ; LIVE verrouillé |
| `lib/ai/fabric-prototype/tests/lot19m-preparation.test.ts` | Tests hors ligne |
| `docs/ai/lot19m-live-retest-preparation.md` | Ce document |
| `docs/ai/lot19m-human-review-grid.md` | Grille vierge |

Réutilise le harness LOT 19J (`runLot19aEvaluation`, `createBudgetTracker` cumulatif USD, live-client HTTP+retries, persistence sanitisée).

---

## 4. Validateurs

Classement strict :

- **DETERMINISTIC_PASS / FAIL** — Zod, versions, tailles, clarification, echo scores, side-effects, arbitrage oui/non, horizons, % non validés, facts/hypotheses, plafonds HTTP/USD (harness).
- **HUMAN_REVIEW_REQUIRED** — qualité anti-biais / pertinence métier (A1–A3, C1, C2, B2, C4). **Jamais PASS par présence/absence de mots-clés** (ex. « automatisation »).

Voir `LOT19M_VALIDATOR_IDS` dans `lot19m-validators.ts`.

---

## 5. Commandes

### Préflight / dry-run (autorisé maintenant — zéro Groq)

```bash
npm run eval:fabric:19m:prepare
# alias:
npm run eval:fabric:19m -- --dry-run
```

Vérifie dataset (8), versions, validateurs, budget, flags OFF, readiness clé (présence seulement, sans échouer si absente), écrit `tmp/lot19m-live/lot19m-dry-run-mock-validations.json`.

### LIVE future (documentaire — **ne pas exécuter dans ce LOT**)

Conditions cumulatives :

1. Autorisation **explicite dans le chat** pour LOT 19M LIVE  
2. `FABRIC_EVAL_CONFIRM_19M=I_AUTHORIZE_LOT19M_LIVE`  
3. `FABRIC_PROTOTYPE_ENABLED=1`  
4. `FABRIC_PROTOTYPE_LIVE=1`  
5. `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM`  
6. Provider groq + modèle `openai/gpt-oss-120b` + clé  
7. Flag CLI **`--execute-live`** (l’env LIVE seule ne suffit pas)

```bash
# NE PAS LANCER SANS AUTORISATION EXPLICITE LOT 19M
npm run eval:fabric:19m -- --execute-live
```

Les confirmations 19J / 19F / `I_AUTHORIZE_LIVE_LLM` seules **ne** débloquent **pas** 19M.

---

## 6. Protections budgétaires (exécution future)

| Plafond | Valeur |
|---------|--------|
| Scénarios | 8 |
| HTTP (retries inclus) | **12** |
| USD estimé cumulatif | **$0.02** |
| Projection avant appel | $0.0025 / scénario |
| Spacing TPM | ≥ 4 s ; TPM ~8000 |
| Backoff | max 2 attempts / appel logique |

Arrêt harness si plafond HTTP, USD cumulatif, ou projection de dépassement.  
Le plafond USD est une **estimation harness**, pas une facture fournisseur exacte.

---

## 7. Tests MOCK exécutés (session préparation)

| Contrôle | Résultat |
|----------|----------|
| Préflight offline (`eval:fabric:19m:prepare`) | PASS — `prepOk=true`, flags OFF, 8 scénarios, versions match |
| Dry-run mock | PASS — `httpCalls=0`, artifact `tmp/lot19m-live/lot19m-dry-run-mock-validations.json` |
| Tests Fabric + 19M | **94/94 PASS** |
| Typecheck | PASS |
| Lint | PASS (0 errors ; warnings préexistants hors scope 19M) |
| Build | PASS |
| LIVE Groq | **ZERO** (non lancé) |

Couverture offline 19M : dataset, auth lock, HTTP/USD ceilings simulés, retries, Zod, scoring integrity, secrets sanitization, semantic → `HUMAN_REVIEW_REQUIRED` (jamais PASS par mots-clés).

---

## 8. Risques résiduels

1. Qualité anti-biais A1–A3 / C1–C2 non prouvable sans LIVE + revue humaine.  
2. Estimation USD ≠ facturation Groq réelle.  
3. Flags LIVE laissés ON après un run antérieur peuvent faire échouer le préflight « flags expected OFF » — les éteindre pour la préparation.  
4. HUMAN REVIEW reste PENDING — aucune note / APPROVED.

---

## 9. Conditions avant autorisation LIVE

- [ ] Préflight offline PASS  
- [ ] Versions 1.3.1 / 1.3.0 / 1.3.1 confirmées  
- [ ] Autorisation chat dédiée LOT 19M  
- [ ] Confirm env 19M + flags + `--execute-live`  
- [ ] Budget HTTP/USD compris  
- [ ] Grille humaine prête (`lot19m-human-review-grid.md`)

**Ne pas lancer LIVE dans ce LOT.**
