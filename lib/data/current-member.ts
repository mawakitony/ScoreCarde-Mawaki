export type MemberIdentity = {
  userId: string
  organizationId: string
  role: string
  accessRole?: string | null
}

export function selectCurrentMember(rows: MemberIdentity[], userId: string, organizationId: string) {
  const matches = rows.filter((row) => row.userId === userId && row.organizationId === organizationId)
  return matches.length === 1 ? matches[0] : null
}
