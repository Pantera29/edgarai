"use client"

import { PieChart, Pie, Label, ResponsiveContainer, Cell, Tooltip } from "recharts"
import * as React from "react"

interface DonutChartProps {
  data: { id: string; label: string; value: number; color: string }[]
  total: number
  centerLabel?: string
}

// Colores de Estado de Citas
const origenColorMap: Record<string, string> = {
  whatsapp: "#22c55e", // verde (green-500)
  twilio: "#fbbf24", // amarillo (amber-400)
  manual: "#e5e7eb", // gris claro (gray-200)
  agenteai: "#3b82f6", // azul (blue-500)
  web: "#e5e7eb", // gris claro (gray-200)
}

// Paleta de azules para fallback (como el ejemplo de shadcnui)
const bluePalette = [
  "#2563eb", // blue-600
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#bfdbfe", // blue-200
]

export function DonutChart({ data, total, centerLabel }: DonutChartProps) {
  // Filtrar solo manual y agenteai
  const filteredData = data.filter(d => d.id === 'manual' || d.id === 'agenteai');
  const allZero = filteredData.every(d => d.value === 0);
  const rechartsData = filteredData.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: allZero ? bluePalette[i % bluePalette.length] : (origenColorMap[d.id] || d.color || "#e5e7eb")
  }));

  return (
    <div style={{ height: 260, width: 260, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rechartsData}
            dataKey="value"
            nameKey="name"
            innerRadius={80}
            outerRadius={110}
            strokeWidth={5}
            isAnimationActive
          >
            <Label
              position="center"
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {total}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground text-base"
                      >
                        {centerLabel}
                      </tspan>
                    </text>
                  )
                }
                return null
              }}
            />
            {rechartsData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="rounded-md bg-background px-3 py-2 shadow-md border text-xs">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-muted-foreground">{d.value} citas</div>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 