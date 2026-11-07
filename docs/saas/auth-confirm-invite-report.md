# Rapport — confirmation Auth réelle + invitations (staging)

**Date :** 2026-10-28  
**Cible :** Supabase staging `hznmtadobqfhumezdgbh` uniquement  
**Protect :** ScorApp-XP non touché · aucun paiement réel · aucun deploy  
**Contraintes respectées :** Confirm email ON · anti-abus ON · pas de `email_confirm: true` · pas de boucle signup

## Verdict global

**BLOCKED** — le mailer Auth intégré staging est encore en quota (`email rate limit exceeded`).  
La validation bout-en-bout « signup UI → lien de confirmation → invite → accept » ne peut pas être rejouée tant qu’un **SMTP Auth custom** n’est pas branché.

## Étapes

| # | Étape | Résultat | Preuve / notes |
|---|--------|----------|----------------|
| A | Diagnostic rate-limit Auth | **PASS** | Audit one-shot `scripts/saas-auth-email-audit.mjs` → `DECISION=BLOCKED_AUTH_EMAIL_RATE_LIMIT` |
| B | Solution durable SMTP / Auth / UX | **PASS** | Doc `docs/saas/auth-email-rate-limit.md` ; message clair dans `actions/auth.ts` ; checklist SMTP Brevo + Confirm ON |
| C | Inscription UI + confirmation réelle (sans Admin bypass) | **BLOCKED** | Probe : `email rate limit exceeded` ; user non créé. Pas de 2ᵉ tentative. Spec prête : `tests/e2e/isolated/saas-auth-confirm-invite.spec.ts` |
| D | Création org après confirmation | **BLOCKED** | Dépend de C |
| E | Propriétaire invite collaborateur | **PASS*** | Validé dans parcours cosmétiques (`cosmetics-customer-journey-report.md` §9) via UI → `email_jobs` URL. Rejeu avec confirmation réelle : **BLOCKED** (dépend de C) |
| F | Collaborateur accepte l’invitation | **PASS*** | Validé cosmétiques §10 (`role=member`, `access_role=editor`). Rejeu avec signup confirmé réel : **BLOCKED** (dépend de C + signup collab Auth) |
| G | Envoi réel e-mail Auth (inbox) | **BLOCKED** | Quota mailer intégré ; SMTP custom non configuré sur le dashboard staging |
| H | Envoi réel invitation (`email_jobs` → Brevo) | **BLOCKED** | `BREVO_API_KEY` / sender **MISSING** en `.env.e2e.local` ; file `email_jobs` OK pour récupérer l’URL en E2E |

\*PASS sous le parcours cosmétiques avec compte confirmé via Auth Admin après tentative UI rate-limité — **pas** le chemin « confirmation inbox réelle » exigé ici.

## Ce qui a été volontairement non exécuté

- Spec Playwright `saas-auth-confirm-invite` : **non lancée** après l’audit (aurait refait un signup inutile alors que la limite est active).
- Aucune désactivation de Confirm email / rate limits Auth.
- Aucun contournement `auth.admin.createUser({ email_confirm: true })` pour cette validation.

## Déblocage (action Dashboard, hors code)

1. Staging → Authentication → **SMTP Settings** : activer Brevo (ou Resend) SMTP + domaine SPF/DKIM.  
2. Garder **Confirm email** et rate limits Auth activés.  
3. Renseigner `BREVO_*` dans `.env.e2e.local` pour les invitations applicatives.  
4. Relancer **une fois** l’audit, puis `saas-auth-confirm-invite.spec.ts`.

## Artefacts

- `docs/saas/auth-email-rate-limit.md`
- `scripts/saas-auth-email-audit.mjs`
- `tests/e2e/isolated/saas-auth-confirm-invite.spec.ts`
- Parcours cosmétiques déjà **7 PASS** : `docs/saas/cosmetics-customer-journey-report.md`
