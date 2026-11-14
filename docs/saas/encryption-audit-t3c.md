# Tâche 3c — Audit chiffrement avant rotation

**Date :** 2026-11-14  
**Cible :** staging `hznmtadobqfhumezdgbh` uniquement  
**Contraintes respectées :** lecture + `--dry-run` uniquement ; aucun secret affiché ; aucune rotation ; aucun re-chiffrement réel.

**Script :** `scripts/saas-encryption-audit-dry-run.mjs`  
**PROBE dry-run :** PASS (exit 0)

---

## Verdict

| Critère | Résultat |
|---------|----------|
| Inventaire chiffrement / déchiffrement | **PASS** |
| Comptage staging sans plaintext | **PASS** (0 ciphertext utile) |
| Présence `INTEGRATIONS_SECRET` (noms) | **FAIL** — absent local + absent inventaire Vercel T2 |
| Plan de migration proposé (non exécuté) | **PASS** |
| Liste identifiants tiers à faire tourner | **PASS** |
| Aucune rotation / aucun secret loggé | **PASS** |

### Verdict T3c : **FAIL (bloquant rotation `SUPABASE_SERVICE_ROLE_KEY`)**

Raisons bloquantes :

1. `INTEGRATIONS_SECRET` n’existe nulle part (`.env.local`, `.env.e2e.local`, inventaire Vercel Production/Preview T2).
2. Le **scellement** first-access utilise encore `SUPABASE_SERVICE_ROLE_KEY` (`proofSecret()` → `sealSecretValue`).
3. Le worker garde un **repli** service_role — correct tant que des `enc:` historiques existent, mais la rotation sans migration + bascule du seal casse les nouveaux jobs.

Atténuation staging : **0 ligne** chiffrée aujourd’hui → le re-chiffrement est un no-op, mais la bascule code/env reste obligatoire **avant** `OUI-ROTATE`.

---

## 1. Inventaire — chiffrement / déchiffrement

### A. Format `enc:iv.tag.data` (AES-256-GCM, clé = SHA-256(secret))

| Fichier | Fonction | Opération | Matériau | Stockage |
|---------|----------|-----------|----------|----------|
| `lib/auth/first-access.ts` | `sealSecretValue` / `openSecretValue` | CHIFFRE / DÉCHIFFRE | secret passé en argument | N/A (utilitaire) |
| `lib/auth/first-access.ts` | `firstAccessEmailPayload` | CHIFFRE `accessCode` | `input.secret` | payload email |
| `actions/first-access.ts` | `proofSecret` | fournit le secret | **`SUPABASE_SERVICE_ROLE_KEY`** | — |
| `actions/first-access.ts` | `enqueueAccess` → `firstAccessEmailPayload` | CHIFFRE | via `proofSecret()` = **service_role** | `email_jobs.payload.accessCode` |
| `lib/email/worker.ts` | `unsealRecord` | DÉCHIFFRE champs `enc:` | **`INTEGRATIONS_SECRET` puis `SUPABASE_SERVICE_ROLE_KEY`** | lit `email_jobs.payload` |

**Table / colonne :** `email_jobs.payload` → clé JSON `accessCode` (template `first_access`).  
**Note :** `organization_invitations.first_access_code_hash` est un **hash**, pas un ciphertext.

### B. Format packed `iv.tag.data` (sans préfixe `enc:`)

| Fichier | Fonction | Opération | Matériau | Stockage |
|---------|----------|-----------|----------|----------|
| `lib/integrations/crypto.ts` | `encryptSecret` / `decryptSecret` | CHIFFRE / DÉCHIFFRE | `INTEGRATIONS_SECRET` | N/A (utilitaire) |
| `actions/integrations.ts` | `saveWebhook` / `saveBrevo` (etc.) | CHIFFRE | **`INTEGRATIONS_SECRET`** | `integrations.encrypted_credentials` |
| `actions/integrations.ts` | test webhook | DÉCHIFFRE | **`INTEGRATIONS_SECRET`** | idem |
| `lib/integrations/worker.ts` | `readSecret` | DÉCHIFFRE | **`INTEGRATIONS_SECRET` seulement** (pas de repli service_role) | idem |
| `lib/reports/queue.ts` | `safeDecrypt` | DÉCHIFFRE | **`INTEGRATIONS_SECRET`** | Brevo API key pour envoi rapport |

