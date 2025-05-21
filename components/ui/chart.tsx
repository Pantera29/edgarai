import * as React from "react"
import { TooltipProps, Tooltip } from "recharts"
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

export type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
  }
>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={className}
      style={
        {
          "--color-pendientes": "hsl(221.2 83.2% 53.3%)",
          "--color-enviados": "hsl(142.1 76.2% 36.3%)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

interface ChartTooltipContentProps extends TooltipProps<ValueType, NameType> {
  labelFormatter?: (label: string) => string
  indicator?: "dot" | "line"
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  indicator = "dot",
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="text-sm font-medium">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
        <div className="grid gap-1">
          {payload.map((item, index) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                {indicator === "dot" ? (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                ) : (
                  <div
                    className="h-0.5 w-3"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ChartLegendContentProps {
  payload?: Array<{
    value: string
    type: string
    id: string
    color: string
  }>
}

export function ChartLegendContent({ payload }: ChartLegendContentProps) {
  if (!payload?.length) return null

  return (
    <div className="flex items-center justify-center gap-4">
      {payload.map((item, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export const ChartTooltip = Tooltip
export const ChartLegend = Tooltip 