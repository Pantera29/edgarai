"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, TrendingUp, Users, Target, BarChart3 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { CohortRetentionChart } from "@/components/cohort-retention-chart"

interface TokenData {
  dealership_id?: string
}

interface CohortRetentionData {
  success: boolean;
  dealership_id: string;
  calculated_at: string;
  months_analyzed: number;
  summary: {
    total_cohorts: number;
    complete_cohorts: number;
    partial_cohorts: number;
    avg_retention_0_6m: number;
    avg_retention_6_12m: number;
    avg_retention_12_18m: number;
    total_new_clients: number;
    latest_complete_cohort: string | null;
    best_cohort_0_6m: string | null;
    worst_cohort_0_6m: string | null;
  };
  cohorts: Array<{
    cohort_label: string;
    cohort_month: string;
    cohort_size: number;
    retention_rates: Record<string, number>;
    retention_counts: Record<string, number>;
    has_complete_data: boolean;
  }>;
  benchmarks: {
    period_0_6m: { average: number; min: number; max: number; median: number; count: number; };
    period_6_12m: { average: number; min: number; max: number; median: number; count: number; };
    period_12_18m: { average: number; min: number; max: number; median: number; count: number; };
  };
  metadata: {
    total_cohorts: number;
    execution_time_ms: number;
    data_complete_cohorts: number;
    data_partial_cohorts: number;
  };
}

export default function RetencionPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<TokenData>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [retentionData, setRetentionData] = useState<CohortRetentionData | null>(null)
  const router = useRouter()

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

  // Cargar datos de retención
  useEffect(() => {
    if (dataToken.dealership_id) {
      cargarDatosRetencion()
    }
  }, [dataToken])

  const cargarDatosRetencion = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Cargando datos de retención por cohort...')
      
      const response = await fetch(`/api/retention/cohort?token=${token}&months_back=24&format=dashboard`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const data: CohortRetentionData = await response.json()
      setRetentionData(data)
      
      console.log('✅ Datos de retención cargados exitosamente')
      toast({
        title: "Datos actualizados",
        description: "Los datos de retención se han cargado correctamente.",
      })
      
    } catch (err) {
      console.error('❌ Error cargando datos de retención:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de retención.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    cargarDatosRetencion()
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('es-ES')
  }

  if (isLoading && !retentionData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Retención por Cohort</h1>
            <p className="text-muted-foreground">Análisis de retención de clientes a lo largo del tiempo</p>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Retención por Cohort</h1>
            <p className="text-muted-foreground">Análisis de retención de clientes a lo largo del tiempo</p>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar los datos: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Retención por Cohort</h1>
          <p className="text-muted-foreground">
            Análisis de retención de clientes a lo largo del tiempo
            {retentionData && (
              <span className="ml-2 text-sm">
                • Última actualización: {new Date(retentionData.calculated_at).toLocaleString('es-ES')}
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {retentionData && (
        <>
          {/* Métricas principales */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Cohorts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(retentionData.summary.total_cohorts)}</div>
                <p className="text-xs text-muted-foreground">
                  {retentionData.summary.complete_cohorts} completos, {retentionData.summary.partial_cohorts} parciales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retención 0-6m</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(retentionData.summary.avg_retention_0_6m)}</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de {retentionData.benchmarks.period_0_6m.count} cohorts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retención 6-12m</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(retentionData.summary.avg_retention_6_12m)}</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de {retentionData.benchmarks.period_6_12m.count} cohorts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(retentionData.summary.total_new_clients)}</div>
                <p className="text-xs text-muted-foreground">
                  Nuevos clientes en {retentionData.months_analyzed} meses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de retención por cohort */}
          <CohortRetentionChart cohorts={retentionData.cohorts} />

          {/* Tabla de cohorts */}
          <Card>
            <CardHeader>
              <CardTitle>Cohorts Detallados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-left p-2">Tamaño</th>
                      <th className="text-left p-2">0-6m</th>
                      <th className="text-left p-2">6-12m</th>
                      <th className="text-left p-2">12-18m</th>
                      <th className="text-left p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionData.cohorts.map((cohort) => (
                      <tr key={cohort.cohort_label} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{cohort.cohort_label}</td>
                        <td className="p-2">{formatNumber(cohort.cohort_size)}</td>
                        <td className="p-2">{formatPercentage(cohort.retention_rates['0_6m'] || 0)}</td>
                        <td className="p-2">{formatPercentage(cohort.retention_rates['6_12m'] || 0)}</td>
                        <td className="p-2">{formatPercentage(cohort.retention_rates['12_18m'] || 0)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            cohort.has_complete_data 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cohort.has_complete_data ? 'Completo' : 'Parcial'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground text-center">
            Tiempo de ejecución: {retentionData.metadata.execution_time_ms}ms • 
            Cohorts completos: {retentionData.metadata.data_complete_cohorts} • 
            Cohorts parciales: {retentionData.metadata.data_partial_cohorts}
          </div>
        </>
      )}
    </div>
  )
} 