# LOT 19M-S — Audit de sécurité hors ligne (avant autorisation Groq LIVE)

**Date :** 2026-10-25  
**Périmètre :** dispositif LOT 19M (préparation / dry-run / script LIVE verrouillé)  
**LIVE LLM CALLS (cet audit) :** **ZERO**  
**HUMAN REVIEW :** **PENDING**  
**PRODUCTION CHANGES :** **NONE** (corrections limitées au harness d’évaluation / script / tests)  
**LOT 20 :** **NOT STARTED**

---

## 1. Résumé exécutif

Le dispositif LOT 19M a été inspecté comme un système à vérifier, non comme une déclaration de confiance.

**Décision de sécurité proposée :** `SAFE FOR LIVE AUTHORIZATION` *sous conditions* — l’exécution LIVE reste **interdite** tant qu’une autorisation explicite n’est pas donnée **dans la conversation**, en plus des verrous techniques (`--execute-live` + `FABRIC_EVAL_CONFIRM_19M` + flags Fabric + budget).

Aucun contrôle **CRITICAL** ou **HIGH** ouvert après corrections locales du harness. Des risques **MEDIUM / LOW** résiduels sont documentés (estimation USD ≠ facture ; appel direct du harness hors script 19M ; qualité métier non prouvable hors revue humaine).

---

## 2. Fichiers inspectés (chemins réels)

| Fichier | Statut |
|---------|--------|
| `docs/ai/lot19m-live-retest-preparation.md` | Présent |
| `docs/ai/lot19m-human-review-grid.md` | Présent |
| `docs/ai/lot19l-business-fixes.md` | Présent |
| `lib/ai/fabric-prototype/eval/lot19m-dataset.ts` | Présent |
| `lib/ai/fabric-prototype/eval/lot19m-validators.ts` | Présent |
| `lib/ai/fabric-prototype/eval/lot19m-campaign.ts` | Présent |
| `scripts/lot19m-live.mjs` | Présent (`eval:fabric:19m` / `:prepare`) |
| `lib/ai/fabric-prototype/eval/harness.ts` | Présent |
| `lib/ai/fabric-prototype/eval/live-client.ts` | Présent (client HTTP `fetch`, pas SDK) |
| `lib/ai/fabric-prototype/eval/budget.ts` | Présent |
| `lib/ai/fabric-prototype/eval/cost-model.ts` | Présent |
| `lib/ai/fabric-prototype/eval/live-gate.ts` | Présent |
| `lib/ai/fabric-prototype/eval/retry.ts` | Présent |
| `lib/ai/fabric-prototype/eval/persistence.ts` | Présent |
| `lib/ai/fabric-prototype/llm-adapter.ts` | Présent |
| `lib/ai/fabric-prototype/runner.ts` | Présent |
| `lib/ai/fabric-prototype/flags.ts` | Présent |
| `package.json` scripts `eval:fabric:19m*` | Présent |

Documents LOT 19I/19J budgets : réutilisés via le même harness (`createBudgetTracker`, `createLot19aLiveClient`, `runLot19aEvaluation`).

---

## 3. Carte des chemins d’exécution

### 3.1 Préflight (offline)

`npm run eval:fabric:19m:prepare` → `scripts/lot19m-live.mjs --dry-run`

1. `loadEnvLocal()` (valeurs jamais loggées)  
2. `lot19mPreflightSnapshot()` + `preflightDiagnostic()` — **aucun** `fetch` / Groq  
3. Exit 2 si `prepOk` faux ou versions mismatch  
4. Enchaîne sur dry-run mock  

### 3.2 Dry-run (offline)

1. `createMockLlmAdapter()` + `runFabricPattern` × 8  
2. `validateLot19mScenario`  
3. Écrit `tmp/lot19m-live/lot19m-dry-run-mock-validations.json` (racine `tmp/` contrainte)  
4. Scan `containsForbiddenSecrets`  
5. `process.exit(0)` **avant** toute branche LIVE  

### 3.3 LIVE (futur — non exécuté ici)

Conditions cumulatives vérifiées **avant** `runLot19aEvaluation({ mode: "live" })` :

