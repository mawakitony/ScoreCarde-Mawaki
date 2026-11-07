# LOT 19N — Résultats du retest Groq LIVE ciblé (campagne 19M)

**HUMAN REVIEW :** `PENDING`  
**PRODUCTION CHANGES :** `NONE`  
**LOT 20 :** `NOT STARTED`  
**APPROVED produit :** **non attribué**

---

## 1. Horodatage et exécution

| Champ | Valeur |
|-------|--------|
| Début (shell) | 2026-10-25T11:16:47Z |
| Fin (artefacts) | 2026-10-25T11:20:29.035Z |
| Campagne | `lot19m-targeted-retest` |
| Entrée | Script audité `scripts/lot19m-live.mjs --execute-live` |
| Note Windows | `npm run eval:fabric:19m -- --execute-live` n’a **pas** transmis `--execute-live` à Node dans ce shell ; exécution via l’entrée script directe équivalente (mêmes verrous) |
| Autorisation | Chat utilisateur LOT 19N + `FABRIC_EVAL_CONFIRM_19M=I_AUTHORIZE_LOT19M_LIVE` + flags Fabric + `FABRIC_EVAL_CONFIRM` |
| Flags après run | Désactivés dans le shell d’exécution |

---

## 2. Versions et modèle

| Pattern | Version réelle |
|---------|----------------|
| `generate_scorecard_draft` | **1.3.1** |
| `analyze_scorecard_results` | **1.3.0** |
| `generate_action_plan` | **1.3.1** |

| Provider | Modèle |
|----------|--------|
| groq | `openai/gpt-oss-120b` |

---

## 3. Budgets

| Plafond | Consommé | Statut |
|---------|----------|--------|
| 8 scénarios | 8 exécutés | OK |
| 12 tentatives HTTP (retries inclus) | **8** | OK (`stopped=false`) |
| $0.02 USD estimé | **$0.009867** | OK |
| Retries | **0** | — |
| HTTP 429 | **0** | — |
| Timeouts | **0** | — |

Tokens : prompt **14207** · completion **13085** · cached **1536**  
Note : plafond USD = **estimation harness**, pas facture Groq exacte.

---

## 4. Résultat par scénario

| ID | Pattern | HTTP | Zod/run | Overall validateur 19M | Notes automatiques |
|----|---------|------|---------|------------------------|--------------------|
| `d19m_draft_pmp` | draft 1.3.1 | 1 | OK | **DETERMINISTIC_FAIL** | Sous-chaîne `certification officielle pmi` trouvée dans un disclaimer de **négation** (« sans prétention de… ») — faux positif probable du check lexical ; **revue humaine** anti-biais toujours requise |
| `d19m_draft_pmo` | draft 1.3.1 | 1 | OK | **HUMAN_REVIEW_REQUIRED** | Déterministe OK |
| `d19m_draft_prospects` | draft 1.3.1 | 1 | OK | **HUMAN_REVIEW_REQUIRED** | Déterministe OK |
| `d19m_draft_ambiguous` | draft 1.3.1 | 1 | OK | **DETERMINISTIC_PASS** | `needs_clarification` ; question leadership / commercial / les deux |
| `d19m_analyze_high` | analyze 1.3.0 | 1 | OK | **HUMAN_REVIEW_REQUIRED** | Echo **88 / 92 / 85 / 87** ; scoring integrity PASS |
| `d19m_plan_skills` | plan 1.3.1 | 1 | OK | **HUMAN_REVIEW_REQUIRED** | `requiresArbitration=false` (C1) |
| `d19m_plan_pmo` | plan 1.3.1 | 1 | OK | **HUMAN_REVIEW_REQUIRED** | `requiresArbitration=false` ; une action mentionne macros Excel / Power Query (pas de nouvel outil SaaS) — à juger humainement vs contrainte « pas de nouvel outil » |
| `d19m_plan_competing` | plan 1.3.1 | 1 | **FAIL** | **DETERMINISTIC_FAIL** | `output_invalid` (Zod) — pas de sortie validée ; **arbitrage C4 non vérifiable** sur ce run |

