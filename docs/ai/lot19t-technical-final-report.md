# LOT 19T — Rapport technique final (hors ligne)

**Date :** 2026-10-25  
**LIVE LLM CALLS :** ZERO  
**HUMAN REVIEW :** PENDING  
**PRODUCTION CHANGES :** NONE  
**LOT 20 :** NOT STARTED  
**GO / NO-GO :** PENDING

---

## 1. Versions

| Pattern | Avant 19T | Après 19T |
|---------|-----------|-----------|
| `generate_scorecard_draft` | 1.3.1 | **1.3.1** |
| `analyze_scorecard_results` | 1.3.0 | **1.3.0** |
| `generate_action_plan` | 1.3.2 | **1.3.3** |

**Pourquoi Plan 1.3.3 :** comportement public du schéma — les champs métier trop longs **échouent Zod** au lieu d’être tronqués silencieusement.

---

## 2. Cause racine `clipString`

`clipString` (introduit en 19R) était appelé dans le preprocess Zod Plan sur :

- `title`, `description`, `expectedOutcome`, `successIndicator`
- `situationSynthesis`, `arbitrationQuestion`

Un texte > max était **coupé** puis accepté → perte possible de contrainte, échéance, arbitrage ou justification en fin de champ, **sans erreur diagnostiquable**.

Usages restants hors schéma critique : helper optionnel uniquement (`allowSilentClip: true` requis pour tronquer).

---

## 3. Correctif

| Changement | Détail |
|------------|--------|
| `trimBusinessString` | Trim uniquement, jamais de coupe |
| `clipString` | Par défaut **ne coupe plus** ; clip seulement si `{ allowSilentClip: true }` |
| Schéma Plan | Critiques → `trimBusinessString` ; Zod `.max()` rejette le surplus |
| Prompt Plan 1.3.3 | Rappelle « dépassement = sortie invalide » |
| Dataset / campagne 19M | `expectedPatternVersion` / `versionsRequired` plan → **1.3.3** |

**Champs critiques protégés :** title, description, expectedOutcome, successIndicator, situationSynthesis, arbitrationQuestion.

**Non inventé :** aucun texte de remplacement. Limites Zod **inchangées**.

**Résidu documenté :** `normalizeStringList` peut encore soft-clipper les items de listes (facts/hypotheses/…) — hors `clipString` ; hors scope d’affaiblissement 19T ; à surveiller si une perte métier apparaît en LIVE.

---

## 4. Tests & régression

| Suite | Résultat |
|-------|----------|
| Fabric + 19T (177 tests) | **PASS** |
| Security (19M-S + lot6) | **PASS** |
| Adversarial (19O) | **PASS** |
| Typecheck | **PASS** |
| Lint | **PASS** (0 errors ; 10 warnings scripts préexistants) |
| Build | **PASS** |

Nouveau fichier : `lib/ai/fabric-prototype/tests/lot19t-clipstring-and-regression.test.ts`.

Contrôles ciblés : longueurs under/exact/over ; marqueurs métier en fin de texte ; Unicode ; C1/C4 arbitrage ; A1 PMI ; A4 ; B2 echo 88/92/85/87 ; verrous LIVE intacts.

| Contrôle offline | Statut |
|------------------|--------|
| A1 historical replay PMI | **VERIFIED** |
| C1 non-régression | **VERIFIED** (mock) |
| C4 contrat offline | **VERIFIED** (mock) |
| C4 LIVE Groq | **PENDING** / **NOT VERIFIED** |

---

## 5. Sécurité / production

- Aucun flag LIVE activé.  
- Confirm 19M toujours requis.  
- Pas de Supabase / Stripe / CRM / scoring officiel / WOLOYEM AI / robot.  
- Harness LIVE non affaibli.

---

## 6. Actions restantes avant LOT 20 (minimales)

1. **Revue humaine** des 7 réponses LIVE 19N disponibles (`lot19t-human-review-package.md`).  
2. **Retest LIVE ciblé C4** (et idéalement A1) sous **nouvelle autorisation**, Pattern Plan **1.3.3**.  
3. Cocher GO uniquement si humain + C4 LIVE OK (`lot19t-go-no-go-checklist.md`).

Aucun nouveau LOT documentaire nécessaire si rien de technique n’apparaît.
