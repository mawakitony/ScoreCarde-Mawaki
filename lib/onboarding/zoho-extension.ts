/**
 * Extension point — Zoho CRM sync (NOT wired).
 *
 * Future job: on successful organization creation, enqueue an outbox event
 * `organization_created` with the payload below, then a worker pushes Lead/Account to Zoho.
 *
 * Do not call Zoho APIs from request handlers until credentials + mapping are approved.
 */

export const ZOHO_ORG_CREATED_EVENT = "organization_created" as const

export type ZohoOrganizationCreatedPayload = {
  event: typeof ZOHO_ORG_CREATED_EVENT
  occurredAt: string
  organizationId: string
  slug: string
  legalName: string
  country: string
  city: string
  sector: string
  sectorOther: string | null
  headcountBand: string
  currency: string
  language: string
  timezone: string
  website: string | null
  primaryObjective: string
  referralSource: string | null
  owner: {
    userId: string
    email: string
    firstName: string
    lastName: string
    jobTitle: string
  }
  /** Sensitive — sync only if Zoho field mapping allows. */
  phoneE164?: string
  legalId?: string | null
  legalIdType?: string | null
}

/** Build payload for a future outbox; currently unused by runtime. */
export function buildZohoOrganizationCreatedPayload(
  input: Omit<ZohoOrganizationCreatedPayload, "event" | "occurredAt"> & { occurredAt?: string },
): ZohoOrganizationCreatedPayload {
  return {
    event: ZOHO_ORG_CREATED_EVENT,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    ...input,
  }
}
