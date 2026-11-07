# Diagnostic Brevo / SMTP Auth — causes sans nouvel essai d’inscription

**Date :** 2026-10-28  
**Cible :** staging `hznmtadobqfhumezdgbh`  
**Protect :** ScorApp-XP non touché · Auth protections non modifiées · **aucun** nouveau `signUp`

## Synthèse

La cause principale confirmée n’est **pas** le 403 sur `/v3/account`.  
L’endpoint d’**envoi transactionnel** `POST /v3/smtp/email` répond :

> `permission_denied` — **Unable to send email. Your SMTP account is not yet activated.**

Le compte Brevo a donc une plateforme / compte **SMTP transactionnel non activé**. Cela bloque à la fois :

- les invitations app (`email_jobs` → API Brevo) ;
- très probablement les confirmations Auth Supabase via SMTP custom (`smtp-relay.brevo.com`), d’où le message générique GoTrue `Error sending confirmation email`.

Aucun nouvel essai d’inscription n’a été lancé pour ce diagnostic.

---

## 1. Permissions `BREVO_API_KEY` (endpoints adaptés)

| Endpoint | HTTP | Interprétation |
|----------|------|----------------|
| `GET /v3/account` | **403** | Clé non autorisée pour la ressource `account` — **ne prouve pas** l’interdiction d’envoi |
| `GET /v3/senders` | **403** | Même restriction `account` / senders list |
| `GET /v3/smtp/templates` | **200** | La clé API est valide pour une partie du périmètre SMTP/API |
| `GET /v3/smtp/blockedContacts` | **200** | Idem |
| `POST /v3/smtp/email` (payload vide) | **403** | Message : **SMTP account is not yet activated** |
| `POST /v3/smtp/email` (forme valide, pas d’attente de livraison utile) | **403** | **Même message d’activation** |

**Conclusion clé API :** la clé `xkeysib-…` est une vraie API key et fonctionne sur certains GET SMTP ; l’**envoi** est refusé parce que le **compte SMTP transactionnel Brevo n’est pas activé**, pas seulement à cause du scope `/account`.

## 2. Formats de clés (valeurs non affichées)

| Secret | Emplacement | Format observé |
|--------|-------------|----------------|
| `BREVO_API_KEY` | `.env.e2e.local` | **API_KEY** (`xkeysib-…`), longueur cohérente |
| Clé SMTP (`xsmtpsib-…`) | **Dashboard Supabase staging uniquement** (pas dans l’env local) | Non relisible depuis ici |
| Login SMTP | Dashboard Brevo / Supabase SMTP | Non relisible depuis ici |

TCP `smtp-relay.brevo.com:587` : **OK** (réseau joignable).

## 3. Logs Auth Supabase staging

| Check | Résultat |
|-------|----------|
| `SUPABASE_ACCESS_TOKEN` / management token | **ABSENT** (local + OS) |
| CLI supabase authentifié | **Non** (pas de access-token) |
| Lecture logs Auth Dashboard via API | **BLOCKED** depuis cet environnement |

Sans token Management, impossible d’extraire la stack SMTP GoTrue.  
Corrélation fiable : l’erreur Auth déjà observée (`Error sending confirmation email`) est le **wrapper générique** de GoTrue quand le provider SMTP échoue ; Brevo confirme côté envoi que le compte SMTP **n’est pas activé** (erreur aussi typique en SMTP relai : *Your SMTP account is not yet activated*).

## 4. Authentification SMTP vs expéditeur vs activation

| Hypothèse | Statut |
|-----------|--------|
| **Service SMTP transactionnel Brevo non activé** | **CONFIRMÉ** (réponse API d’envoi explicite) |
| Authentification SMTP Supabase (mauvais login / clé API au lieu de SMTP key) | **Hypothèse restante** — ne peut être tranchée sans logs Auth ni test d’auth SMTP (identifiants absents localement). Peut coexister après activation. |
| Expéditeur non autorisé / non verified (ex. `@gmail.com`) | **Hypothèse restante** — `GET /v3/senders` inaccessible avec cette clé ; domaine sender = `gmail.com` (souvent plus fragile qu’un domaine authentifié). À vérifier après activation. |
| Quota rate-limit mailer intégré Supabase | **Écarté** — les probes récents ne renvoient plus `email rate limit exceeded` |
| Confirm email désactivé | **Écarté** — Auth tente toujours d’envoyer la confirmation |
| Port / host Brevo injoignable | **Écarté** — TCP 587 OK |

---

## Causes confirmées

1. **Compte SMTP / plateforme transactionnelle Brevo non activé** → tout envoi (`/v3/smtp/email` et très probablement SMTP relai Auth) échoue.  
2. Un **403 sur `/account`** est un signal de **scope clé**, pas la preuve isolée du blocage d’envoi (l’envoi a son propre message d’activation).

## Hypothèses restantes (après activation)

1. Sender `…@gmail.com` non verified / non autorisé dans Brevo.  
2. Sur Supabase staging : password SMTP = API key au lieu de **SMTP key**, ou SMTP login incorrect.  
3. Domaine d’envoi sans SPF/DKIM (délivrabilité) — secondaire une fois l’activation OK.

## Actions exactes (dans l’ordre)

### A. Brevo — activer le transactionnel (bloquant)

1. Se connecter à [Brevo](https://app.brevo.com/).  
2. **Settings** → **Senders, Domains & Dedicated IPs** → **Domains** : ajouter et authentifier un **domaine** (SPF/DKIM) — recommandé avant la demande d’activation.  
3. **Senders** : ajouter/verifier un expéditeur sur ce domaine (préférable à Gmail pour Auth + invites).  
4. Icône **?** → **Support and Tickets** → **Contact your support team**.  
5. Demander l’**activation de la plateforme SMTP / transactional email**, en indiquant : URL du site, type d’e-mails (transactionnel : confirmation compte, invitations), volume estimé.  
6. Attendre confirmation Brevo. Re-tester **uniquement** `POST /v3/smtp/email` (ou le script d’audit) — **pas** de boucle signup avant ça.

Doc Brevo : [Troubleshooting SMTP](https://help.brevo.com/hc/en-us/articles/115000188150-Troubleshooting-Issues-with-Brevo-SMTP).

### B. Brevo — clé API (après activation)

1. Settings → **SMTP & API** → **API keys**.  
2. S’assurer que la clé utilisée dans `.env.e2e.local` a les droits d’**envoi transactionnel**.  
3. Optionnel : élargir les droits si `/account` et `/senders` restent nécessaires pour du monitoring (non bloquant pour l’envoi une fois le compte activé).

### C. Supabase staging uniquement (`hznmtadobqfhumezdgbh`)

1. **Authentication** → **SMTP Settings**.  
2. Host `smtp-relay.brevo.com`, port `587`.  
3. Username = **SMTP login** (onglet SMTP Brevo).  
4. Password = **SMTP key** `xsmtpsib-…` (**pas** `xkeysib-…`).  
5. Sender = expéditeur **verified** (idéalement domaine authentifié).  
6. **Confirm email** = ON · rate limits = ON.  
7. **Ne pas** ouvrir / modifier ScorApp-XP.

### D. Puis un seul test (plus tard)

1. `scripts/saas-auth-email-audit.mjs` **une fois**.  
2. Si PASS → parcours inscription / invite une fois.

---

## Serveur

Aucun `dev-e2e` démarré pour ce diagnostic. `npm run dev` + `.env.local` inchangé sur `localhost:3000`.
