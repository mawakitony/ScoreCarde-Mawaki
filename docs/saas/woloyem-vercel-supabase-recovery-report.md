# WOLOYEM Score — Remise en état Auth / Vercel / Supabase staging

**Date :** 2026-11-09  
**Repo :** `mawakitony/ScoreCarde-Mawaki` (`main`)  
**Vercel :** `mawakitonys-projects/score-card-mawaki` → https://score-card-mawaki.vercel.app  
**Supabase autorisé :** `hznmtadobqfhumezdgbh` (staging)  
**Supabase protégé (interdit) :** `zkyjaslogpdujyeysjzw` (ScorApp-XP) — **aucune modification**

**Statut du document :** Phases 1–2 faites. **Phase 3 exécutée** (2026-11-09). Phases 4–5 = checklist opérateur (dashboard). Tests partiels faits. **Pas de rotation / probe delete / redeploy** (non autorisés). Aucun secret dans ce fichier.

---

## 1. Diagnostic initial

### 1.1 Symptôme

Après déploiement Vercel, la connexion échoue (ou les parcours e-mail Auth restent bloqués).

### 1.2 Cause racine (synthèse)

| # | Cause | Statut |
|---|--------|--------|
| A | **Décalage d’instance** : local `.env.local` = XP `zky…` ; Vercel Production = staging `hzn…` | Confirmé |
| B | Import initial Vercel depuis `.env.e2e.local` (bloc `E2E_*` + `APP_URL=localhost`) | Confirmé (inventaire clés) |
| C | `NEXT_PUBLIC_*` stockées en **Secret** (illisibles, anti-pattern) | Partiellement corrigé (voir §4) |
| D | SMTP Auth Supabase staging : `SMTP_SEND_FAILED` | Confirmé (audit 2026-10-30) |
| E | Site URL / Redirect URLs Supabase non validés pour le domaine Vercel | Non accessible via API — à vérifier dashboard |
| F | `SUPABASE_SERVICE_ROLE_KEY` / `E2E_*_SERVICE_ROLE` locaux e2e = placeholder (~41 car.) | Confirmé localement ; Vercel illisible (Secret) |
| G | Confusion de nommage URL : `score-carde-mawaki` (404) vs `score-card-mawaki` (OK) | Confirmé |

### 1.3 Projet Vercel réel

- Nom : **`score-card-mawaki`** (pas `score-carde-mawaki`)
- URL prod : `https://score-card-mawaki.vercel.app`
- Dernier déploiement connu au moment de l’audit Auth : Ready / commit `753437e` (à redéployer après corrections d’env)
- Projet parasite créé par erreur d’audit CLI : **`woloyem-ref-probe`** — à supprimer (autorisé séparément)

### 1.4 Cohérence des project refs

| Source | `NEXT_PUBLIC_SUPABASE` ref | Notes |
|--------|---------------------------|--------|
| `.env.local` | `zkyjaslogpdujyeysjzw` | Dev local courant → **XP** (ne pas utiliser pour Vercel WOLOYEM) |
| `.env.e2e.local` | `hznmtadobqfhumezdgbh` | Staging + protect XP |
| Vercel Production (Config, pull 2026-11-09) | **`hznmtadobqfhumezdgbh`** | Confirmé via `vercel env pull` (valeur Config) |
| Vercel Production `NEXT_PUBLIC_APP_URL` | host `score-card-mawaki.vercel.app` | Confirmé Config |
| Vercel Preview | **pas** de `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_APP_URL` | **Trou Preview** après recréation Config Production-only |

---

## 2. Liste des problèmes identifiés

### P0 — Bloquants Auth / prod

