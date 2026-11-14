# Tâche 3d — Découpler secrets applicatifs de `service_role`

**Date :** 2026-11-14  
**Périmètre :** code uniquement — aucun secret généré/affiché, aucun redeploy, aucun `--apply`.

---

## Verdict : **PASS** (code)

| Critère | Résultat |
|---------|----------|
| Seal first-access + cookie HMAC via `INTEGRATIONS_SECRET` (HKDF) | **PASS** |
| Repli `SUPABASE_SERVICE_ROLE_KEY` retiré du worker email | **PASS** |
| Erreur explicite si secret absent / trop court | **PASS** |
| `check-env` bloquant (longueur/format only) | **PASS** (FAIL attendu tant que non renseigné) |
| Script re-encrypt `--dry-run` only | **PASS** (`--apply` refusé) |
| Tests unitaires seal / HMAC / échec propre | **PASS** (13/13 ciblés) |
| `.env.example` + checklist | **PASS** |
| Aucun redeploy / aucune valeur secrète loggée | **PASS** |

**Ops restant (hors T3d code) :** générer et poser `INTEGRATIONS_SECRET` en local + e2e + Vercel Prod/Preview **avant** `npm run dev` / prebuild / redeploy.

---

## Changements

| Fichier | Rôle |
|---------|------|
| `lib/security/app-secret.ts` | `readIntegrationsSecret`, HKDF labels `first-access-seal` / `first-access-cookie` / `integrations` |
| `actions/first-access.ts` | `sealKey` / `cookieKey` — plus de `SUPABASE_SERVICE_ROLE_KEY` |
| `lib/email/worker.ts` | unseal HKDF seal only ; `last_error=INTEGRATIONS_SECRET_*` si absent |
| `actions/integrations.ts`, `lib/integrations/worker.ts`, `lib/reports/queue.ts` | credentials via HKDF `integrations` |
| `scripts/check-env.mjs` | bloquant min 32 ; log `STATUS` / `FORMAT` / `LENGTH` |
| `scripts/saas-encryption-reencrypt.mjs` | dry-run only ; staging 0 ciphertext |
| `lib/security/app-secret.test.ts` | tests dédiés |

---

## Format `INTEGRATIONS_SECRET` (à générer **toi**)

| Règle | Valeur |
|-------|--------|
| Préféré | **64 caractères hex** (32 bytes) |
| Minimum accepté | **32** caractères (opaque OK) |
| Interdit | vide, `< 32`, coller dans le chat / commits |

### Commande (Windows PowerShell) — à lancer **dans ton terminal** (pas par l’agent)

```powershell
openssl rand -hex 32
```

Puis coller le résultat **uniquement** dans :

1. `.env.local`
2. `.env.e2e.local`
3. Vercel → Secret → **Production**
4. Vercel → Secret → **Preview**

Vérifier sans afficher la valeur :

```powershell
node scripts/check-env.mjs
```

Attendu : `INTEGRATIONS_SECRET_STATUS=ok FORMAT=hex64 LENGTH=64`

---

## Dry-run re-encrypt (T3d)

```
HOST=hznmtadobqfhumezdgbh.supabase.co
SCANNED=0
WOULD_REECRYPT_FROM_SERVICE_ROLE=0
ROWS_WITH_CIPHERTEXT=0
PROBE=PASS
```

Aucune migration de données nécessaire en staging (conforme T3c).

---

## Ordre ops suivant

1. Générer / poser `INTEGRATIONS_SECRET` (4 emplacements)
2. `node scripts/check-env.mjs` → OK
3. Gate **`OUI-REDEPLOY`**
4. Puis seulement rotation Supabase (`OUI-ROTATE`)