1. `--execute-live`  
2. `FABRIC_EVAL_CONFIRM_19M=I_AUTHORIZE_LOT19M_LIVE`  
3. Gate Fabric (`ENABLED` + `LIVE` + `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM`)  
4. Provider groq + modèle `openai/gpt-oss-120b` + clé présente  
5. Budgets 12 HTTP / $0.02 / projection > 0  

Puis : `createLot19aLiveClient` → `fetch` compté **avant** émission → retries inclus → artefacts sanitisés.

### 3.4 Gestion des erreurs

- 429 / 5xx / timeout / network : classés dans `retry.ts`, retryables bornés (`backoff.maxAttempts=2` pour 19M)  
- Chaque tentative HTTP incrémente `liveClient.state.calls` **avant** `fetch`  
- Plafond → throw, pas de 13e émission  
- Projection USD `beforeAttempt` peut refuser **avant** incrément / fetch  

### 3.5 Rapports

- Dry-run : mock validations JSON  
- LIVE : `persistLot19dArtifacts` → `*-full/traces/human-review/slim.json` + `lot19m-validations.json`  
- Scan secrets post-écriture ; exit 3 si fuite  

---

## 4. Tableau des contrôles

| Contrôle | Résultat | Preuve |
|----------|----------|--------|
| LIVE sans `--execute-live` | **VERIFIED** refuse | `assertLot19mLiveScriptReady` + test |
| LIVE sans / mauvaise confirm 19M | **VERIFIED** refuse | `assertLot19mNotAutoRun` ; prior lots exclus |
| LIVE flags OFF | **VERIFIED** refuse | gate + test |
| `npm run eval:fabric:19m` défaut = dry-run | **VERIFIED** | script `dryRun = !wantExecuteLive` |
| Préflight / dry-run sans Groq | **VERIFIED** | exit avant client ; mock only |
| Compteur HTTP avant émission | **VERIFIED** | `live-client.ts` `state.calls += 1` puis `fetch` |
| Retries / 429 / timeout comptés | **VERIFIED** | tests mock fetch ; ceiling 12 |
| Aucune 13e tentative | **VERIFIED** | test 429 storm `fetchCount ≤ 12` |
| Pas de retry SDK opaque | **VERIFIED** | `fetch` natif uniquement |
| Concurrence | **VERIFIED** séquentiel | boucle harness mono-thread |
| Plafond HTTP global campagne | **VERIFIED** | `maxCalls=12` client partagé |
| Plafond USD estimé + projection | **VERIFIED** | budget + `beforeAttempt` + floor usage manquant |
| USD ≠ facture réelle | **VERIFIED** documenté | estimation harness |
| Tarif inconnu (LIVE) | **VERIFIED** fail-closed | `requireKnownUsd` |
| Secrets / Bearer / gsk_ | **VERIFIED** | sanitize + containsForbiddenSecrets |
| Isolation Supabase / Stripe / CRM / writes | **VERIFIED** imports | spot-check + runner side_effect |
| Dataset 8 ids / Zod / A4 / C1 / C4 | **VERIFIED** | tests dataset + mocks |
| Qualité sémantique auto-PASS mots-clés | **VERIFIED** absent | toujours `HUMAN_REVIEW_REQUIRED` |
| Appel harness LIVE hors script 19M | **NOT_VERIFIED** comme bloqué | résiduel MEDIUM (voir §6) |
| Autorisation chat humaine | **NOT_APPLICABLE** technique | hors code — obligatoire avant LIVE |

---

## 5. Vulnérabilités constatées

### Avant correction (session audit)

| ID | Gravité | Description | Fichier |
|----|---------|-------------|---------|
| V1 | **MEDIUM** | Usage HTTP à 0 tokens compté comme $0 → sous-estimation possible du plafond USD | `budget.ts` / `harness.ts` |
| V2 | **MEDIUM** | Tarif inconnu (`estimatedUsd=null`) n’arrêtait pas la campagne | `budget.ts` |
| V3 | **MEDIUM** | Projection USD seulement entre scénarios, pas avant chaque tentative HTTP | `harness.ts` / `live-client.ts` |
| V4 | **MEDIUM** | Détection secrets incomplète (`gsk_`, JWT) ; messages d’erreur non sanitisés dans traces | `persistence.ts` |
| V5 | **LOW** | Pas de confinement de chemin d’artefacts (`..` / hors `tmp` pour 19M) | `persistence.ts` / script |
| V6 | **MEDIUM** (résiduel) | `runLot19aEvaluation({mode:"live"})` hors script n’exige pas `FABRIC_EVAL_CONFIRM_19M` | `harness.ts` |

