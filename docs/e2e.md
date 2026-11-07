# Environnement E2E isolé (Lot 7)

Objectif : valider les parcours authentifiés Playwright **sans** toucher à la base de développement/production.

## Prérequis

1. Un projet Supabase **distinct** (Dashboard → New project).
2. Migrations du dépôt appliquées sur ce projet uniquement.
3. Fichier local `.env.e2e.local` (non versionné) basé sur `.env.e2e.example`.
4. Serveur Next démarré avec ces variables (l’app sous test pointe vers le projet E2E).

## Étapes manuelles Dashboard Supabase

1. Créer un projet nommé par ex. `woloyem-score-e2e` (région au choix).
2. Project Settings → API : copier Project URL, `anon` key, `service_role` key dans `.env.e2e.local`.
3. Authentication → Providers : Email activé ; désactiver la confirmation email pour les comptes de test si besoin.
4. SQL / CLI : appliquer **toutes** les migrations de `supabase/migrations/` dans l’ordre (Supabase CLI `db push` ou SQL Editor).
5. Ne pas importer de dump production. Ne pas désactiver RLS.
6. Noter l’URL du projet **réel/dev** dans `E2E_PROTECT_SUPABASE_URL` (celle qu’il ne faut jamais seed).

## Variables requises

| Variable | Rôle |
|---|---|
| `E2E_BASE_URL` | Origine Playwright (`http://localhost:3000`) |
| `E2E_SUPABASE_URL` | Projet E2E |
| `E2E_SUPABASE_ANON_KEY` | Anon du projet E2E |
| `E2E_SUPABASE_SERVICE_ROLE_KEY` | Service role E2E (seed uniquement) |
| `E2E_PROTECT_SUPABASE_URL` | Projet réel/dev à protéger |
| `E2E_PREFIX` | `E2E-WOLOYEM-<digits>` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Doit être égal** à `E2E_SUPABASE_URL` pendant les runs isolés |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Clés du projet E2E |

Garde-fou code : `e2eIsolatedAllowed()` / `e2eIsolatedBlockReason()` dans `lib/env.ts`.

## Commandes

```bash
# Vérifie la config sans secrets ni écriture
node scripts/e2e-check-config.mjs

# Seed fixtures synthétiques (refuse si isolation invalide)
node scripts/e2e-seed.mjs

# Playwright isolé (skip auto si non prêt)
npm run test:e2e:isolated
```

## Données

Fixtures préfixe `E2E_PREFIX` : org, owner/admin/viewer, scorecard brouillon, questions, leads fictifs `@example.com`, abonnement `manual` (pas de Checkout). Nettoyage via `node scripts/e2e-cleanup.mjs`.

## Interdits

- Seed sur `E2E_PROTECT_SUPABASE_URL`
- `sk_live_`
- Copie de leads / PII réels
- Contournement RLS
- Marquer PASS un scénario skippé

## Lot 8H — Digital Experience (authentifié)

Parcours Playwright : `tests/e2e/isolated/lot8h-digital-experience.spec.ts`

1. Connexion owner (fixtures isolées)
2. `/dashboard/templates` → Utiliser **Digital Experience**
3. Builder landing : titre, highlight, sous-titre, CTA, couleurs, image URL
4. Autosave + reload → persistance
5. Preview Desktop / Mobile
6. Publication + page publique `/s/{slug}` en session anonyme
7. Catalogue intact (autres thèmes présents)
8. Cleanup scorecard créée + fixtures

```bash
node --experimental-strip-types --import ./test/register.mjs scripts/e2e-check-config.mjs
# STATUS=READY requis avant :
npm run test:e2e:isolated -- tests/e2e/isolated/lot8h-digital-experience.spec.ts
```

Si `.env.e2e.local` est absent → le spec est **skippé** (`BLOCKED`), jamais marqué PASS.

## Lot 8I — Configuration isolée (checklist humaine)

Le dépôt **ne peut pas** créer le projet Supabase E2E à votre place (compte cloud + secrets).

### A. Projet Supabase E2E (obligatoire)

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project** (ex. `woloyem-score-e2e`).
2. Ne pas cloner / importer la base de développement ou production.
3. Project Settings → API : noter Project URL, `anon` `public`, `service_role` (secret).
4. Authentication → Providers → Email **ON** ; pour les tests, désactiver « Confirm email » (ou confirmer via service role — le seed le fait déjà).
5. Appliquer **toutes** les migrations `supabase/migrations/` (15 fichiers) via `supabase db push --project-ref <ref>` ou SQL Editor dans l’ordre chronologique.
6. Ne **pas** désactiver RLS. Ne **pas** coller un dump prod.

### B. Fichier local

```bash
node scripts/e2e-prepare-scaffold.mjs
# ou : copy .env.e2e.example .env.e2e.local
```

Remplir dans `.env.e2e.local` (jamais commit) :

| Variable | Remplir avec |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet **E2E** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon du projet **E2E** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role du projet **E2E** |
| `E2E_SUPABASE_URL` | **identique** à `NEXT_PUBLIC_SUPABASE_URL` |
| `E2E_SUPABASE_ANON_KEY` | anon E2E |
| `E2E_SUPABASE_SERVICE_ROLE_KEY` | service_role E2E |
| `E2E_PROTECT_SUPABASE_URL` | URL du projet **dev actuel** (prérempli par le scaffold) |
| `E2E_BASE_URL` | `http://localhost:3000` |
| `E2E_PREFIX` | `E2E-WOLOYEM-<digits>` (prérempli) |

Contraintes code (`e2eIsolatedAllowed`) :

- `E2E_SUPABASE_URL` ≠ `E2E_PROTECT_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL` = `E2E_SUPABASE_URL`
- pas de `sk_live_`

### C. Démarrer l’app sur le projet E2E

Le serveur Next doit charger `.env.e2e.local` (pas seulement `.env.local` de dev). Exemple PowerShell :

```powershell
# Arrêter le next pointant vers le projet protégé, puis :
Get-Content .env.e2e.local | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k,$v = $_.Split('=',2); Set-Item -Path "Env:$k" -Value $v
}
npm run dev
```

Dans un autre terminal :

```bash
npm run e2e:check
# attendu : STATUS=READY

npm run test:e2e:isolated -- tests/e2e/isolated/lot8h-digital-experience.spec.ts
```

### D. Après les tests

```bash
node --experimental-strip-types scripts/e2e-cleanup.mjs
```

Remettre le `npm run dev` habituel sur `.env.local` (projet protégé) pour le travail quotidien.
