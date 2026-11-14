import { FEATURES, METRICS, type Feature, type UsageMetric } from "@/lib/billing/plans"

const FEATURE_COPY: Record<string, { label: string; description: string }> = {
  advanced_analytics: { label: "Analytique avancée", description: "Tableaux et insights détaillés" },
  csv_export: { label: "Export CSV", description: "Export des données au format CSV" },
  pdf_reports: { label: "Rapports PDF", description: "Génération de rapports PDF" },
  webhooks: { label: "Webhooks", description: "Notifications HTTP sortantes" },
  basic_automation: { label: "Automatisation de base", description: "Règles d'automatisation simples" },
  advanced_automation: { label: "Automatisation avancée", description: "Workflows et conditions avancées" },
  brevo: { label: "Brevo", description: "Intégration e-mail Brevo" },
  api: { label: "API", description: "Accès API programmatique" },
  ai: { label: "IA", description: "Fonctions d'assistance IA" },
  custom_branding: { label: "Branding personnalisé", description: "Personnalisation visuelle" },
  custom_domain: { label: "Domaine personnalisé", description: "Nom de domaine dédié" },
  remove_powered_by: { label: "Retirer « Powered by »", description: "Masquer la mention WOLOYEM" },
  scorecards: { label: "Scorecards", description: "Limite de scorecards" },
  assessment_starts: { label: "Démarrages d'évaluation", description: "Limite de sessions démarrées" },
  leads: { label: "Leads", description: "Limite de leads collectés" },
  team_members: { label: "Membres d'équipe", description: "Limite de collaborateurs" },
  reports: { label: "Rapports", description: "Limite de rapports générés" },
  ai_generations: { label: "Générations IA", description: "Limite d'appels IA" },
  webhook_deliveries: { label: "Livraisons webhook", description: "Limite d'envois webhook" },
  api_requests: { label: "Requêtes API", description: "Limite de requêtes API" },
}

export function entitlementCopy(key: string) {
  return FEATURE_COPY[key] ?? { label: key, description: "Fonctionnalité technique" }
}

export const ENTITLEMENT_KEYS = [...FEATURES, ...METRICS] as (Feature | UsageMetric)[]

/** Environment badge — never label staging as production. */
export function platformEnvironment(): { code: "STAGING" | "PRODUCTION" | "LOCAL" | "UNKNOWN"; label: string; tone: "amber" | "rose" | "sky" | "zinc" } {
  const host = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host
    } catch {
      return ""
    }
  })()
  if (host === "hznmtadobqfhumezdgbh.supabase.co") {
    return { code: "STAGING", label: "STAGING", tone: "amber" }
  }
  if (process.env.NODE_ENV !== "production") {
    return { code: "LOCAL", label: "LOCAL", tone: "sky" }
  }
  if (host) return { code: "UNKNOWN", label: "REFUSÉ (hors whitelist)", tone: "rose" }
  return { code: "UNKNOWN", label: "ENV INCONNU", tone: "zinc" }
}

export function orgInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export const ORG_DETAIL_TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "subscription", label: "Abonnement" },
  { id: "users", label: "Utilisateurs" },
  { id: "permissions", label: "Permissions" },
  { id: "activity", label: "Activité" },
  { id: "invoices", label: "Factures" },
  { id: "domains", label: "Domaines" },
  { id: "settings", label: "Paramètres" },
] as const

export type OrgDetailTab = (typeof ORG_DETAIL_TABS)[number]["id"]

export function parseOrgDetailTab(value: string | undefined): OrgDetailTab {
  const match = ORG_DETAIL_TABS.find((tab) => tab.id === value)
  return match?.id ?? "overview"
}
