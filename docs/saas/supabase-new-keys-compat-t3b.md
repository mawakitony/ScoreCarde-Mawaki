# Tâche 3b — Compatibilité clés Supabase `sb_publishable_` / `sb_secret_`

**Date :** 2026-11-14  
**Périmètre :** lecture + correctifs code locaux. **Aucun secret affiché. Aucun redeploy. Aucune modif Vercel.**

Noms d’env **conservés** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_*`.

---

## 1. Versions packages

| Package | Installé | Support `sb_*` |
|---------|----------|----------------|
| `@supabase/supabase-js` | **2.116.0** | **OUI** — bundle contient `sb_publishable` / `sb_secret` ; comment SDK : *new-format keys are not JWTs and must never be sent as Bearer — `apikey` only* |
| `@supabase/ssr` | **0.12.7** | **OUI** (délègue à `supabase-js`) |

**Mise à jour :** non requise pour accepter les nouvelles clés.  
Optionnel plus tard : suivre les releases supabase-js pour Edge Functions `verify_jwt` / `@supabase/server` (hors scope app actuelle — **aucune** Edge Function dans ce repo).

---

## 2. Inventaire `Authorization: Bearer` + service key

| Emplacement | Usage | Risque `sb_secret_` |
|-------------|-------|---------------------|
| `lib/supabase/{client,server,proxy,admin}.ts` | `createClient(url, key)` | **OK** — SDK gère `apikey` |
| Scripts admin / e2e (`createClient`) | idem | **OK** |
| `actions/import-questions.ts` | Bearer vers **ScoreApp** API | Hors sujet Supabase |
| Avatars Google/Microsoft | Bearer OAuth | Hors sujet |
| Cron docs / routes | Bearer `CRON_SECRET` | Hors sujet |
| Migrations SQL | `grant … to service_role` (rôle Postgres) | **OK** — pas une API key HTTP |
| `pg_net` / Database Webhooks / Edge Functions | **Aucun** dans ce repo | N/A — à surveiller si ajoutés plus tard |

**Correctif Bearer app :** aucun requis.

---

## 3. Code qui traitait les clés comme JWT

| Fichier | Avant | Après |
|---------|-------|-------|
| `scripts/check-env.mjs` | Ne décodait pas JWT (URL only) | Log **format** (`sb_publishable` / `sb_secret` / `legacy_jwt` / …) sans valeur |
| `lib/supabase/key-format.ts` | — | **Ajouté** : `classifySupabaseKey` |
| `scripts/saas-e2e-connectivity-probe.mjs` | Hint « prefer legacy JWT if sb_secret rejected » | Hint aligné SDK ≥2.110 + `sb_secret_` |
| Docs / checklist rotation | Mentions JWT only | Mis à jour vers publishable/secret |
| Redaction (`lib/platform/dto.ts`, AI security) | `service_role` only | + `sb_secret_` / `sb_publishable_` |

Aucun script runtime du repo ne décode le payload JWT des clés API pour autoriser l’accès (les audits agent one-shot ne sont pas dans le chemin app).

---

## 4. Correctif lié à la rotation (chiffrement)

`lib/email/worker.ts` utilisait **uniquement** `SUPABASE_SERVICE_ROLE_KEY` comme matériau de déchiffrement (`enc:…`).  
Avec un passage JWT → `sb_secret_`, les payloads scellés avec l’ancienne clé casseraient.

**Correctif T3b (temporaire) :** tenter `INTEGRATIONS_SECRET` puis `SUPABASE_SERVICE_ROLE_KEY`.  
**T3d :** repli service_role **supprimé** ; seal/HMAC/credentials = HKDF(`INTEGRATIONS_SECRET`). Définir le secret avant redeploy / rotation.

---

## 5. PASS / FAIL

| Critère | Résultat |
|---------|----------|
| supabase-js / ssr supportent `sb_*` | **PASS** (2.116.0 / 0.12.7) |
| Pas de Bearer manuel service_role dans l’app | **PASS** |
| Adaptations format clé (check-env, redaction, hint) | **PASS** |
| Noms de variables inchangés | **PASS** |
| Pas de redeploy / pas de secret loggé | **PASS** |
| Upgrade package obligatoire | **FAIL non applicable** — non nécessaire |

**Verdict T3b : PASS** — prêt à coller `sb_publishable_…` / `sb_secret_…` dans les **mêmes** variables env (local + Vercel) lors de la rotation (`OUI-ROTATE` / saisie manuelle).
