/** CRM lead detail path — id must be the leads.id UUID from RPC, never name/email. */
export function leadDetailHref(leadId: string | null | undefined) {
  const id = leadId?.trim()
  if (!id) return null
  return `/dashboard/leads/${encodeURIComponent(id)}`
}

/** Same destination for name click and Eye action. */
export function hotLeadActions(lead: { id: string; name: string }) {
  const href = leadDetailHref(lead.id)
  return {
    href,
    eyeLabel: `Ouvrir la fiche de ${lead.name}`,
    nameLabel: `Voir la fiche de ${lead.name}`,
  }
}
