# LOT 19E — Évaluation qualitative réelle, diagnostic TPM et optimisation ciblée

**Date:** 2026-10-24  
**LIVE LLM CALLS:** **ZERO**  
**Artefacts source:** `tmp/lot19d-live/lot19d-qualitative-live-2026-10-24T20-18-54-235Z-*`  
**Patterns après optimisation:** **v1.2.1** (étaient v1.2.0 au LIVE 19D)

---

## 1. Inventaire des réponses disponibles

| ID | Pattern | Statut 19D | Zod | Output | Tokens (in/out) | Attempts |
|----|---------|------------|-----|--------|-----------------|----------|
| `d19d_draft_pmp` | draft | **PASS** | OK | Oui | 1175 / 1930 | 1 |
| `d19d_draft_pmo` | draft | **PASS** | OK | Oui | 1171 / 1934 | 1 |
| `d19d_draft_prospects` | draft | **PASS** | OK | Oui | 1174 / 1938 | 1 |
| `d19d_draft_ambiguous` | draft | **PASS** | OK | Oui | 1164 / 1410 | 2 |
| `d19d_analyze_low` | analyze | **PASS** | OK | Oui | 889 / 785 | 3 |
| `d19d_analyze_high` | analyze | **PASS** | OK | Oui | 888 / 953 | 2 |
| `d19d_analyze_imbalanced` | analyze | **PASS** | OK | Oui | 885 / 816 | 3 |
| `d19d_analyze_partial` | analyze | **PASS** | OK | Oui | 842 / 637 | 2 |
| `d19d_plan_skills` | plan | **FAIL** | n/a | **Non** | 0 / 0 | 1 (429) |
| `d19d_plan_pmo` | plan | **NOT RUN** | — | Non | — | 0 |
| `d19d_plan_digital` | plan | **NOT RUN** | — | Non | — | 0 |
| `d19d_plan_competing` | plan | **NOT RUN** | — | Non | — | 0 |

**8 réponses évaluables** · **1 FAIL provider** · **3 NOT RUN** (plafond HTTP 16/16).

Aucune reconstruction des sorties manquantes.

---

## 2–3. Évaluation qualitative (grille 0–5)

**Nature des notes :** évaluation **provisoire** (LLM Evaluation Engineer) à partir des sorties LIVE réelles.  
**Ce ne sont pas des notes humaines finales.** Une revue produit reste requise.

Légende critères : P=pertinence · Pr=précision · C=cohérence · Cl=clarté · U=utilité · D=respect données · I=absence inventions · S=structure · A=adaptation · E=exploitabilité.

| Scénario | P | Pr | C | Cl | U | D | I | S | A | E | Moy. prov. |
|----------|---|----|---|----|---|---|---|---|---|---|------------|
| draft_pmp | 4 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | **4.3** |
| draft_pmo | 4 | 3 | 4 | 4 | 3 | 5 | 5 | 5 | 4 | 3 | **4.0** |
| draft_prospects | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | **4.8** |
| draft_ambiguous | 3 | 3 | 3 | 4 | 3 | 5 | 4 | 5 | 3 | 3 | **3.6** |
| analyze_low | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | **4.8** |
| analyze_high | 3 | 4 | 3 | 4 | 3 | 5 | 4 | 5 | 4 | 3 | **3.8** |
| analyze_imbalanced | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | **4.8** |
| analyze_partial | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | **4.8** |
| plan_* | — | — | — | — | — | — | — | — | — | — | **non évaluable** |

Moyennes par Pattern (provisoires, sur sorties disponibles) :

| Pattern | Moyenne provisoire | HUMAN REVIEW |
|---------|-------------------|--------------|
| draft (4) | **≈ 4.2 / 5** | PENDING |
| analyze (4) | **≈ 4.6 / 5** | PENDING |
| plan (0) | n/a | PENDING (aucune sortie) |

---

## 4. Défauts observés (preuves)

| Défaut | Preuve courte | Impact |
|--------|---------------|--------|
| Catégories EN alors que locale=fr (PMP) | `Initiation`, `Planning`, `Execution`, `Monitoring & Controlling` | Adaptation |
| Question email hors besoin (PMO) | `email:Adresse email du responsable du PMO ?` | Exploitabilité / privacy |
| Ambigu : fusion leadership+vente sans titre « provisoire » | Titre `Auto‑évaluation leadership et performance commerciale` | Pertinence |
| Analyze high : « faiblesses » sur écarts 1–3 pts | Collaboration 85 % / Sécurité 87 % vs global 88 % listés en improvementAreas | Utilité / cohérence |
| Analyze low : « forces » encore dans bande Faible | Livraison 32 % / Reporting 30 % vs 27 % | Nuance OK mais à surveiller |
| Plan : 0 qualité métier mesurable | 429 TPM + plafond HTTP | Disponibilité ≠ qualité |

Zod PASS n’efface pas ces défauts.

---

## 5. Analyse `generate_scorecard_draft`

**Points forts :** titres spécifiques ; disclaimers anti-PMI présents ; pondérations ~100 ; types Builder variés ; prospects très exploitables.

**Faiblesses :** sorties très longues (~1900 completion tokens) → pression TPM ; contact email injustifié (PMO) ; ambigu trop assertif ; catégories parfois en anglais.

**SCORECARD QUALITY: NEEDS IMPROVEMENT** (bon niveau global, corrections v1.2.1 ciblées)

---

## 6. Analyse `analyze_scorecard_results`

**Points forts :** echo scores exact ; citations explicites des % ; prudence sur partial (listes vides + limits) ; pas de recalcul.

