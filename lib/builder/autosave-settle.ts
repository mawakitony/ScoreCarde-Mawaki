export type AutosaveResult = { error?: string; quiet?: boolean }

export type AutosaveSettle =
  | { ok: true }
  | { ok: false; quiet?: boolean; error?: string }

/** Settles an autosave attempt — rejection must not leave the UI stuck on "saving". */
export async function settleAutosave(
  save: () => Promise<AutosaveResult>,
): Promise<AutosaveSettle> {
  try {
    const result = await save()
    if (result.error) return { ok: false, quiet: result.quiet, error: result.error }
    return { ok: true }
  } catch {
    return { ok: false, error: "Impossible d'enregistrer. Réessayez." }
  }
}
