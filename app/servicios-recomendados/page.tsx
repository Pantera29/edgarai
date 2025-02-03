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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ServicioRecomendado {
  id: string
  appointment_id: string
  vehicle_id: string
  service_name: string
  service_description: string | null
  urgency_level: 'high' | 'medium' | 'low'
  estimated_cost: number | null
  estimated_time: number | null
  technical_notes: string | null
  status: 'pending' | 'scheduled' | 'completed' | 'rejected'
  created_at: string
  vehiculos: {
    marca: string
    modelo: string
    placa: string
    clientes: {
      nombre: string
    }
  }
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'scheduled': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

interface DetallesServicioModalProps {
  servicio: ServicioRecomendado | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetallesServicioModal({ servicio, open, onOpenChange }: DetallesServicioModalProps) {
  if (!servicio) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalles del Servicio Recomendado</DialogTitle>
          <DialogDescription>
            Detectado el {format(new Date(servicio.created_at), "dd/MM/yyyy", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Información del Vehículo</h3>
            <p>Cliente: {servicio.vehiculos.clientes.nombre}</p>
            <p>Vehículo: {servicio.vehiculos.marca} {servicio.vehiculos.modelo}</p>
            <p>Placa: {servicio.vehiculos.placa}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Información del Servicio</h3>
            <p>Servicio: {servicio.service_name}</p>
            <p>Urgencia: 
              <Badge className={`ml-2 ${getUrgencyColor(servicio.urgency_level)}`}>
                {servicio.urgency_level === 'high' ? 'Alta' :
                 servicio.urgency_level === 'medium' ? 'Media' : 'Baja'}
              </Badge>
            </p>
            <p>Estado: 
              <Badge className={`ml-2 ${getStatusColor(servicio.status)}`}>
                {servicio.status === 'pending' ? 'Pendiente' :
                 servicio.status === 'scheduled' ? 'Agendado' :
                 servicio.status === 'completed' ? 'Completado' : 'Rechazado'}
              </Badge>
            </p>
          </div>

          <div className="col-span-2">
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-gray-600">{servicio.service_description || 'Sin descripción'}</p>
          </div>

          <div className="col-span-2">
            <h3 className="font-semibold mb-2">Notas Técnicas</h3>
            <p className="text-gray-600">{servicio.technical_notes || 'Sin notas técnicas'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Tiempo Estimado</h3>
            <p>{servicio.estimated_time ? `${servicio.estimated_time} minutos` : 'No especificado'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Costo Estimado</h3>
            <p>{servicio.estimated_cost ? `$${servicio.estimated_cost.toLocaleString()}` : 'No especificado'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ServiciosRecomendadosPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [servicios, setServicios] = useState<ServicioRecomendado[]>([])
  const [filtros, setFiltros] = useState({
    urgencia: '',
    estado: '',
    busqueda: '',
    fechaInicio: null,
    fechaFin: null
  })
  const [selectedServicio, setSelectedServicio] = useState<ServicioRecomendado | null>(null)
  const [showDetalles, setShowDetalles] = useState(false)

  const cargarServicios = async () => {
    try {
      console.log('Cargando servicios...');
      const { data, error } = await supabase
        .from('recommended_services')
        .select(`
          *,
          vehiculos:vehicle_id (
            marca,
            modelo,
            placa,
            clientes:id_cliente_uuid (
              nombre
            )
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Respuesta:', { data, error });

      if (error) throw error
      setServicios(data || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los servicios recomendados"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarServicios()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Servicios Recomendados</h1>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <CalendarDateRangePicker />
        
        <Select
          value={filtros.urgencia}
          onValueChange={(value) => setFiltros({ ...filtros, urgencia: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por urgencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtros.estado}
          onValueChange={(value) => setFiltros({ ...filtros, estado: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar por cliente o vehículo..."
          value={filtros.busqueda}
          onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
        />
      </div>

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Urgencia</TableHead>
              <TableHead>Costo Est.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : servicios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No hay servicios recomendados
                </TableCell>
              </TableRow>
            ) : (
              servicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell>
                    {format(new Date(servicio.created_at), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{servicio.vehiculos.clientes.nombre}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/vehiculos?id=${servicio.vehicle_id}`}
                      className="hover:underline"
                    >
                      {servicio.vehiculos.marca} {servicio.vehiculos.modelo}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {servicio.vehiculos.placa}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{servicio.service_name}</TableCell>
                  <TableCell>
                    <Badge className={getUrgencyColor(servicio.urgency_level)}>
                      {servicio.urgency_level === 'high' ? 'Alta' :
                       servicio.urgency_level === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${servicio.estimated_cost?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(servicio.status)}>
                      {servicio.status === 'pending' ? 'Pendiente' :
                       servicio.status === 'scheduled' ? 'Agendado' :
                       servicio.status === 'completed' ? 'Completado' : 'Rechazado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedServicio(servicio)
                        setShowDetalles(true)
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DetallesServicioModal
        servicio={selectedServicio}
        open={showDetalles}
        onOpenChange={setShowDetalles}
      />

      <Toaster />
    </div>
  )
} 