**Table / colonne :** `integrations.encrypted_credentials`  
**Contenu typique :** clé API Brevo, secret webhook sortant.

### C. HMAC (pas AES — hors re-chiffrement DB)

| Fichier | Fonction | Matériau | Stockage |
|---------|----------|----------|----------|
| `lib/auth/first-access.ts` | `sealProof` / `openProof` | même `proofSecret()` = **service_role** | cookie httpOnly `first-access` (TTL 15 min) |

Cookies éphémères : invalidés naturellement après rotation ; pas de migration DB.

### D. Hors périmètre produit WOLOYEM

`design-references/ko-predict/**` utilise `SUPABASE_SERVICE_ROLE_KEY` comme client admin, **pas** comme clé de chiffrement applicative — exclu du plan.

---

## 2. Comptages staging `hzn…` (dry-run, sans contenu)

| Source | Total lignes | Avec ciphertext | Attribution clé |
|--------|--------------|-----------------|-----------------|
| `integrations` | 0 | **0** | N/A |
| `integrations.encrypted_credentials` non null | — | **0** | N/A |
| `email_jobs` | 3 | **0** champ `enc:` | templates `trial_ending_j*` uniquement |
| `email_jobs` template `first_access` | 0 | **0** | N/A |
| `organization_invitations` `first_access_code` | 0 | hash seulement | N/A |

**Limite de format :** le ciphertext **n’embarque pas** d’identifiant de clé. L’attribution = « open réussit avec secret X ».  
Ici : **aucune ligne à attribuer**.  
`INTEGRATIONS_SECRET` absent → impossible de compter « scellé avec INTEGRATIONS_SECRET » (reste 0 faute de ciphertext).

Sortie dry-run (extraits non secrets) :

```
HOST=hznmtadobqfhumezdgbh.supabase.co
INTEGRATIONS_SECRET_PRESENT=no
ROWS_WITH_CIPHERTEXT=0
JOBS_SCANNED=0 (first_access)
ROWS_WITH_enc_ACCESS_CODE=0
PROBE=PASS
```

---

## 3. Présence `INTEGRATIONS_SECRET` (noms seulement)

| Emplacement | Présent ? |
|-------------|-----------|
| `.env.local` | **ABSENT** |
| `.env.e2e.local` | **ABSENT** |
| Vercel Production | **ABSENT** (inventaire T2 `docs/saas/vercel-env-audit-t2.md` — pas dans la liste Config/Secret) |
| Vercel Preview | **ABSENT** (idem T2) |

Re-check CLI Vercel du 2026-11-14 : `vercel env ls` en erreur API locale → pas de relecture live ; **confiance = audit T2 + absence locale**.

---

## 4. Plan de migration (à exécuter seulement après gates dédiés)

### Étape A — Créer `INTEGRATIONS_SECRET` (opérateur)

1. Générer localement un secret fort (≥ 32 bytes, hex/base64) — **ne jamais le coller dans le chat / les logs**.
2. Ajouter le **nom** `INTEGRATIONS_SECRET` dans :
   - `.env.local`
   - Vercel Production + Preview (Secret)
3. Ne **pas** encore retirer le repli service_role du worker.
4. Ne **pas** encore tourner `SUPABASE_SERVICE_ROLE_KEY`.

### Étape B — Bascule du **seal** first-access (code)

1. `proofSecret()` : préférer `INTEGRATIONS_SECRET`, fallback temporaire `SUPABASE_SERVICE_ROLE_KEY` (ou seal uniquement avec INTEGRATIONS une fois env déployée).
2. Redeploy après env (gate `OUI-REDEPLOY`).
3. Nouveaux `email_jobs.payload.accessCode` scellés avec `INTEGRATIONS_SECRET`.

### Étape C — Script re-chiffrement idempotent (à écrire ; **pas exécuté en T3c**)

Cible : `scripts/saas-encryption-reencrypt.mjs`

Comportement :

