# WOLOYEM Score — SaaS production readiness

**Date :** 2026-10-28 (Stripe test E2E + landing commerciale)  
**Staging :** `hznmtadobqfhumezdgbh` · **Protect :** ScorApp-XP (`zkyjaslogpdujyeysjzw`) — non touché  
**Paiements :** test Stripe uniquement · **Deploy / commit / push :** non

---

## Verdict

# READY FOR PRODUCTION REVIEW

Stripe test + parcours SaaS staging validés. Landing commerciale publique sur `/` (CTA essai 14 j → `/signup` → onboarding org). Ce n’est **pas** un go-live production (clés live, webhook Dashboard prod, Price IDs prod, pages juridiques et revue humaine restent requis).

### Landing commerciale (implémentée)

| Élément | Statut |
|---------|--------|
| `/` publique (sans login forcé) | **Oui** — `components/marketing/landing-page.tsx` |
| Hero + aperçu dashboard fictif | **Oui** |
| Démo guidée (données fictives) | **Oui** |
| Fonctionnalités / secteurs / FAQ | **Oui** (modules réellement présents uniquement) |
| Starter **10 USD / mois / organisation** | **Oui** (catalogue `PLANS.starter.monthlyPrice = 10`) |
| CTA → `/signup` puis onboarding org + essai 14 j | **Oui** (mécanismes SaaS existants, non reconstruits) |
| Politique / CGU | **Manquant** — footer n’invente pas de documents |
| Parcours cosmétiques bout-en-bout (staging) | **7 PASS** — voir `docs/saas/cosmetics-customer-journey-report.md` |

---

## Rapport final (checklist mission)

| Critère | Résultat |
|---------|----------|
| Configuration Stripe | **READY** (test uniquement : `sk_test_` / `pk_test_` / `price_` / `whsec_`) |
| Webhook | **PASS** (`stripe listen` → `/api/webhooks/stripe`, signature OK, HTTP 200) |
| Checkout | **PASS** (Checkout hébergé test + carte `4242…`) |
| Abonnement mensuel | **PASS** (Starter monthly test Price) |
| Déblocage après paiement | **PASS** (essai expiré → payé → dashboard accessible) |
| Annulation et période de grâce | **PASS** (`cancel_at_period_end` accès conservé ; `past_due` + 8 j → lock, billing OK) |
| Isolation multi-entreprises | **PASS** (2 specs Playwright) |
| Idempotence événements Stripe | **PASS** (unitaire `rememberStripeEvent` + contrainte `stripe_events.event_id`) |

**Totaux exécutés (cette session) :**

| Suite | PASS | FAIL | SKIPPED | BLOCKED |
|-------|------|------|---------|---------|
| Playwright SaaS isolé (journey + trial + isolation + Stripe) | **10** | 0 | 0 | 0 |
| Unitaires billing / workspace-access / stripe-ready | **19** | 0 | 0 | 0 |
| `saas-stripe-prep-audit.mjs` | **DECISION=RUN_STRIPE_TEST_E2E** | — | — | — |
| `npm run typecheck` | **PASS** | | | |
| `npm run lint` | **PASS** (0 error ; warnings hors périmètre SaaS) | | | |
| `npm run build` | **PASS** | | | |

---

## 1. Audit intégration Stripe (existante)

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Client | `lib/billing/stripe.ts` | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` |
| Checkout | `actions/billing.ts` → `startCheckout` | Session + `metadata.organization_id` |
| Portal | `actions/billing.ts` → `openBillingPortal` | Customer Portal |
| Price map | `lib/billing/plans.ts` | `STRIPE_PRICE_*` |
| Webhook | `app/api/webhooks/stripe/route.ts` | Signature + idempotence + merge anti-race |
| Apply | `lib/billing/stripe-apply.ts` | Sync plan/status ; Checkout → `active` |
| Lock | `getOrganizationAccessState` + layout | Trial / active / grâce 7 j / restricted |

Endpoint : **`/api/webhooks/stripe`**

Cibles : staging Supabase uniquement · clés Stripe **test** uniquement.

---

## 2. Variables Stripe (noms / préfixes uniquement — aucun secret)

| Variable | État |
|----------|------|
| `STRIPE_SECRET_KEY` | **TEST** (`sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | **SET** (`whsec_`, Stripe CLI listen) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **TEST** (`pk_test_`) |
| `STRIPE_PRICE_STARTER_MONTHLY` | **SET** (`price_`) |
| `STRIPE_PRICE_PRO_MONTHLY` | MISSING_OPTIONAL |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | MISSING_OPTIONAL |

`stripeTestModeReady=true` · `DECISION=RUN_STRIPE_TEST_E2E`  
Produit test : WOLOYEM Score — Starter · tarif mensuel test.

---

## 3. Corrections effectuées (périmètre SaaS/Stripe)

1. **Race webhooks Checkout / `subscription.created` / `invoice.paid`**  
   - `applyStripeEvent` : Checkout payé → `active` ; `invoice.paid` active aussi depuis `trialing` ; `preferBillingStatus` évite la régression `active` → `trialing`.  
   - Webhook route : re-lecture + merge avant upsert ; **ne jamais écrire `null`** sur `provider_*_id` (évite l’effacement concurrent de l’id d’abonnement).  
   - Factures : extraction `subscriptionId` / `customerId` pour enrichir l’apply.
2. **E2E** : `tests/e2e/isolated/saas-stripe.spec.ts` (Checkout 4242, cancel_at_period_end, past_due + grâce).  
3. **Config locale** : `STRIPE_PRICE_STARTER_MONTHLY` résolu en `price_…` ; `STRIPE_WEBHOOK_SECRET` via Stripe CLI listen (sans login interactif grâce à `sk_test_`).  
4. Next redémarré via `scripts/dev-e2e.mjs` pour charger `.env.e2e.local` (staging + Stripe test).

Hors scope (non modifié) : Fabric / LOT 19, assistant AI, scoring métier, ScorApp-XP, migrations SQL, production Vercel.

---

## 4. Blocages restants (avant go-live réel)

- Clés / Price IDs / webhook endpoint **production** non configurés (volontaire).  
- Price Pro / Business optionnels absents en E2E.  
- Webhook prod doit pointer vers l’URL déployée (pas `stripe listen`).  
- Revue humaine pricing, taxes, Customer Portal branding, emails `payment_failed`.

---

## 5. Décision

| Critère | Validé ? |
|---------|----------|
| Staging + isolation E2E | Oui |
| Stripe **test** configuré | Oui |
| Checkout / webhook / unlock E2E | Oui (exécutés) |
| Cancel + grâce | Oui (E2E + unitaires) |
| ScorApp-XP intact / pas de deploy / pas de paiement réel | Oui |

**READY FOR PRODUCTION REVIEW :** **oui**  
**READY FOR PRODUCTION (go-live) :** **non** — reste la bascule live + revue ops  
**NOT READY FOR PRODUCTION :** non (pour la revue staging/test)
