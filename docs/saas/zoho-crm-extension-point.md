# Point d’extension Zoho CRM (non intégré)

**Statut :** documentation seule — aucune synchronisation runtime.

## Événement

- Nom : `organization_created` (`ZOHO_ORG_CREATED_EVENT` dans `lib/onboarding/zoho-extension.ts`)
- Déclencheur prévu : après succès de `createOrganization` (onboarding)
- Payload : `ZohoOrganizationCreatedPayload` (raison sociale, pays, ville, secteur, effectif, devise, langue, fuseau, site, objectif, referral, owner, téléphone / identifiant légal optionnels)

## Cible Zoho (future)

1. Créer un Lead ou Account selon le mapping métier validé.
2. Mapper `phoneE164` → Phone, `legalId` → champ custom, `owner.email` → Email.
3. Outbox durable + worker (idempotence sur `organizationId`).

## Ne pas faire maintenant

- Pas de credentials Zoho en env
- Pas d’appel HTTP depuis les Server Actions
- Pas de file `email_jobs` pour CRM

Helper prêt : `buildZohoOrganizationCreatedPayload(...)`.
