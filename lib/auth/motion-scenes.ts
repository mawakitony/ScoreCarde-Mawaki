/** Illustrative auth showcase scenes — no live product data. */

export const AUTH_SCENE_MS = 7200
export const AUTH_SCENE_TRANSITION_MS = 600

export const AUTH_SCENES = [
  {
    id: "scorecards",
    label: "Scorecards",
    title: "Des évaluations qui créent de la valeur.",
    subtitle: "Concevez des expériences interactives et découvrez ce qui compte vraiment.",
  },
  {
    id: "leads",
    label: "Leads",
    title: "Chaque réponse devient une opportunité.",
    subtitle: "Identifiez les bons prospects et concentrez vos efforts là où ils comptent.",
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "Vos performances, en toute clarté.",
    subtitle: "Visualisez vos résultats et prenez des décisions mieux éclairées.",
  },
] as const

export type AuthSceneId = (typeof AUTH_SCENES)[number]["id"]

export function nextAuthSceneIndex(current: number, length = AUTH_SCENES.length) {
  if (length <= 0) return 0
  return (current + 1) % length
}

export function clampAuthSceneIndex(index: number, length = AUTH_SCENES.length) {
  if (length <= 0) return 0
  if (!Number.isFinite(index)) return 0
  return ((Math.trunc(index) % length) + length) % length
}

/** Auto-advance only when motion is allowed and the tab is visible. */
export function shouldAutoAdvanceScenes(input: {
  prefersReducedMotion: boolean
  tabHidden: boolean
  paused: boolean
}) {
  return !input.prefersReducedMotion && !input.tabHidden && !input.paused
}