1. SMTP Auth staging (`SMTP_SEND_FAILED`) → signup / magic link / reset / confirmation bloqués.
2. Redirect URLs / Site URL Supabase staging non validés pour `https://score-card-mawaki.vercel.app`.
3. Preview sans `NEXT_PUBLIC_APP_URL` ni `NEXT_PUBLIC_SUPABASE_URL` (si deploy Preview).
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` encore **Secret** (Production+Preview) — à migrer en Config.
5. Secrets considérés **compromis** (partagés en conversation) → rotation requise (Phase 2).
6. Service role / DB password e2e locaux = placeholders — risque que Vercel ait reçu les mêmes valeurs.

### P1 — Hygiène / sécurité opérationnelle

7. Variables `E2E_*` présentes en Production (+ Preview) — ne doivent pas piloter le runtime métier.
8. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` encore Secret (préférence Config).
9. `CRON_SECRET` local e2e court (~25 car.) — renforcer à la rotation.
10. Local `.env.local` pointe XP : risque de confusion opérateur (OK pour XP, interdit pour config Vercel WOLOYEM).
11. Projet `woloyem-ref-probe` à supprimer.

### P2 — Améliorations

12. Alignement documentation / checklist GO-NOGO.
13. Development env Vercel vide (optionnel).
14. Pas de bug code Auth structurel identifié comme cause principale (Server Actions + `proxy.ts` + `@supabase/ssr` 0.12.7 cohérents).

### Inventaire variables (classification)

#### Obligatoires runtime Production (code `lib/env.ts` + app)

| Variable | Public/Secret | Type Vercel cible |
|----------|---------------|-------------------|
| `NEXT_PUBLIC_APP_URL` | Public | **Config** |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | **Config** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (anon) | **Config** |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | **Secret** |
| `CRON_SECRET` | Secret | **Secret** |

#### Fortement recommandées Production

