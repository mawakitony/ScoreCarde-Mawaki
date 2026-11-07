# Rapport — vérification SMTP Brevo staging + parcours e-mail

**Date :** 2026-10-28 (rejeu)  
**Cible :** staging `hznmtadobqfhumezdgbh` uniquement  
**Protect :** ScorApp-XP non touché · Confirm email / anti-abus non désactivés · pas de `email_confirm: true` · aucun deploy · aucun secret affiché

## Verdict global

**BLOCKED**

## 1. SMTP staging (sans identifiants)

| Check | Résultat |
|-------|----------|
| Cible staging / protect | **PASS** |
| Quota mailer intégré | **PASS** — plus de `email rate limit exceeded` |
| Envoi confirmation Auth | **FAIL** — `Error sending confirmation email` |
| Confirm email (inféré) | **PASS** — Auth tente toujours d’envoyer la confirmation |
| Probe | **1 seule** (`saas-auth-email-audit.mjs`) → `BLOCKED_AUTH_SMTP_SEND` |

Le custom SMTP est **engagé**, mais Brevo/SMTP **refuse ou échoue** l’envoi. À corriger sur le dashboard staging uniquement :

- Host `smtp-relay.brevo.com`, port `587`
- Username = **SMTP login** (onglet SMTP Brevo)
- Password = **SMTP key** (`xsmtpsib-…`)
- Sender = adresse **verified** dans Brevo (un Gmail non vérifié / non autorisé comme sender provoque souvent cet échec)
- Consulter Brevo → Transactional → logs d’erreur

## 2. Variables `.env.e2e.local`

| Variable | État | Note |
|----------|------|------|
| `BREVO_API_KEY` | **SET** | Préfixe `xsmtpsib-` = **clé SMTP**, pas API |
| `BREVO_SENDER_EMAIL` | **SET** | |
| `BREVO_SENDER_NAME` | **SET** | |
| `CRON_SECRET` | **SET** | |

Probe API Brevo `GET /v3/account` (sans envoi d’e-mail) → **HTTP 401**.  
Pour `email_jobs`, remplacer `BREVO_API_KEY` par une clé **API** Brevo (`xkeysib-…`) : Settings → SMTP & API → **API keys**.

Variables absentes pour preuve inbox auto : `TESTMAIL_API_KEY`, `TESTMAIL_NAMESPACE` (optionnel).

## 3–6. Parcours réel

| # | Étape | Résultat |
|---|--------|----------|
| A | Création compte | **FAIL** (envoi confirmation SMTP) |
| B | Réception e-mail confirmation | **BLOCKED** |
| C | Confirmation | **BLOCKED** |
| D | Création organisation | **BLOCKED** |
| E | Invitation collaborateur | **BLOCKED** (Auth KO + clé API Brevo invalide pour REST) |
| F | Acceptation | **BLOCKED** |
| G | Preuve boîtes de réception | **BLOCKED** |

Aucun second signup. Spec Playwright non lancée (échec SMTP déjà prouvé).

## Serveur

`dev-e2e` non démarré. `npm run dev` avec `.env.local` actif sur `localhost:3000`.

## Déblocage

1. Corriger SMTP Auth staging (login/clé SMTP + sender verified).  
2. Mettre une **API key** `xkeysib-…` dans `BREVO_API_KEY` (garder la SMTP key uniquement dans le dashboard Supabase).  
3. Confirmer sans coller de secrets → un seul rejeu.
