# WOLOYEM Score — SaaS multi-entreprises (essai 14 jours)

**Date :** 2026-10-26  
**Scope :** inscription → organisation → essai 14 j → abonnement Stripe → blocage workspace  
**Hors scope :** LOT 19 / Patterns Fabric / WOLOYEM AI / robot animé  
**Production :** non déployé — validation paiement réelle **requise** avant GO prod

---

## 1. Audit de l’existant

| Domaine | Classification |
|---------|----------------|
| Authentification (signup, confirm e-mail, login, first-access) | **EXISTANTE ET FONCTIONNELLE** |
| Création d’organisation | **EXISTANTE MAIS INCOMPLÈTE** → enrichie (pays, secteur, logo URL) |
| Membres / rôles OWNER·ADMIN·MEMBER (+ access_role) | **EXISTANTE ET FONCTIONNELLE** |
| Isolation multi-tenant + RLS | **EXISTANTE ET FONCTIONNELLE** |
| Tables abonnement / trial | **EXISTANTE MAIS INCOMPLÈTE** (naming `trial_used_at` / `trial_end`, pas `trial_started_at`) |
| Stripe Checkout + Portal | **EXISTANTE ET FONCTIONNELLE** (env requis) |
| Webhooks Stripe idempotents | **EXISTANTE ET FONCTIONNELLE** |
| Gate workspace post-essai | **À CORRIGER** → **implémentée** (layout + Server Actions) |
| Dashboard métier | **EXISTANTE ET FONCTIONNELLE** |
| Admin plateforme WOLOYEM | **EXISTANTE ET FONCTIONNELLE** |

### Mapping trial (pas de migration destructive)

| Besoin métier | Colonne réelle |
|---------------|----------------|
| Début d’essai | `organizations.trial_used_at` / `profiles.trial_used_at` |
| Fin d’essai | `subscriptions.trial_end` (UTC) |
| Statut TRIALING | `subscriptions.status = 'trialing'` |
| Protection anti-réessai | `profiles.trial_used_at` non null → nouvel org en `free/active` sans second trial |

Renommer l’entreprise **ne modifie pas** `trial_used_at` / `trial_end`.

---

## 2. Fonctionnalités réutilisées

- `create_organization` RPC (`supabase/migrations/20260921240000_saas_billing.sql`)
- `getOrganizationAccessState` / `loadEntitlements` / `DEFAULT_TRIAL_DAYS = 14`
- Stripe `startCheckout` / `openBillingPortal` / webhook `app/api/webhooks/stripe`
- RLS `is_org_member` / `has_org_role`
- Platform admin orgs + subscriptions

---

## 3. Fonctionnalités implémentées (ce chantier)

1. **Gate serveur centralisée** — `lib/billing/workspace-access.ts` + policy pure.  
2. **Blocage UI** — `app/dashboard/layout.tsx` : si `restricted`/`suspended` et chemin hors facturation → écran d’expiration + CTA « Activer mon abonnement ».  
3. **Blocage Server Actions** — `requireWorkspaceAccess` sur scorecards (edit), save org, invite member.  
4. **Assessments publics** — `allowNewAssessment` refuse aussi `restricted`.  
5. **Onboarding** — secteur (`use_case`), pays, logo URL optionnel.  
6. **Copy signup** alignée multi-entreprises.  
7. **Header `x-pathname`** dans le proxy session pour la gate layout.  
8. **Tests** — `lib/billing/workspace-access.test.ts` (J13 / frontière J14 / cancel / paths billing).

---

## 4. Tables / migrations

**Aucune migration destructive ajoutée.** Schema déjà présent dans `20260921240000_saas_billing.sql`.

Option future (non appliquée) : vues alias `trial_started_at` / `trial_ends_at` en lecture seule — non requises pour le fonctionnement.

---

## 5. Parcours d’inscription

1. `/signup` → compte Supabase (+ confirm e-mail si pas de session).  
2. `/auth/callback` → session.  
3. `/onboarding` → nom, slug, secteur, pays, logo URL → RPC `create_organization` → OWNER + trial 14 j.  
4. `/dashboard` privé.

---

## 6. Essai 14 jours

- Calcul serveur UTC : `trial_end = now() + 14 days` à la création.  
- Pas de carte bancaire.  
- Pas de prolongation à la connexion.  
- Un essai par compte (`profiles.trial_used_at`).  
- Accès tant que `status=trialing` **et** `now < trial_end`.

---

## 7. Abonnement mensuel

- Stripe Billing existant ; prix via `STRIPE_PRICE_*` (montants **non inventés** dans le code).  
- Checkout + Customer Portal.  
- Webhooks vérifiés + `stripe_events` idempotents.  
- Redirect Checkout **≠** preuve de paiement (état via webhook).  
- **Ne pas activer les paiements live** sans validation préalable.

---

## 8. Protection des espaces expirés

| État | Workspace métier | Facturation |
|------|------------------|-------------|
| TRIALING non expiré | OK | OK |
| ACTIVE | OK | OK |
| PAST_DUE dans grâce (`grace_period`) | OK | OK |
| Trial expiré / unpaid / canceled hors période | **BLOQUÉ** | OK (`/dashboard/settings/billing`) |
| Suspension plateforme | BLOQUÉ | message maintenance |

Message produit : voir `TRIAL_EXPIRED_MESSAGE`.

---

## 9. Résultats des tests

Exécuter localement :

```bash
node --experimental-strip-types --import ./test/register.mjs --test lib/billing/billing.test.ts lib/billing/workspace-access.test.ts
npm run typecheck && npm run lint && npm run build
```

| Suite | Résultat |
|-------|----------|
| `billing.test.ts` + `workspace-access.test.ts` | **PASS** |
| Typecheck | **PASS** |
| Lint | **PASS** (0 errors ; warnings scripts préexistants) |
| Build | **PASS** |

**Non déclaré prêt production** : E2E + Stripe test + webhook staging encore requis.  
Rapport détaillé (2026-10-26) : [saas-production-readiness.md](./saas-production-readiness.md) → **NOT READY FOR PRODUCTION**.

---

## 10. Configurations Stripe nécessaires

```
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_PRICE_STARTER_MONTHLY=price_…
STRIPE_PRICE_PRO_MONTHLY=price_…
STRIPE_PRICE_BUSINESS_MONTHLY=price_…
# optionnels yearly / tax
```

Webhook endpoint : `/api/webhooks/stripe`  
Mode test uniquement jusqu’à validation métier.

---

## 11. Étapes restantes avant production

1. E2E manuel : signup → org → J+14 simulé → lock → Checkout test → unlock.  
2. Configurer prix Stripe + webhook Vercel.  
3. Valider e-mails confirm + trial_ending.  
4. Revue sécurité RLS en staging.  
5. Décision commerciale du tarif mensuel (externe au code).  
6. **Ne pas** déclarer prêt prod sans E2E + paiement test validés.

**LOT 19 / Fabric :** non touchés.  
**GO production SaaS :** **NON** tant que l’étape 1–5 n’est pas faite.