**Faiblesses :** sur-interprétation d’écarts négligeables (high) ; recommandations parfois génériques (« collecter plus de réponses ») bien que pertinentes.

**RESULTS ANALYSIS QUALITY: PASS** (provisoire ≥ 4.5 moyen) avec bémol high → corrigé en prompt 1.2.1

**SCORING INTEGRITY: PASS** (4/4 LIVE)

---

## 7. Diagnostic `generate_action_plan`

**Conclusion principale :** échec de **disponibilité fournisseur / budget HTTP**, **pas** une preuve de mauvaise qualité métier.

| Hypothèse | Verdict |
|-----------|---------|
| 1. Disponibilité fournisseur (429 TPM) | **Confirmé** — message TPM Limit 8000, Used 6265, Requested 2463 |
| 2. Consommation tokens (drafts ~3.1k tok/appel) | **Confirmé** — 4 drafts ≈ 12k tokens en fenêtre courte |
| 3. Validation Zod / format plan | **Non observé** (aucune sortie) |
| 4. Qualité métier plan | **Non évaluable** |

Ordre d’exécution : drafts → analyze → plan. Retries analyze (7) ont consommé le plafond avant les plans utiles.

**ACTION PLAN QUALITY: NOT EVALUATED**

---

## 8. Analyse TPM / 429

| Fait | Valeur |
|------|--------|
| Limite org observée | **8000 TPM** (on_demand) |
| HTTP attempts | 16/16 |
| Retries | 7 |
| Retry wait cumulé | ≈ 56 s |
| Provider latency cumulée | ≈ 26 s |
| Coût | ≈ $0.0075 |
| Dernier échec | plan_skills 429, **1 attempt**, plus de budget retry |

Cause racine : spacing 600 ms insuffisant vs TPM + drafts volumineux + retries comptés dans le plafond.

---

## 9. Optimisations réalisées (sans LIVE)

| Zone | Changement | Version |
|------|------------|---------|
| Patterns | Instructions resserrées ; anti-email inutile ; titre provisoire si ambigu ; anti-faiblesses sur écarts &lt;5 pts | **1.2.1** |
| Limits | draft maxOut 10k ; analyze/plan 8k | 1.2.1 |
| Runner | `max_tokens` dérivé de `maxOutputChars` | — |
| Live client | Espacement adaptatif TPM (`computeTpmSpacingMs`) | — |
| Retry | Honor `Retry-After` / « try again in Xs » jusqu’à 60 s (ne plus tronquer trop tôt) | — |
| Sanitize | Clés secret plus précises (évite de redacter `*Tokens`) | — |
| Retest plan | Campagne préparée `lot19e-plan-retest` (4 sc., max 6 HTTP, spacing 4 s) | PREPARED_NOT_RUN |

**Aucun changement** scoring, Assistant, Supabase, RLS, Stripe, UI.

**OPTIMIZATION: PASS**

---

## 10. Résultats des tests

| Commande | Résultat |
|----------|----------|
| Suites Fabric 19B–19E | **PASS** (34/34) |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors) |
| `npm run build` | **PASS** |
| Appels Groq | **0** |

---

## 11. Risques résiduels

1. Qualité plan toujours inconnue jusqu’au retest LIVE.  
2. TPM 8000 org reste contrainte dure.  
3. Notes provisoires ≠ validation produit.  
4. Ambiguous draft peut encore sur-combiner des thèmes (à revérifier LIVE).  

---

## 12. Plan de retest ciblé (NON EXÉCUTÉ)

Voir `lib/ai/fabric-prototype/eval/lot19e-plan-retest.ts` :

- 4 scénarios plan synthétiques  
- Max **6** HTTP attempts  
- Spacing **4000 ms** + TPM adaptatif  
- Backoff maxAttempts **2** ; Retry-After honoré  
- Sorties : `tmp/lot19e-plan-live/` (gitignored)  
- Auth : `FABRIC_EVAL_CONFIRM_19E=I_AUTHORIZE_LOT19E_PLAN_LIVE` + autorisation chat  

**Ne pas lancer sans nouvelle autorisation.**

---

## 13. Recommandation par Pattern

| Pattern | Recommandation |
|---------|----------------|
| `generate_scorecard_draft` | **NEEDS IMPROVEMENT** → v1.2.1 appliqué ; revalidation LIVE optionnelle après revue humaine des 4 sorties |
| `analyze_scorecard_results` | **PENDING HUMAN REVIEW** (qualité provisoire forte ; intégrité OK) |
| `generate_action_plan` | **NEEDS IMPROVEMENT** (disponibilité) → **READY FOR TARGETED RETEST** |

**Aucun Pattern READY FOR INTEGRATION.**

---

## STATUTS FINAUX

| Item | Status |
|------|--------|
| LIVE OUTPUT REVIEW | **PASS** (8/8 disponibles lus) |
| HUMAN REVIEW | **PENDING** (notes provisoires documentées) |
| SCORECARD QUALITY | **NEEDS IMPROVEMENT** |
| RESULTS ANALYSIS QUALITY | **PASS** (provisoire) |
| ACTION PLAN QUALITY | **NOT EVALUATED** |
| TPM DIAGNOSIS | **PASS** |
| OPTIMIZATION | **PASS** |
| SECURITY | **PASS** |
| SCORING INTEGRITY | **PASS** |
| NON-REGRESSION | **PASS** |
| LIVE LLM CALLS | **ZERO** |
| **OVERALL STATUS** | **READY FOR TARGETED RETEST** |

---

## Arrêt

LOT 19E terminé. **Aucun retest LIVE lancé.** Attente d’une autorisation explicite pour le retest plan-only (≤ 6 appels Groq).
