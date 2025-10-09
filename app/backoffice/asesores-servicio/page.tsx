"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search, UserCheck, Settings } from 'lucide-react'
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ServiceAdvisorWithRelations, getWorkingDaysString, formatTimeRange } from "@/types/database.types"

interface Workshop {
  id: string
  name: string
}

export default function AsesoresServicioPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<any>({})

  const router = useRouter()
  const { toast } = useToast()

  // Estados para datos
  const [advisors, setAdvisors] = useState<ServiceAdvisorWithRelations[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("all")
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  
  // Estados de carga
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setSearchParams(params)
    }
  }, [])

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token")
      if (tokenValue) {
        setToken(tokenValue)
        const verifiedDataToken = verifyToken(tokenValue)
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login")
          return
        }
        
        setDataToken(verifiedDataToken || {})
        
        if (verifiedDataToken?.dealership_id) {
          cargarDatos(verifiedDataToken.dealership_id)
        }
      }
    }
  }, [searchParams, router])

  async function cargarDatos(dealershipId: string) {
    setLoading(true)
    
    try {
      // Cargar asesores
      const advisorsParams = new URLSearchParams({
        dealershipId: dealershipId,
      })
      
      if (!showActiveOnly) {
        advisorsParams.append('isActive', 'false')
      }

      const advisorsRes = await fetch(`/api/service-advisors?${advisorsParams.toString()}`)
      const advisorsData = await advisorsRes.json()
      
      if (advisorsData.success) {
        setAdvisors(advisorsData.data || [])
      } else {
        throw new Error(advisorsData.error || 'Error al cargar asesores')
      }

      // Cargar talleres
      const workshopsParams = new URLSearchParams({
        dealership_id: dealershipId,
      })
      
      const workshopsRes = await fetch(`/api/workshops?${workshopsParams.toString()}`)
      const workshopsData = await workshopsRes.json()
      
      if (workshopsData.success) {
        setWorkshops(workshopsData.data || [])
      }

    } catch (error: any) {
      console.error('Error al cargar datos:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDesactivar(advisorId: string, advisorName: string) {
    if (!confirm(`¿Estás seguro de desactivar al asesor ${advisorName}?`)) {
      return
    }

    setIsDeleting(advisorId)

    try {
      const response = await fetch(`/api/service-advisors/${advisorId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al desactivar asesor')
      }

      toast({
        title: "Asesor desactivado",
        description: data.message || "El asesor ha sido desactivado exitosamente",
      })

      // Recargar datos
      if (dataToken?.dealership_id) {
        cargarDatos(dataToken.dealership_id)
      }

    } catch (error: any) {
      console.error('Error al desactivar asesor:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  function handleNuevoAsesor() {
    router.push(`/backoffice/asesores-servicio/nuevo?token=${token}`)
  }

  function handleEditar(advisorId: string) {
    router.push(`/backoffice/asesores-servicio/${advisorId}/editar?token=${token}`)
  }

  function handleConfigurarSlots(advisorId: string) {
    router.push(`/backoffice/asesores-servicio/${advisorId}/slots?token=${token}`)
  }

  // Filtrar asesores
  const advisorsFiltrados = advisors.filter(advisor => {
    // Filtro de búsqueda
    const matchesSearch = !searchTerm || 
      advisor.name.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro de taller
    const matchesWorkshop = selectedWorkshop === "all" || 
      advisor.workshop_id === selectedWorkshop

    // Filtro de estado
    const matchesActive = !showActiveOnly || advisor.is_active

    return matchesSearch && matchesWorkshop && matchesActive
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Toaster />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Asesores de Servicio
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los asesores que atienden las citas en tus talleres
          </p>
        </div>
        <Button onClick={handleNuevoAsesor} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Asesor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra los asesores por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filtro de taller */}
            <div className="space-y-2">
              <Label htmlFor="workshop">Taller</Label>
              <Select value={selectedWorkshop} onValueChange={setSelectedWorkshop}>
                <SelectTrigger id="workshop">
                  <SelectValue placeholder="Selecciona un taller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los talleres</SelectItem>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id}>
                      {workshop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de estado */}
            <div className="space-y-2">
              <Label htmlFor="active-filter">Estado</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="active-filter"
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                />
                <Label htmlFor="active-filter" className="cursor-pointer">
                  Solo activos
                </Label>
              </div>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-semibold">{advisorsFiltrados.length}</span> de{" "}
              <span className="font-semibold">{advisors.length}</span> asesores
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de asesores */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando asesores...</p>
              </div>
            </div>
          ) : advisorsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No se encontraron asesores</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || selectedWorkshop !== "all"
                  ? "Intenta ajustar los filtros"
                  : "Comienza agregando un nuevo asesor"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Taller</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Días Laborables</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisorsFiltrados.map((advisor) => (
                  <TableRow key={advisor.id}>
                    <TableCell className="font-medium">{advisor.name}</TableCell>
                    <TableCell>
                      {advisor.workshop?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatTimeRange(advisor.shift_start_time, advisor.shift_end_time)}</div>
                        <div className="text-xs text-muted-foreground">
                          Almuerzo: {formatTimeRange(advisor.lunch_start_time, advisor.lunch_end_time)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getWorkingDaysString(advisor)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={advisor.is_active ? "default" : "secondary"}>
                        {advisor.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditar(advisor.id)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConfigurarSlots(advisor.id)}>
                            Configurar Slots
                          </DropdownMenuItem>
                          {advisor.is_active && (
                            <DropdownMenuItem 
                              onClick={() => handleDesactivar(advisor.id, advisor.name)}
                              className="text-red-600"
                              disabled={isDeleting === advisor.id}
                            >
                              {isDeleting === advisor.id ? "Desactivando..." : "Desactivar"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

