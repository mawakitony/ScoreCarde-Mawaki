# Rapport — finalisation e-mails Brevo (staging)

**Date :** 2026-10-28  
**Cible :** staging `hznmtadobqfhumezdgbh` uniquement  
**Protect :** ScorApp-XP non touché · SMTP production non modifié · aucun secret affiché

## Verdict global

**BLOCKED** — aucune clé Brevo (API ou SMTP) n’est présente dans l’environnement sécurisé local (`.env.local`, `.env.e2e.local`, variables process/user/machine). Impossible de finaliser SMTP Auth staging ni `BREVO_*` depuis ici, ni de rejouer le parcours e-mail réel.

## Audit des intégrations

| Composant | Statut | Détail |
|-----------|--------|--------|
| `lib/email/brevo.ts` + `email_jobs` worker | **PASS** (code) | API `v3/smtp/email` ; vars `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` |
| File + retry | **PASS** (code) | `lib/email/queue.ts` / `worker.ts` ; cron `/api/cron/maintenance` |
| Intégration CRM contacts Brevo (par org) | **PASS** (hors scope invite Auth) | Clé chiffrée `integrations` provider `brevo` |
| Vars locales `BREVO_*` | **BLOCKED** | Toutes **MISSING** |
| SMTP Auth custom staging | **BLOCKED** | Intervention Dashboard requise (agent ne peut pas écrire le SMTP Supabase) |
| Confirm email / anti-abus | **PASS** | Non désactivés ; consignes explicites de les garder ON |

## Variables nécessaires

| Variable / secret | Canal | Où |
|-------------------|-------|-----|
| SMTP host/port/user/pass + sender | Auth confirmation | Dashboard Supabase **staging** only |
| `BREVO_API_KEY` | `email_jobs` | `.env.local` + `.env.e2e.local` |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | `email_jobs` | idem |
| `CRON_SECRET` | flush worker | idem |

## Configuration effectuée dans le repo

| Action | Résultat |
|--------|----------|
| Guide clics Brevo + Supabase staging | **PASS** — `docs/saas/brevo-staging-setup.md` |
| Placeholders `.env.e2e.example` | **PASS** |
| Écriture secrets locaux | **BLOCKED** — identifiants absents |
| Modification SMTP ScorApp-XP / prod | **PASS** (non fait, volontaire) |

## Parcours réel demandé

| # | Étape | Résultat |
|---|--------|----------|
| 1 | Inscription | **BLOCKED** (quota Auth built-in + pas de SMTP custom) |
| 2 | Réception e-mail confirmation | **BLOCKED** |
| 3 | Confirmation | **BLOCKED** |
| 4 | Création organisation | **BLOCKED** (dépend 1–3) |
| 5 | Invitation collaborateur (envoi Brevo) | **BLOCKED** (`BREVO_*` manquants) |
| 6 | Acceptation invitation | **BLOCKED** (dépend 5) |

Aucun signup en boucle n’a été relancé.

## Déblocage (vous)

1. Suivre **`docs/saas/brevo-staging-setup.md`** (Brevo → SMTP staging → `.env*.local`).  
2. Me fournir **hors chat** (ou coller vous-même dans `.env.e2e.local`) : API key + sender verified.  
3. Confirmer que le custom SMTP staging est sauvegardé (sans coller le mot de passe ici).  
4. Relancer alors audit + `saas-auth-confirm-invite` / parcours manuel une seule fois.
