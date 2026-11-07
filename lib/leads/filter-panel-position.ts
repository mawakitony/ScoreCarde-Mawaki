/** Pure placement for CRM filter portals (avoids overflow clipping + off-screen panels). */

export function placeFilterPanel(input: {
  button: { top: number; left: number; bottom: number; right: number }
  viewport: { width: number; height: number }
  panel: { width: number; height: number }
  gap?: number
  margin?: number
}) {
  const gap = input.gap ?? 8
  const margin = input.margin ?? 8
  const maxLeft = Math.max(margin, input.viewport.width - input.panel.width - margin)
  const left = Math.min(Math.max(input.button.left, margin), maxLeft)

  const below = input.button.bottom + gap
  const above = input.button.top - gap - input.panel.height
  const fitsBelow = below + input.panel.height <= input.viewport.height - margin
  const top = fitsBelow ? below : Math.max(margin, above)

  return { top, left, maxHeight: Math.max(120, input.viewport.height - top - margin) }
}