- Cible forcée staging `hzn…` (refuser XP `zky…`).
- Modes : `--dry-run` (défaut) / `--apply` (gate explicite).
- Pour chaque `email_jobs` avec `payload.*.` préfixé `enc:` :
  - tenter open avec `SUPABASE_SERVICE_ROLE_KEY` puis `INTEGRATIONS_SECRET` ;
  - si open OK avec ancienne clé ≠ INTEGRATIONS : re-seal avec `INTEGRATIONS_SECRET` ;
  - si déjà open avec INTEGRATIONS : skip (idempotent) ;
  - si ni l’un ni l’autre : `FAIL_UNOPENABLE` (compteur).
- Pour chaque `integrations.encrypted_credentials` :
  - aujourd’hui : seulement INTEGRATIONS (pas de migrate service_role) ;
  - si un jour format `enc:` ou seal croisé : même logique.
- Rapport : `SCANNED / ALREADY_NEW / WOULD_REECRYPT / REENCRYPTED / UNOPENABLE` — **jamais** plaintext ni secret.
- `--dry-run` staging actuel attendu : tous compteurs à 0 (no-op).

### Étape D — Retirer le repli service_role (**après** C + 0 UNOPENABLE)

1. `lib/email/worker.ts` `unsealRecord` : **uniquement** `INTEGRATIONS_SECRET`.
2. `proofSecret()` : **uniquement** `INTEGRATIONS_SECRET`.
3. Tests unitaires / e2e first-access + worker.
4. Alors seulement : gate `OUI-ROTATE` sur les clés Supabase.

### Ordre interdit

```
❌ tourner SERVICE_ROLE → puis découvrir des enc: scellés avec l’ancienne clé
✅ INTEGRATIONS_SECRET env → seal code → re-encrypt (dry-run puis apply) → drop fallback → rotate
```

---

## 5. Identifiants tiers à faire tourner (clé de chiffrement fuitée)

Contexte : fuite / exposition de **`SUPABASE_SERVICE_ROLE_KEY`** (matériau de seal historique first-access) + accès admin DB inhérent à cette clé.

### Chiffrés avec service_role (AES `enc:`)

| Donnée | Tiers ? | Action |
|--------|---------|--------|
| `email_jobs.payload.accessCode` | Non (codes app) | Invalider invitations first-access pending ; ne pas « rotator » un IdP tiers |
| Cookie `sealProof` | Non | Expirent seuls (15 min) |

**Aucun identifiant tiers n’est chiffré avec `SUPABASE_SERVICE_ROLE_KEY` dans le code actuel.**

### Chiffrés avec `INTEGRATIONS_SECRET` (quand présent)

| Donnée | Provider | Action si INTEGRATIONS_SECRET fuité |
|--------|----------|-------------------------------------|
| Clé API Brevo | Brevo | **Régénérer** clé API Brevo + re-saisir dans Integrations |
| Secret webhook sortant | endpoints clients | **Régénérer** secrets webhook + mettre à jour côté destinataires |
| (doc) refresh tokens avatars / futures intégrations | selon provider | même règle : rotate chez le provider puis re-seal |

Staging actuel : **0** `integrations` → rien à re-saisir pour l’instant.

### Conséquence plus large de la fuite service_role (hors ciphertext)

Même sans ciphertext tiers sous service_role, une fuite service_role = **compromission DB** :

- Tourner la clé Supabase (publishable/secret) dès que le plan seal/migrate est vert.
- Tourner aussi les secrets **en clair** dans Vercel susceptibles d’avoir été exposés ensemble : `BREVO_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, etc. (gate `OUI-ROTATE` séparé — hors T3c).

---

## 6. Critères pour lever le blocage T3c

- [ ] `INTEGRATIONS_SECRET` présent local + Vercel Production/Preview (noms vérifiés)
- [ ] Seal first-access utilise `INTEGRATIONS_SECRET`
- [ ] Dry-run re-encrypt : `UNOPENABLE=0` ; apply si `WOULD_REECRYPT>0`
- [ ] Repli service_role retiré du worker
- [ ] Alors : autoriser `OUI-ROTATE`

---

## 7. Non-exécuté volontairement

- Aucune écriture DB
- Aucune rotation de clé
- Aucun `vercel env add`
- Aucun redeploy
- Script re-encrypt `--apply` non créé/exécuté (seul dry-run d’audit comptage)
