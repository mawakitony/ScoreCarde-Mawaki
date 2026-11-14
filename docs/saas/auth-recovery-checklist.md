# Checklist manuelle — Auth recovery WOLOYEM Score

**Projet Vercel :** `score-card-mawaki` → https://score-card-mawaki.vercel.app  
**Supabase uniquement :** `hznmtadobqfhumezdgbh` (staging)  
**Interdit :** ScorApp-XP `zkyjaslogpdujyeysjzw`  
**Aucune valeur secrète dans ce document.**

---

## Note Preview / Auth (décision produit)

- Sur Vercel, `NEXT_PUBLIC_APP_URL` en **Preview** pointe actuellement vers le **domaine Production** (`score-card-mawaki.vercel.app`).
- Conséquence : les liens Auth générés depuis une Preview (confirmation, magic link, reset) **renvoient vers Production**.
- **Décision pour l’instant :** exécuter et valider les tests Auth **uniquement sur Production** (pas sur les URL Preview).
- Plus tard (optionnel) : définir une `NEXT_PUBLIC_APP_URL` Preview dédiée + Redirect URLs Preview `https://*-mawakitonys-projects.vercel.app/**` si tu veux tester Auth hors prod.

---

## A. Supabase Auth — URL Configuration (`hzn…` seulement)

