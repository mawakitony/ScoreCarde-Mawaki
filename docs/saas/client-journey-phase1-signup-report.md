# Phase 1 — Inscription nouvelle entreprise (staging)

**Date :** 2026-10-30  
**Cible :** Supabase staging `hznmtadobqfhumezdgbh`  
**Protect :** ScorApp-XP `zkyjaslogpdujyeysjzw` non touché  
**Contraintes :** Confirm email ON · pas de bypass Admin `email_confirm` · pas de boucle `signUp` · aucun commit/deploy

## Verdict phase 1

| Synthèse | Statut |
|----------|--------|
| UI `/signup` + validations | **PASS** |
| Canal Brevo transactionnel app (`BREVO_*`) | **SET** (prêt pour invitations / jobs — hors Auth) |
| E-mail de confirmation Auth (signup) | **BLOCKED** — SMTP Auth custom en échec d’envoi |
| Création Auth user via parcours réel | **BLOCKED** (dépend SMTP) |
| Création org + owner + isolation bout-en-bout | **BLOCKED** (dépend confirmation) |
| Redirection post-confirmation | **BLOCKED** (non exécutable) |

**Verdict global Phase 1 : BLOCKED** — la porte Auth confirmation empêche la recette bout-en-bout. Les contrôles indépendants de l’e-mail sont OK.

---

## Architecture observée (audit code)

1. `/signup` → `signUp` → `supabase.auth.signUp` (e-mail confirmation via **Supabase Auth SMTP**, canal A).  
2. Si session absente (confirm ON) → message « Ouvrez le lien reçu par email… ».  
3. Après confirmation → `/auth/callback` → session → `bootstrap_membership` → si `organisation_required` → `/onboarding`.  
4. `/onboarding` → `createOrganization` → RPC `create_organization` (owner + essai 14 j côté serveur).

L’organisation **n’est pas** créée au submit `/signup` : elle l’est à l’onboarding après compte confirmé.

---

## Contrôles exécutés

| # | Contrôle | Méthode | Résultat |
|---|----------|---------|----------|
| 1 | Page `/signup` joignable | HTTP 200 localhost | **PASS** |
| 2 | Titre / copy essai 14 j | Playwright | **PASS** — « Essayer gratuitement » |
| 3 | Validations champs (vide, e-mail invalide, mdp min 8) | Playwright + HTML5 | **PASS** |
| 4 | Schema Zod `signupSchema` | Node assert | **PASS** |
| 5 | Lien « Se connecter » | Playwright | **PASS** |
| 6 | Responsive mobile 390×844 | Capture | **PASS** (capture) |
| 7 | Audit Auth e-mail (1 tentative) | `scripts/saas-auth-email-audit.mjs` | **BLOCKED** |
| 8 | Création user Auth via signup réel | Probe audit | **BLOCKED** — `USER_CREATED=no` |
| 9 | Envoi e-mail confirmation | Probe audit | **BLOCKED** — `SMTP_SEND_FAILED=yes` |
| 10 | Création org + rattachement owner | Non exécuté (dépend 8–9) | **BLOCKED** |
| 11 | Isolation multi-org (parcours signup) | Non exécuté | **BLOCKED** |
| 12 | Redirection post-confirm / login | Non exécuté | **BLOCKED** |

### Détail audit Auth (sans secrets)

```
DECISION=BLOCKED_AUTH_SMTP_SEND
RATE_LIMITED=no
SMTP_SEND_FAILED=yes
USER_CREATED=no
SESSION_IMMEDIATE=no
BREVO_API_KEY=SET   # canal B email_jobs — ≠ SMTP Auth
```

**Interprétation :** le chemin SMTP custom est engagé (plus le rate-limit mailer intégré), mais l’envoi de confirmation **échoue**. Cause probable : SMTP login/key Brevo incorrects, expéditeur non verified, ou erreur Brevo SMTP.  
**Fix :** Dashboard staging → Authentication → SMTP Settings (`smtp-relay.brevo.com:587` + **clé SMTP** ≠ API key) + sender verified. Garder Confirm email ON.

Aucun second `signUp` Auth n’a été relancé après l’audit (évite le spam / rate-limit).

---

## Bugs / écarts identifiés

1. **P0 staging ops :** confirmation Auth non délivrée → inscription SaaS réelle impossible.  
2. Messages HTML5 de validation en anglais navigateur (« Please fill out this field. ») — UX mineure, pas bloquant métier.  
3. Rapport antérieur (2026-10-28) : rate-limit mailer ; **état actuel différent** : SMTP custom cassé + `BREVO_*` app SET.

## Corrections nécessaires (hors code app — intervention Dashboard)

1. Corriger SMTP Auth Brevo sur projet `hznmtadobqfhumezdgbh` uniquement.  
2. Vérifier logs Brevo Transactional / SMTP.  
3. Relancer **une fois** `scripts/saas-auth-email-audit.mjs` → attendre `USER_CREATED` / envoi OK.  
4. Puis rejouer Phase 1 bout-en-bout (+ spec `saas-auth-confirm-invite` si applicable).

---

## Captures

- `docs/saas/client-journey-phase1/01-signup-desktop.png`
- `docs/saas/client-journey-phase1/02-signup-empty-validation.png`
- `docs/saas/client-journey-phase1/03-signup-invalid-email.png`
- `docs/saas/client-journey-phase1/04-signup-mobile.png`

---

## Suite

Phases 2–6 **non démarrées** (attente déblocage Phase 1 e-mail, sauf tests explicitement indépendants que vous autoriserez ensuite).

Revue code anticipée (non exécutée E2E) : `DEFAULT_TRIAL_DAYS = 14` + RPC `create_organization` pose `trialing` / `trial_end` serveur et `trial_used_at` (anti-renouvellement) — à valider en Phase 2 après signup réel.
