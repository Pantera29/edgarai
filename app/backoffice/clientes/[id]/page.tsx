"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Breadcrumb } from "@/components/Breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  Car, 
  Calendar, 
  Clock, 
  Wrench, 
  Phone, 
  Mail,
  TrendingUp,
  CalendarDays,
  Car as CarIcon
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getBaseUrl } from '@/lib/utils'

interface PageProps {
  params: {
    id: string;
  };
}

interface Cliente {
  id: string;
  names: string;
  email: string | null;
  phone_number: string;
  created_at: string;
  dealership_id: string;
}

interface Vehiculo {
  id_uuid: string;
  make: string;
  model: string;
  year: number;
  license_plate: string | null;
  vin: string | null;
  last_km: number | null;
  last_service_date: string | null;
}

interface Cita {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  services: {
    id_uuid: string;
    service_name: string;
    duration_minutes: number;
    price: number;
  };
  vehicles: {
    id_uuid: string;
    make: string;
    model: string;
    license_plate: string | null;
    year: number;
  };
}

export default function ClientePage({ params }: PageProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingVehiculos, setLoadingVehiculos] = useState(true)
  const [loadingCitas, setLoadingCitas] = useState(true)
  const [token, setToken] = useState<string>("")
  const supabase = createClientComponentClient()

  // Obtener token de la URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tokenValue = params.get("token")
      if (tokenValue) {
        setToken(tokenValue)
      }
    }
  }, [])

  // Cargar datos básicos del cliente
  useEffect(() => {
    const cargarCliente = async () => {
      try {
        console.log('🔄 Cargando datos del cliente:', params.id)
        const { data, error } = await supabase
          .from('client')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setCliente(data)
        console.log('✅ Cliente cargado:', data)
      } catch (error) {
        console.error('❌ Error cargando cliente:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarCliente()
  }, [params.id, supabase])

  // Cargar vehículos del cliente
  useEffect(() => {
    const cargarVehiculos = async () => {
      try {
        console.log('🔄 Cargando vehículos del cliente:', params.id)
        const response = await fetch(`/api/customers/${params.id}/vehicles`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setVehiculos(data.vehicles || [])
        console.log('✅ Vehículos cargados:', data.vehicles?.length || 0)
      } catch (error) {
        console.error('❌ Error cargando vehículos:', error)
        setVehiculos([])
      } finally {
        setLoadingVehiculos(false)
      }
    }

    if (params.id) {
      cargarVehiculos()
    }
  }, [params.id])

  // Cargar citas del cliente
  useEffect(() => {
    const cargarCitas = async () => {
      try {
        console.log('🔄 Cargando citas del cliente:', params.id)
        const response = await fetch(`/api/customers/${params.id}/appointments`)
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setCitas(data.appointments || [])
        console.log('✅ Citas cargadas:', data.appointments?.length || 0)
      } catch (error) {
        console.error('❌ Error cargando citas:', error)
        setCitas([])
      } finally {
        setLoadingCitas(false)
      }
    }

    if (params.id) {
      cargarCitas()
    }
  }, [params.id])

  // Calcular métricas
  const totalVehiculos = vehiculos.length
  const totalServicios = citas.filter(cita => cita.status === 'completed').length
  const primeraVisita = citas.length > 0 ? citas[citas.length - 1] : null
  const ultimaVisita = citas.length > 0 ? citas[0] : null

  // Obtener estado de cita en español
  const getEstadoCita = (status: string) => {
    const estados: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pending': { label: 'Pendiente', variant: 'outline' },
      'confirmed': { label: 'Confirmada', variant: 'secondary' },
      'in_progress': { label: 'En Progreso', variant: 'default' },
      'completed': { label: 'Completada', variant: 'default' },
      'cancelled': { label: 'Cancelada', variant: 'destructive' }
    }
    return estados[status] || { label: status, variant: 'outline' }
  }

  // Breadcrumbs con token
  const breadcrumbItems = [
    { label: "Clientes", href: `${getBaseUrl()}/backoffice/clientes?token=${token}` },
    { label: cliente?.names || "Cliente", href: `${getBaseUrl()}/backoffice/clientes/${params.id}?token=${token}` }
  ]

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Cliente no encontrado</h1>
          <p className="text-muted-foreground mt-2">El cliente con ID {params.id} no existe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{cliente.names}</h1>
          <p className="text-muted-foreground">Cliente desde {format(new Date(cliente.created_at), 'PPP', { locale: es })}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Datos básicos del cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.phone_number}</span>
                  </div>
                  {cliente.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehículos Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CarIcon className="h-5 w-5" />
                    Vehículos Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingVehiculos ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : vehiculos.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Car className="mx-auto h-8 w-8 mb-2" />
                      <p>No hay vehículos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vehiculos.slice(0, 3).map(vehiculo => (
                        <div key={vehiculo.id_uuid} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{vehiculo.make} {vehiculo.model}</div>
                            <div className="text-sm text-muted-foreground">
                              {vehiculo.year} • {vehiculo.license_plate || 'Sin placa'}
                            </div>
                          </div>
                          {vehiculo.last_service_date && (
                            <div className="text-right">
                              <div className="text-sm font-medium">Último servicio</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(vehiculo.last_service_date), 'dd/MM/yyyy', { locale: es })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Servicios Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Servicios Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCitas ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-12" />
                      ))}
                    </div>
                  ) : citas.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Wrench className="mx-auto h-8 w-8 mb-2" />
                      <p>No hay servicios registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {citas.slice(0, 5).map(cita => (
                        <div key={cita.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{cita.services.service_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {cita.vehicles.make} {cita.vehicles.model}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={getEstadoCita(cita.status).variant}>
                              {getEstadoCita(cita.status).label}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(cita.appointment_date), 'dd/MM/yyyy', { locale: es })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab Vehículos */}
        <TabsContent value="vehiculos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehículos del Cliente ({totalVehiculos})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVehiculos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : vehiculos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Car className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">No hay vehículos registrados</h3>
                  <p>Este cliente aún no tiene vehículos registrados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehiculos.map(vehiculo => {
                    const serviciosVehiculo = citas.filter(cita => cita.vehicles.id_uuid === vehiculo.id_uuid)
                    const totalServiciosVehiculo = serviciosVehiculo.length
                    const ultimoServicio = serviciosVehiculo.length > 0 ? serviciosVehiculo[0] : null

                    return (
                      <Card key={vehiculo.id_uuid}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{vehiculo.make} {vehiculo.model}</span>
                            <Badge variant="outline">{vehiculo.year}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Placa:</span>
                              <div className="text-muted-foreground">
                                {vehiculo.license_plate || 'No registrada'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">VIN:</span>
                              <div className="text-muted-foreground">
                                {vehiculo.vin || 'No registrado'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Kilometraje:</span>
                              <div className="text-muted-foreground">
                                {vehiculo.last_km ? `${vehiculo.last_km} km` : 'No registrado'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Servicios:</span>
                              <div className="text-muted-foreground">
                                {totalServiciosVehiculo} realizados
                              </div>
                            </div>
                          </div>
                          
                          {ultimoServicio && (
                            <div className="pt-3 border-t">
                              <div className="text-sm">
                                <span className="font-medium">Último servicio:</span>
                                <div className="text-muted-foreground">
                                  {ultimoServicio.services.service_name} - {format(new Date(ultimoServicio.appointment_date), 'dd/MM/yyyy', { locale: es })}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Historial */}
        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial de Servicios ({citas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCitas ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : citas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">No hay servicios registrados</h3>
                  <p>Este cliente aún no tiene historial de servicios.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {citas.map(cita => (
                    <div key={cita.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{cita.services.service_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {cita.vehicles.make} {cita.vehicles.model} • {cita.vehicles.license_plate || 'Sin placa'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(cita.appointment_date), 'EEEE dd/MM/yyyy', { locale: es })} a las {cita.appointment_time}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getEstadoCita(cita.status).variant}>
                          {getEstadoCita(cita.status).label}
                        </Badge>
                        {cita.notes && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {cita.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 