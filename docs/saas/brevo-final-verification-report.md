# Rapport final — Brevo + Auth SMTP staging + parcours réel

**Date :** 2026-10-28  
**Cible :** staging `hznmtadobqfhumezdgbh` uniquement  
**Protect :** ScorApp-XP non modifié · Confirm email / anti-abus non désactivés · pas de bypass `email_confirm` · aucun deploy · aucun secret affiché

## Verdict global

**BLOCKED**

Un seul essai d’inscription (audit Auth) a été exécuté. Arrêt immédiat après échec d’envoi SMTP — aucun Playwright, aucune invitation, aucune boucle.

## Résultats

| # | Contrôle | Résultat | Cause / preuve |
|---|----------|----------|----------------|
| 1 | Validité `BREVO_API_KEY` | **FAIL** | Clé présente, préfixe `xkeysib-` (forme API), mais `GET /v3/account` et `/v3/contacts` → **HTTP 403** |
| 2 | Envoi SMTP Auth staging | **FAIL** | Probe unique : `Error sending confirmation email` (`BLOCKED_AUTH_SMTP_SEND`). Plus de rate-limit built-in → custom SMTP engagé mais envoi refusé |
| 3 | Inscription + réception + confirmation e-mail | **BLOCKED** | Stoppé : dépend de (2) |
| 4 | Création org + essai 14 j | **BLOCKED** | Dépend de (3) |
| 5 | Invitation collab + réception | **BLOCKED** | Dépend de (4) + clé API Brevo utilisable pour `email_jobs` |
| 6 | Acceptation + dashboard org | **BLOCKED** | Dépend de (5) |

## Causes précises

### A. Clé API Brevo (403)

- Fichier `.env.e2e.local` : `BREVO_API_KEY` **SET**, type **API_KEY**.
- Réponse Brevo exacte : `permission_denied` — `api key is not authorized for resource "account"`.
- La clé est acceptée comme API key, mais ses **scopes / permissions** sont insuffisants (au minimum pas d’accès `account` ; probablement trop étroits pour l’envoi transactionnel aussi).
- Action : Brevo → Settings → **SMTP & API** → **API keys** → créer une clé avec droits **Transactional emails / SMTP API** (ou « All ») → remplacer `BREVO_API_KEY` dans `.env.e2e.local` **sans coller la clé dans le chat**.

### B. SMTP Supabase staging (Error sending confirmation email)

- Auth tente d’envoyer la confirmation (Confirm email **ON**).
- L’échec est au moment de l’envoi SMTP vers Brevo.
- Causes probables :
  1. Password SMTP = mauvaise clé (API key au lieu de **SMTP key**, ou SMTP key révoquée après rotation).
  2. **SMTP login** incorrect (doit être le login affiché sous l’onglet SMTP Brevo).
  3. **Sender email** non verified / non autorisé dans Brevo (ex. Gmail non validé comme sender).
  4. Port / TLS incorrect (attendu : `smtp-relay.brevo.com` + `587`).
- Action : staging `hznmtadobqfhumezdgbh` uniquement → Authentication → SMTP Settings ; croiser avec Brevo → Transactional → logs d’erreur. **Ne pas** toucher ScorApp-XP.

## Ce qui n’a pas été fait (volontairement)

- Deuxième tentative `signUp`
- Suite Playwright `saas-auth-confirm-invite`
- Contournement Admin `email_confirm: true`
- Modification SMTP / Auth production

## Serveur local

`dev-e2e` non démarré. `npm run dev` conservé avec **`.env.local`** sur `http://localhost:3000`.

## Prochaine étape

1. Corriger SMTP staging jusqu’à disparition de `Error sending confirmation email` (1 probe audit).  
2. Corriger la clé API jusqu’à `GET /v3/account` → **200**.  
3. Relancer **un** parcours complet.
