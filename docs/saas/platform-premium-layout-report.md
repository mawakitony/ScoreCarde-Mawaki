# Rapport — refonte visuelle premium `/platform`

**Date :** 2026-10-29  
**Périmètre :** staging local · MFA non contournée · ScorApp-XP non touché · aucun commit

## Structure (desktop)

| Zone | Composition |
|------|-------------|
| Header | Titre compact + filtres temporels segmentés à droite |
| Cockpit | **30 %** carte Finance navy · **30 %** grille 2×3 mini-KPI (~96 px) · **40 %** area chart évolution |
| Secondaire | Panneau « Voir tous les indicateurs » (métriques hors fold) |
| Analytics | Billing **8/12** · Donut compact **4/12** (légende droite, total au centre) |
| Opérations | Expirations · Actions requises · Santé |
| Formules | Section secondaire (MRR / conversion / churn / legacy) |

## Corrections clés

- **MRR indéterminable** : affiche `— USD` + badge « Données incomplètes » (jamais `0 $`).
- **Donut %** : `attachMixPercents` (largest remainder) ; 1+1 → **50/50** ; si d’autres statuts existent (ex. annulés), ils apparaissent dans la légende et le dénominateur.
- **Graphique dominant** : évolution multi-séries (cumul orgs, essais démarrés, actifs créés) dès le cockpit.
- **Densité** : mini-KPI 85–105 px, charts ~250–280 px, gaps 12–16 px.

## Qualité

| Check | Statut |
|-------|--------|
| Typecheck | **PASS** |
| ESLint (fichiers touchés) | **PASS** |
| Unitaires mix / financial / range | **PASS** (11) |
| `next build` | **PASS** |
| Capture 1440×900 | **BLOCKED** (porte MFA) — shell capturé |
| Capture mobile 390×844 | **BLOCKED** (porte MFA) — shell capturé |
| Graphiques au-dessus du fold | **PASS** (structure) — validation visuelle overview après MFA |

## Captures

- `docs/saas/platform-premium-viewport-1440.png`
- `docs/saas/platform-premium-full.png`
- `docs/saas/platform-premium-mobile-390.png`

Pour valider le cockpit premium : déverrouiller MFA AAL2 puis recharger `/platform?range=30`.

## Fichiers

- `app/platform/page.tsx`
- `components/platform/kpi-cluster.tsx`
- `components/platform/platform-charts.tsx`
- `components/platform/range-filter.tsx`
- `components/platform/page-chrome.tsx`
- `lib/platform/mix.ts` (+ tests)
- `lib/platform/series-types.ts`
- `lib/platform/overview-series.ts` / `metrics.ts`
- `app/globals.css` (fond ambient platform)
