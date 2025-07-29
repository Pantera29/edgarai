"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  RefreshCw, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  Phone,
  Mail
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DonutChart } from "@/components/ui/donut-chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz'

interface TokenData {
  dealership_id?: string
}

interface LRFSummary {
  total_clientes: number
  clientes_en_riesgo: number
  porcentaje_en_riesgo: number
  score_promedio: number
  ultima_actualizacion: string
  clientes_criticos: number
}

interface SegmentData {
  name: string
  value: number
  color: string
}

interface CriticalClient {
  client_id: string
  current_segment: string
  lrf_composite_score: number
  days_since_last_appointment: number
  expected_interval_days: number
  dias_vencidos: number
  client_names: string
  client_phone: string
  client_email: string
}

interface TemporalData {
  semana: number
  fecha_inicio: string
  champions: number
  loyal_customers: number
  at_risk: number
  cannot_lose: number
}

interface LRFData {
  success: boolean
  dealership_id: string
  summary: LRFSummary
  segment_distribution: SegmentData[]
  critical_clients: CriticalClient[]
  temporal_evolution: TemporalData[]
  calculated_at: string
}

interface DealershipConfig {
  timezone?: string
}

export default function LealtadPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<TokenData>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lrfData, setLrfData] = useState<LRFData | null>(null)
  const [dealershipConfig, setDealershipConfig] = useState<DealershipConfig>({})
  const router = useRouter()
  const supabase = createClientComponentClient()



  // Efecto para obtener los query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setSearchParams(params)
    }
  }, [])

  // Efecto para verificar el token
  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token")
      if (tokenValue) {
        setToken(tokenValue)
        const verifiedDataToken = verifyToken(tokenValue)
        
        // Validación robusta del token
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          console.error("Token inválido o sin dealership_id")
          router.push("/login")
          return
        }
        
        setDataToken(verifiedDataToken)
        setIsLoading(false)
      } else {
        console.error("No se encontró token en los query params")
        router.push("/login")
      }
    }
  }, [searchParams, router])

  // Cargar datos de lealtad
  useEffect(() => {
    if (dataToken.dealership_id) {
      cargarConfiguracionDealership()
      cargarDatosLealtad()
    }
  }, [dataToken])

  const cargarConfiguracionDealership = async () => {
    try {
      console.log('🔄 Cargando configuración del dealership...')
      
      const { data: config, error: configError } = await supabase
        .from('dealership_configuration')
        .select('timezone')
        .eq('dealership_id', dataToken.dealership_id)
        .maybeSingle()
      
      if (configError) {
        console.error('❌ Error cargando configuración:', configError)
        // Usar timezone por defecto
        setDealershipConfig({ timezone: 'America/Mexico_City' })
        return
      }
      
      setDealershipConfig({
        timezone: config?.timezone || 'America/Mexico_City'
      })
      
      console.log('✅ Configuración cargada:', { timezone: config?.timezone || 'America/Mexico_City' })
      
    } catch (error) {
      console.error('❌ Error cargando configuración:', error)
      setDealershipConfig({ timezone: 'America/Mexico_City' })
    }
  }

  const cargarDatosLealtad = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Cargando datos de lealtad de clientes...')
      
      const response = await fetch(`/api/lrf/analytics?dealership_id=${dataToken.dealership_id}`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }
      
      const data: LRFData = await response.json()
      
      console.log('📊 [Frontend] Datos recibidos del API:', data)
      
      if (!data.success) {
        throw new Error('Error al cargar datos de lealtad')
      }
      
      setLrfData(data)
      
      console.log('✅ Datos de lealtad cargados exitosamente')
      console.log('📅 [Debug] Fecha de última actualización del API:', data.summary.ultima_actualizacion)
      toast({
        title: "Datos actualizados",
        description: "Los datos de lealtad se han cargado correctamente.",
      })
      
    } catch (error) {
      console.error('❌ Error cargando datos de lealtad:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de lealtad.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    cargarDatosLealtad()
  }

  const handleContactarCliente = (clientId: string) => {
    router.push(`/backoffice/clients/${clientId}/conversation?token=${token}`)
  }

  const traducirSegmento = (segmento: string) => {
    const traducciones: Record<string, string> = {
      'champions': 'Campeones',
      'loyal_customers': 'Clientes Leales',
      'new_customers': 'Clientes Nuevos',
      'at_risk': 'En Riesgo',
      'cannot_lose': 'No Perder',
      'lost_customers': 'Clientes Perdidos',
      'potential_loyalists': 'Potenciales Leales'
    }
    return traducciones[segmento] || segmento
  }

  const getSegmentColor = (segmento: string, index: number = 0) => {
    // Paleta azul estándar de Tailwind (igual que el dashboard principal)
    const blueShades = [
      '#dbeafe', // blue-100
      '#93c5fd', // blue-300
      '#60a5fa', // blue-400
      '#3b82f6', // blue-500
      '#2563eb', // blue-600
      '#1d4ed8', // blue-700
      '#1e40af', // blue-800
      '#172554'  // blue-900
    ];
    
    // Usar la paleta azul para todos los segmentos
    return blueShades[index % blueShades.length];
  }

  const formatearFechaConTimezone = (fechaUTC: string) => {
    if (!fechaUTC) return 'No disponible'
    
    try {
      const timezone = dealershipConfig.timezone || 'America/Mexico_City'
      
      console.log('🕐 [Debug] Formateando fecha:', {
        fechaUTC,
        timezone,
        dealershipConfig
      })
      
      // Crear fecha UTC
      const fecha = new Date(fechaUTC)
      
      // Para México (UTC-6), restar 6 horas
      if (timezone === 'America/Mexico_City') {
        const fechaMexico = new Date(fecha.getTime() - (6 * 60 * 60 * 1000))
        
        console.log('🕐 [Debug] Fecha UTC original:', fecha.toISOString())
        console.log('🕐 [Debug] Fecha México ajustada:', fechaMexico.toISOString())
        
        const fechaFormateada = format(fechaMexico, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
        
        console.log('✅ [Debug] Fecha formateada:', fechaFormateada)
        
        return fechaFormateada
      } else {
        // Para otros timezones, usar Intl.DateTimeFormat
        const formatter = new Intl.DateTimeFormat('es-MX', {
          timeZone: timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        
        const fechaFormateada = formatter.format(fecha)
        
        console.log('✅ [Debug] Fecha formateada:', fechaFormateada)
        
        return fechaFormateada
      }
    } catch (error) {
      console.error('❌ Error formateando fecha:', error)
      // Fallback: mostrar fecha sin conversión de timezone
      return format(new Date(fechaUTC), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar los datos: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!lrfData) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            No se encontraron datos de lealtad.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Lealtad de Clientes</h1>
          <p className="text-muted-foreground">
            Última actualización: {formatearFechaConTimezone(lrfData.summary.ultima_actualizacion)}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lrfData.summary.total_clientes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Clientes con scores LRF calculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% En Riesgo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lrfData.summary.porcentaje_en_riesgo}%
            </div>
            <p className="text-xs text-muted-foreground">
              {lrfData.summary.clientes_en_riesgo} clientes en riesgo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {lrfData.summary.score_promedio}
            </div>
            <p className="text-xs text-muted-foreground">
              Score LRF promedio (1-5)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lrfData.summary.clientes_criticos}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Distribución de Segmentos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Segmentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <DonutChart
                data={lrfData.segment_distribution.map((segment, index) => ({
                  id: segment.name,
                  label: traducirSegmento(segment.name),
                  value: segment.value,
                  color: getSegmentColor(segment.name, index)
                }))}
                total={lrfData.summary.total_clientes}
                centerLabel="Clientes"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes Críticos */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto space-y-3">
              {lrfData.critical_clients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No hay clientes críticos
                </div>
              ) : (
                lrfData.critical_clients.map((client) => (
                  <div key={client.client_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{client.client_names}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.client_phone}
                        </span>
                        {client.client_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.client_email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={client.current_segment === 'cannot_lose' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {traducirSegmento(client.current_segment)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {client.dias_vencidos} días vencidos
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleContactarCliente(client.client_id)}
                      className="ml-2"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contactar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart - Evolución Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución Temporal (Últimas 8 Semanas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lrfData.temporal_evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha_inicio" 
                  tickFormatter={(value) => format(new Date(value), "dd/MM", { locale: es })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => `Semana: ${format(new Date(value), "dd/MM/yyyy", { locale: es })}`}
                  formatter={(value: any, name: any) => [
                    `${value} clientes`, 
                    traducirSegmento(name)
                  ]}
                />
                <Legend formatter={(value) => traducirSegmento(value)} />
                <Line 
                  type="monotone" 
                  dataKey="champions" 
                  stroke={getSegmentColor('champions', 0)} 
                  strokeWidth={2}
                  dot={{ fill: getSegmentColor('champions', 0), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="loyal_customers" 
                  stroke={getSegmentColor('loyal_customers', 1)} 
                  strokeWidth={2}
                  dot={{ fill: getSegmentColor('loyal_customers', 1), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="at_risk" 
                  stroke={getSegmentColor('at_risk', 2)} 
                  strokeWidth={2}
                  dot={{ fill: getSegmentColor('at_risk', 2), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cannot_lose" 
                  stroke={getSegmentColor('cannot_lose', 3)} 
                  strokeWidth={2}
                  dot={{ fill: getSegmentColor('cannot_lose', 3), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 