Dashboard : [URL Configuration](https://supabase.com/dashboard/project/hznmtadobqfhumezdgbh/auth/url-configuration)

- [ ] **Site URL** = `https://score-card-mawaki.vercel.app`
- [ ] Redirect URL : `https://score-card-mawaki.vercel.app/**`
- [ ] Redirect URL : `https://score-card-mawaki.vercel.app/auth/callback`
- [ ] Redirect URL (local) : `http://localhost:3000/**`
- [ ] Redirect URL (local callback) : `http://localhost:3000/auth/callback`
- [ ] **Confirm email** = **ON** (ne jamais désactiver pour « contourner »)
- [ ] Aucune URL XP / ancien domaine incorrecte laissée comme Site URL

---

## B. Brevo SMTP → Supabase Auth (canal A)

**Rappel :** canal A (SMTP Auth) ≠ canal B (`BREVO_API_KEY` pour `email_jobs`).

Valeurs publiques Brevo (OK à documenter) :

| Champ | Valeur |
|-------|--------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` (prioritaire) |

Dans Brevo :

- [ ] Domaine d’envoi vérifié (SPF + DKIM ; DMARC recommandé)
- [ ] Expéditeur (sender) **verified**
- [ ] Onglet **SMTP** : noter le **SMTP login** (pas l’e-mail inventé)
- [ ] Générer une **SMTP key** (pas la clé API)

Dans Supabase `hzn…` → Authentication → SMTP :

- [ ] Enable custom SMTP
- [ ] Host / Port 587
- [ ] Username = SMTP login Brevo
- [ ] Password = SMTP key Brevo
- [ ] Sender email = adresse verified
- [ ] Sender name = `WOLOYEM Score` (ou équivalent)
- [ ] Sauver
- [ ] Quand prêt : écrire **`SMTP-URLS-DONE`** dans le chat pour la sonde tâche 4

---

## C. Vercel — contrôle rapide (noms / types)

- [ ] Production : `NEXT_PUBLIC_SUPABASE_URL` → ref `hznmtadobqfhumezdgbh`
- [ ] Production : `NEXT_PUBLIC_APP_URL` → `score-card-mawaki.vercel.app`
- [ ] Production : `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Config
- [ ] Production : **plus aucun** `E2E_*` (fait 2026-11-13 via OUI-ENV)
- [ ] Preview : `E2E_*` encore présents (volontaire — non retirés)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` : JWT staging `service_role` (vérifier au dashboard ; pas placeholder)
- [ ] **`INTEGRATIONS_SECRET`** présent (Secret) — **Production** et **Preview** (min 32 car. ; préférer 64 hex)
- [ ] Stripe : TEST uniquement (`sk_test_` / `pk_test_`)
- [ ] Après changements `NEXT_PUBLIC_*` : redeploy seulement avec **`OUI-REDEPLOY`**

---

## D. Rotation des secrets (ordre exact)

**Règle :** ne jamais révoquer l’ancienne clé avant que la nouvelle fonctionne partout.  
**Ordre pour chaque secret :**

1. **Générer** la nouvelle clé chez le fournisseur  
2. **Mettre à jour** `.env.local` (et `.env.e2e.local` / `.env.xp.local` si pertinent)  
3. **Mettre à jour** Vercel (Production ± Preview) — type Config ou Secret selon le cas  
4. **Tester** (login / cron / webhook / e-mail selon le secret)  
5. **Redeploy** si variable `NEXT_PUBLIC_*` ou si le runtime live n’a pas encore la valeur (**`OUI-REDEPLOY`**)  
6. **Révoquer / supprimer** l’ancienne clé chez le fournisseur  
7. Confirmer qu’aucun service n’utilise encore l’ancienne

### Où trouver / régénérer chaque clé

| Secret | Où générer | Où remplacer | Notes |
|--------|------------|--------------|-------|
| **`INTEGRATIONS_SECRET`** (crypto app) | Terminal local : `openssl rand -hex 32` (64 hex) | `.env.local` · `.env.e2e.local` · Vercel **Secret** Production **et** Preview | Obligatoire (check-env / prebuild). HKDF → seal first-access, cookie HMAC, credentials intégrations. **Avant** toute rotation `SUPABASE_SERVICE_ROLE_KEY`. Ne jamais coller la valeur dans le chat. |
| Supabase **secret key** (remplace `service_role`) | Dashboard Supabase `hzn…` → **Project Settings → API Keys** → onglet *Publishable and secret* → `sb_secret_…` | `.env.local` **`SUPABASE_SERVICE_ROLE_KEY`** (nom inchangé) · Vercel Secret même nom | Préférer `sb_secret_…`. Legacy JWT `service_role` encore accepté le temps de la migration. **Jamais** XP. **Après** `INTEGRATIONS_SECRET` en place (T3d). |
| Supabase **publishable key** (remplace `anon`) | Même page → `sb_publishable_…` | `.env.local` **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (nom inchangé) · Vercel **Config** | Préférer `sb_publishable_…`. Legacy JWT `anon` encore accepté. |
| **CRON_SECRET** | Générer localement (`openssl rand -hex 32`) | `.env.local` · Vercel Secret | Utilisé par `/api/cron/*`. |
| Stripe TEST **secret** | [Stripe Dashboard](https://dashboard.stripe.com) → mode **Test** → Developers → API keys → Secret key (roll) | `.env.local` `STRIPE_SECRET_KEY` · Vercel Secret | Uniquement `sk_test_…`. Jamais LIVE. |
| Stripe TEST **publishable** | Même page → Publishable key | `.env.local` `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` · Vercel Config | `pk_test_…` |
| Stripe TEST **webhook signing secret** | Developers → Webhooks → endpoint `https://score-card-mawaki.vercel.app/api/webhooks/stripe` → Signing secret | `.env.local` `STRIPE_WEBHOOK_SECRET` · Vercel Secret | Recréer l’endpoint si besoin. |
| Brevo **API key** (canal B `email_jobs`) | Brevo → Settings → SMTP & API → **API keys** → Generate | `.env.local` `BREVO_API_KEY` · Vercel Secret | ≠ SMTP key. |
| Brevo **SMTP key** (canal A Auth) | Brevo → SMTP & API → **SMTP** → Generate SMTP key | **Uniquement** Supabase SMTP Settings `hzn…` (pas une env Next obligatoire) | Après update SMTP → retester Auth e-mail. |
| PostgreSQL password staging (optionnel) | Supabase `hzn…` → Project Settings → Database | `.env.local` / scripts `SUPABASE_DB_PASSWORD` · Vercel si présent | **Dernier** ; coupe les connexions DB existantes. Demander OK dédié. |

### Cases rotation

- [ ] **`INTEGRATIONS_SECRET`** — local (`.env.local`) + e2e (`.env.e2e.local`) + Vercel Production + Preview (**avant** rotation service_role)
- [ ] service_role staging (générer → env local → Vercel → test → [redeploy si besoin] → révoquer ancienne) — seulement après INTEGRATIONS_SECRET
- [ ] CRON_SECRET
- [ ] Brevo API key (canal B)
- [ ] Brevo SMTP key (canal A) + retest Auth
- [ ] Stripe TEST sk / pk / webhook secret
- [ ] (Optionnel) DB password staging

N’exécuter la rotation automatisée / en masse que sur **`OUI-ROTATE`**.

---

## E. Après SMTP-URLS-DONE + OUI-REDEPLOY

- [ ] Login compte staging existant confirmé → `/dashboard`
- [ ] Signup → e-mail reçu → callback → session
- [ ] Magic link / reset (si utilisés)
- [ ] Session persistante après refresh
- [ ] `/dashboard` sans session → redirect login
- [ ] Platform Admin visible seulement si ligne `platform_admins` sur `hzn…`
- [ ] MFA Platform Admin (étape manuelle)

---

## F. PASS / FAIL checklist (à remplir après exécution manuelle)

| Bloc | Statut |
|------|--------|
| A — URL Configuration | ☐ |
| B — SMTP Brevo Auth | ☐ |
| C — Vercel contrôles | ☐ (E2E_* Production retiré : fait) |
| D — Rotations | ☐ (en attente OUI-ROTATE) |
| E — Recette Auth | ☐ (après SMTP + redeploy) |
