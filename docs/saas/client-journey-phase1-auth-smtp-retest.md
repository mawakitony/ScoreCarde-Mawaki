# Retest Auth SMTP staging — une tentative

**Date :** 2026-10-30  
**Commande :** `node --experimental-strip-types --import ./test/register.mjs scripts/saas-auth-email-audit.mjs` (exécutée **une seule fois**)  
**Cible :** `hznmtadobqfhumezdgbh` · Protect XP non touché · Confirm email non désactivée

## Verdict global : **BLOCKED**

Le SMTP Auth custom répond toujours par un échec d’envoi. Aucune preuve de création utilisateur, ni de mail reçu, ni de confirmation, org ou dashboard.

---

## Résultats par critère

| # | Critère | Statut | Preuve |
|---|---------|--------|--------|
| 1 | Absence de `SMTP_SEND_FAILED` | **FAIL** | Sortie audit : `SMTP_SEND_FAILED=yes` · `PROBE_ERROR=Error sending confirmation email` |
| 2 | Création effective utilisateur Auth | **FAIL** | `USER_CREATED=no` |
| 3 | Réception e-mail de confirmation | **BLOCKED** | Non testable — aucun user / aucun envoi réussi (pas de 2ᵉ signup) |
| 4 | Confirmation du compte | **BLOCKED** | Dépend de 2–3 — non exécuté |
| 5 | Création organisation + propriétaire | **BLOCKED** | Dépend de 4 — non exécuté |
| 6 | Accès dashboard après connexion | **BLOCKED** | Dépend de 5 — non exécuté |

**Aucune étape 3–6 déclarée PASS** (non exécutées faute de prérequis).

---

## Sortie brute (extrait)

```
E2E_HOST=hznmtadobqfhumezdgbh.supabase.co
APP_HOST=hznmtadobqfhumezdgbh.supabase.co
PROTECT_HOST=zkyjaslogpdujyeysjzw.supabase.co
BREVO_API_KEY=SET
BREVO_SENDER_EMAIL=SET
BREVO_SENDER_NAME=SET
PROBE_ERROR=Error sending confirmation email
RATE_LIMITED=no
SMTP_SEND_FAILED=yes
USER_CREATED=no
SESSION_IMMEDIATE=no
EMAIL_CONFIRMED=no
DECISION=BLOCKED_AUTH_SMTP_SEND
```

Exit code script : **3**

---

## Interprétation

- `RATE_LIMITED=no` → le mailer intégré n’est plus le frein ; le **chemin SMTP custom** est engagé.
- `SMTP_SEND_FAILED=yes` → Supabase tente d’envoyer via SMTP custom et **échoue** (credentials SMTP, sender non verified, port/TLS, ou rejet Brevo).
- `BREVO_*=SET` concerne le canal **B** (`email_jobs` / API) — **≠** le login/clé **SMTP** du canal **A** (Auth).

## Action Dashboard (staging uniquement)

1. Authentication → SMTP Settings : host `smtp-relay.brevo.com`, port `587`.  
2. Username = **SMTP login** Brevo · Password = **SMTP key** (pas `BREVO_API_KEY`).  
3. Sender = adresse **verified** dans Brevo.  
4. Logs Brevo → Transactional / SMTP errors.  
5. Confirm email **reste ON**.  
6. Relancer **une seule** fois l’audit après correction.

## Non fait volontairement

- Pas de second `signUp`.  
- Pas de `auth.admin.createUser({ email_confirm: true })`.  
- Pas de désactivation Confirm email.  
- Pas de test org / dashboard sans user créé.
