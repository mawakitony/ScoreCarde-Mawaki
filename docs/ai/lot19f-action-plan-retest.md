# LOT 19F — Retest LIVE `generate_action_plan` v1.2.1

**Date exécution:** 2026-10-24  
**Autorisation:** explicite (chat LOT 19F LIVE) + `FABRIC_EVAL_CONFIRM_19F=I_AUTHORIZE_LOT19F_LIVE`  
**Campagne:** `lot19f-action-plan-retest`  
**Artefacts:** `tmp/lot19f-plan-live/lot19f-action-plan-retest-2026-10-24T22-06-53-279Z-*` (gitignored)

---

## Résultats d’exécution

| Item | Valeur |
|------|--------|
| Pattern / version | `generate_action_plan` **v1.2.1** |
| Modèle | groq / `openai/gpt-oss-120b` |
| Scénarios exécutés | **4 / 4** |
| PASS déterministe | **4** |
| FAIL | **0** |
| NOT RUN | **0** |
| Tentatives HTTP | **4 / 6** |
| Retries | **0** |
| HTTP 429 | **Aucun** observé |
| Zod | **4 / 4 (100 %)** |
| Coût estimé | **≈ $0.00332** |
| Prompt / completion / cached | **3870** / **4667** / **768** |

### Par scénario

| ID | PASS | Zod | Attempts | Latence ms | Provider ms | Tokens in/out |
|----|------|-----|----------|------------|-------------|---------------|
| `d19f_plan_skills` | Oui | OK | 1 | 3187 | 3180 | 968 / 1072 |
| `d19f_plan_pmo` | Oui | OK | 1 | 20413 | 3613 | 971 / 1402 |
| `d19f_plan_digital` | Oui | OK | 1 | 23496 | 4196 | 969 / 1197 |
| `d19f_plan_competing` | Oui | OK | 1 | 20270 | 2521 | 962 / 996 |

Latences élevées sur sc. 2–4 = **espacement TPM adaptatif** (pas d’échec provider). Budget HTTP restant : **2** tentatives non utilisées.

---

## Performance & TPM

| Métrique | Valeur |
|----------|--------|
| Latence moyenne (bout-en-bout) | **16842 ms** |
| Latence max | **23496 ms** (`digital`) |
| Provider latency typique | ~2,5–4,2 s |
| Retries / 429 | **0** |
| TPM handling | **PASS** — spacing post-19E a permis 4/4 sans 429 |
| Coût | dans la fourchette prévue ($0.001–0.008) |

---

## Conservation des réponses

| Fichier | Rôle |
|---------|------|
| `*-full.json` | Rapport sanitizé |
| `*-traces.json` | Input + **validatedOutput** + métriques |
| `*-human-review.json` | Grille 0–5 vide (`score: null`) |
| `*-slim.json` | Résumé déterministe |

Scan secrets (`sk-` / Bearer) : **aucun**.

---

## Qualité métier (provisoire)

**Nature :** évaluation LLM Evaluation Engineer à partir des sorties LIVE.  
**Ce ne sont pas des notes humaines finales.**

### Exemples d’actions concrètes

- **Skills :** registre de risques simplifié (succès = document validé sous 5 j) ; sync parties prenantes 30 min (participation ≥80 % / 4 sem.).
- **PMO :** cartographie besoins décisionnels ; 3 KPI décisionnels à J+30 ; −20 % temps reporting à J+180.
- **Digital :** diagnostic adoption par équipe ; rituel inter-équipes ≥80 % leads.
- **Competing :** **un seul** chantier majeur (contrainte budget) + tableau de bord quotidien + transfert « Buddy ».

### Points forts

- Priorités liées aux écarts fournis.
- `successIndicator` souvent observables (dates, taux, livrables).
- Contraintes respectées (3 h/semaine, pas de nouvel outil, un seul chantier).
- Séparation facts / hypotheses / disclaimers présente.

### Défauts / risques

| Observation | Preuve | Gravité |
|-------------|--------|---------|
| Hypothèses parfois affirmatives | Competing : causes coûts/satisfaction inventées en `hypotheses` (libellé OK mais à surveiller) | Faible |
| 4 actions alors que 3 priorités | Skills / PMO / Digital | Acceptable (contrat ≥3) |
| Quelques formulations encore « atelier / guide » | Digital guide bonnes pratiques | Mineure |

### Notes provisoires 0–5 (grille 19C)

| Scénario | Pert. | Préc. | Coh. | Clar. | Util. | Données | Inventions | Struct. | Adapt. | Exploit. | Moy. |
|----------|-------|-------|------|-------|-------|---------|------------|---------|--------|----------|------|
| skills | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | **4.8** |
| pmo | 5 | 4 | 5 | 4 | 5 | 5 | 4 | 5 | 5 | 5 | **4.7** |
| digital | 4 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | **4.2** |
| competing | 5 | 4 | 5 | 4 | 5 | 5 | 3 | 5 | 5 | 5 | **4.6** |

**Moyenne provisoire Pattern plan ≈ 4.6 / 5** (sur 4 sorties LIVE).

### Grille revue humaine

Fichier prêt : `…-human-review.json` — scores à `null`, à remplir sans auto-valider via Zod.

---

## Sécurité

| Contrôle | Résultat |
|----------|----------|
| Données production | **NONE** |
| Écritures DB | **NONE** |
| Prod / Assistant / robot | **inchangés** |
| Plafond HTTP | **Respecté** (4 ≤ 6) |
| Commit / deploy | **aucun** |

---

## Décision

| Pattern | Décision |
|---------|----------|
| `generate_action_plan` | **PENDING HUMAN REVIEW** |

Justification : preuves techniques fortes (4/4 Zod, 0×429, plans concrets) et qualité provisoire élevée, **mais** revue humaine obligatoire avant tout READY FOR INTEGRATION / intégration Assistant.

**Aucun Pattern intégré à la production.**

---

## STATUTS FINAUX

| Item | Status |
|------|--------|
| LIVE EXECUTION | **PASS** |
| SCENARIOS | **4/4 PASS** |
| HTTP ATTEMPTS | **4/6** |
| ZOD VALIDATION | **PASS** |
| TPM HANDLING | **PASS** |
| OUTPUT PERSISTENCE | **PASS** |
| ACTION PLAN QUALITY | **PENDING HUMAN REVIEW** |
| SECURITY | **PASS** |
| DATABASE WRITES | **NONE** |
| PRODUCTION CHANGES | **NONE** |
| **OVERALL** | **READY FOR HUMAN REVIEW** |

---

## Arrêt

Campagne LOT 19F terminée. Aucune campagne suivante lancée automatiquement.
