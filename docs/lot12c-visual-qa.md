# Lot 12C — QA visuel Dashboard (session authentifiée)

## Principe

Playwright utilise un fichier **storageState** local créé après une connexion interactive.  
Le mot de passe n’est jamais lu par un script, jamais loggé, jamais commité.

Fichier de session (gitignored) :

`tmp/playwright-auth/dashboard-storage.json`

## Prérequis

1. `npm run dev` sur `http://localhost:3000`
2. Un compte de test **autorisé** (org réelle de dev, pas de contournement RLS)

## Créer la session

```bash
node scripts/lot12c-save-session.mjs
```

1. Une fenêtre Chromium s’ouvre sur `/login`.
2. Connectez-vous manuellement.
3. Dès que l’URL atteint `/dashboard`, le script enregistre le storageState.
4. Fermez la fenêtre si elle reste ouverte.

Timeout par défaut : 5 minutes (`LOT12C_LOGIN_TIMEOUT_MS` pour ajuster).

## Lancer le QA

```bash
node scripts/lot12c-dashboard-qa.mjs
```

Captures → `tmp/lot12c-shots/`  
Rapport → `tmp/lot12c-shots/report.json`

## Sécurité

- Ne pas committer `tmp/playwright-auth/`
- Ne pas partager le JSON de session
- Ne pas coller de cookies/tokens dans le chat
- En cas d’expiration → rejouer `lot12c-save-session.mjs`
