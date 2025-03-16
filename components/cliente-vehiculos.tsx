"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Calendar, Clock, Bell, Wrench, Car, AlertTriangle } from "lucide-react"

interface Vehiculo {
  id: string
  client_id: string
  vin: string | null
  make: string
  model: string
  year: number
  license_plate: string | null
  last_km: number | null
  last_service_date: string | null
  next_service_date: string | null
  garantia_type: string | null
  garantia_expiration_date: string | null
  garantia_state: string | null
  created_at: string | null
  updated_at: string | null
}

interface ServicioHistorial {
  id_uuid: string
  fecha: string
  tipo: string
  descripcion: string
  tecnico: string
  costo: number
  estado: string
}

interface Modificacion {
  id_uuid: string
  fecha: string
  tipo: string
  descripcion: string
  proveedor: string
  garantia: string
  costo: number
}

export function ClienteVehiculos({ clienteId }: { clienteId: string }) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [servicios, setServicios] = useState<ServicioHistorial[]>([])
  const [modificaciones, setModificaciones] = useState<Modificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const cargarDatos = useCallback(async () => {
    setLoading(true)

    try {
      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clienteId)

      if (vehiculosError) throw vehiculosError

      setVehiculos(vehiculosData || [])
      if (vehiculosData?.length > 0) {
        setVehiculoSeleccionado(vehiculosData[0].id)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }, [clienteId, supabase])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const getEstadoGarantia = (vehiculo: Vehiculo) => {
    if (!vehiculo.garantia_expiration_date) return 'Sin garantía'
    const hoy = new Date()
    const vencimiento = new Date(vehiculo.garantia_expiration_date)
    return hoy > vencimiento ? 'Vencida' : 'Vigente'
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-4 bg-muted rounded w-1/4"></div>
      <div className="h-32 bg-muted rounded"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {vehiculos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Car className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No hay vehículos registrados</h3>
                <p className="text-sm text-muted-foreground">
                  Este cliente aún no tiene vehículos registrados.
                </p>
              </div>
              <Button>
                Agregar Vehículo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">
              <Car className="h-4 w-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger value="modificaciones">
              <Wrench className="h-4 w-4 mr-2" />
              Modificaciones
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <Bell className="h-4 w-4 mr-2" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehiculos.map(vehiculo => (
                <Card key={vehiculo.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{vehiculo.make} {vehiculo.model} {vehiculo.year}</span>
                      <Badge variant={vehiculo.garantia_state === 'vigente' ? 'success' : 'destructive'}>
                        {getEstadoGarantia(vehiculo)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">VIN</p>
                        <p className="text-sm text-muted-foreground">{vehiculo.vin || 'No registrado'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Placa</p>
                        <p className="text-sm text-muted-foreground">{vehiculo.license_plate || 'No registrada'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Kilometraje</p>
                        <p className="text-sm text-muted-foreground">
                          {vehiculo.last_km ? `${vehiculo.last_km} km` : 'No registrado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Último servicio</p>
                        <p className="text-sm text-muted-foreground">
                          {vehiculo.last_service_date ? 
                            format(new Date(vehiculo.last_service_date), 'PP', { locale: es }) : 
                            'Sin servicios'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Próximo servicio</p>
                        <p className="text-sm text-muted-foreground">
                          {vehiculo.next_service_date ? 
                            format(new Date(vehiculo.next_service_date), 'PP', { locale: es }) : 
                            'No programado'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modificaciones">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Modificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Aquí irá la tabla de modificaciones cuando tengamos los datos */}
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 mb-4" />
                  <p>El registro de modificaciones estará disponible próximamente</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alertas">
            <Card>
              <CardHeader>
                <CardTitle>Alertas y Notificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Aquí irán las alertas cuando implementemos esa funcionalidad */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 mb-4" />
                    <p>Las alertas y notificaciones estarán disponibles próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 