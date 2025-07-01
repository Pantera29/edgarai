"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

import { UsageSummaryData } from "@/types"

interface UsageSummaryCardProps {
  dealershipId: string
  token: string
}

export function UsageSummaryCard({ dealershipId, token }: UsageSummaryCardProps) {
  const [data, setData] = useState<UsageSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummaryData = async () => {
    try {
      console.log("🔄 Fetching summary data for dealership:", dealershipId)
      
      const response = await fetch(`/api/dealerships/usage?dealership_id=${dealershipId}&months=2`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.usage_data || !Array.isArray(result.usage_data)) {
        throw new Error("Formato de datos inválido")
      }
      
      // Transformar datos para el resumen
      const transformedData: UsageSummaryData = {
        current_period: {
          unique_conversations: result.usage_data[0]?.unique_conversations || 0,
          by_channel: {
            phone: result.usage_data[0]?.phone_conversations || 0,
            whatsapp: result.usage_data[0]?.whatsapp_conversations || 0
          }
        },
        previous_period: result.usage_data[1] ? {
          unique_conversations: result.usage_data[1].unique_conversations || 0
        } : undefined
      }
      
      setData(transformedData)
      console.log("✅ Summary data loaded successfully:", transformedData)
      
    } catch (err) {
      console.error("❌ Error fetching summary data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      // No mostrar toast para no interrumpir el dashboard principal
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dealershipId) {
      fetchSummaryData()
      
      // Actualización automática cada 5 minutos
      const interval = setInterval(fetchSummaryData, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [dealershipId])

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getGrowthIndicator = () => {
    if (!data?.previous_period) return null
    
    const growth = calculateGrowth(
      data.current_period.unique_conversations,
      data.previous_period.unique_conversations
    )
    
    const isPositive = growth >= 0
    
    return (
      <div className="flex items-center gap-1 mt-2">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-600" />
        )}
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? "+" : ""}{growth.toFixed(1)}%
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" />
            Uso de la Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs">Sin datos</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentMonth = format(new Date(), "MMM yyyy", { locale: es })

  return (
    <Link href={`/backoffice/uso?token=${token}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" />
            Uso de la Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {data.current_period.unique_conversations}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {currentMonth}
            </p>
            {getGrowthIndicator()}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-2">
              <span>W: {data.current_period.by_channel.whatsapp}</span>
              <span>L: {data.current_period.by_channel.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 