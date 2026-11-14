# Audit complet du projet WOLOYEM Score

**Date audit :** 2026-11-09  
**Repo :** https://github.com/mawakitony/ScoreCarde-Mawaki (`main` @ `753437e`)  
**Staging Supabase :** `hznmtadobqfhumezdgbh`  
**Protect (non touché) :** ScorApp-XP `zkyjaslogpdujyeysjzw`  
**Stack :** Next.js 16.3.5 · React 19.2.8 · Supabase · Stripe · Brevo

Canvas interactif : ouvrir `woloyem-project-audit.canvas.tsx` à côté du chat.

---

## Verdict global

| Pilier | Verdict |
|--------|---------|
| Produit client (scorecards / CRM / dashboard) | **LIVRÉ** |
| SaaS multi-tenant + essai 14 j + Stripe TEST | **READY FOR PRODUCTION REVIEW** (pas go-live live) |
| Platform Admin | **GO conditionnel staging** (checklist MFA humaine restante) |
| Confirmation e-mail Auth (signup réel) | **BLOCKED** (`SMTP_SEND_FAILED`) |
| Assistant IA Fabric (LOT 19) | **NO-GO / PENDING** (revue humaine + C4 LIVE) |
| Déploiement Vercel public | **EN COURS** (auth à finaliser) |

**Synthèse :** le code métier et Platform Admin sont poussés sur ScoreCarde-Mawaki. La boucle « nouvelle entreprise → confirm e-mail → org → dashboard » reste bloquée côté SMTP Auth staging. Vercel nécessite une config Auth/URL correcte.

---

## 1. Ce qui a été fait (par domaine)

### 1.1 Produit client
- Landing `/` + `/pricing` (Starter 10 USD/mois / org)
- Auth UI `/login` `/signup` `/onboarding` `/invite` `/first-access`
- Dashboard : overview, scorecards, leads, analytics, settings, templates, guide
- Builder scorecard (questions, scoring, publish, versioning, thèmes)
- Parcours public `/s/[slug]` → lead → résultat
- Assistant (`/dashboard/assistant`) + prototype Fabric (LOT 19 docs)

### 1.2 SaaS multi-tenant & billing
- Création org RPC `create_organization` + owner + essai **14 j** serveur
- `trial_used_at` anti-renouvellement abusif
- Workspace lock / billing restricted
- Stripe TEST : Checkout, webhook idempotent, portal, past_due / grâce
- Isolation multi-entreprises (Playwright)
- Parcours cosmétiques : **7 PASS** (avec confirm admin si SMTP bloqué)

### 1.3 Platform Admin
- Shell premium, overview KPI/charts, 16+ pages
- MFA AAL2 (hors page enroll)
- RBAC (`support` / `operations` / `finance` / `super_admin`)
- Mode support : bannière honnête, listes/exports scopés, redirect overview/health/alerts
- Correctifs P0/P1/P2 (MFA admins honnête, hard-gate admins, a11y, erreurs UX)
- `billing.manage` documenté réservé (pas d’élargissement)
- Playwright access visitor + owner deny **PASS** ; Super Admin MFA **SKIPPED**

### 1.4 E-mail
- Canal B Brevo API (`BREVO_*`) : **SET** pour `email_jobs`
- Canal A Supabase Auth SMTP : **FAIL** envoi confirmation (`Error sending confirmation email`)
- Docs : `docs/saas/brevo-staging-setup.md` + audits

### 1.5 Ops / Git / Vercel
- Remote basculé de ScorApp-XP → **ScoreCarde-Mawaki**
- Commit massif Platform/SaaS poussé
- Vercel CLI + plugin + MCP configurés (`mawakitony`)
- Projet Vercel `score-carde-mawaki` : env en place, auth login à corriger (APP_URL Config, redirects Supabase, `CRON_SECRET`)

---

## 2. Matrice des validations

| Suite | Résultat documenté |
|-------|-------------------|
| Typecheck / lint / build (sessions Platform) | PASS |
| Unitaires platform / billing / stripe-ready | PASS |
| Playwright Platform access (visitor, owner) | PASS |
| Playwright Platform UI Super Admin | SKIPPED |
| Playwright SaaS isolé (Stripe/trial/isolation) | 10 PASS |
| Cosmétiques journey | 7 PASS |
| Auth SMTP audit (dernière tentative) | BLOCKED / FAIL envoi |
| LOT 19 GO checklist | NO-GO PENDING |

---

## 3. Bloqueurs ouverts (priorisés)

1. **P0** — SMTP Auth staging (clé SMTP Brevo, sender verified) → relancer 1× `saas-auth-email-audit.mjs`
2. **P0** — Vercel Auth : `NEXT_PUBLIC_APP_URL` = URL Vercel en type **Config** · `CRON_SECRET` · Redeploy · Site URL / Redirect URLs Supabase
3. **P1** — Checklist Platform Admin post-MFA + captures AAL2
4. **P1** — Phase 1→6 parcours client **sans** bypass confirmation
5. **P2** — LOT 19 revue humaine + C4 LIVE
6. **P2** — CGU / politique confidentialité sur landing

---

## 4. Fichiers de référence

| Sujet | Doc |
|-------|-----|
| Recette Platform Admin | `docs/saas/platform-admin-staging-recette-finale.md` |
| Fix P0/P1/P2 Platform | `docs/saas/platform-admin-p0-p2-fix-report.md` |
| Checklist MFA manuelle | `docs/saas/platform-admin-post-mfa-checklist.md` |
| Readiness SaaS / Stripe | `docs/saas/saas-production-readiness.md` |
| Cosmétiques journey | `docs/saas/cosmetics-customer-journey-report.md` |
| Phase 1 signup | `docs/saas/client-journey-phase1-signup-report.md` |
| Retest SMTP Auth | `docs/saas/client-journey-phase1-auth-smtp-retest.md` |
| LOT 19 GO/NO-GO | `docs/ai/lot19t-go-no-go-checklist.md` |
| Setup Brevo | `docs/saas/brevo-staging-setup.md` |
