"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import { 
  MessageSquare, 
  Phone, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"
import { UsageData } from "@/types"

interface UsageDashboardProps {
  dealershipId: string
  token: string
}

export function UsageDashboard({ dealershipId, token }: UsageDashboardProps) {
  const [data, setData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchUsageData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log("🔄 Fetching usage data for dealership:", dealershipId)
      
      const response = await fetch(`/api/dealerships/usage?dealership_id=${dealershipId}&months=12`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.usage_data || !Array.isArray(result.usage_data)) {
        throw new Error("Formato de datos inválido")
      }
      
      const usageArray = result.usage_data || [];

      const transformedData: UsageData = {
        dealership_id: dealershipId,
        current_period: usageArray[0]
          ? {
              period: usageArray[0].period,
              year: parseInt(usageArray[0].period.split("-")[0]),
              month: parseInt(usageArray[0].period.split("-")[1]),
              unique_conversations: usageArray[0].unique_conversations || 0,
              by_channel: {
                phone: usageArray[0].phone_users || 0,
                whatsapp: usageArray[0].whatsapp_users || 0
              }
            }
          : {
              period: "",
              year: 0,
              month: 0,
              unique_conversations: 0,
              by_channel: { phone: 0, whatsapp: 0 }
            },
        historical_usage: usageArray.slice(0, 12).map((item: any) => ({
          period: item.period,
          year: parseInt(item.period.split("-")[0]),
          month: parseInt(item.period.split("-")[1]),
          unique_conversations: item.unique_conversations || 0,
          by_channel: {
            phone: item.phone_users || 0,
            whatsapp: item.whatsapp_users || 0
          }
        })),
        calculated_at: new Date().toISOString()
      }
      
      setData(transformedData)
      setLastUpdated(new Date())
      
      console.log("✅ Usage data loaded successfully:", transformedData)
      
    } catch (err) {
      console.error("❌ Error fetching usage data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de uso. Por favor, intente nuevamente."
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (dealershipId) {
      fetchUsageData()
    }
  }, [dealershipId])

  const formatMonth = (year: number, month: number) => {
    if (!year || !month || isNaN(year) || isNaN(month)) {
      console.warn("Valores inválidos para fecha en formatMonth:", { year, month })
      return "Mes inválido"
    }
    const date = new Date(year, month - 1)
    if (isNaN(date.getTime())) {
      console.warn("Fecha inválida generada en formatMonth:", { year, month, date })
      return "Mes inválido"
    }
    return format(date, "MMM yyyy", { locale: es })
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getGrowthBadge = (current: number, previous: number) => {
    const growth = calculateGrowth(current, previous)
    const isPositive = growth >= 0
    
    return (
      <Badge variant={isPositive ? "default" : "destructive"} className="ml-2">
        {isPositive ? "+" : ""}{growth.toFixed(1)}%
      </Badge>
    )
  }

  const getGrowthIcon = (current: number, previous: number) => {
    const growth = calculateGrowth(current, previous)
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button 
            onClick={fetchUsageData}
            className="ml-2 underline hover:no-underline"
          >
            Intentar nuevamente
          </button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se encontraron datos de uso para esta agencia.
        </AlertDescription>
      </Alert>
    )
  }

  const currentPeriod = data.current_period
  const previousPeriod = data.historical_usage[1] // El segundo elemento es el mes anterior

  // Preparar datos para el gráfico
  const chartData = data.historical_usage
    .slice(0, 12)
    .reverse()
    .map(item => ({
      month: formatMonth(item.year, item.month),
      conversaciones: item.unique_conversations,
      whatsapp: item.by_channel.whatsapp,
      llamadas: item.by_channel.phone
    }))

  return (
    <div className="grid gap-6">
      {/* Grid de dos columnas: card principal 2/5, gráfico 3/5 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Card Principal - Mes Actual (2/5) */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversaciones del Mes Actual
                </CardTitle>
                <button 
                  onClick={fetchUsageData}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title="Actualizar datos"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Última actualización: {format(lastUpdated, "dd/MM/yyyy HH:mm")}
                </p>
              )}
            </CardHeader>
            <CardContent className="py-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {currentPeriod.unique_conversations}
                </div>
                <p className="text-muted-foreground mb-4">
                  conversaciones en {formatMonth(currentPeriod.year, currentPeriod.month)}
                </p>
                <div className="flex items-center justify-center mb-4">
                  {getGrowthBadge(currentPeriod.unique_conversations, previousPeriod?.unique_conversations || 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Gráfico Histórico (3/5) */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Últimos 12 meses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} conversaciones`, "Total"]}
                      labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversaciones" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Tabla Detallada: abajo, ancho completo */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">WhatsApp</TableHead>
                  <TableHead className="text-right">Llamadas</TableHead>
                  <TableHead className="text-right">Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.historical_usage.slice(0, 12).map((item, index) => {
                  const previousItem = data.historical_usage[index + 1]
                  const isCurrentMonth = index === 0
                  
                  return (
                    <TableRow key={item.period}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {formatMonth(item.year, item.month)}
                          {isCurrentMonth && (
                            <Badge variant="secondary" className="text-xs">
                              Actual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.unique_conversations}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.by_channel?.whatsapp ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.by_channel?.phone ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {previousItem && (
                          <div className="flex items-center justify-end gap-1">
                            {getGrowthIcon(
                              item.unique_conversations,
                              previousItem.unique_conversations
                            )}
                            <span className="text-sm">
                              {calculateGrowth(
                                item.unique_conversations,
                                previousItem.unique_conversations
                              ).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 