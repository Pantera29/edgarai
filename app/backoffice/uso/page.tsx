"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { verifyToken } from "../../jwt/token"
import { UsageDashboard } from "@/components/usage-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, ArrowLeft, BarChart3 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface TokenData {
  dealership_id?: string
}

export default function UsoPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<TokenData>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
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

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    // Simular refresh - en realidad el componente UsageDashboard maneja su propio estado
    setTimeout(() => setIsLoading(false), 500)
    toast({
      title: "Actualizando datos",
      description: "Los datos se están actualizando...",
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/backoffice?token=${token}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uso de la Plataforma</h1>
          <p className="text-muted-foreground">
            Monitorea las conversaciones de tu agencia
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Dashboard Component */}
      {dataToken.dealership_id && (
        <UsageDashboard 
          dealershipId={dataToken.dealership_id} 
          token={token}
        />
      )}
    </div>
  )
} 