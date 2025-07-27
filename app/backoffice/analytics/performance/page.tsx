"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface TokenData {
  dealership_id?: string
}

interface WorkshopPerformanceData {
  success: boolean;
  dealership_id: string;
  calculated_at: string;
  period: string;
}

export default function PerformancePage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<TokenData>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [performanceData, setPerformanceData] = useState<WorkshopPerformanceData | null>(null)
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

  // Cargar datos de performance
  useEffect(() => {
    if (dataToken.dealership_id) {
      cargarDatosPerformance()
    }
  }, [dataToken])

  const cargarDatosPerformance = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Cargando datos de performance del taller...')
      
      // Por ahora, creamos datos mock para demostración
      // En el futuro, esto se conectará a un endpoint real
      const mockData: WorkshopPerformanceData = {
        success: true,
        dealership_id: dataToken.dealership_id!,
        calculated_at: new Date().toISOString(),
        period: "Últimos 30 días"
      }
      
      setPerformanceData(mockData)
      
      console.log('✅ Datos de performance cargados exitosamente')
      toast({
        title: "Datos actualizados",
        description: "Los datos de performance se han cargado correctamente.",
      })
      
    } catch (err) {
      console.error('❌ Error cargando datos de performance:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de performance.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    cargarDatosPerformance()
  }



  if (isLoading && !performanceData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance del Taller</h1>
            <p className="text-muted-foreground">Métricas y análisis de rendimiento del taller</p>
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
            <h1 className="text-3xl font-bold">Performance del Taller</h1>
            <p className="text-muted-foreground">Métricas y análisis de rendimiento del taller</p>
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
          <h1 className="text-3xl font-bold">Performance del Taller</h1>
          <p className="text-muted-foreground">
            Métricas y análisis de rendimiento del taller
            {performanceData && (
              <span className="ml-2 text-sm">
                • {performanceData.period} • Última actualización: {new Date(performanceData.calculated_at).toLocaleString('es-ES')}
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {performanceData && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Página de performance en desarrollo</p>
        </div>
      )}
    </div>
  )
} 