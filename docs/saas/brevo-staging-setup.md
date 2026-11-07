# Configuration Brevo — staging WOLOYEM Score uniquement

**Projet Supabase staging :** `hznmtadobqfhumezdgbh`  
**Interdit :** ScorApp-XP (`zkyjaslogpdujyeysjzw`) · tout SMTP / Auth de production  
**Conserver :** Confirm email = ON · rate limits Auth = ON

Ne jamais coller de clés API / SMTP dans git, tickets, captures ou chat.

---

## Deux canaux (ne pas les confondre)

| Canal | Rôle | Identifiants | Où ça se configure |
|-------|------|--------------|--------------------|
| **A — Supabase Auth SMTP** | Confirmation signup, reset password, magic link | **Login SMTP + clé SMTP** Brevo (≠ API key) | Dashboard Supabase **staging** → Authentication → SMTP |
| **B — `email_jobs` app** | Invitations org, essai, paiement échoué, etc. | **`BREVO_API_KEY`** + sender | `.env.local` / `.env.e2e.local` (gitignored) |

L’intégration CRM « Brevo » par organisation (contacts leads) est un 3ᵉ chemin (`integrations` + clé chiffrée) — hors scope de ce guide Auth / invitations.

Code app pour B : `lib/email/brevo.ts` → `https://api.brevo.com/v3/smtp/email`  
Worker : `processEmailJobs()` via cron maintenance (`/api/cron/maintenance` + `CRON_SECRET`).

---

## Étape 1 — Brevo (compte)

### 1a. Domaine / expéditeur

1. Ouvrir [Brevo](https://app.brevo.com/) → **Settings** (icône engrenage / menu compte).  
2. **Senders, Domains & Dedicated IPs** → **Domains** : ajouter et authentifier le domaine d’envoi (SPF + DKIM ; DMARC recommandé).  
3. **Senders** → **Add a sender** : ex. `noreply@votre-domaine` (ou `auth@…` pour Auth).  
4. Valider l’expéditeur (lien e-mail Brevo) jusqu’à statut **verified**.

Utiliser le **même domaine vérifié** pour Auth SMTP et pour `BREVO_SENDER_EMAIL` si possible.

### 1b. Clé API (canal B — `email_jobs`)

1. Compte → **Settings** → **SMTP & API**.  
2. Onglet **API keys** → **Generate a new API key**.  
3. Nom suggéré : `woloyem-score-staging-email-jobs`.  
4. Copier la clé **une seule fois** dans un gestionnaire de secrets (pas dans le repo).  
5. Droits : envoi transactionnel / SMTP API suffisant.

### 1c. Clé SMTP (canal A — Auth Supabase)

1. Même page **Settings** → **SMTP & API**.  
2. Onglet **SMTP**.  
3. Noter le **SMTP login** affiché (souvent `…@smtp-brevo.com` ou l’e-mail compte — **ne pas inventer** : copier la valeur Brevo).  
4. **Generate a new SMTP key** → nom `woloyem-score-staging-supabase-auth`.  
5. Variante **Standard** (64 car.) sauf contrainte longueur côté client.  
6. Copier la clé SMTP complète **une seule fois** (elle ne sera plus réaffichée en entier).

Valeurs serveur Brevo (publiques, OK à documenter) :

| Champ | Valeur |
|-------|--------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` (prioritaire) ; sinon `2525` ; ou `465` + SSL |
| User | *SMTP login* (étape 1c.3) |
| Password | *SMTP key* (étape 1c.6) — **pas** l’API key |

---

## Étape 2 — Supabase staging uniquement (canal A)

1. Ouvrir le dashboard : projet **`hznmtadobqfhumezdgbh`** (vérifier le ref dans l’URL / sélecteur).  
2. **Ne pas** ouvrir ScorApp-XP / production.  
3. Menu gauche → **Authentication**.  
4. Sous-menu **Sign In / Providers** ou **Emails** selon UI : trouver **SMTP Settings**  
   (chemin actuel : **Project Settings** → **Authentication** → section **SMTP Settings**, ou **Authentication** → **Emails** → **SMTP**).  
5. Activer **Enable custom SMTP**.  
6. Renseigner (valeurs secrètes depuis Brevo, jamais dans git) :

| Champ Supabase | Valeur |
|----------------|--------|
| Sender email | Expéditeur Brevo **verified** (ex. `auth@votre-domaine`) |
| Sender name | `WOLOYEM Score` |
| Host | `smtp-relay.brevo.com` |
| Port number | `587` |
| Username | SMTP login Brevo |
| Password | SMTP key Brevo |
| Minimum interval between emails | laisser défaut ou ≥ 1 s (ne pas mettre 0) |

7. **Authentication** → **Providers** / **Email** :  
   - **Confirm email** = **ON** (ne pas désactiver).  
   - Rate limits / protections anti-abus = **laisser activés**.  
8. **URL Configuration** : Site URL / Redirect URLs inclure `http://localhost:3000/**` et `/auth/callback` pour les tests locaux.  
9. Enregistrer. Envoyer un e-mail de test depuis le dashboard si proposé.

Après SMTP custom, le quota « built-in mailer » ne bloque plus les confirmations ; les rate limits Auth restent en place.

---

## Étape 3 — Variables locales (canal B)

Fichiers gitignored uniquement : `.env.local` (dev habituel) et/ou `.env.e2e.local` (parcours staging E2E).

```env
BREVO_API_KEY=<coller la clé API — jamais commit>
BREVO_SENDER_EMAIL=<expéditeur verified, ex. noreply@votre-domaine>
BREVO_SENDER_NAME=WOLOYEM Score
CRON_SECRET=<déjà présent ou générer une valeur aléatoire longue>
```

Pour un test E2E staging, les mêmes `BREVO_*` doivent être dans `.env.e2e.local` car `dev-e2e` charge cet env.

Vérification **sans afficher de secrets** :

```bash
node --experimental-strip-types --import ./test/register.mjs scripts/saas-auth-email-audit.mjs
```

Attendu après config : `BREVO_*=SET` et plus `RATE_LIMITED=yes` (si SMTP Auth staging OK).

---

## Étape 4 — Envoi des jobs d’invitation en local

Les invitations sont enfilées dans `email_jobs` puis envoyées par le worker :

```http
POST /api/cron/maintenance
Authorization: Bearer <CRON_SECRET>
```

Sans `BREVO_API_KEY` + sender, le job reste en retry avec `last_error=not_configured`.

---

## Étape 5 — Test réel (après 1–3)

1. Arrêter `npm run dev` si besoin ; lancer `node scripts/dev-e2e.mjs` (staging).  
2. Une seule fois : audit Auth.  
3. Suite : `tests/e2e/isolated/saas-auth-confirm-invite.spec.ts`  
   **ou** parcours manuel : signup → ouvrir l’e-mail reçu → confirmer → onboarding org → inviter → collab accepte.  
4. Ne pas boucler les signups si rate-limit encore actif.  
5. Remettre `npm run dev` + `.env.local` après les tests.

---

## Checklist rapide

- [ ] Domaine + sender Brevo verified  
- [ ] API key créée (email_jobs) → `.env.e2e.local` / `.env.local`  
- [ ] SMTP login + SMTP key créés  
- [ ] Custom SMTP **uniquement** sur staging `hznmtadobqfhumezdgbh`  
- [ ] Confirm email ON · anti-abus ON  
- [ ] ScorApp-XP / prod SMTP **non modifiés**  
- [ ] Audit + parcours invite PASS
