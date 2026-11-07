# Rapport correctifs P0/P1/P2 — Platform Admin

**Date :** 2026-10-30  
**Périmètre :** local / staging `hznmtadobqfhumezdgbh` · MFA non contournée · aucun commit / déploiement · ScorApp-XP non touché

## Verdict sécurité Platform Admin

**GO conditionnel (staging)** — le P0 support trompeur est corrigé ; le scope support serveur est appliqué ; MFA AAL2 et RBAC ne sont pas affaiblis.

Bloquants restants pour un **GO produit navigateur complet** : captures post-MFA (TOTP humain) et tests e2e `super_admin` / UI premium (credentials + AAL2).

---

## Problèmes corrigés

### P0
| ID | Correctif |
|----|-----------|
| P0-1 | Bannière dashboard : plus de « Viewing {org} ». Message honnête : le dashboard client reste sur l’org admin ; lien vers la fiche Platform Admin. |
| P0-1 | Ouverture support → reste sur `/platform/organizations/{id}` (pas `/platform` global). |
| P0-1 | Shell Platform : « session limitée à {org} », listes/exports filtrés, pas d’impersonation RLS. |

### P1
| ID | Correctif |
|----|-----------|
| P1-1 | Scope support sur listes/exports (orgs, subs, payments, users, audit, notifications, domains, jobs, integrations, usage, expirations) + redirect overview si session ouverte. |
| P1-2 | Colonne MFA admins : `Facteur inscrit` uniquement si Auth Admin confirme un facteur `verified` ; sinon **Non vérifié**. |
| P1-3 | `/platform/admins` : `requirePlatformAdmin("platform.admins.manage")` (hard gate). |
| P1-4 | Chromium Playwright installé ; access e2e exécutable. |

### P2
| ID | Correctif |
|----|-----------|
| P2-1 | Page MFA : chrome minimal (pas de nav/sidebar). |
| P2-2 | Copy Paramètres : MFA obligatoire pour pages + actions (hors enrôlement). |
| P2-3 | Nav filtrée par permission (`platformNavForRole`). |
| P2-5 | `checkPlatformDomain` → `platform.organizations.manage`. |
| P2-6 | Erreurs listes orgs/subscriptions → `PlatformEmpty` + log serveur. |
| P2-7 | `aria-label` auto sur `PlatformField` / `PlatformSelect`. |
| P2-8 | Colonnes actions : en-tête « Actions ». |
| P2-9 | Fiche org : plus de select du ciphertext `encrypted_credentials` (présence via id seulement). |

### Non traité / ouvert
| ID | Statut |
|----|--------|
| P2-4 | `platform.billing.manage` toujours défini mais sans mutation dédiée (dette mineure). |
| Captures desktop/mobile auth | **BLOCKED** — porte MFA AAL2 (intervention humaine). |

---

## Fichiers principaux modifiés

- `app/dashboard/layout.tsx` — bannière support honnête  
- `app/platform/layout.tsx`, `components/platform/shell.tsx` — bannière + nav RBAC + MFA chrome  
- `lib/platform/support-scope.ts` (nouveau), `lib/platform/rules.ts`, `lib/platform/nav.ts`  
- `app/platform/page.tsx` + pages listes/exports Platform  
- `app/platform/admins/page.tsx`, `actions/platform.ts`  
- `app/platform/organizations/[id]/page.tsx`, `app/platform/settings/page.tsx`  
- `components/platform/page-chrome.tsx`  
- `lib/platform/platform.test.ts`  

---

## Tests

| Contrôle | Résultat |
|----------|----------|
| Typecheck `tsc --noEmit` | **PASS** |
| ESLint (platform + dashboard layout) | **PASS** |
| Build `next build` | **PASS** |
| Unitaires platform (+ mix/range/financial/reminders) | **PASS** 33 |
| Playwright `saas-platform-access` visitor + owner deny | **PASS** 2 |
| Playwright super_admin MFA gate | **SKIPPED** (pas de `PLATFORM_E2E_ADMIN_*` / MFA) |
| Playwright `saas-platform-ui` | **SKIPPED** (idem credentials MFA) |
| RBAC unitaire (rôles + nav) | **PASS** |
| Isolation support (`supportCanRead` + `constrainOrgIds`) | **PASS** |
| MFA AAL2 (revue code `requirePlatformAdmin`) | **PASS** — non désactivée |
| Captures desktop/mobile authentifiées | **BLOCKED** |

---

## Notes support / isolation

- Aucun contournement RLS : le dashboard client continue d’utiliser `ensureMembership()` (org de l’admin).
- En session support, Platform Admin ne montre que l’org de session (listes + exports + fiche).
- Un admin support sans `platform.admins.manage` / `platform.organizations.manage` ne peut ni gérer les admins ni vérifier un domaine.

---

## Captures

- Disponibles : `docs/saas/platform-access-01-visitor.png`, `platform-access-02-owner-denied.png`.
- Overview / listes premium post-AAL2 desktop+mobile : **BLOCKED** (TOTP humain, MFA non contournée).
