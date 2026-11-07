# Rapport — accès Platform Admin staging

**Date :** 2026-10-28  
**Projet :** `hznmtadobqfhumezdgbh` uniquement  
**Protect / XP :** `zkyjaslogpdujyeysjzw` — **non modifié**  
**MFA / Auth protections :** non désactivées

## Compte créé

| Champ | Valeur |
|-------|--------|
| E-mail | `tonyassiki05@gmail.com` |
| User ID | `5ff6cb69-1f31-4247-a00e-858bcc19dfbe` |
| Rôle | `super_admin` |
| Profile | upsert OK |
| Mot de passe | temporaire généré (crypto), **non** codé en dur dans le repo |

Script : `scripts/saas-staging-bootstrap-platform-admin.mjs`

## Tests

| # | Contrôle | Résultat |
|---|----------|----------|
| 1 | Visiteur `/platform` → redirection | **PASS** (Playwright + HTTP 307 → `/dashboard`) |
| 2 | Utilisateur sans `platform_admins` | **PASS** (redirigé hors `/platform`) |
| 3 | `super_admin` atteint `/platform` (porte MFA) | **PASS** |
| 4 | Dashboard / entreprises / abonnements / expirations / alertes après MFA | **BLOCKED** — MFA AAL2 pas encore enrôlée par l’utilisateur |
| 5 | ScorApp-XP intact | **PASS** |

Captures : `docs/saas/platform-access-01-visitor.png`, `…-02-owner-denied.png`, `…-03-super-admin.png`

## Guide MFA AAL2 (à faire maintenant)

Le serveur staging tourne via `dev-e2e` sur `http://localhost:3000` (env staging).  
**Ne pas** utiliser `.env.local` (XP) pour ce login.

1. Ouvrir `http://localhost:3000/login`  
2. E-mail : `tonyassiki05@gmail.com`  
3. Mot de passe : celui affiché une seule fois dans le terminal d’amorçage (message agent) — **changez-le** après MFA  
4. Aller sur `/platform` → redirection vers `/platform/security/mfa`  
5. Cliquer **Activer le MFA (TOTP)** → scanner le QR avec Authy / Google Authenticator / 1Password  
6. Saisir le code à 6 chiffres → **Vérifier et continuer**  
7. Vous devez arriver sur **Vue d’ensemble** ; tester ensuite Entreprises, Abonnements, Expirations, Alertes  

Si MFA refuse : Dashboard Supabase staging → Authentication → Providers → MFA (TOTP) doit être **enabled**.

## Verdict global

**PASS** sur bootstrap + autorisations.  
**BLOCKED** sur captures dashboard métier tant que MFA n’est pas activée par vous.
