"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface AppointmentTrendData {
  date: string;
  currentMonth: number;
  previousMonth: number;
}

export function AppointmentTrendChart() {
  const [data, setData] = React.useState<AppointmentTrendData[]>([])
  const [growth, setGrowth] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const supabase = createClientComponentClient()

  const chartConfig = {
    currentMonth: {
      label: "Mes Actual",
      color: "var(--color-currentMonth)",
    },
    previousMonth: {
      label: "Mes Anterior",
      color: "var(--color-previousMonth)",
    },
  } satisfies ChartConfig

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Obtener el dealership_id del token en la URL
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      let dealershipId = null

      if (token) {
        try {
          const verifiedDataToken = JSON.parse(atob(token.split('.')[1]))
          dealershipId = verifiedDataToken.dealership_id
        } catch (error) {
          console.error('Error al decodificar el token:', error)
        }
      }

      // Llamar a la función RPC en Supabase
      let rpcParams = {}
      if (dealershipId) {
        rpcParams = { dealer_id: dealershipId }
      }
      const { data: rpcData, error } = await supabase.rpc('citas_trend_mes', rpcParams)
      if (error) throw error

      // Mapear los datos para el gráfico
      const chartData = rpcData.map((d: any) => ({
        day: d.dia,
        currentMonth: d.citas_mes_actual,
        previousMonth: d.citas_mes_anterior
      }))

      // Calcular crecimiento
      const currentTotal = chartData.reduce((sum: number, d: { currentMonth: number }) => sum + d.currentMonth, 0)
      const prevTotal = chartData.reduce((sum: number, d: { previousMonth: number }) => sum + d.previousMonth, 0)
      const growthPercentage = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100
      setGrowth(growthPercentage)
      setData(chartData)
    } catch (error) {
      console.error('❌ Error al cargar datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Tendencia de Citas</CardTitle>
          <CardDescription>
            Comparación de citas con el mes anterior
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className={`rounded-md p-1 flex items-center gap-1 ${growth > 0 ? 'bg-green-100' : growth < 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <span className={`text-xs font-medium ${growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
            {growth > 0 ? 
              <ArrowUpIcon className="h-4 w-4 text-green-600" /> : 
              growth < 0 ?
              <ArrowDownIcon className="h-4 w-4 text-red-600" /> :
              null
            }
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6" style={{ fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
        {/* Gráfico principal responsivo */}
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCurrentMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-currentMonth)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-currentMonth)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPreviousMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-previousMonth)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-previousMonth)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={0}
                minTickGap={0}
                tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'inherit' }}
                tickFormatter={(value) => value.toString()}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.max(5, dataMax + 1)]}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
                tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'inherit' }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Día ${value}`}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="previousMonth"
                type="monotone"
                fill="url(#fillPreviousMonth)"
                stroke="var(--color-previousMonth)"
                strokeWidth={2}
                stackId="a"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                dataKey="currentMonth"
                type="monotone"
                fill="url(#fillCurrentMonth)"
                stroke="var(--color-currentMonth)"
                strokeWidth={2}
                stackId="a"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Leyenda personalizada centrada */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 4, borderRadius: 2, background: 'var(--color-currentMonth)' }}></span>
            <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>Mes Actual</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 4, borderRadius: 2, background: 'var(--color-previousMonth)' }}></span>
            <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>Mes Anterior</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 