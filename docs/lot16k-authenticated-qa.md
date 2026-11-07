# LOT 16K — Authenticated visual QA (checklist)

## Statut actuel

Exécuter :

```bash
node --experimental-strip-types --import ./test/register.mjs scripts/e2e-check-config.mjs
```

Si `STATUS=NOT_CONFIGURED`, **ne pas** lancer de seed ni de QA authentifiée.

Audit LOT 16K (valeurs non secrètes) :

| Contrôle | État observé |
|---|---|
| `.env.e2e.local` présent | Oui |
| `E2E_BASE_URL` | SET (`localhost:3000`) |
| `E2E_SUPABASE_URL` | Placeholder (`your_e2e_project.supabase.co`) — **à remplacer** |
| `E2E_PROTECT_SUPABASE_URL` | SET (projet réel/dev protégé) |
| `NEXT_PUBLIC_SUPABASE_URL` = `E2E_SUPABASE_URL` | Oui (mais les deux sont placeholder) |
| `E2E_SUPABASE_ANON_KEY` | **MISSING** |
| `E2E_SUPABASE_SERVICE_ROLE_KEY` | **MISSING** |
| `E2E_PREFIX` format `E2E-WOLOYEM-<digits>` | À vérifier après édition |
| `sk_live_` | Absent (OK) |
| `e2eIsolatedAllowed()` | **false** |

## Déblocage (ordre strict)

1. Créer un projet Supabase **distinct** (jamais le projet protégé).
2. Appliquer toutes les migrations `supabase/migrations/` sur ce projet.
3. Auth → Email activé ; confirmation email désactivable pour les comptes seed.
4. Renseigner `.env.e2e.local` depuis `.env.e2e.example` :
   - `E2E_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` = URL du projet E2E
   - `E2E_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `E2E_SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
   - `E2E_PROTECT_SUPABASE_URL` = projet réel/dev (différent)
   - `E2E_PREFIX=E2E-WOLOYEM-<timestamp>`
   - Stripe : absent ou `sk_test_` uniquement
5. Relancer `scripts/e2e-check-config.mjs` → viser `STATUS=READY`.
6. Démarrer Next **avec** les variables E2E (même URL Supabase que Playwright).
7. Seed : `node --experimental-strip-types --import ./test/register.mjs scripts/e2e-seed.mjs`
8. QA :

```bash
npx playwright test tests/e2e/isolated/lot16k-authenticated-visual.spec.ts --reporter=list
npx playwright test tests/e2e/isolated/lot7-responsive.spec.ts --reporter=list
```

9. Cleanup : `scripts/e2e-cleanup.mjs`

## Interdits

- Seed / login Playwright contre `E2E_PROTECT_SUPABASE_URL`
- Contournement auth / RLS
- Checkout Stripe, invitations, publication, suppressions réelles
- Afficher ou committer des clés
- Marquer PASS un scénario skippé

## Captures attendues

Dossier `test-results/lot16k/` (gitignored) : dashboard, analytics, scorecards, builder, leads, templates, assistant, guide, settings, billing — 1440 + 390 light, sample dark, focus, reduced-motion.
