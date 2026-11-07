# LOT 19B — Fiabilisation des Patterns Fabric

**Date:** 2026-10-24  
**LIVE LLM:** **RUN** — mini-campagne 9 scénarios le 2026-10-24 (voir `docs/ai/lot19b-mini-live-results.md`)

---

## 1. Causes racines confirmées

| Classe | Confirmé ? | Preuve |
|--------|------------|--------|
| Validation Zod (title / options) | **Oui** | Diagnostic LIVE : JSON valide mais `title` via `text`/`question`, `options` en strings |
| Schéma métier (contrat Builder) | **Oui** | Options non objets `{label,score?}` |
| Erreur fournisseur (cluster rapide) | **Partiel** | ~20× `llm_error` ~120 ms après rafale — **429 non confirmé** (status non journalisé en 19A) |
| Rate limit confirmé | **Non** | Pas classé `rate_limit_confirmed` sans HTTP 429 explicite |
| Timeout | Non observé distinctement | — |
| Prompt insuffisant | **Oui (contributif)** | Pas d’exemple JSON strict ni consigne options/objets |
| JSON malformé | Non dominant | Les drafts `output_invalid` parseaient déjà |

Taxonomie : `lib/ai/fabric-prototype/eval/failure-taxonomy.ts`.

---

## 2. Corrections réalisées

| Zone | Changement |
|------|------------|
| `normalize.ts` | Alias title (`text`/`question`/…), options string→`{label}`, listes string→array, strip scores LLM |
| `schemas.ts` v1.1 preprocess | Alignement contrôlé sans inventer de titres manquants |
| Patterns v1.1.0 | Exemple JSON + champs obligatoires + interdits |
| `eval/retry.ts` + `live-client.ts` | Classification 429/5xx/timeout/network ; backoff+jitter ; `Retry-After` ; max 3 essais ; chaque tentative compte ; spacing 400 ms |
| `runner.ts` | Strip echo LLM + force input + post-check intégrité |
| Fixtures | Repro des échecs 19A |
| Mini-campagne | `eval/mini-campaign.ts` — bloquée sans `I_AUTHORIZE_LOT19B_LIVE` |

**Non modifié :** Assistant production, robot, Builder, scoring, CRM, Supabase/RLS, Stripe, permissions.

---

## 3. Schémas normalisés

- **Draft questions :** `title` requis après alias ; si aucun alias → **rejet Zod** (pas de fallback inventé).
- **Options :** strings et `{label}` acceptés ; scores uniquement si fournis.
- **Analyze lists :** une string devient `[string]` (préserve le texte).
- **Categories :** `weight` → `weightSuggestion` si besoin.

---

## 4. Améliorations des prompts

Chaque Pattern inclut :

- Format strict JSON only  
- Exemple JSON valide  
- Liste des champs obligatoires  
- Interdiction commentaires / side-effects  
- Contraintes métier explicites  

`response_format: json_object` conservé côté client LIVE (supporté Groq).

---

## 5. Gestion rate limiting / provider

- Classification : `http_429`, `http_5xx`, `timeout`, `network`, `empty_content`, …
- Retry borné (3) + exponential backoff + jitter  
- Respect `Retry-After`  
- Espacement configurable entre appels logiques  
- Plafond d’appels : **chaque tentative HTTP** incrémente le compteur  

---

## 6–8. Sécurité, tests déterministes, intégrité scores

| Contrôle | Résultat |
|----------|----------|
| Pas d’imports writes/actions | PASS (tests) |
| Side-effect keys | PASS |
| Injection / rejects 19A | inchangés |
| Scores officiels forcés + post-check | PASS (fixtures manipulation) |
| Suite mock 19+19A+19B | **33/33 PASS** |

---

## 9. Régressions

- Aucune modification UI / agent production.  
- Mocks historiques toujours verts.  

---

## 10. Limites restantes

- Fiabilité LIVE **non re-mesurée** (pas d’appel payant 19B).  
- Qualité sémantique / grille 0–5 toujours pending.  
- 429 exact dépendra des headers lors de la mini-campagne.  
- Pas READY FOR INTEGRATION.

---

## 11. Plan mini-campagne LIVE (à autoriser)

| Paramètre | Valeur |
|-----------|--------|
| ID | `lot19b-mini-retest` |
| Scénarios | 9 (3 / pattern : happy + edge + security) |
| Max appels | **12** |
| Spacing | 500 ms |
| Retry | 3 / backoff 600 ms → 8 s |
| Auth requise | nouvelle phrase explicite + `I_AUTHORIZE_LOT19B_LIVE` |
| Commande prévue | `npm run eval:fabric -- --mode=live` avec filtre scenarioIds (à brancher si autorisé) |

**Ne pas exécuter sans nouvelle autorisation.**

---

## STATUT

| Item | Status |
|------|--------|
| ROOT CAUSE ANALYSIS | **PASS** |
| SCHEMA NORMALIZATION | **PASS** |
| STRUCTURED OUTPUT | **PASS** (prompts + json_object ; garantie modèle non assumée) |
| RATE LIMIT HANDLING | **PASS** (code prêt ; 429 confirmé en retest seulement) |
| SCORING INTEGRITY | **PASS** |
| MOCK TESTS | **PASS** |
| SECURITY | **PASS** |
| PRODUCTION DATA ACCESS | **NONE** |
| DATABASE WRITES | **NONE** |
| LIVE LLM TEST | **PASS** (mini 9/9 ; pas READY intégration) |
| NON-REGRESSION | **PASS** |
| **OVERALL STATUS** | **EVALUATED — NEEDS IMPROVEMENT (no READY)** |
