# Rapport — disposition compacte Vue d'ensemble

**Date :** 2026-10-29  
**Périmètre :** staging local · MFA non contournée · ScorApp-XP non touché

## Changement de structure

| Avant | Après |
|-------|--------|
| 10 grandes `KpiCard` (grille 5 cols) | 4 groupes KPI + 8 mini-métriques |
| Graphiques sous ~2 rangées de KPI | **Hero asymétrique** : Finance/Système + mini grid + **donut dès le 1er écran** |
| Hauteur KPI ~8rem chacune | Clusters ~108px, mini ~92px |
| Charts ~256–320px sous le fold | Charts 250–280px juste sous le hero |

## Disposition desktop (12 colonnes)

1. **Col 3** : clusters Finance + Système  
2. **Col 4** : grille 2×4 mini-métriques (entreprises, actifs, essais, expirations, users, scorecards, leads, réponses)  
3. **Col 5** : donut répartition abo (visible immédiatement)  
4. Rangée : évolution entreprises (3/5) + revenus (2/5)  
5. Rangée : activité + funnel  
6. Expirations + cluster Entreprises  
7. Activité cluster + santé  
8. Formules en section secondaire compacte  

## Vérifications

| Check | Statut |
|-------|--------|
| Typecheck | **PASS** |
| ESLint (fichiers touchés) | **PASS** |
| Unitaires range/financial | **PASS** |
| Capture viewport 1440×900 | **BLOCKED** (porte MFA) — shell capturé |
| Graphique au-dessus du fold | **PASS** (structure code) — validation visuelle overview après MFA |
| Playwright chromium bundle | **BLOCKED** (install) — shots via Chrome système OK pour shell |

## Fichiers

- `components/platform/kpi-cluster.tsx` (nouveau)
- `app/platform/page.tsx` (refonte layout)
- `components/platform/platform-charts.tsx` (`compact` / `embedded`)

## Captures

- `docs/saas/platform-compact-after-viewport.png` (MFA gate — shell)
- `docs/saas/platform-compact-after-full.png`
- `docs/saas/platform-compact-after-mobile.png`

Pour valider les graphiques au-dessus du fold : déverrouiller MFA puis recharger `/platform?range=30`.
