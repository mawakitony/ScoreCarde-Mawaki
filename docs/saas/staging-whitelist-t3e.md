# Tâche 3e — Base unique staging (`ALLOWED_SUPABASE_REF`)

**Date :** 2026-11-14  
**Ref autorisée :** `hznmtadobqfhumezdgbh`  
**Host :** `https://hznmtadobqfhumezdgbh.supabase.co`  
**Constante :** `lib/env/allowed-supabase.ts` — *à changer volontairement le jour du passage LIVE*

---

## Verdict code : **PASS**

| Critère | Résultat |
|---------|----------|
| Whitelist `check-env` (plus de liste noire XP / `ALLOW_XP`) | **PASS** |
| Runtime (`instrumentation` + clients Supabase) | **PASS** |
| Suppression `dev:xp` / `.env.xp.example` / `ALLOW_XP` | **PASS** |
| Bandeau « BASE ACTIVE : STAGING · hzn… » | **PASS** |
| Tests hzn OK / zky+vide+autre FAIL | **PASS** |
| Docs checklist + audit | **PASS** |
| Commit séparé non poussé | **PASS** `7378cfa` (ahead 1, non poussé) |
| Build + secret éphémère | **PASS** |

---

## `.env.xp.local` (ne pas supprimer par l’agent)

**Présent :** `C:\Users\Admin\Downloads\ScorApp-Woloyem\.env.xp.local`  
À **déplacer hors du repo** manuellement (ex. backup hors workspace). Ne plus l’utiliser.

---

## Vercel — variables hors whitelist (noms) — **retrait non exécuté**

D’après l’inventaire T2 (Preview encore) et la politique « hzn only » :

| Nom | Environnement | Motif |
|-----|---------------|--------|
| `E2E_PROTECT_SUPABASE_URL` | Preview (historiquement aussi Prod, retiré OUI-ENV) | Pointait vers une **autre** ref (protect / zky…) |

Autres `E2E_*` Preview (`E2E_BASE_URL`, `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`, `E2E_PREFIX`) : OK **seulement si** leurs URLs = hzn… ; sinon à retirer aussi.  
`NEXT_PUBLIC_SUPABASE_URL` Prod/Preview doit rester hzn… (déjà le cas T2).

### Commandes préparées (ne pas lancer sans OK ops)

```bash
vercel --scope mawakitonys-projects env rm E2E_PROTECT_SUPABASE_URL preview --project score-card-mawaki --yes
# Optionnel si tu veux purger tout E2E Preview :
# vercel --scope mawakitonys-projects env rm E2E_BASE_URL preview --project score-card-mawaki --yes
# vercel --scope mawakitonys-projects env rm E2E_SUPABASE_URL preview --project score-card-mawaki --yes
# vercel --scope mawakitonys-projects env rm E2E_SUPABASE_ANON_KEY preview --project score-card-mawaki --yes
# vercel --scope mawakitonys-projects env rm E2E_SUPABASE_SERVICE_ROLE_KEY preview --project score-card-mawaki --yes
# vercel --scope mawakitonys-projects env rm E2E_PREFIX preview --project score-card-mawaki --yes
```

Puis redeploy Preview/Production selon besoin.
