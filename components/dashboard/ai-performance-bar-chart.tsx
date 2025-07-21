"use client"

import React, { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Bot, TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO } from "date-fns"

interface AiPerformanceBarChartProps {
  dealershipId: string
}

type ApiWeek = {
  semana: string
  fecha_inicio: string
  agenteai_citas: number
  manual_citas: number
  total_citas: number
  agenteai_percentage: string
}

type ChartDatum = {
  semana: string
  fecha_inicio: string
  AgenteAI: number
  Manual: number
}

const chartConfig = {
  AgenteAI: {
    label: "Agente AI",
    color: "#93c5fd", // blue-300 (igual que DonutChart)
  },
  Manual: {
    label: "Manual",
    color: "#dbeafe", // azul muy claro
  },
} satisfies ChartConfig

export function AiPerformanceBarChart({ dealershipId }: AiPerformanceBarChartProps) {
  const [chartData, setChartData] = useState<ChartDatum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAI: 0,
    totalManual: 0,
    avgAIPercentage: 0,
  })

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/ai-performance?dealership_id=${dealershipId}&months=3`)
        const json = await res.json()
        const weeks: ApiWeek[] = json.weeks || []
        const data: ChartDatum[] = weeks.map((w) => ({
          semana: w.semana,
          fecha_inicio: w.fecha_inicio ? format(parseISO(w.fecha_inicio), "dd/MM") : "",
          AgenteAI: w.agenteai_citas,
          Manual: w.manual_citas,
        }))
        setChartData(data)
        // Calcular stats
        const totalAI = weeks.reduce((acc, w) => acc + (w.agenteai_citas || 0), 0)
        const totalManual = weeks.reduce((acc, w) => acc + (w.manual_citas || 0), 0)
        const avgAIPercentage = weeks.length
          ? weeks.reduce((acc, w) => acc + parseFloat(w.agenteai_percentage || "0"), 0) / weeks.length
          : 0
        setStats({
          totalAI,
          totalManual,
          avgAIPercentage: Math.round(avgAIPercentage * 10) / 10,
        })
      } catch (e) {
        setChartData([])
        setStats({ totalAI: 0, totalManual: 0, avgAIPercentage: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    if (dealershipId) fetchData()
  }, [dealershipId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-500" /> Performance semanal AI
        </CardTitle>
        <CardDescription>
          Citas agendadas por Agente AI vs Manual (últimas 12 semanas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-72 w-full">
            <Skeleton className="w-full h-72" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-72 w-full text-muted-foreground">
            No hay datos para mostrar
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={chartData} width={undefined} height={undefined} className="w-full">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha_inicio"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={60}
                tick={{ fontSize: 12 }}
              />
              <Bar dataKey="AgenteAI" stackId="a" fill="#93c5fd" />
              <Bar dataKey="Manual" stackId="a" fill="#dbeafe" />
              <ChartTooltip content={<ChartTooltipContent labelKey="semana" />} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="flex flex-col items-center">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-1" />
          <span className="text-xs text-muted-foreground">Total AgenteAI</span>
          <span className="text-lg font-bold text-blue-600">{stats.totalAI}</span>
        </div>
        <div className="flex flex-col items-center">
          <TrendingUp className="w-5 h-5 text-blue-400 mb-1" />
          <span className="text-xs text-muted-foreground">Total Manual</span>
          <span className="text-lg font-bold text-blue-400">{stats.totalManual}</span>
        </div>
        <div className="flex flex-col items-center">
          <TrendingUp className="w-5 h-5 text-blue-700 mb-1" />
          <span className="text-xs text-muted-foreground">% Promedio AI</span>
          <span className="text-lg font-bold text-blue-700">{stats.avgAIPercentage}%</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default AiPerformanceBarChart 