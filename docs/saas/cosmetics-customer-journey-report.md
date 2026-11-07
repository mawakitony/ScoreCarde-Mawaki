# Rapport — parcours entreprise cosmétiques (staging)

**Date :** 2026-10-28  
**Scénario :** Atelier Lumière (cosmétiques / beauté)  
**Cible :** Supabase staging `hznmtadobqfhumezdgbh` uniquement  
**Protect :** ScorApp-XP non touché · aucun paiement réel · aucun deploy  

**Suite :** `tests/e2e/isolated/saas-cosmetics-journey.spec.ts`  
**Résultat global Playwright :** **7 PASS / 0 FAIL**

## Checklist demandée

| # | Étape | Résultat | Notes |
|---|--------|----------|--------|
| 1 | Landing publique | **PASS** | Desktop + mobile 390px, CTA fonctionnels |
| 2 | Inscription dirigeant | **PASS*** | UI signup tentée ; **Auth staging rate-limit email** → compte confirmé via Auth admin (même pattern que `saas-journey`) |
| 3 | Création organisation | **PASS** | OWNER, secteur cosmétiques |
| 4 | Essai 14 jours | **PASS** | `status=trialing`, `trial_end` ~14 j, bannière visible |
| 5 | Dashboard entreprise | **PASS** | Accès scorecards / leads sans lock |
| 6 | Création + publication scorecard | **PASS** | Création UI « Nouvelle scorecard » + contenu publishable + Publier |
| 7 | Réponse cliente fictive | **PASS** | `/s/{slug}` lead + choix « Peaux sensibles » |
| 8 | Prospect dans le CRM | **PASS** | Lead visible `/dashboard/leads` |
| 9 | Invitation collaborateur | **PASS** | Invitation classique UI → `email_jobs` URL |
| 10 | Connexion collab + permissions | **PASS** | `role=member`, `access_role=editor` ; scorecard OK ; pas de CTA Checkout |

\*Inscription **e-mail confirmation inbox** : **BLOCKED** par quota Auth staging (`email rate limit exceeded`). Contournement E2E autorisé : `auth.admin.createUser({ email_confirm: true })` après tentative UI.

## Landing mobile

| Check | Résultat |
|-------|----------|
| Viewport 390×844 | **PASS** |
| Titre hero visible | **PASS** |
| CTA « Essayer gratuitement » → `/signup` | **PASS** |

## Captures

Dossier `docs/saas/` :

- `cosmetics-journey-01-landing-desktop.png`
- `cosmetics-journey-01-landing-mobile.png`
- `cosmetics-journey-02-signup.png`
- `cosmetics-journey-03-dashboard-trial.png`
- `cosmetics-journey-04-dashboard.png`
- `cosmetics-journey-05-published.png`
- `cosmetics-journey-06-public-response.png`
- `cosmetics-journey-06-crm-lead.png`
- `cosmetics-journey-07-invite.png`
- `cosmetics-journey-07-collab-dashboard.png`

## Corrections effectuées

1. Expectation signup journey alignée sur le titre « Essayer gratuitement ».
2. Contournement rate-limit Auth staging pour confirmation e-mail.
3. Seed publishable minimal (landing, question notée, plage 0–100, lead `before`) pour permettre la publication réelle via UI.
4. Assertion collab : `access_role=editor` (le `role` org reste `member`).

## Hors périmètre / non rejoué ici

- Checkout Stripe / paiement (déjà validé précédemment en test mode).
- Expiration 14 j + lock (couvert par `saas-trial-lock` / journey).
- Pages juridiques (toujours absentes, non inventées).
