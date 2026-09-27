# Mise en production

Contrôle du 22 septembre 2026, sur le seul projet Supabase configuré (`zkyjaslogpdujyeysjzw`). Pas de staging séparé. Aucun test destructif.

- NOT TESTED — Migrations : les objets jusqu'à `email_jobs`, `rate_limits`, `platform_settings` et les colonnes domaine répondent. L'historique `schema_migrations` n'a pas été lu.
- PASS — Anonyme refusé (401) sur `integrations`, `custom_domains`, `email_jobs`, `subscriptions`, `assessment_reports`, `conversions`, `lead_notes`.
- NOT TESTED — RLS cross-tenant : une seule organisation, tables leads/réponses/résultats vides.
- FAIL — Variables de production absentes de `.env.local` : `CRON_SECRET`, Stripe, Vercel, Brevo. Supabase et `NEXT_PUBLIC_APP_URL` sont présents.
- NOT TESTED — Stripe live ou test.
- NOT TESTED — Vercel domains.
- NOT TESTED — SPF, DKIM, DMARC.
- NOT TESTED — Brevo.
- NOT TESTED — Crons Vercel.
- NOT TESTED — Buckets Storage.
- NOT APPLICABLE — MFA applicative : l'enrôlement n'est pas branché.
- FAIL — `platform_admins` : 0 ligne.
- NOT TESTED — Sauvegardes Supabase / PITR.
- NOT TESTED — `GET /api/health`.
- NOT TESTED — Smoke navigateur.

Contrôle du 27 septembre 2026. Parcours Accès rapide exécuté dans le navigateur : email + code, mot de passe choisi par l’utilisateur, dashboard.

- PASS — Code de première connexion, stocké uniquement en hash.
- PASS — Mot de passe choisi par l’utilisateur, via Supabase Auth.
- PASS — Viewer : rôle et permissions réels.
- PASS — Editor : rôle et permissions réels.
- PASS — Quota de membres.
- PASS — Expiration du code.
- PASS — Blocage après 5 tentatives.
- PASS — Régénération : l’ancien code est invalidé.
- PASS — Annulation : invitation refusée, aucun membership.
- PASS — Cross-tenant refusé.
- PASS — Logs sans secret.
- NOT TESTED — EMAIL DELIVERY : aucun email `first_access` reçu. Le job est créé en file. Ne pas marquer PASS tant qu’un vrai message n’est pas arrivé.
