# Auth e-mail staging — diagnostic et solution durable

**Projet :** `hznmtadobqfhumezdgbh` (staging)  
**Protect :** ScorApp-XP — hors scope  
**Confirm email :** doit rester **activé**  
**Anti-abus / rate limits Auth :** doivent rester **activés**

## Audit one-shot (2026-10-28)

Commande : `node --experimental-strip-types --import ./test/register.mjs scripts/saas-auth-email-audit.mjs`

| Champ | Valeur |
|-------|--------|
| Cible | `hznmtadobqfhumezdgbh` (staging OK, XP protégé) |
| `BREVO_API_KEY` / sender | **MISSING** en local E2E |
| Probe signup | `email rate limit exceeded` |
| Décision | **BLOCKED_AUTH_EMAIL_RATE_LIMIT** |

Aucune boucle signup n’a été relancée après ce résultat.

## Diagnostic

Deux canaux e-mail distincts :

| Canal | Usage | Provider actuel |
|-------|--------|-----------------|
| **Supabase Auth** | confirmation signup, magic link, reset password | Mailer intégré Supabase (quota faible sans SMTP custom) |
| **`email_jobs` app** | invitations org, paiement échoué, etc. | Brevo API (`BREVO_API_KEY`) — **indépendant** d’Auth |

Le blocage `email rate limit exceeded` vient du **mailer Auth Supabase**, pas de Brevo.

Autres constats staging :

- `@example.com` peut être **refusé** (`Email address … is invalid`) — éviter pour les tests.
- `BREVO_*` souvent absent en local E2E : les invitations sont quand même **enfilées** dans `email_jobs` (lien récupérable pour E2E) ; l’envoi réel nécessite Brevo.

Script d’audit (une seule tentative signup, pas de boucle) :

```bash
node --experimental-strip-types --import ./test/register.mjs scripts/saas-auth-email-audit.mjs
```

## Solution durable (recommandée)

Guide pas-à-pas (clics Brevo + Supabase staging) : **`docs/saas/brevo-staging-setup.md`**.

1. **SMTP Auth custom sur le projet staging uniquement** (`hznmtadobqfhumezdgbh`)  
   - Host `smtp-relay.brevo.com` · port `587` · login SMTP + **clé SMTP** (≠ API key).  
   - Sender Brevo verified (SPF/DKIM/DMARC).  
2. **Conserver** « Confirm email » = ON.  
3. **Conserver** les rate limits Auth.  
4. **Configurer `BREVO_API_KEY` + `BREVO_SENDER_*`** dans `.env.e2e.local` / `.env.local` pour `email_jobs`.  
5. **UX** : `actions/auth.ts` mappe le rate-limit Auth vers un message clair.

## Ce qu’il ne faut pas faire

- Désactiver la confirmation d’e-mail pour « faire passer » les tests.  
- Boucler sur `signUp` tant que le rate-limit est actif.  
- Contourner avec `email_confirm: true` en production-like validation.  
- Pointer le SMTP ou les tests vers ScorApp-XP.

## Validation E2E « confirmation réelle »

Spec : `tests/e2e/isolated/saas-auth-confirm-invite.spec.ts`

- Signup UI → utilisateur **non confirmé**.  
- Lien de confirmation = `auth.admin.generateLink({ type: 'signup' })` (**équivalent du lien e-mail**, sans forcer `email_confirm`).  
- Visite du lien → `email_confirmed_at` renseigné.  
- Création d’organisation + invitation collaborateur + acceptation.
