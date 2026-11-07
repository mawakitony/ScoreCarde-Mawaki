# Rapport — indicateurs financiers Platform Admin

**Date :** 2026-10-28  
**Périmètre :** local + staging (`hznmtadobqfhumezdgbh`) · ScorApp-XP non modifié · aucun déploiement · abonnements Stripe non mutés

## Verdict

| Item | Statut |
|------|--------|
| Afficher abo. prix inconnu sans les compter à 0 $ | **PASS** |
| Vérifier prix/devises Stripe test (lecture seule) | **PASS** |
| Séparer MRR calculable / non déterminable | **PASS** |
| Conversion cohorte + churn période (si données) | **PASS** |
| Afficher « Données insuffisantes » | **PASS** |
| Legacy hybrides en audit seulement (pas KPI) | **PASS** |
| Tests unitaires | **PASS** (27/27) |
| Vérification staging | **PASS** (dump) |
| ScorApp-XP / déploiement | **PASS** (non touchés) |

## Formules commerciales

### MRR calculable
- **Inclusion :** abonnements `status=active`, plan ∈ {starter, pro, business, enterprise}, avec prix résolu (catalogue **ou** `STRIPE_PRICE_*` Stripe **ou** montant de `provider_subscription_id` en lecture seule).
- **Exclusion :** prix inconnu → liste `undetermined`, **jamais** valorisé à 0 $.
- **Affichage :** montants par devise, ou **« Données insuffisantes »** s’il n’y a que des indéterminés.

### Conversion essai → payant (cohorte fermée)
- **Dénominateur :** abonnements avec `trial_end` ∈ [now − fenêtre, now] (essai clos).
- **Numérateur :** parmi ceux-ci, `status=active` et plan payant.
- **Si dénominateur = 0 :** « Données insuffisantes » (essais encore ouverts exclus).

### Churn logo (période)
- **Numérateur :** orgs **distinctes** avec audit `subscription.canceled` + `metadata.plan` payant dans la fenêtre.
- **Dénominateur :** orgs payantes au début ≈ actives créées avant la fenêtre ∪ canceled de la fenêtre.
- **Si dénominateur = 0 :** « Données insuffisantes ».

## Legacy (audit uniquement — non KPI)

| Legacy | Formule | Staging 30 j |
|--------|---------|--------------|
| Conversion hybride | `paid_events / (trialing_stock + paid_events)` | 93,3 % |
| Churn hybride | `cancel_events / (activePaid_stock + cancel_events)` | 87,5 % |

Marqués `DEPRECATED` dans l’UI section « Audit — formules legacy (non KPI) ».

## Données Stripe test (lecture seule)

| Source | Résultat |
|--------|----------|
| `STRIPE_PRICE_STARTER_MONTHLY` | **10,00 USD / month** (`price_1UVKihBkxetP9mG0bncAofnq`) |
| Autres `STRIPE_PRICE_*` | absents dans `.env.e2e.local` |
| Abonnements Stripe | 7 subs, **tous canceled**, 10,00 USD — **aucune mutation** |
| DB active payant | 1 × `pro` provider=`manual`, **sans** `provider_subscription_id`, catalogue `monthlyPrice=null` → **non déterminable** |

## Résultats staging (fenêtre 30 j)

| Indicateur | Résultat | Données |
|------------|----------|---------|
| MRR calculable | **Données insuffisantes** | 0 inclus, 1 indéterminé (`pro` manual) |
| Conversion cohorte | **Données insuffisantes** | 0 essai clos (`trial_end` futur) |
| Churn période | **100,0 %** | 1 org distincte canceled / base 1 |
| Legacy conversion | 93,3 % | audit only |
| Legacy churn | 87,5 % | audit only |

## Tests

```bash
node --experimental-strip-types --import ./test/register.mjs --test \
  lib/platform/platform.test.ts \
  lib/platform/reminders.test.ts \
  lib/platform/financial-metrics.test.ts
# → 27 pass

node scripts/saas-platform-metrics-dump.mjs
# → JSON staging ci-dessus
```

## Fichiers principaux

- `lib/platform/financial-metrics.ts` — formules pures
- `lib/platform/metrics.ts` — agrégation + résolution Stripe lecture seule
- `app/platform/page.tsx` — KPI commerciaux + section audit legacy
- `docs/saas/platform-financial-metrics-report.md` — ce rapport
