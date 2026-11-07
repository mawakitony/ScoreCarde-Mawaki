# LOT 19S — Vérification hors ligne A1 / C4 (après LOT 19R)

**Date :** 2026-10-25  
**LIVE LLM CALLS :** **ZERO**  
**HUMAN REVIEW :** **PENDING** (aucune note inventée)  
**PRODUCTION CHANGES :** **NONE**  
**LOT 20 :** **NOT STARTED**

Ce lot **vérifie indépendamment** les corrections 19R. Un PASS MOCK **n’est pas** une validation LIVE Groq.

---

## 1. Versions inspectées

| Pattern | Version code | Attendu 19S | Statut |
|---------|--------------|-------------|--------|
| `generate_scorecard_draft` | **1.3.1** | 1.3.1 | **VERIFIED** |
| `analyze_scorecard_results` | **1.3.0** | 1.3.0 | **VERIFIED** |
| `generate_action_plan` | **1.3.2** | 1.3.2 | **VERIFIED** |

`LOT19M_CAMPAIGN.versionsRequired` et `versionsMatchRequired().all` : **VERIFIED**.

Sources : `patterns/*.ts`, `eval/lot19m-campaign.ts`, tests `lot19s-offline-a1-c4-verification.test.ts`.

---

## 2. Preuves A1 disponibles

| Preuve | Présente ? | Statut |
|--------|------------|--------|
| Rapport 19N | `docs/ai/lot19n-live-final-results.md` | Oui |
| Rapport 19R | `docs/ai/lot19r-post-live-fixes.md` | Oui |
| `validatedOutput` A1 LIVE 19N | `tmp/lot19m-live/...-traces.json` + `full.json` | **Oui** |
| Corps brut LLM A1 (pre-Zod) | Non nécessaire (Zod OK en 19N) | N/A |
| Notes humaines A1 | Scores `null` / PENDING | **HUMAN REVIEW REQUIRED** |

---

## 3. Replay historique A1

**Résultat : VERIFIED**

1. Chargement inchangé de `validatedOutput` pour `d19m_draft_pmp` depuis l’artefact 19N.
2. Passage dans `findMisleadingPmiCertificationClaim` → **null** (pas de claim trompeur).
3. Passage dans `scoreDeterministic` / `no_forbidden_substrings` → **PASS**.
4. `draft_status` → `draft_suggestion` **PASS**.
5. `semantic_business_quality` → **HUMAN_REVIEW_REQUIRED** (anti-biais fréquence / automatisation non jugés ici).
6. Aucune requête réseau (lecture fichier locale + validateurs).

Phrases historiques concernées (négations) :

- description : « …sans prétention de certification officielle PMI »
- disclaimer : « Ne constitue pas une certification PMI ni une validation officielle d’organisme. »

---

## 4. Cas PMI — acceptés / rejetés

| Cas | Attendu | Résultat |
|-----|---------|----------|
| « Ne constitue pas une certification officielle PMI. » | accept | **VERIFIED** |
| « Sans prétendre être une certification officielle PMI. » | accept | **VERIFIED** |
| « Sans prétendre à une certification officielle PMI. » | accept | **VERIFIED** |
| Mention informative PMI / PMP | accept | **VERIFIED** |
| « Cet outil est officiellement certifié par PMI. » | reject | **VERIFIED** |
| « PMI approuve officiellement ce scorecard. » | reject | **VERIFIED** |
| Casse / espaces / ponctuation sur claims | reject | **VERIFIED** |
| « sans égale : certification officielle PMI » | reject | **VERIFIED** |
| Ambigu (« alignée sur les standards PMI ») | pas hard-fail ; flag humain | **HUMAN REVIEW REQUIRED** (`isAmbiguousPmiAffiliationPhrase`) |

### Correction validator (19S, hors Pattern métier)

Élargissement minimal de `findMisleadingPmiCertificationClaim` + helper `isAmbiguousPmiAffiliationPhrase` pour :

- couvrir « certifié par PMI » / « PMI approuve officiellement » ;
- accepter « sans prétendre **être** une certification… » (gap détecté à l’inspection).

Pas de changement de prompt draft / version draft.

---

## 5. Fixtures synthétiques C4

**Étiquette :** toutes les fixtures C4 de ce lot sont **SYNTHETIC** (MOCK).  
**Corps brut Groq C4 19N :** **absent** → replay historique Zod C4 = **NOT VERIFIED**.

| # | Fixture | Résultat |
|---|---------|----------|
| 1 | Horizon canonique | **VERIFIED** |
| 2 | Alias horizon (`30 jours`, etc.) | **VERIFIED** |
| 3 | Priorité canonique | **VERIFIED** |
| 4 | Alias priorité (`high`→`haute`) | **VERIFIED** |
| 5 | Booléens typés | **VERIFIED** |
| 6 | Chaînes `"true"`/`"false"` | **VERIFIED** (`"false"` ≠ `true`) |
| 7 | Longueurs aux limites | **VERIFIED** |
| 8 | Longueurs > max | clip → Zod OK (**résidu documenté**) |
| 9 | Champ obligatoire manquant | Zod FAIL + flatten **VERIFIED** |
| 10 | Enum inconnu (`next_sprint`, `critique`) | **non remappé** → Zod FAIL **VERIFIED** |
| 11 | JSON malformé | parse échoue **VERIFIED** |
| 12 | Exclusif vs limité (guards) | exclusif true / limité false **VERIFIED** |
| 13 | Arbitrage exclusif mock runner | **VERIFIED** (MOCK ≠ LIVE) |
| 14 | Budget simplement limité (C1) | pas d’arbitrage **VERIFIED** |
| 15 | Horizon `90_jours` | **VERIFIED** |
| 16 | Multi-actions conditionnelles + arbitrage | **VERIFIED** (schema) |

