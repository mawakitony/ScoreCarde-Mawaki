# Checklist validation manuelle post-MFA — Platform Admin (staging)

**Projet :** staging `hznmtadobqfhumezdgbh` uniquement · **jamais** ScorApp-XP  
**Prérequis :** compte `super_admin` + TOTP AAL2 · `node scripts/dev-e2e.mjs` (ou `next start` local sur le même projet)

## 0. Porte MFA

- [ ] `/login` → accès `/platform` redirige vers `/platform/security/mfa` si AAL1
- [ ] Page MFA sans sidebar Platform (chrome minimal)
- [ ] Après code TOTP valide → accès aux pages data
- [ ] MFA **non** contournée (pas de flag test, pas de skip)

---

## 1. Vue d’ensemble `/platform`

- [ ] Graphique principal visible au-dessus du fold (desktop 1440×900)
- [ ] KPI compacts ; MRR = montant réel ou « Données insuffisantes » / « — » (jamais `0 $` inventé)
- [ ] Bannière undetermined si prix catalogue manquants
- [ ] Filtre période (`range`) change les séries
- [ ] Mobile 390×844 : pas d’overflow horizontal incontrôlé

## 2. Entreprises `/platform/organizations`

- [ ] Filtres (q, plan, status, state, trial, country, created, domain, sort) appliqués à la liste
- [ ] Export CSV cohérent avec le parc (hors session support)
- [ ] Lien détail → fiche org
- [ ] Empty state si aucun résultat

## 3. Fiche org `/platform/organizations/[id]`

- [ ] Onglets overview / membres / domaines / abonnement / permissions / activité / settings
- [ ] Credentials intégrations = configured / not_configured (pas de secret)
- [ ] Support : motif ≥ 20 car. → session + bannière Platform + redirect fiche
- [ ] Autre org en session support → 404
- [ ] Suspension / entitlements : uniquement si permissions manage

## 4. Abonnements `/platform/subscriptions` · Paiements `/platform/payments`

- [ ] Permission : rôles sans `billing.read` n’ont pas le lien nav
- [ ] Filtres branchés ; prix « Non déterminé » si catalogue null
- [ ] Graphiques / mix / MRR sans zéro inventé
- [ ] Export CSV subscriptions cohérent

## 5. Expirations `/platform/expirations`

- [ ] Buckets filtres ; jours restants cohérents
- [ ] Timeline si hors support

## 6. Utilisateurs `/platform/users`

- [ ] Recherche e-mail/nom ; filtre rôle
- [ ] E-mails masqués

## 7. Notifications · Jobs · Intégrations · Domaines

- [ ] Filtres status/provider appliqués
- [ ] Retry job : uniquement `jobs.retry` ; audit
- [ ] Domaines : vérif DNS → `organizations.manage` (sinon redirect/deny)

## 8. Usage · Audit

- [ ] Usage : ratios / seuils ≥ 80 % ; export CSV
- [ ] Audit : lecture seule ; filtres org/acteur/action/date

## 9. Alertes · Santé · Paramètres · Admins

- [ ] Alertes / Santé : hors session support (en support → redirect fiche org)
- [ ] Paramètres : copy MFA = pages + actions ; maintenance si `admins.manage`
- [ ] Admins : inaccessible sans `admins.manage` ; MFA colonne = Facteur inscrit / Non vérifié

## 10. Mode support (isolation)

- [ ] Dashboard client : bannière honnête (pas « Viewing ») + lien fiche ; données = org admin
- [ ] Listes Platform filtrées sur l’org de session
- [ ] Overview / health / alerts → redirect fiche org
- [ ] Quitter support → parc global rétabli
- [ ] Rôle `support` : pas d’admins, pas de suspend, pas de domain check

## 11. RBAC rapide (si comptes dispo)

| Rôle | Doit voir | Ne doit pas |
|------|-----------|-------------|
| support | orgs, billing read, jobs read, audit, support | admins, entitlements write, suspend |
| operations | orgs, jobs (+ retry), audit | billing pages, admins, support open |
| finance | orgs, subscriptions/payments, audit | jobs, admins, support, billing.manage |
| super_admin | tout | — |

## 12. Captures (après AAL2)

- [ ] Desktop 1440×900 : overview, organizations, subscriptions, users, alerts
- [ ] Mobile 390×844 : mêmes URL
- [ ] Déposer sous `docs/saas/` si besoin d’archivage

## 13. Playwright (machine)

```bash
npx playwright test tests/e2e/isolated/saas-platform-access.spec.ts tests/e2e/isolated/saas-platform-ui.spec.ts
```

- [ ] Visitor + owner deny = PASS
- [ ] Super Admin / UI premium = exécutés **avec** `PLATFORM_E2E_ADMIN_EMAIL` + `PASSWORD` + MFA réelle — sinon **non réussis**
