"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { verifyToken } from '../../../../jwt/token'
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Wrench,
  MapPin,
  Hash,
  Gauge
} from "lucide-react"

interface Cliente {
  id: string
  names: string
  phone_number: string
  email?: string
}

interface Vehiculo {
  id_uuid: string
  client_id: string
  vin?: string
  make: string
  model: string
  year: number
  license_plate?: string
  last_km?: number
  last_service_date?: string
  created_at: string
  updated_at: string
  dealership_id: string
  client: Cliente
}

interface Servicio {
  id_uuid: string
  service_name: string
  description?: string
  duration_minutes?: number
  price?: number
}

interface ServicioEspecifico {
  id: string
  service_name: string
  kilometers: number
  months: number
  price: number
  additional_price?: number
  additional_description?: string
  includes_additional?: boolean
}

interface Cita {
  id: number
  appointment_date: string
  appointment_time: string
  status: string
  notes?: string
  channel?: string
  created_at: string
  service: Servicio
  specific_service?: ServicioEspecifico
}

interface Recordatorio {
  reminder_id: string
  reminder_date: string
  status: string
  notes?: string
  service?: {
    service_name: string
  }
}

interface PageProps {
  params: {
    id: string
  }
}

export default function HistorialVehiculoPage({ params }: PageProps) {
  const [vehicle, setVehicle] = useState<Vehiculo | null>(null)
  const [appointments, setAppointments] = useState<Cita[]>([])
  const [reminders, setReminders] = useState<Recordatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<{dealership_id?: string}>({})
  
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
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
        cargarDatosVehiculo(verifiedDataToken.dealership_id)
      } else {
        router.push("/login")
      }
    }
  }, [router])

  const cargarDatosVehiculo = async (dealershipId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/backoffice/vehicles/${params.id}?token=${token}`)
      
      if (!response.ok) {
        throw new Error('No se pudo cargar la información del vehículo')
      }
      
      const data = await response.json()
      setVehicle(data.vehicle)
      setAppointments(data.appointments || [])
      setReminders(data.reminders || [])
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'completada':
        return 'success'
      case 'confirmed':
      case 'confirmada':
        return 'info'
      case 'pending':
      case 'pendiente':
        return 'warning'
      case 'cancelled':
      case 'cancelada':
      case 'canceled':
        return 'destructive'
      case 'sent':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Completada'
      case 'confirmed':
        return 'Confirmada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      case 'sent':
        return 'Enviado'
      case 'canceled':
        return 'Cancelado'
      default:
        return status || 'Sin estado'
    }
  }

  // Calcular el último servicio basado en las citas completadas
  const getUltimoServicio = () => {
    const citasCompletadas = appointments.filter(appointment => 
      appointment.status?.toLowerCase() === 'completed' || 
      appointment.status?.toLowerCase() === 'completada'
    )
    
    if (citasCompletadas.length === 0) {
      return null
    }
    
    // Ordenar por fecha y tomar la más reciente
    const ultimaCita = citasCompletadas.sort((a, b) => 
      new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    )[0]
    
    return ultimaCita
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando información del vehículo...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'No se pudo cargar la información del vehículo'}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Historial del Vehículo</h1>
            <p className="text-muted-foreground">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>
        </div>
      </div>

      {/* Información del vehículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Información del Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Hash className="w-4 h-4 mr-2" />
                Marca y Modelo
              </div>
              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Año
              </div>
              <p className="font-medium">{vehicle.year}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                Placas
              </div>
              <p className="font-medium">{vehicle.license_plate || 'No registradas'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Hash className="w-4 h-4 mr-2" />
                VIN
              </div>
              <p className="font-medium font-mono text-sm">
                {vehicle.vin || 'No registrado'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Gauge className="w-4 h-4 mr-2" />
                Último Kilometraje
              </div>
              <p className="font-medium">
                {vehicle.last_km ? `${vehicle.last_km.toLocaleString()} km` : 'No registrado'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Último Servicio
              </div>
              <p className="font-medium">
                {(() => {
                  const ultimoServicio = getUltimoServicio()
                  if (ultimoServicio) {
                    return format(new Date(ultimoServicio.appointment_date), 'dd/MM/yyyy', { locale: es })
                  }
                  return 'No registrado'
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Cliente Propietario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-2" />
                Nombre
              </div>
              <p className="font-medium">{vehicle.client.names}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mr-2" />
                Teléfono
              </div>
              <p className="font-medium">{vehicle.client.phone_number}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </div>
              <p className="font-medium">
                {vehicle.client.email || 'No registrado'}
              </p>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Historial de citas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Historial de Citas y Servicios
          </CardTitle>
          <CardDescription>
            Lista de todas las citas realizadas para este vehículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay citas registradas para este vehículo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                          {appointment.appointment_time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Wrench className="w-4 h-4 mr-2 text-muted-foreground" />
                          <div>
                            {/* Servicio normal */}
                            <p className="font-medium">{appointment.service.service_name}</p>
                            
                            {/* Servicio específico (si existe) */}
                            {appointment.specific_service && (
                              <div className="text-sm text-muted-foreground mt-1">
                                <p className="font-medium text-blue-600">
                                  Servicio específico: {appointment.specific_service.service_name}
                                </p>
                                {appointment.specific_service.additional_description && (
                                  <p>Adicional: {appointment.specific_service.additional_description}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {appointment.channel || 'No especificado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {appointment.notes || 'Sin notas'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordatorios */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recordatorios
            </CardTitle>
            <CardDescription>
              Recordatorios programados para este vehículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.reminder_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">
                        {reminder.service?.service_name || 'Recordatorio general'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reminder.reminder_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                      {reminder.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {reminder.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(reminder.status)}>
                    {getStatusText(reminder.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
