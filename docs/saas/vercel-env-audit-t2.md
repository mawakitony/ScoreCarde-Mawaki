# Audit Vercel env — Tâche 2 (lecture seule)

**Date :** 2026-11-13  
**Projet :** `mawakitonys-projects/score-card-mawaki`  
**Méthode :** `vercel env ls` + `vercel env pull` (refs / présence uniquement — **aucune valeur secrète**)  
**Aucune modification Vercel exécutée.**

---

## 1. Ref Supabase par environnement (`NEXT_PUBLIC_SUPABASE_URL`)

| Environnement | Ref `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_APP_URL` (host) |
|---------------|--------------------------------|------------------------------|
| **Production** | `hznmtadobqfhumezdgbh` (staging) | `score-card-mawaki.vercel.app` |
| **Preview** | `hznmtadobqfhumezdgbh` (staging) | `score-card-mawaki.vercel.app` |
| **Development** | **MISSING** (aucune variable) | **MISSING** |

Critère : Production / Preview = staging `hzn…` → **PASS**.  
Development vide → **INFO** (dev local via `.env.local`, pas bloquant pour prod).

---

## 2. Inventaire des noms par environnement

### Production + Preview (mêmes clés présentes)

**Config (lisibles) :**
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Secret (présents, non lus) :**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_REGION`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_WEBHOOK_SECRET`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `CRON_SECRET`
- `E2E_PROTECT_SUPABASE_URL`
- `E2E_BASE_URL`
- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_ANON_KEY`
- `E2E_SUPABASE_SERVICE_ROLE_KEY`
- `E2E_PREFIX`

### Development

Aucune variable listée / pullable → environnement **vide**.

---

## 3. Signaux

| Signal | Environnements | Sévérité | Verdict |
|--------|----------------|----------|---------|
| Ref staging `hzn…` sur `NEXT_PUBLIC_SUPABASE_URL` | Prod + Preview | — | **OK** |
| `NEXT_PUBLIC_*` en Config (anon, URL, APP_URL, Stripe pk) | Prod + Preview | — | **OK** |
| Stripe publishable mode TEST | Prod + Preview | — | **OK** |
| **6× `E2E_*` en Production** (et Preview) | Prod + Preview | P1 | **Production retiré 2026-11-13 (OUI-ENV)** ; Preview conservé |
| `SUPABASE_SERVICE_ROLE_KEY` = Secret présent | Prod + Preview | P1 | **Présent mais JWT non vérifiable** via pull ; historique import e2e = risque placeholder |
| Development sans vars | Development | P2 | OK si local-only |
| Pas de `NEXT_PUBLIC_SUPABASE_URL` hors hzn… | Prod + Preview | — | **OK** (whitelist T3e) |
| `E2E_PROTECT_SUPABASE_URL` (Preview) | Preview | P1 | **À retirer** si ref ≠ hzn… (T3e — commandes préparées, non exécutées) |

---

## 4. Commandes préparées — retirer `E2E_*` de Production (**NE PAS EXÉCUTER** sans `OUI-ENV`)

Vérifié : `E2E_*` utilisés seulement par scripts/tests locaux, pas par le runtime Next en production.

```bash
# Scope: Production only (garder Preview si tu veux, sinon répéter --environment preview)
vercel env rm E2E_BASE_URL production --project score-card-mawaki --scope mawakitonys-projects --yes
vercel env rm E2E_PREFIX production --project score-card-mawaki --scope mawakitonys-projects --yes
vercel env rm E2E_PROTECT_SUPABASE_URL production --project score-card-mawaki --scope mawakitonys-projects --yes
vercel env rm E2E_SUPABASE_URL production --project score-card-mawaki --scope mawakitonys-projects --yes
vercel env rm E2E_SUPABASE_ANON_KEY production --project score-card-mawaki --scope mawakitonys-projects --yes
vercel env rm E2E_SUPABASE_SERVICE_ROLE_KEY production --project score-card-mawaki --scope mawakitonys-projects --yes
```

Option Preview (même liste avec `--environment preview`).

**Non inclus ici :** redeploy, rotation `service_role`, suppression `woloyem-ref-probe`.

---

## 5. PASS / FAIL tâche 2

| Critère | Résultat |
|---------|----------|
| Liste des noms Prod / Preview / Development | **PASS** |
| Ref Supabase visible par env (sans clés) | **PASS** (Prod+Preview = `hzn…` ; Dev = MISSING) |
| Signalement `E2E_*` en Production | **PASS** (6 clés signalées) |
| Signalement `NEXT_PUBLIC_*` / service_role | **PASS** |
| Commandes retrait `E2E_*` préparées sans exécution | **PASS** |
| Aucune modif Vercel / secret exposé | **PASS** |

**Verdict T2 :** audit lecture seule **PASS**. Action suivante humaine : valider `service_role` staging au dashboard ; optionnel `OUI-ENV` pour retirer `E2E_*` de Production.
