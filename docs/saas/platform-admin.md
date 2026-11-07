# Platform Admin WOLOYEM Score

Back-office `/platform` réservé aux comptes présents dans `platform_admins`.  
Un OWNER d’organisation **n’est pas** administrateur plateforme.

## Sécurité

| Contrôle | Implémentation |
|----------|----------------|
| Autorisation | Ligne `platform_admins` (rôles `super_admin` / `support` / `operations` / `finance`) |
| Pas d’allowlist e-mail | Confirmé — e-mail seul insuffisant |
| Permissions | `lib/platform/permissions.ts` sur chaque page / action |
| MFA | AAL2 Supabase Auth obligatoire (`lib/platform/mfa.ts`, UI `/platform/security/mfa`) |
| Actions sensibles | `recentAuth` ≤ 30 min + `audit_logs` + motif |
| RLS | Tables plateforme révoquées pour `anon`/`authenticated` ; accès via service role serveur |
| Secrets | Stripe / Brevo jamais exposés au navigateur |
| Impersonation | Session support cookie limitée (pas d’usurpation silencieuse) |

Bootstrap premier admin (staging, manuel) :

```sql
insert into public.platform_admins (user_id, role)
values ('<uuid profil>', 'super_admin');
```

## Navigation

Vue d’ensemble · Entreprises · Abonnements · Paiements · Utilisateurs · Expirations · Notifications · Alertes · Usage · Jobs · Intégrations · Domaines · Journal d’audit · Santé · Paramètres · Administrateurs

## Fonctions opérationnelles

- Dashboard métriques réelles (orgs, trials, actifs, past_due, suspendus, users, scorecards, réponses, leads, MRR catalogue, conversion/churn fenêtre, série d’activité)
- Liste / fiche organisations (suspend / unsuspend journalisés, entitlements, support mode)
- Abonnements & paiements (lecture Stripe IDs, events audit)
- Utilisateurs par org (e-mails masqués)
- Expirations (trials, past_due, cancel_at_period_end)
- Notifications `email_jobs`
- Centre d’alertes + résolution motivée
- Rappels essai J-7 / J-3 / J-1 / J-0 + e-mails billing (échec, grâce, succès, annulation, renouvellement)
- Cron `/api/cron/maintenance` (idempotent)

## Fonctions bloquées / limites

| Élément | Statut |
|---------|--------|
| Mutation statut paiement Stripe depuis la console | Non (Stripe = source de vérité) |
| MRR montant Stripe exact | Non stocké — MRR catalogue uniquement |
| Envoi e-mail si Brevo SMTP non activé | Bloqué (jobs `dead` + alerte) |
| Captures E2E admin sans `platform_admins` + MFA | Bloqué jusqu’à bootstrap staging |
| ScorApp-XP / production | Hors scope |

## Tests

```bash
node --experimental-strip-types --import ./test/register.mjs --test lib/platform/platform.test.ts lib/platform/reminders.test.ts
```

E2E smoke : visiteur `/platform` redirigé (`tests/e2e/smoke.spec.ts`).

## Avant production

1. Au moins un `super_admin` + MFA AAL2 enrôlé.  
2. Brevo SMTP transactionnel **activé**.  
3. `CRON_SECRET` + cron maintenance.  
4. Revue des permissions finance/support.  
5. Pas de commit de secrets ; pas de deploy depuis cette mission.
