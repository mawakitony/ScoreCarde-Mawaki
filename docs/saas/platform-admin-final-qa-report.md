# Rapport final QA — WOLOYEM Platform Admin

**Date :** 2026-10-30  
**Périmètre :** local / staging uniquement · MFA non contournée · ScorApp-XP non touché · aucun commit / déploiement

## Verdict global

| Domaine | Résultat |
|---------|----------|
| Typecheck | **PASS** |
| ESLint (`app/platform`, `components/platform`, `lib/platform`) | **PASS** |
| Build `next build` | **PASS** |
| Unitaires platform (32) | **PASS** (1 test aligné sur libellés FR) |
| Playwright access + UI | **BLOCKED** (binaire Chromium Playwright absent dans le cache sandbox) |
| Captures authentifiées overview/listes | **BLOCKED** (porte MFA AAL2 — intervention humaine) |
| MFA AAL2 sur routes data | **PASS** (seul `/platform/security/mfa` skip volontaire) |
| Exactitude financière (pas de 0 $ inventé) | **PASS** (revu code) |
| Support mode « Viewing tenant » | **FAIL** (P0 — UI trompeuse) |

**Synthèse :** la plateforme est **prête pour usage staging** côté build/qualité de code et garde-fous MFA/RBAC de base, avec **1 défaut P0** (mode support) et plusieurs **P1/P2** UX/RBAC. Les validations navigateur automatisées et captures authentifiées restent **bloquées**.

---

## Matrice des contrôles exécutés

| Contrôle | Commande / méthode | Statut |
|----------|-------------------|--------|
| Typecheck | `npx tsc --noEmit` | PASS |
| ESLint | scoped platform paths, `--max-warnings 0` | PASS |
| Build | `npx next build` | PASS |
| Unitaires | `platform` + mix + range + financial + reminders | PASS 32/32 |
| Playwright | `saas-platform-access` + `saas-platform-ui` | BLOCKED (Chromium manquant) |
| Audit code MFA/RBAC/isolation | revue `auth.ts`, `mfa.ts`, `permissions.ts`, pages | voir findings |
| Boutons factices / href `#` | scan pages platform | aucun CTA mort trouvé |
| Filtres non branchés | revue listes vague 1–2 | aucun filtre UI « décoratif » trouvé |

Correctifs QA mineurs effectués pendant l’audit (hors refonte) :
- Test libellés FR (`lib/platform/reminders.test.ts`).
- `mfa-client` : `router.replace` à la place de `window.location.href` (lint Next).

---

## Findings classés par priorité

### P0 — Critiques

| ID | Problème | Impact | Preuve |
|----|----------|--------|--------|
| P0-1 | **Mode support : bannière « Viewing {org} » alors que le dashboard reste sur l’org de l’admin** | Isolation multi-entreprises trompeuse ; risque d’erreur opérationnelle | `startSupportSession` pose un cookie ; `app/dashboard/layout.tsx` affiche le nom de session mais les données passent encore par `ensureMembership()` (org admin). La redirection post-support envoie vers `/platform`, pas dans le tenant. |

### P1 — Importants

| ID | Problème | Impact | Preuve |
|----|----------|--------|--------|
| P1-1 | Support : scoping réel **uniquement** sur fiche org `[id]` ; listes/exports platform restent globaux (service role) | Pendant une session support, l’admin voit encore tout le parc | `[id]/page.tsx` + `notFound` si autre org ; listes orgs/users/audit non filtrées par session |
| P1-2 | Colonne MFA sur `/platform/admins` **statique** (« Vérifié à la session ») | Fausse lecture d’état MFA par admin | `admins/page.tsx` |
| P1-3 | Entrée `/platform/admins` via `organizations.read` puis soft-deny | Route atteignable AAL2 par rôles non manage | Préférer `requirePlatformAdmin("platform.admins.manage")` |
| P1-4 | Playwright Chromium non installé dans l’environnement agent | Impossible de valider access/UI en CI locale agent | Erreur `chrome-headless-shell.exe` manquant |

### P2 — Mineurs / dette