| Variable | Notes |
|----------|--------|
| `BREVO_API_KEY` | Canal B `email_jobs` (≠ SMTP Auth) |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Expéditeur verified |
| `STRIPE_SECRET_KEY` | **TEST only** (`sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | TEST (`pk_test_…`) — Config préférable |
| `STRIPE_WEBHOOK_SECRET` | TEST |
| `STRIPE_PRICE_STARTER_MONTHLY` | Price TEST |

#### Facultatives / métier

`SUPABASE_DB_PASSWORD`, `SUPABASE_DB_REGION` (migrations/scripts locaux uniquement — **pas nécessaires** au runtime Next sur Vercel), AI_*, MFA_POLICY, etc.

#### Réservées E2E (jamais config métier Production)

`E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_PROTECT_SUPABASE_URL`, `E2E_BASE_URL`, `E2E_PREFIX`, `PLATFORM_E2E_*`

#### Utilisées par le code Auth (clients)

- Browser / Server / Proxy : **uniquement** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Admin / workers : `SUPABASE_SERVICE_ROLE_KEY`
- Redirects e-mail Auth : origin request (`x-forwarded-host`) ou `getAppUrl()` ← `NEXT_PUBLIC_APP_URL`
- Callback : `/auth/callback` + `exchangeCodeForSession` + `bootstrap_membership`

---

## 3. Secrets nécessitant une rotation

**Principe :** traiter toutes les valeurs déjà exposées en chat comme compromises.  
**Règle :** créer / tester la **nouvelle** clé partout → **puis seulement** révoquer l’ancienne.  
**Interdit :** toucher ScorApp-XP ; révoquer avant validation ; coller secrets dans git/chat/rapport.

| # | Secret | Consommateurs | Ordre proposé | Création | Mise à jour | Test | Révocation | Rollback |
|---|--------|---------------|---------------|----------|-------------|------|------------|----------|
| 1 | **Supabase staging `service_role`** | Vercel `SUPABASE_SERVICE_ROLE_KEY`, scripts admin, email worker, cron, E2E service | 1 | Dashboard Supabase `hzn…` → API → rotate service_role (ou JWT secret project selon UI) | Vercel Secret (Prod+Preview) ; `.env.e2e.local` local only | Health / cron dry / script ping staging | Révoquer ancienne après OK | Remettre ancienne dans Vercel si besoin tant que non révoquée |
| 2 | **`CRON_SECRET`** | `/api/cron/*` Authorization | 2 | `openssl rand -hex 32` (local) | Vercel Secret Prod+Preview ; vercel.json cron headers déjà branchés sur env | Appel cron avec nouveau secret → 200 ; ancien → 401 | Remplacer seule valeur (pas de multi-version) | Restaurer ancienne valeur Vercel |
| 3 | **Brevo API key** (canal B) | `BREVO_API_KEY`, `email_jobs` | 3 | Brevo → Generate API key `woloyem-score-staging-email-jobs-rotated` | Vercel + `.env.e2e.local` | Envoi test job / health Brevo | Delete ancienne clé API Brevo | Recréer/réactiver clé précédente si encore listée |
| 4 | **Brevo SMTP key** (canal A) | **Uniquement** SMTP Settings Supabase Auth `hzn…` | 4 | Brevo SMTP → new SMTP key | Dashboard Supabase SMTP password | `saas-auth-email-audit` **une** fois ; signup test | Delete ancienne SMTP key | Remettre ancienne SMTP key dans Supabase |
| 5 | **Stripe TEST `sk_test`** | Billing, webhooks sortants | 5 | Stripe Dashboard → roll test secret (ou restreindre + nouvelle clé restreinte) | Vercel Secret | Checkout test / API balance | Révoquer ancienne sk_test | Remettre ancienne sk_test |
| 6 | **Stripe TEST webhook secret** | `/api/webhooks/stripe` | 6 | Stripe → Webhook endpoint → reveal/roll signing secret ; URL = `https://score-card-mawaki.vercel.app/api/webhooks/stripe` | Vercel `STRIPE_WEBHOOK_SECRET` | Envoyer event test Stripe | N/A (secret endpoint) | Remettre ancien whsec |
| 7 | **PostgreSQL password staging** | Scripts migrations (`SUPABASE_DB_PASSWORD`) — **pas** le runtime Vercel Next | **Dernier / optionnel** | Supabase DB settings → reset password | `.env.e2e.local` + Vercel si conservé | `saas-staging-db-ping` | Ancien MDP invalidé immédiatement au reset | **Risque élevé** : connexions actives / poolers — **demander OK dédié** |

### Commandes de préparation (sans exécution de révocation)

```bash
# Générer CRON_SECRET (ne pas coller la sortie dans le chat/rapport)
openssl rand -hex 32

# Vérifier refs JWT sans afficher la clé (exemple local)
node -e "const k=process.env.SUPABASE_SERVICE_ROLE_KEY; const p=JSON.parse(Buffer.from(k.split('.')[1],'base64url')); console.log(p.ref,p.role)"
```

### Checklist avant chaque révocation

- [ ] Nouvelle valeur présente sur Vercel (environnements concernés)
- [ ] Redeploy Production effectué si variable build-time (`NEXT_PUBLIC_*`)
- [ ] Test fonctionnel OK
- [ ] Autorisation explicite utilisateur pour révoquer l’ancienne

---

## 4. Variables Vercel corrigées

### 4.1 État après Phase 3 (vérifié par `env pull` refs only)

| Variable | Type | Targets | Vérification | Statut |
|----------|------|---------|--------------|--------|
| `NEXT_PUBLIC_APP_URL` | Config | Production + Preview | host `score-card-mawaki.vercel.app` | **OK** |
| `NEXT_PUBLIC_SUPABASE_URL` | Config | Production + Preview | ref `hznmtadobqfhumezdgbh` | **OK** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config | Production, Preview | JWT `ref=hzn…` `role=anon` | **OK** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Config | Production, Preview | mode TEST | **OK** |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Production, Preview | Illisible ; local e2e = placeholder → **contrôle manuel requis** | **À VALIDER** |
| `E2E_*` | Secret | Production, Preview | Inutiles au runtime Next prod ; **conservées** (pas de suppression) | KEEP |

### 4.2 Actions Phase 3 réalisées

- Preview : ajout Config `NEXT_PUBLIC_APP_URL` + `NEXT_PUBLIC_SUPABASE_URL` (staging / URL canonique).
- Migration Secret → Config : anon key staging + Stripe publishable TEST.
- Incident mineur corrigé : valeur temporaire Preview `APP_URL` pendant un debug CLI → immédiatement remplacée par l’URL canonique.
- **Aucun** push de `service_role` placeholder.
- **Aucun** redeploy (non autorisé) → le déploiement live peut encore servir d’anciennes valeurs `NEXT_PUBLIC_*` inlinées au build.

### 4.3 Encore ouvert

- Validation manuelle `SUPABASE_SERVICE_ROLE_KEY` (JWT staging `service_role`, pas placeholder).
- Retrait `E2E_*` prod → attendre `OUI-REMOVE-E2E`.
- Rotation secrets → attendre `OUI-ROTATE`.
- Redeploy → attendre `OUI-REDEPLOY`.

---

## 5. Configuration Supabase Auth (staging only)

**Projet :** `hznmtadobqfhumezdgbh`  
**Accès agent :** non disponible (dashboard manuel) → statut **à valider par l’opérateur**

### Cible attendue

| Paramètre | Valeur |
|-----------|--------|
| Site URL | `https://score-card-mawaki.vercel.app` |
| Redirect URLs | `https://score-card-mawaki.vercel.app/**` |
| | `https://score-card-mawaki.vercel.app/auth/callback` |
| | (optionnel local) `http://localhost:3000/**` |
| Confirm email | **ON** (ne pas désactiver) |
| OAuth | Non utilisé dans le flux login actuel (password + magic link) |

### Comportement code (référence)

- Login : `signInWithPassword` → `bootstrap_membership` → `/dashboard` ou `/onboarding` si `organisation_required` ; sinon sign-out + erreur
- Signup / magic link : `emailRedirectTo` = `{origin}/auth/callback?next=…`
- Callback : `exchangeCodeForSession` puis bootstrap

**Aucune modification Auth appliquée dans cette phase.**

---

## 6. Configuration SMTP (Brevo × Supabase)

Deux canaux distincts (voir `docs/saas/brevo-staging-setup.md`) :

| Canal | Usage | Identifiants | Preuve actuelle |
|-------|-------|--------------|-----------------|
| **A — SMTP Auth** | Confirmation, magic link, reset | Host `smtp-relay.brevo.com` :587 + login SMTP + **SMTP key** (≠ API key) | `SMTP_SEND_FAILED=yes` (retest) |
| **B — API Brevo** | `email_jobs` app | `BREVO_API_KEY` | Présente en env ; **ne prouve pas** A |

### Procédure proposée (autorisation requise avant écriture SMTP)

1. Brevo : sender + domaine **verified**
2. Générer **nouvelle** SMTP key (canal A)
3. Supabase `hzn…` → Authentication → SMTP : Enable custom SMTP, port 587, sender verified
4. **Une** sonde `scripts/saas-auth-email-audit.mjs` (staging only)
5. Si PASS → rotation/révocation ancienne SMTP key
6. Ne jamais désactiver Confirm email

**Aucune modification SMTP exécutée dans les phases 1–2.**

---

## 7. Modifications de code

**Phases 1–2 :** aucune modification de code applicatif.

**Revue :** `actions/auth.ts`, `lib/supabase/{server,client,proxy}.ts`, `proxy.ts`, `app/auth/callback` — pattern Next 16 / SSR correct ; pas de correctif P0 code identifié avant env + SMTP + redirects.

Correctifs code éventuels (Phase 6, si toujours nécessaires après infra) :
- Messages d’erreur plus précis (config vs credentials vs unconfirmed)
- Garde-fou build : refuser `NEXT_PUBLIC_APP_URL` contenant `localhost` en production

---

## 8. Résultats des tests

| Test | Résultat |
|------|----------|
| Inventaire env / Vercel | FAIT |
| Prod+Preview Config URL/ref/anon/Stripe pk | FAIT (refs OK staging) |
| Prod `/login` 200 + formulaire | PASS |
| Prod `/api/health` | PASS `{"ok":true}` |
| Prod `/dashboard` sans session | PASS redirect 307 |
| Staging connectivity probe (`hzn…`) | PASS (ANON + admin orgs) |
| Staging `signIn` credentials invalides | PASS (Auth joignable, `invalid_credentials`) |
| SMTP Auth signup probe | **DIFFÉRÉ** — attendre config dashboard Phases 4–5 (évite spam / orphelins) |
| Login compte staging réel + session persistante | **BLOQUÉ** — besoin compte confirmé + **OUI-REDEPLOY** pour appliquer `NEXT_PUBLIC_*` |
| Build / lint / redeploy | NON (pas d’autorisation redeploy) |

---

## 9. Éléments encore bloqués

1. Autorisation pour **Phase 3** (compléter Vercel Config/Secrets, Preview, retrait E2E prod).
2. Autorisation pour **Phase 4–5** (Auth URLs + SMTP Brevo sur `hzn…` uniquement).
3. Autorisation pour **rotation / révocation** secrets (§3).
4. Autorisation pour **suppression** `woloyem-ref-probe`.
5. Autorisation pour **redeploy** Production.
6. Accès dashboard Supabase Auth/SMTP non automatisé → checklist manuelle opérateur.
7. Compte staging de test (email confirmé) à fournir ou créer **après** SMTP OK — sans utilisateurs réels clients.

---

## 10. Checklist GO / NO-GO production

### GO seulement si tous les points sont verts

- [ ] `NEXT_PUBLIC_SUPABASE_URL` Production = `hznmtadobqfhumezdgbh` (Config)
- [ ] `NEXT_PUBLIC_APP_URL` Production = `https://score-card-mawaki.vercel.app` (Config)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` Config, JWT `ref=hzn…` `role=anon`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` Secret, JWT `ref=hzn…` `role=service_role` (pas placeholder)
- [ ] Preview : mêmes `NEXT_PUBLIC_SUPABASE_*` + APP_URL cohérents
- [ ] Aucune clé XP sur Vercel WOLOYEM
- [ ] Stripe exclusivement TEST
- [ ] Site URL + Redirect URLs Supabase staging OK
- [ ] SMTP Auth : plus de `SMTP_SEND_FAILED` (1 sonde)
- [ ] Login staging existant + session persistante + logout + protection `/dashboard`
- [ ] Signup + e-mail confirmation + callback
- [ ] Cron authentifié avec `CRON_SECRET` fort
- [ ] Secrets exposés rotés (ou plan daté + accepté)
- [ ] Redeploy Production après env
- [ ] `woloyem-ref-probe` supprimé
- [ ] ScorApp-XP intact (aucune action)

### NO-GO si

- SMTP Auth encore en échec
- Confirm email désactivé pour « contourner »
- Service role / URL pointent vers XP
- Stripe LIVE
- Preview/Prod sans anon/URL
- Deploy sans retest login

**Verdict actuel :** **NO-GO** — Phase 3 env project OK ; reste Site URL/Redirects + SMTP Auth (dashboard), validation service_role, **redeploy**, login staging réel, rotation secrets.

---

## Annexes — Demandes d’autorisation (prochaine étape)

Répondre par lot, par exemple :

1. **OUI-PHASE3** — Corriger Vercel (Preview Config, anon Config, vérifier service_role staging, Stripe publishable Config, plan retrait E2E prod).
2. **OUI-PHASE4-5** — Je configure manuellement Site URL/Redirects + SMTP ; ou tu guides pas à pas (l’agent ne peut pas écrire dans le dashboard Supabase sans accès).
3. **OUI-ROTATE** — Exécuter la rotation dans l’ordre §3 (sans révoquer avant validation).
4. **OUI-DELETE-PROBE** — Supprimer le projet Vercel `woloyem-ref-probe`.
5. **OUI-REDEPLOY** — Redeploy Production après env.
6. **OUI-TESTS** — Lancer sondes non destructives staging (1 audit SMTP max).

Sans l’un de ces accords, l’agent reste en mode préparation / documentation.