### Transformations documentées (pas d’invention de champs)

- `horizon` aliases listés → tokens enum  
- `priority` high/medium/low → haute/moyenne/basse  
- `requiresArbitration` string bool → boolean  
- `clipString` tronque **sans inventer** de contenu  

**Résidu :** la troncature `clipString` est **silencieuse** (pas d’erreur Zod si trop long) → risque de perte de fin de phrase. Statut preuve « pas de troncature silencieuse d’info métier » : **FAILED** comme garantie absolue / **OPEN ISSUE** (comportement 19R conservé, documenté).

---

## 6. Résultats Zod / arbitrage

| Contrôle | Statut |
|----------|--------|
| Contrat Plan 1.3.2 (schema + normalize) | **VERIFIED** (offline) |
| Erreurs Zod exploitables (`flatten` / message runner) | **VERIFIED** |
| `requiresArbitration=true` si budget exclusif (mock + guard) | **VERIFIED** |
| Budget limité ≠ arbitrage (C1) | **VERIFIED** |
| Cause exacte Zod du run LIVE C4 19N | **NOT VERIFIED** (raw absent) |
| Groq produira une sortie valide au prochain LIVE | **NOT VERIFIED** |

---

## 7. Sécurité (offline)

| Contrôle | Statut |
|----------|--------|
| Pas d’accès réseau LLM dans les tests 19S | **VERIFIED** (mock + fichiers locaux) |
| Flags LIVE non activés par les tests | **VERIFIED** |
| Sanitize secrets factices | **VERIFIED** |
| Pas d’écriture Supabase / CRM / Stripe dans le prototype eval | **VERIFIED** (isolation existante + audit 19M-S) |
| Scoring officiel non modifié (echo forcé) | **VERIFIED** (B2 88/92/85/87) |
| Verrous LIVE non contournés | **VERIFIED** (confirm 19M absent) |
| WOLOYEM AI / robot animé | non touchés |

---

## 8. Régressions exécutées

| Suite | Résultat |
|-------|----------|
| Fabric + 19S (166 tests) | **PASS** |
| Security (inclus lot6 + 19M-S + 19O + 19S) | **PASS** |
| Typecheck | **PASS** |
| Lint | **PASS** (0 errors ; 10 warnings préexistants scripts) |
| Build | **PASS** |

Régressions métier MOCK : A1 PMI, A4 clarification, B2 echo, C1 non-arbitrage, C4 arbitrage exclusif.

---

## 9. Limites de preuve

1. MOCK ≠ LIVE : aucun appel Groq 19S.  
2. C4 LIVE 19N : échec Zod **sans** corps brut → cause exacte **NOT VERIFIED**.  
3. Qualité anti-biais A1 (fréquence / automatisation) : **HUMAN REVIEW REQUIRED**.  
4. Formulations PMI ambiguës : flag humain, pas d’auto-APPROVED.  
5. `clipString` peut tronquer sans fail Zod.  
6. Checklist 19Q encore partiellement figée à « NOT RUN » historique — ne pas confondre avec l’exécution réelle 19N.

---

## 10. Anomalies / corrections 19S

| Item | Action |
|------|--------|
| Gap « sans prétendre être… » | Corrigé dans validateur PMI |
| Gap « PMI approuve officiellement… » | Corrigé dans validateur PMI |
| Ambigu PMI | Helper `isAmbiguousPmiAffiliationPhrase` + tests |
| Clip silencieux | Documenté, **pas** retiré (exigerait autorisation si on veut fail-hard) |
| Pattern prompts / versions métier hors validator | **Non modifiés** en 19S |

---

## 11. Points nécessitant un nouveau retest LIVE

Sous **nouvelle autorisation** uniquement :

1. **`d19m_plan_competing` (C4)** — Plan **1.3.2** : Zod OK + `requiresArbitration=true` (**priorité**)  
2. **`d19m_draft_pmp` (A1)** — confirmer lexical PMI + revue anti-biais humaine  

Ne pas déclarer ces scénarios APPROVED sur la seule base MOCK.

---

## 12. Synthèse des libellés

| Contrôle | Libellé |
|----------|---------|
| Versions | **VERIFIED** |
| A1 historical replay | **VERIFIED** |
| A1 PMI false-positive / misleading | **VERIFIED** |
| A1 qualité métier / biais | **HUMAN REVIEW REQUIRED** |
| C4 historical Zod replay | **NOT VERIFIED** |
| C4 synthetic contract | **VERIFIED** (MOCK) |
| C4 LIVE readiness | **NOT VERIFIED** |
| Security offline | **VERIFIED** |
| Overall | **PARTIALLY VERIFIED** |