| ID | Problème |
|----|----------|
| P2-1 | Shell/nav visibles sur page MFA avant AAL2 (pas de fuite data, chrome pre-gate) |
| P2-2 | Copy Paramètres : « MFA obligatoire pour le shell » — en réalité pages + actions |
| P2-3 | Nav non filtrée par rôle (liens → redirect `/dashboard` si refusé) |
| P2-4 | `platform.billing.manage` défini mais inutilisé |
| P2-5 | `checkPlatformDomain` mutatif sous permission `organizations.read` |
| P2-6 | Erreurs listes orgs/subscriptions en `<p>` rose vs `PlatformEmpty` |
| P2-7 | Champs filtres souvent sans `<label>` / `aria-label` (placeholders seuls) |
| P2-8 | Colonnes actions avec `<th>` vide |
| P2-9 | Select `encrypted_credentials` sur fiche org (affiché masqué via `credentialState` uniquement) |

### PASS confirmés

- Aucune route data `/platform` ne skip MFA hors enrollment.
- Mutations `actions/platform.ts` passent par `requirePlatformAdmin` + permissions ciblées.
- Pas de boutons `href="#"` / TODO mock métriques inventées sur overview MRR.
- Filtres listes branchés sur `searchParams` / requêtes.
- Empty states présents sur la majorité des listes premium.

---

## RBAC (rappel)

| Rôle | Capacités principales |
|------|------------------------|
| `super_admin` | Tout |
| `support` | read orgs, support, billing.read, jobs.read, audit.read |
| `operations` | read orgs, jobs.read, jobs.retry, audit.read |
| `finance` | read orgs, billing.read, audit.read |

Pages billing → `billing.read` · Jobs/intégrations → `jobs.read` · Audit → `audit.read` · reste read orgs (sauf soft-gates manage).

---

## Captures authentifiées — procédure (intervention humaine)

MFA **non contournée**. Pour valider le dashboard et les listes :

1. Démarrer le staging local : `node scripts/dev-e2e.mjs` (port 3000, projet `hznmtadobqfhumezdgbh`).
2. Ouvrir `http://localhost:3000/login` avec le compte `super_admin` staging.
3. Aller sur `/platform` → page **Sécurité plateforme — MFA**.
4. Entrer le code TOTP 6 chiffres de l’app d’authentification (ou enrôler si premier accès).
5. Une fois AAL2 OK, capturer :
   - Desktop **1440×900** viewport : `/platform?range=30`, `/platform/organizations`, `/platform/subscriptions`, `/platform/users`, `/platform/alerts`
   - Full page optionnel
   - Mobile **390×844** : mêmes URLs
6. Critères de validation visuelle :
   - Au moins un graphique principal visible au-dessus du fold sur Vue d’ensemble
   - KPI compacts (pas 10 grandes cartes)
   - Filtres + tableaux lisibles sans overflow horizontal incontrôlé
7. Optionnel après install navigateur :  
   `npx playwright install chromium`  
   puis  
   `npx playwright test tests/e2e/isolated/saas-platform-access.spec.ts tests/e2e/isolated/saas-platform-ui.spec.ts`  
   avec `PLATFORM_E2E_ADMIN_EMAIL` / `PASSWORD` dans l’env (ou `.env.e2e.local`).

---

## Recommandations d’ordre

1. **Corriger le mode support** (P0) : soit charger réellement l’org de session dans le dashboard, soit retirer/reformuler la bannière « Viewing ».
2. Durcir `/platform/admins` (P1-3) + honnêteté colonne MFA (P1-2).
3. Installer Chromium Playwright et rejouer access/UI (P1-4).
4. Traiter a11y filtres / erreurs empty (P2).

---

## Conclusion

**PASS technique** (tsc / lint / build / unitaires).  
**FAIL produit** sur le mode support (P0).  
**BLOCKED** sur Playwright agent + captures post-MFA.

La refonte UI vagues 1–2 est structurellement cohérente ; les blocages restants sont surtout **isolation support**, **honnêteté MFA admins**, et **validation navigateur**.
