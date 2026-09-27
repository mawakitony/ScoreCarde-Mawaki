function expiryLine(hours: number) {
  const delay = hours === 1 ? "1 heure" : `${hours} heures`
  return `Ce code expire dans ${delay} et ne peut être utilisé qu'une seule fois.`
}

export function firstAccessShareMessage(input: {
  organizationName: string
  roleLabel: string
  code: string
  appUrl: string
  hours: number
}) {
  const link = `${input.appUrl.replace(/\/$/, "")}/first-access`
  return [
    "Bonjour,",
    "",
    `Vous avez été ajouté à ${input.organizationName} sur WOLOYEM Score.`,
    `Votre rôle : ${input.roleLabel}`,
    `Votre code de première connexion : ${input.code}`,
    `Créez votre accès ici : ${link}`,
    expiryLine(input.hours),
  ].join("\n")
}

export function whatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
