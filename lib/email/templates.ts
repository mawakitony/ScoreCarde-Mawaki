import { expirySentence } from "@/lib/auth/first-access"
import { inviteRoleLabel } from "@/lib/auth/invitation-flow"

export type EmailTemplate =
  | "organization_invitation"
  | "first_access"
  | "trial_ending"
  | "trial_ending_j7"
  | "trial_ending_j3"
  | "trial_ending_j1"
  | "trial_ending_j0"
  | "payment_failed"
  | "payment_succeeded"
  | "grace_started"
  | "grace_ending"
  | "subscription_canceled"
  | "renewal_confirmed"
  | "report_ready"
  | "support_notice"

export function renderEmail(input: { template: EmailTemplate; locale: string; payload: Record<string, string> }) {
  const english = input.locale === "en"
  const name = input.payload.organizationName || "WOLOYEM Score"
  const billing = input.payload.billingUrl || ""
  const billingLine = billing
    ? english
      ? `\n\nManage billing securely: ${billing}`
      : `\n\nGérer la facturation : ${billing}`
    : ""

  if (input.template === "organization_invitation") {
    const inviter = input.payload.inviterName?.trim()
    const role = inviteRoleLabel(input.payload.role)
    const intro = inviter
      ? english
        ? `${inviter} invited you to join ${name} on WOLOYEM Score.`
        : `${inviter} vous invite à rejoindre ${name} sur WOLOYEM Score.`
      : english
        ? `You have been invited to join ${name} on WOLOYEM Score.`
        : `Vous êtes invité à rejoindre ${name} sur WOLOYEM Score.`
    const roleLine = role ? (english ? `\n\nProposed role: ${role}` : `\n\nRôle proposé : ${role}`) : ""
    return {
      subject: english ? `Invitation to ${name}` : `Invitation à rejoindre ${name}`,
      text: english
        ? `${intro}${roleLine}\n\nAccept invitation: ${input.payload.url}`
        : `${intro}${roleLine}\n\nAccepter l'invitation : ${input.payload.url}`,
    }
  }
  if (input.template === "first_access") {
    const role = inviteRoleLabel(input.payload.role) ?? "Viewer"
    const hours = Number(input.payload.expiresInHours)
    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24
    const delay = english
      ? `This code expires in ${safeHours} hour${safeHours === 1 ? "" : "s"} and can be used only once.`
      : expirySentence(safeHours)
    const link = input.payload.url
    return {
      subject: "Votre accès à WOLOYEM Score",
      text: english
        ? `Hello,\n\nYou have been added to ${name} on WOLOYEM Score.\nYour role: ${role}\nYour first-access code:\n${input.payload.accessCode}\n\nCreate my access: ${link}\n\n${delay}\n\nOpen WOLOYEM Score: ${link}`
        : `Bonjour,\n\nVous avez été ajouté à ${name} sur WOLOYEM Score.\nVotre rôle : ${role}\nVotre code de première connexion :\n${input.payload.accessCode}\n\nCréer mon accès : ${link}\n\n${delay}\n\nAccéder à WOLOYEM Score : ${link}`,
    }
  }

  if (input.template === "trial_ending" || input.template === "trial_ending_j3") {
    return {
      subject: english ? "Your trial ends in 3 days" : "Votre essai se termine dans 3 jours",
      text: english
        ? `The trial for ${name} ends on ${input.payload.date}.${billingLine}`
        : `L'essai de ${name} se termine le ${input.payload.date}.${billingLine}`,
    }
  }
  if (input.template === "trial_ending_j7") {
    return {
      subject: english ? "Your trial ends in 7 days" : "Votre essai se termine dans 7 jours",
      text: english
        ? `Reminder: the trial for ${name} ends on ${input.payload.date}.${billingLine}`
        : `Rappel : l'essai de ${name} se termine le ${input.payload.date}.${billingLine}`,
    }
  }
  if (input.template === "trial_ending_j1") {
    return {
      subject: english ? "Your trial ends tomorrow" : "Votre essai se termine demain",
      text: english
        ? `The trial for ${name} ends tomorrow (${input.payload.date}).${billingLine}`
        : `L'essai de ${name} se termine demain (${input.payload.date}).${billingLine}`,
    }
  }
  if (input.template === "trial_ending_j0") {
    return {
      subject: english ? "Your trial ends today" : "Votre essai se termine aujourd'hui",
      text: english
        ? `The trial for ${name} ends today (${input.payload.date}).${billingLine}`
        : `L'essai de ${name} se termine aujourd'hui (${input.payload.date}).${billingLine}`,
    }
  }
  if (input.template === "payment_failed") {
    return {
      subject: english ? "Payment failed" : "Paiement échoué",
      text: english
        ? `The latest payment for ${name} did not succeed. A grace period may apply.${billingLine}`
        : `Le dernier paiement de ${name} n'a pas abouti. Une période de grâce peut s'appliquer.${billingLine}`,
    }
  }
  if (input.template === "payment_succeeded") {
    return {
      subject: english ? "Payment confirmed" : "Paiement confirmé",
      text: english
        ? `Payment for ${name} was confirmed by Stripe.${billingLine}`
        : `Le paiement de ${name} a été confirmé par Stripe.${billingLine}`,
    }
  }
  if (input.template === "grace_started") {
    return {
      subject: english ? "Grace period started" : "Période de grâce démarrée",
      text: english
        ? `A grace period has started for ${name} after a payment issue.${billingLine}`
        : `Une période de grâce a démarré pour ${name} après un incident de paiement.${billingLine}`,
    }
  }
  if (input.template === "grace_ending") {
    return {
      subject: english ? "Grace period ending" : "Fin de période de grâce",
      text: english
        ? `The grace period for ${name} is ending. Update your payment method to keep access.${billingLine}`
        : `La période de grâce de ${name} se termine. Mettez à jour votre moyen de paiement pour conserver l'accès.${billingLine}`,
    }
  }
  if (input.template === "subscription_canceled") {
    return {
      subject: english ? "Subscription canceled" : "Abonnement annulé",
      text: english
        ? `The subscription for ${name} has been canceled.${billingLine}`
        : `L'abonnement de ${name} a été annulé.${billingLine}`,
    }
  }
  if (input.template === "renewal_confirmed") {
    return {
      subject: english ? "Renewal confirmed" : "Renouvellement confirmé",
      text: english
        ? `The subscription renewal for ${name} was confirmed.${billingLine}`
        : `Le renouvellement de l'abonnement de ${name} a été confirmé.${billingLine}`,
    }
  }
  if (input.template === "report_ready") {
    return {
      subject: english ? "Your report is ready" : "Votre rapport est prêt",
      text: english ? `A report for ${name} is ready.` : `Un rapport pour ${name} est prêt.`,
    }
  }
  return {
    subject: english ? "Support access opened" : "Accès support ouvert",
    text: english
      ? `WOLOYEM support opened a temporary access to ${name}.`
      : `Le support WOLOYEM a ouvert un accès temporaire à ${name}.`,
  }
}

const DELAYS_SECONDS = [60, 300, 1800, 7200, 43200]

export function nextEmailAttempt(attempts: number, now = Date.now()) {
  if (attempts >= DELAYS_SECONDS.length) return { status: "dead" as const, nextRunAt: null }
  return { status: "failed" as const, nextRunAt: new Date(now + DELAYS_SECONDS[attempts] * 1000).toISOString() }
}

export function invitationIdempotencyKey(invitationId: string) {
  return `organization_invitation:${invitationId}`
}
