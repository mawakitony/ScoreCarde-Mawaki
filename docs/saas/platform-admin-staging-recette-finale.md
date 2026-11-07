# Recette staging finale — Platform Admin WOLOYEM

**Date :** 2026-10-30  
**Projet :** staging `hznmtadobqfhumezdgbh` · ScorApp-XP non touché · aucun déploiement / commit automatique  
**MFA AAL2 :** non contournée

## Verdict

| Domaine | Statut |
|---------|--------|
| Isolation mode support (code + durcissement) | **VALIDÉ** |
| `platform.billing.manage` | **DOCUMENTÉ** (réservé, droits non élargis) |
| Filtres / finance / RBAC (revue code) | **VALIDÉ** |
| Playwright visitor + owner non autorisé | **PASS** |
| Playwright / UI Super Admin post-MFA | **NON RÉUSSI** (non exécuté — credentials + TOTP) |
| Checklist manuelle toutes pages | **À FAIRE PAR VOUS** |

**Verdict staging technique :** prêt pour validation humaine post-MFA.  
**Verdict produit navigateur complet :** en attente de votre checklist + captures AAL2.

---

## 1. Mode support — isolation multi-entreprises

### Validé (code)

| Contrôle | Résultat |
|----------|----------|
| Dashboard client ne charge pas l’org support (`ensureMembership`) | OK — bannière honnête + lien fiche |
| Fiche org : `supportCanRead` → autre org = `notFound()` | OK |
| Listes / exports tenant filtrés par `organization_id` de session | OK |
| Vue d’ensemble → redirect fiche org en session support | OK |
| **Santé + Alertes** → redirect fiche org (ferme fuite `platform_overview` / agrégats parc) | OK (correctif recette) |
| Pas de contournement RLS | OK — service role Platform + filtre session, pas d’impersonation tenant |

### À valider manuellement

- Ouvrir support sur org A → confirmer listes = A uniquement ; URL org B → 404.
- Confirmer dashboard admin ≠ données org A.
- Quitter support → parc global rétabli.

---

## 2. Permission `platform.billing.manage`

**Décision :** rester **inutilisée** jusqu’à une vraie mutation Platform de facturation.

**Pourquoi :** aujourd’hui subscriptions/payments = lecture (`billing.read`) ; suspension = `organizations.manage` ; entitlements = `entitlements.manage`. Aucune action Platform « forcer plan / refund Stripe » n’existe.

**Garde-fous :**

- Seul `super_admin` possède la permission via `ALL`.
- `support` / `operations` / `finance` : **pas** de `billing.manage` (test unitaire étendu).
- Commentaire JSDoc dans `lib/platform/permissions.ts` — **aucun élargissement** de droits.

---

## 3. Revue filtres / graphiques / actions / finance

| Zone | Constat |
|------|---------|
| Filtres listes | Branchés sur `searchParams` / requêtes (pas décoratifs) |
| Graphiques overview | Séries réelles ; MRR via `formatCalculableMrr` / undetermined |
| Finance | Prix catalogue null → non compté / « Données insuffisantes » — pas de `0 $` inventé |
| Actions sensibles | `requirePlatformAdmin` + permission ciblée + audit |
| Nav | Filtrée par RBAC (`platformNavForRole`) |
| Admins | Hard-gate `admins.manage` ; MFA = Facteur inscrit / Non vérifié |

---

## 4. Playwright (rejeu recette)

| Test | Statut |
|------|--------|
| Visitor redirigé hors `/platform` | **PASS** |
| Org owner sans `platform_admins` refusé | **PASS** |
| Super Admin MFA gate | **SKIPPED** — pas de `PLATFORM_E2E_ADMIN_EMAIL` / `PASSWORD` |
| UI premium post-unlock | **SKIPPED** — idem |

Captures access : `docs/saas/platform-access-01-visitor.png`, `platform-access-02-owner-denied.png`.

**Règle :** les tests Super Admin / UI post-MFA ne sont **pas** considérés réussis tant qu’ils n’ont pas été exécutés avec MFA réelle.

Unitaires `lib/platform/platform.test.ts` : **15/15 PASS** (dont billing.manage réservé + nav RBAC + constrainOrgIds).

---

## 5. Checklist manuelle

Fichier : [`docs/saas/platform-admin-post-mfa-checklist.md`](./platform-admin-post-mfa-checklist.md)

Couvre toutes les pages Platform + support + RBAC + captures desktop/mobile.

---

## 6. Intervention requise (vous)

1. Connexion staging `super_admin` + TOTP AAL2.
2. Exécuter la checklist post-MFA page par page.
3. Optionnel : définir `PLATFORM_E2E_ADMIN_EMAIL` / `PASSWORD` dans `.env.e2e.local` et rejouer Playwright UI **sans** bypass MFA (si le flux e2e gère AAL2 ; sinon validation manuelle seule).
4. Captures desktop 1440×900 + mobile 390×844 (overview, orgs, subs, users, alerts).
5. Scénario support org A / org B (isolation visuelle).

---

## Fichiers touchés cette recette

- `lib/platform/support-scope.ts` — `redirectIfSupportScoped`
- `app/platform/health/page.tsx`, `app/platform/alerts/page.tsx`, `app/platform/page.tsx`
- `lib/platform/permissions.ts` — doc `billing.manage`
- `lib/platform/platform.test.ts`
- `docs/saas/platform-admin-post-mfa-checklist.md`
- `docs/saas/platform-admin-staging-recette-finale.md` (ce fichier)
