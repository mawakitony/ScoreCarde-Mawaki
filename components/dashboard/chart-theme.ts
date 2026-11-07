/** Shared Recharts chrome — follows light/dark CSS tokens without hard-coded greys. */
export const chartTick = { fontSize: 13, fill: "var(--muted-foreground)" } as const
export const chartTickSm = { fontSize: 12, fill: "var(--muted-foreground)" } as const
export const chartAxisStroke = "var(--border)"
export const chartGridStroke = "var(--chart-grid, var(--border))"

export const chartTooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.85rem",
  color: "var(--popover-foreground)",
  boxShadow: "var(--shadow-panel)",
  fontSize: 13,
  padding: "10px 12px",
} as const

export const chartTooltipLabelStyle = {
  color: "var(--muted-foreground)",
  fontWeight: 600,
  fontSize: 12,
  marginBottom: 4,
} as const

export const chartLegendStyle = {
  color: "var(--muted-foreground)",
  fontSize: 13,
  paddingTop: 8,
} as const

/** Semantic series slots (meanings stay: primary / secondary / teal metric). */
export const chartSeries = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  tertiary: "var(--chart-3)",
  quaternary: "var(--chart-4)",
  quinary: "var(--chart-5)",
} as const

export const chartPieColors = [
  chartSeries.primary,
  chartSeries.secondary,
  chartSeries.tertiary,
  chartSeries.quaternary,
  chartSeries.quinary,
] as const