### CRITICAL / HIGH ouverts après correction

**Aucun.**

### Corrections effectuées (harness local uniquement)

1. `unknownUsageFloorUsd` + `requireKnownUsd` (LIVE) dans `budget.ts` / câblage harness  
2. Hook `beforeAttempt` dans `live-client.ts` + projection USD avant HTTP  
3. Sanitize élargi + `errorMessage` sanitisé + détection `gsk_` / JWT  
4. `resolveEvalArtifactDir` (cwd + root `tmp` pour script 19M)  
5. `assertLot19mLiveScriptReady` / `assertLot19mBudgetValid`  
6. Suite `lot19m-security.test.ts` (19 tests)  

**Non modifié :** Patterns métier 1.3.x, scoring officiel, Supabase, Stripe, CRM, WOLOYEM AI, robot animé.

---

## 6. Risques résiduels

1. **MEDIUM — contournement programmatique :** un appel direct à `runLot19aEvaluation({ mode: "live", scenarios: LOT19M_DATASET })` avec la confirm générique `I_AUTHORIZE_LIVE_LLM` (sans confirm 19M) reste possible. Mitigé par le script npm 19M et l’absence de route HTTP publique.  
2. **MEDIUM — estimation USD :** le plafond $0.02 est une **estimation** harness (tarifs Groq snapshot), pas une garantie de facturation fournisseur.  
3. **LOW — arrondi `toFixed(6)` :** écarts mineurs possibles vs facture.  
4. **LOW — `loadEnvLocal` :** peut réactiver des flags hérités ; le préflight refuse les flags ON en préparation (fail-closed).  
5. Qualité anti-biais A1–A3 / C1–C2 : **HUMAN_REVIEW_REQUIRED** — hors preuve déterministe.

---

## 7. Tests exécutés (résultats réels)

| Suite | Résultat |
|-------|----------|
| `lot19m-security.test.ts` | **19/19 PASS** |
| Fabric + 19M prep + security | **113/113 PASS** |
| `eval:fabric:19m:prepare` | **PASS** (dry-run, `httpCalls=0`) |
| Typecheck | **PASS** |
| ESLint (fichiers touchés, `--max-warnings 0`) | **PASS** |
| `npm run lint` | **PASS** (0 errors ; warnings préexistants hors scope) |
| Build | **PASS** |
| Appels Groq LIVE | **ZERO** |

---

## 8. Décision de sécurité proposée

| Critère | Statut |
|---------|--------|
| CRITICAL ouverts | 0 |
| HIGH ouverts | 0 |
| Contrôles essentiels HTTP / auth script / dry-run | VERIFIED |
| OVERALL technique | **SAFE FOR LIVE AUTHORIZATION** |

**Recommandation :**

- **Autoriser** une future exécution LIVE **uniquement** après autorisation **explicite dans le chat** pour LOT 19M, avec les verrous techniques listés.  
- **Ne pas** lancer LIVE dans cet audit.  
- Après LIVE : remplir `docs/ai/lot19m-human-review-grid.md` ; **HUMAN REVIEW** reste **PENDING** jusqu’à revue humaine réelle (aucun `APPROVED` inventé).

---

## 9. Conditions minimales avant LIVE

- [ ] Autorisation chat explicite « LOT 19M LIVE »  
- [ ] `FABRIC_EVAL_CONFIRM_19M=I_AUTHORIZE_LOT19M_LIVE`  
- [ ] Flags Fabric + `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM`  
- [ ] Provider groq / modèle / clé  
- [ ] `npm run eval:fabric:19m -- --execute-live`  
- [ ] Plafonds 12 HTTP / $0.02 compris (estimation)  
- [ ] Grille humaine prête  

**Commande LIVE (documentaire uniquement — ne pas exécuter ici) :**

```bash
npm run eval:fabric:19m -- --execute-live
```
