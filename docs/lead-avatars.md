# Lead avatars — Google & Microsoft (Lot 11B)

## Realité API

### Google
- **People API `people.searchContacts`** lit uniquement les contacts du compte OAuth connecté (`contacts.readonly`).
- Ce n’est **pas** une recherche de photo pour n’importe quelle adresse Gmail.
- **Directory** (Workspace) : photos de domaine uniquement si l’admin a activé l’annuaire et si le scope directory est accordé.
- Scraping Gmail / Google Account : interdit et non implémenté.

### Microsoft
- **Graph** `GET /users/{id|upn}/photo/$value` : utilisateurs du **tenant** (ou contacts avec `Contacts.Read`).
- Outlook.com / Hotmail / comptes personnels externes : en pratique **inaccessibles** par e-mail seul (`NOT_AUTHORIZED` / 404).
- Permission minimale recommandée : `ProfilePhoto.Read.All` (app) ou équivalent délégué.

### Autres
- Gravatar / Clearbit / réseaux sociaux : **non** utilisés par défaut.
- Hosts tiers uniquement via `LEAD_AVATAR_APPROVED_HOSTS` (allowlist explicite).

## Configuration manuelle (ne pas activer sans validation)

Variables (jamais `NEXT_PUBLIC_*` pour les secrets) :

| Variable | Rôle |
|----------|------|
| `LEAD_AVATAR_SYNC_ENABLED` | `1` pour autoriser les appels externes (défaut : off) |
| `LEAD_AVATAR_CACHE_TTL_MS` | TTL cache mémoire (min 60s, max 7j) |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | App Google Cloud |
| `GOOGLE_PEOPLE_ACCESS_TOKEN` | Token court (dev/smoke uniquement) — prod : refresh chiffré par org |
| `MICROSOFT_OAUTH_CLIENT_ID` / `MICROSOFT_OAUTH_CLIENT_SECRET` | App Entra |
| `MICROSOFT_GRAPH_ACCESS_TOKEN` | Token court (dev/smoke) |
| `LEAD_AVATAR_APPROVED_HOSTS` | Hôtes HTTPS autorisés, séparés par des virgules |

### Scopes Google
- `https://www.googleapis.com/auth/contacts.readonly`
- Optionnel Workspace : directory readonly (après validation admin)

### Permissions Microsoft Graph
- `ProfilePhoto.Read.All` et/ou `Contacts.Read`
- Consentement admin tenant requis pour l’application

### Flux OAuth recommandé (pas encore branché UI)
1. Owner org connecte Google et/ou Microsoft depuis Réglages → Intégrations.
2. Refresh token chiffré avec `INTEGRATIONS_SECRET` (même modèle que Brevo).
3. Activer `LEAD_AVATAR_SYNC_ENABLED=1` uniquement après revue sécurité.
4. Appliquer `docs/sql/lead_avatar_cache.sql` pour persister cache + statut.
5. Ne jamais lancer de sync massive historique sans quota planifié.

## Comportement actuel en production

- Sync externe : **DISABLED**
- Affichage : URL déjà autorisée / cache mémoire / initiales
- Pas de migration appliquée
- Pas de connexion de comptes réels dans ce lot

## Priorité des sources

1. Photo CRM stockée (`storedUrl`)
2. Google (si sync + token)
3. Microsoft (si sync + token + même tenant)
4. Hôte approuvé
5. Initiales
