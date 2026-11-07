"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { chartAxisStroke, chartGridStroke, chartLegendStyle, chartTickSm } from "@/components/dashboard/chart-theme"
import { PremiumChartTooltip } from "@/components/dashboard/chart-tooltip"

export function EmailJobsChartView({
  data,
}: {
  data: { label: string; total: number; sent: number; failed: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="paEmailFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={chartTickSm} stroke={chartAxisStroke} />
        <YAxis allowDecimals={false} tick={chartTickSm} stroke={chartAxisStroke} width={28} />
        <Tooltip content={<PremiumChartTooltip />} />
        <Legend wrapperStyle={chartLegendStyle} />
        <Area type="monotone" dataKey="total" name="Créés" stroke="#2563EB" fill="url(#paEmailFill)" strokeWidth={2} animationDuration={700} />
        <Area type="monotone" dataKey="sent" name="Envoyés" stroke="#10B981" fill="transparent" strokeWidth={1.75} animationDuration={700} />
        <Area type="monotone" dataKey="failed" name="Échecs" stroke="#F97316" fill="transparent" strokeWidth={1.5} animationDuration={700} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
