# Rapport — refresh UI Platform Admin

**Date :** 2026-10-28  
**Périmètre :** local + staging (`hznmtadobqfhumezdgbh`) · ScorApp-XP non modifié · aucun déploiement · MFA/RBAC inchangés

## Verdict

| Item | Statut |
|------|--------|
| Shell / design system aligné dashboard entreprise | **PASS** |
| MFA AAL2 + RBAC conservés | **PASS** (gate inchangée) |
| MRR « USD indisponible » | **PASS** (cause + correctif feeder) |
| Formules conversion / churn | **PASS** (audit ; formules **inchangées**) |
| Graphiques données réelles | **PASS** (code) · **BLOCKED** captures overview (MFA) |
| Responsive desktop / mobile | **PASS** (shell + captures MFA) |
| Tests unitaires platform | **PASS** 21/21 |
| E2E UI staging | **PASS** (shell + MFA gate) |

## MRR « USD indisponible »

**Cause :** `summarizeMrr` annule le bucket devise dès qu’une ligne a `amountCents: null`.  
`PLANS.pro` / `business` / `enterprise` ont `monthlyPrice: null`. Les passer dans le feeder annulait tout le MRR USD.

**Correction :** le feeder (`lib/platform/metrics.ts`) n’envoie que les abo `active` hors free/internal **avec** prix catalogue connu ; les autres → `mrrMeta.skippedMissingCataloguePrice`.  
`summarizeMrr` **non modifié**.

**Staging dump** (`node scripts/saas-platform-metrics-dump.mjs`, fenêtre 30 j) :

- activePaid=1 plan=`pro` → skipped=1, included=0 → **0.00 USD** (plus « indisponible »)
- Sans le skip feeder, `summarizeMrr` aurait encore poisonné USD → null

## Conversion 93,3 % / désabonnement 87,5 %

**Aucun changement de formule** (pas d’erreur arithmétique).

| Métrique | Formule | Staging 30 j |
|----------|---------|--------------|
| Conversion | `paid / (trialing_stock + paid)` | 14 / 15 = **93,3 %** |
| Désabonnement | `cancels / (activePaid_stock + cancels)` | 7 / 8 = **87,5 %** |

- Numérateur conversion : audit `subscription.created` \| `upgraded` (fenêtre)
- Numérateur churn : audit `subscription.canceled` (fenêtre)
- Dénominateurs : **stock actuel** + numérateur (hybride stock+flux, pas cohortes)

Affichage UI : numérateur, dénominateur, labels, fenêtre, note — section « Revenus & formules (audit) ».

## UI livrée

- Shell : groupes Pilotage / Opérations / Gouvernance, icônes Lucide, sheet mobile, tokens brand
- Overview : `KpiCard`, formules audit, charts Recharts (thème dashboard)
- Pages listes : `ws-panel`, `StatusBadge` (entreprises, paiements, expirations, notifications, alertes)

## Captures

| Fichier | Contenu |
|---------|---------|
| `docs/saas/platform-ui-before-overview-mfa.png` | Avant — sidebar texte plat + enroll MFA |
| `docs/saas/platform-ui-after-desktop.png` | Après — sidebar groupée + icônes + verify MFA |
| `docs/saas/platform-ui-after-mobile.png` | Après — header + menu hamburger + MFA |

Captures KPI/graphiques/tableaux overview : **BLOCKED** tant que AAL2 n’est pas saisi en session E2E (volontaire — MFA non contournée).

## Tests exécutés

```bash
node --experimental-strip-types --import ./test/register.mjs --test lib/platform/platform.test.ts lib/platform/reminders.test.ts
# → 21 pass

npx playwright test tests/e2e/isolated/saas-platform-ui.spec.ts
# → 1 passed (shell desktop + mobile)

node scripts/saas-platform-metrics-dump.mjs
# → staging metrics JSON (ci-dessus)
```

## Non fait (volontaire)

- Déploiement / push / commit secrets
- Modification ScorApp-XP
- Contournement MFA pour captures overview
- Changement des formules conversion/churn