**Totaux harness :** deterministicPass **6** · deterministicFail **2** · NOT RUN **0**

---

## 5. Contrôles métier ciblés (automatiques ≠ approbation)

### A1 — PMP
- Check lexical PMI : FAIL (présence de la phrase d’exclusion).  
- Contenu : encore une question « À quelle fréquence le plan… est mis à jour » (échelle) et un item sur le « degré d’automatisation du reporting » scoré — **HUMAN_REVIEW_REQUIRED** (anti-biais).

### A2 — PMO
- Structure OK ; questions gouvernance / décisions / utilité du reporting présentes.  
- Qualité anti-biais : **revue humaine**.

### A3 — B2B
- Draft OK, 10 questions / 4 catégories.  
- Pas de question contact détectée par le guard.  
- Qualité « contraintes ≠ points » : **revue humaine** (lecture complète dans traces).

### A4 — Ambiguïté
- **PASS** déterministe : clarification sans scorecard.

### B2 — Analyse
- Echo exact des scores officiels.  
- Faits / interprétations / limites présents.  
- Prudence qualitative : **revue humaine**.

### C1 — Compétences
- `requiresArbitration=false` — conforme à l’attente « budget limité ≠ exclusif ».  
- Plan à relire pour charge 3 h/semaine.

### C2 — PMO
- Pas d’arbitrage forcé.  
- Indicateur avec « 20 % à valider » observé (bon sens « indicatif »).  
- Action d’automatisation Excel : **revue humaine** vs interdiction nouvel outil.

### C4 — Arbitrage
- **Échec Zod** — impossible de confirmer `requiresArbitration=true` sur la sortie.  
- Correction / retest ciblé **non relancé** (politique : pas de 2ᵉ campagne automatique).

---

## 6. Artefacts anonymisés (sans secrets)

Scan secrets sur `full.json` : **négatif**.

| Fichier |
|---------|
| `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-full.json` |
| `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-traces.json` |
| `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-slim.json` |
| `tmp/lot19m-live/lot19m-targeted-retest-2026-10-25T11-20-29-035Z-human-review.json` |
| `tmp/lot19m-live/lot19m-validations.json` |

Grille humaine à remplir : `docs/ai/lot19q-live-validation-grid.md` · `docs/ai/lot19m-human-review-grid.md`

---

## 7. Sécurité

| Contrôle | Résultat |
|----------|----------|
| Effets de bord Supabase/Stripe/CRM | Aucun (prototype eval) |
| Secrets dans traces | Non détectés |
| Dépassement HTTP/USD | Non |
| Anomalie sécurité bloquante | Non → campagne non `BLOCKED` |

---

## 8. Risques résiduels / suite

1. **C4** non validable (Zod) — décision métier + éventuel retest **ciblé** sous nouvelle autorisation.  
2. **A1** faux positif possible sur disclaimer PMI + biais fréquence/automatisation à juger.  
3. Qualité A2/A3/C1/C2/B2 non « PASS » métier automatique.  
4. Pas de 2ᵉ campagne dans ce LOT.

---

## 9. Scénarios prioritaires pour le responsable métier

1. `d19m_draft_pmp` (A1) — biais + disclaimer PMI  
2. `d19m_draft_pmo` (A2)  
3. `d19m_draft_prospects` (A3)  
4. `d19m_analyze_high` (B2)  
5. `d19m_plan_skills` (C1)  
6. `d19m_plan_pmo` (C2)  
7. `d19m_plan_competing` (C4) — échec technique à traiter  
8. `d19m_draft_ambiguous` (A4) — contrôle rapide (déjà PASS déterministe)

**Les Patterns ne sont pas approuvés pour la production.**
