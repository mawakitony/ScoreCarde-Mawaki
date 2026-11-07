# LOT 19D — Préparation campagne LIVE qualitative

**Date:** 2026-10-24  
**LIVE EXECUTION:** **RUN** — voir `docs/ai/lot19d-live-results.md` (2026-10-24)  
**Patterns:** v1.2.0 (inchangés dans ce LOT — mesure avant nouvelle optimisation)

---

## 1. Dataset (12 scénarios synthétiques)

| ID | Pattern | Intention |
|----|---------|-----------|
| `d19d_draft_pmp` | draft | Compétences PMP (sans claim PMI) |
| `d19d_draft_pmo` | draft | Maturité PMO |
| `d19d_draft_prospects` | draft | Qualification prospects B2B |
| `d19d_draft_ambiguous` | draft | Demande incomplète / ambiguë (edge) |
| `d19d_analyze_low` | analyze | Score faible |
| `d19d_analyze_high` | analyze | Score élevé |
| `d19d_analyze_imbalanced` | analyze | Catégories déséquilibrées |
| `d19d_analyze_partial` | analyze | Données partielles (edge) |
| `d19d_plan_skills` | plan | Amélioration compétences |
| `d19d_plan_pmo` | plan | Développement PMO |
| `d19d_plan_digital` | plan | Transformation digitale |
| `d19d_plan_competing` | plan | Priorités concurrentes (edge) |

Source : `lib/ai/fabric-prototype/eval/lot19d-dataset.ts`  
**Données 100 % fictives** — aucun client / CRM / tenant / PII.

---

## 2. Version des Patterns

| Pattern | Version |
|---------|---------|
| `generate_scorecard_draft` | **1.2.0** |
| `analyze_scorecard_results` | **1.2.0** |
| `generate_action_plan` | **1.2.0** |

**Aucun changement de prompt dans LOT 19D** — la qualité v1.2.0 doit d’abord être mesurée en LIVE.

---

## 3. Vérification de l’architecture

| Contrôle | Statut |
|----------|--------|
| Moteur isolé `lib/ai/fabric-prototype/` | OK |
| Pas de route publique d’éval | OK |
| Assistant production / robot | **non modifié** |
| Scoring officiel / Supabase / RLS / Stripe | **non touchés** |
| Harness enrichi (version, input, timings, usage, `validatedOutput`) | OK |
| Persistance anonymisée | OK (`tmp/lot19d-live/`, gitignored) |
| Export revue humaine (scores à `null`) | OK |

---

## 4. Conditions de sécurité

- Triple verrou LIVE : `FABRIC_PROTOTYPE_ENABLED=1` + `FABRIC_PROTOTYPE_LIVE=1` + `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM`
- **+** verrou LOT 19D : `FABRIC_EVAL_CONFIRM_19D=I_AUTHORIZE_LOT19D_LIVE`
- **+** autorisation humaine explicite dans le chat
- Arrêt immédiat si scénario security renvoie `ok=true` (N/A sur ce dataset, mécanisme conservé)
- Plafond HTTP dur : **16** tentatives (retries inclus)
- Sanitize : clés `apiKey` / `authorization` / bearer / `sk-…` redacted
- Jamais : clés API, tokens auth, données clients, secrets env dans les artefacts

---

## 5. Budget maximal d’appels

| Paramètre | Valeur |
|-----------|--------|
| Scénarios | **12** |
| Max HTTP attempts | **16** |
| Spacing | **600 ms** |
| Retry | max **3** / appel logique ; backoff 700 ms → 10 s ; `Retry-After` respecté |
| Provider | **groq** |
| Modèle | **openai/gpt-oss-120b** |

---

## 6. Estimation de coût

Tarifs Groq vérifiés (docs modèle, 2026-10-24) :

- Input **$0.15 / M**
- Cached input **$0.075 / M**
- Output **$0.60 / M**
- Source : https://console.groq.com/docs/model/openai/gpt-oss-120b

Estimation campagne 19D (prudente) : **≈ $0.004 – $0.02 USD**  
(basée sur volumes observés 19B et plafond 16 attempts).

Limites modèle : context 131k ; max output tokens 65 536 (non saturés par nos `maxOutputChars`).

---

## 7. Tests (sans coût LLM)

| Commande | Résultat |
|----------|----------|
| `lot19d-preparation.test.ts` | **PASS** (7/7) |
| Suites Fabric 19B–19C | **PASS** (flags LIVE off) |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors, warnings préexistants) |
| `npm run build` | **PASS** |
| `npm run eval:fabric:19d:prepare` | **PASS** dry-run, **0** appel LLM |

**LIVE LLM CALLS this LOT: ZERO**

---

## 8. Emplacement sécurisé des sorties

Dossier local **gitignored** : `tmp/lot19d-live/`

Fichiers prévus après LIVE autorisé :

| Fichier | Contenu |
|---------|---------|
| `*-full.json` | Rapport complet sanitizé |
| `*-traces.json` | Traces par scénario (input + output validé + métriques) |
| `*-human-review.json` | Grille 0–5 vide pour revue humaine |
| `*-slim.json` | Résumé déterministe |

---

## 9. Méthode d’évaluation humaine

Grille LOT 19C (10 critères, 0–5) — `quality-rubric.ts`.

Règles :

1. Lire `validatedOutput` + `syntheticInput` dans les traces.
2. Noter chaque critère ; **Zod PASS ≠ note élevée**.
3. Calculer moyenne seulement sur critères scorés.
4. Documenter dans `docs/ai/lot19d-live-results.md` **après** LIVE + revue.

Critères déterministes (pré-remplissables mécaniquement, hors note qualitative) : structure / respect données scores.  
Critères humains : pertinence, précision, cohérence, clarté, utilité, inventions, adaptation, exploitabilité.

---

## 10. Préconditions du LIVE

Avant exécution, confirmer :

1. [ ] Autorisation chat explicite pour **≤ 16 appels Groq** / 12 scénarios
2. [ ] `FABRIC_PROTOTYPE_ENABLED=1`
3. [ ] `FABRIC_PROTOTYPE_LIVE=1`
4. [ ] `FABRIC_EVAL_CONFIRM=I_AUTHORIZE_LIVE_LLM`
5. [ ] `FABRIC_EVAL_CONFIRM_19D=I_AUTHORIZE_LOT19D_LIVE`
6. [ ] `AI_PROVIDER=groq` + `AI_MODEL=openai/gpt-oss-120b` + clé / base URL
7. [ ] Patterns toujours en **1.2.0**
8. [ ] Dry-run OK : `npm run eval:fabric:19d:prepare`
9. [ ] Pas de déploiement / commit non autorisé

Commande LIVE (uniquement après autorisation) :

```bash
npm run eval:fabric:19d
```

---

## STATUT PRÉPARATION

| Item | Status |
|------|--------|
| Dataset 12 | **PASS** |
| Persistence design | **PASS** |
| Gates LIVE | **PASS** |
| Prompts figés v1.2.0 | **PASS** |
| LIVE exécuté | **NOT RUN** |
| **OVERALL** | **READY FOR CONTROLLED LIVE** |

---

## POINT D’ARRÊT

**La campagne LIVE n’a pas été lancée.**

Pour continuer : merci d’autoriser explicitement **au maximum 16 appels HTTP Groq** (`openai/gpt-oss-120b`) pour les **12 scénarios synthétiques** LOT 19D, avec conservation des réponses dans `tmp/lot19d-live/`.
