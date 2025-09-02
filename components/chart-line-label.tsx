"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from "recharts"

interface ChartLineLabelProps {
  data: any[]
  index: string
  categories: string[]
  colors: string[]
  yAxisWidth?: number
  showLegend?: boolean
  showGrid?: boolean
  showAnimation?: boolean
  height?: number
  className?: string
}

export function ChartLineLabel({
  data,
  index,
  categories,
  colors,
  yAxisWidth = 40,
  showLegend = true,
  showGrid = true,
  showAnimation = true,
  height = 200,
  className = ""
}: ChartLineLabelProps) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <XAxis
          dataKey={index}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          width={yAxisWidth}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          domain={[-100, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {index}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {categories[index]}
                        </span>
                        <span className="font-bold" style={{ color: colors[index] }}>
                          {entry.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        {categories.map((category, index) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[index]}
            strokeWidth={2}
            dot={{
              fill: colors[index],
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              stroke: colors[index],
              strokeWidth: 2,
            }}
            animationDuration={showAnimation ? 1000 : 0}
          >
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground text-xs font-medium"
              fontSize={11}
              formatter={(value: any) => `${value}%`}
            />
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
