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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import "react-big-calendar/lib/css/react-big-calendar.css"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar as CalendarIcon,
  List,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AppointmentCalendar, TimeSlot } from "@/components/workshop/appointment-calendar"
import { BlockedDate, HorarioOperacion } from '@/types/workshop'
import { MetricsCard } from "@/components/metrics-card"
import AppointmentDialog from "@/components/workshop/appointment-dialog"

// Interfaces simplificadas
interface Cliente {
  id_uuid: string
  nombre: string
}

interface Servicio {
  id_uuid: string
  nombre: string
  duracion_estimada: number
}

interface CitaDB {
  id_uuid: string
  cliente_id_uuid: string
  servicio_id_uuid: string
  vehiculo_id_uuid: string
  fecha_hora: string
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
  notas: string
  created_at: string
}

interface Cita {
  id_uuid: string
  cliente_id_uuid: string
  servicio_id_uuid: string
  vehiculo_id_uuid: string
  fecha_hora: string
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
  notas: string
  created_at: string
  clientes: {
    id_uuid: string
    nombre: string
  }
  servicios: {
    id_uuid: string
    nombre: string
    duracion_estimada: number
  }
  vehiculos: {
    id_uuid: string
    marca: string
    modelo: string
    placa: string | null
    id_cliente_uuid: string
  }
}

// Estado inicial de nueva cita
interface NuevaCita {
  cliente_id_uuid: string
  servicio_id_uuid: string
  fecha_hora: string
  estado: CitaDB['estado']
  notas: string
}

// Configuración del calendario
const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface DatosResult {
  clientes: Cliente[]
  servicios: Servicio[]
  citas: Cita[]
}

export default function CitasPage() {
  const { toast } = useToast()
  const [citas, setCitas] = useState<Cita[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nuevaCita, setNuevaCita] = useState<NuevaCita>({
    cliente_id_uuid: "",
    servicio_id_uuid: "",
    fecha_hora: "",
    estado: "pendiente",
    notas: ""
  })
  const [vista, setVista] = useState<"lista" | "calendario">("calendario")
  const [filtroFecha, setFiltroFecha] = useState<string>("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const supabase = createClientComponentClient()
  const [turnDuration, setTurnDuration] = useState(15)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [operatingHours, setOperatingHours] = useState<HorarioOperacion[]>([])
  const [selectedService, setSelectedService] = useState<Servicio | null>(null)
  const [currentStep, setCurrentStep] = useState<'service' | 'date' | 'time'>('service')
  const [searchTerm, setSearchTerm] = useState<string>("")

  const cargarDatos = async () => {
    try {
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id_uuid, nombre')

      if (clientesError) throw clientesError

      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios')
        .select('id_uuid, nombre, duracion_estimada')

      if (serviciosError) throw serviciosError

      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select(`
          id_uuid,
          cliente_id_uuid,
          servicio_id_uuid,
          vehiculo_id_uuid,
          fecha_hora,
          estado,
          notas,
          created_at,
          clientes!citas_cliente_id_uuid_fkey (
            id_uuid,
            nombre
          ),
          servicios!citas_servicio_id_uuid_fkey (
            id_uuid,
            nombre,
            duracion_estimada
          ),
          vehiculos!citas_vehiculo_id_uuid_fkey (
            id_uuid,
            marca,
            modelo,
            placa,
            id_cliente_uuid
          )
        `)
        .order('fecha_hora', { ascending: true })

      if (citasError) throw citasError

      setClientes(clientesData || [])
      setServicios(serviciosData || [])
      setCitas((citasData || []) as unknown as Cita[])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos"
      })
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    const loadConfig = async () => {
      const { data: configData, error } = await supabase
        .from('configuracion_taller')
        .select('duracion_turno')
        .single();

      if (!error && configData) {
        setTurnDuration(configData.duracion_turno);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    const loadOperatingHours = async () => {
      const { data, error } = await supabase
        .from('horarios_operacion')
        .select('*')
        .order('dia_semana');

      if (!error) {
        setOperatingHours(data || []);
      }
    };

    const loadBlockedDates = async () => {
      const { data, error } = await supabase
        .from('fechas_bloqueadas')
        .select('*');

      if (!error) {
        setBlockedDates(data || []);
      }
    };

    loadOperatingHours();
    loadBlockedDates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const servicio = servicios.find(s => s.id_uuid === nuevaCita.servicio_id_uuid)
    if (!servicio) return
    
    const disponible = await verificarDisponibilidad(
      nuevaCita.fecha_hora, 
      servicio.duracion_estimada
    )
    
    if (!disponible) {
      toast({
        variant: "destructive",
        title: "Horario no disponible",
        description: "Ya existe una cita programada en este horario"
      })
      return
    }
    
    setLoading(true)

    try {
      const citaParaInsertar = {
        cliente_id_uuid: nuevaCita.cliente_id_uuid,
        servicio_id_uuid: nuevaCita.servicio_id_uuid,
        fecha_hora: nuevaCita.fecha_hora,
        estado: nuevaCita.estado,
        notas: nuevaCita.notas
      }

      const { error } = await supabase
        .from('citas')
        .insert([citaParaInsertar])

      if (error) throw error

      await cargarDatos()
      
      // Limpiar selecciones del calendario
      setSelectedDate(null)
      setSelectedService(null)
      
      toast({
        title: "Cita agendada",
        description: "La cita se ha registrado correctamente",
      })
      
      setMostrarFormulario(false)
      setNuevaCita({
        cliente_id_uuid: "",
        servicio_id_uuid: "",
        fecha_hora: "",
        estado: "pendiente",
        notas: ""
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al agendar la cita"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Estado actualizado - clientes:', clientes)
    console.log('Estado actualizado - servicios:', servicios)
  }, [clientes, servicios])

  const esDateTimeValido = (dateTime: string): boolean => {
    const fechaSeleccionada = new Date(dateTime);
    const ahora = new Date();
    return fechaSeleccionada > ahora;
  }

  const verificarDisponibilidad = async (fecha_hora: string, duracion: number) => {
    try {
      // Obtener el día de la semana (1-7)
      const date = new Date(fecha_hora);
      const dayOfWeek = date.getDay() || 7;
      
      // Verificar horario operativo
      const horario = operatingHours.find(h => h.dia_semana === dayOfWeek);
      if (!horario || !horario.es_dia_laboral) {
        return false;
      }

      // Verificar bloqueos
      const dateStr = format(date, 'yyyy-MM-dd');
      const bloqueo = blockedDates.find(b => b.fecha === dateStr);
      if (bloqueo?.dia_completo) {
        return false;
      }

      const timeStr = format(date, 'HH:mm:ss');
      if (bloqueo?.hora_inicio && bloqueo?.hora_fin) {
        if (timeStr >= bloqueo.hora_inicio && timeStr <= bloqueo.hora_fin) {
          return false;
        }
      }

      // Verificar citas existentes en el rango de tiempo
      const endTime = addMinutes(date, duracion);
      
      const { data: citasExistentes } = await supabase
        .from('citas')
        .select('*')
        .gte('fecha_hora', fecha_hora)
        .lt('fecha_hora', format(endTime, "yyyy-MM-dd'T'HH:mm:ss"))
        .not('estado', 'eq', 'cancelada');

      if (!citasExistentes) return true;

      // Verificar capacidad máxima
      const citasSimultaneas = citasExistentes.length;
      return citasSimultaneas < horario.servicios_simultaneos_max;

    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      return false;
    }
  };

  const citasFiltradas = citas.filter(cita => {
    const cumpleFiltroEstado = filtroEstado === "todos" || cita.estado === filtroEstado;
    const cumpleFiltroFecha = !filtroFecha || cita.fecha_hora.startsWith(filtroFecha);
    return cumpleFiltroEstado && cumpleFiltroFecha;
  });

  const handleUpdateEstado = async (citaId: string, nuevoEstado: Cita['estado']) => {
    const confirmar = await new Promise((resolve) => {
      const mensaje = `¿Estás seguro de que deseas cambiar el estado de la cita a ${nuevoEstado}?`;
      resolve(window.confirm(mensaje));
    });

    if (!confirmar) return;

    try {
      const { data, error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id_uuid', citaId)
        .select();

      if (error) throw error;

      setCitas(citas.map(cita => 
        cita.id_uuid === citaId ? { ...cita, estado: nuevoEstado } : cita
      ));

      if (nuevoEstado === 'completada') {
        toast({
          title: "Cita completada",
          description: (
            <div className="space-y-2">
              <p>La cita ha sido marcada como completada</p>
              <Button asChild>
                <Link href={`/transacciones/nueva?id_cita=${citaId}`}>
                  Crear Transacción
                </Link>
              </Button>
            </div>
          )
        });
      } else {
        toast({
          title: "Estado actualizado",
          description: `La cita ha sido marcada como ${nuevoEstado}`
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado"
      });
    }
  }

  const getEventStyle = (estado: Cita['estado']) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-200 border-yellow-400'
      case 'en_proceso':
        return 'bg-blue-200 border-blue-400'
      case 'completada':
        return 'bg-green-200 border-green-400'
      case 'cancelada':
        return 'bg-red-200 border-red-400'
      default:
        return 'bg-gray-200 border-gray-400'
    }
  }

  const verificarCita = async (citaId: string) => {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          "uuid id",
          "cliente_id uuid",
          "servicio_id uuid",
          fecha_hora,
          estado,
          notas,
          created_at,
          cliente:clientes!cliente_id uuid (
            "id uuid",
            nombre
          ),
          servicio:servicios!servicio_id uuid (
            "id uuid",
            nombre,
            duracion_estimada
          )
        `)
        .eq('uuid id', citaId)
        .single()

      console.log('Verificación de cita:', data)
      return !error && data
    } catch (error) {
      console.error('Error en verificación:', error)
      return false
    }
  }

  const handleReschedule = async (citaId: string, newDateTime: string) => {
    try {
      const { data, error } = await supabase
        .from('citas')
        .update({ fecha_hora: newDateTime })
        .eq('uuid id', citaId)
        .select()

      if (error) throw error

      toast({
        title: "Cita reprogramada",
        description: "La cita se ha reprogramado correctamente"
      })

      // Recargar datos
      await cargarDatos()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo reprogramar la cita"
      })
    }
  }

  const getStatusBadgeClass = (estado: Cita['estado']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium border';
    switch (estado) {
      case 'pendiente':
        return `${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-300`;
      case 'en_proceso':
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-300`;
      case 'completada':
        return `${baseClasses} bg-green-50 text-green-700 border-green-300`;
      case 'cancelada':
        return `${baseClasses} bg-red-50 text-red-700 border-red-300`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-300`;
    }
  }

  const getKPIs = () => {
    const total = citas.length;
    const pendiente = citas.filter(cita => cita.estado === 'pendiente').length;
    const enProceso = citas.filter(cita => cita.estado === 'en_proceso').length;
    const completada = citas.filter(cita => cita.estado === 'completada').length;
    const cancelada = citas.filter(cita => cita.estado === 'cancelada').length;

    return {
      total,
      pendiente,
      enProceso,
      completada,
      cancelada
    };
  }

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!selectedService) {
      toast({
        title: "Seleccione un servicio",
        description: "Debe seleccionar un servicio antes de elegir un horario",
        variant: "destructive"
      });
      return;
    }

    setSelectedDate(selectedDate);
    setSelectedSlot(slot.time);
    setMostrarFormulario(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 space-y-8">
        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-5">
          <MetricsCard
            title="Total de Citas"
            value={getKPIs().total}
            description="Todas las citas"
            icon={<CalendarIcon className="h-4 w-4 text-gray-600" />}
            className="bg-white"
          />
          <MetricsCard
            title="Pendientes"
            value={getKPIs().pendiente}
            description="Citas por atender"
            icon={<Clock className="h-4 w-4 text-yellow-600" />}
            className="bg-white border-yellow-200"
          />
          <MetricsCard
            title="En Proceso"
            value={getKPIs().enProceso}
            description="Citas en curso"
            icon={<AlertCircle className="h-4 w-4 text-blue-600" />}
            className="bg-white border-blue-200"
          />
          <MetricsCard
            title="Completadas"
            value={getKPIs().completada}
            description="Citas finalizadas"
            icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            className="bg-white border-green-200"
          />
          <MetricsCard
            title="Canceladas"
            value={getKPIs().cancelada}
            description="Citas canceladas"
            icon={<XCircle className="h-4 w-4 text-red-600" />}
            className="bg-white border-red-200"
          />
        </div>

        {/* Calendario y Agendamiento */}
        <div className="bg-white rounded-lg">
          <div className="p-4 border-b">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium">Seleccionar Servicio</h3>
              <Select value={selectedService?.id_uuid || ''} onValueChange={(value) => {
                const service = servicios.find(s => s.id_uuid === value);
                setSelectedService(service || null);
              }}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Seleccione un servicio para agendar" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id_uuid} value={servicio.id_uuid}>
                      {servicio.nombre} ({servicio.duracion_estimada} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AppointmentCalendar
            selectedDate={selectedDate}
            onSelect={(date: Date | undefined) => setSelectedDate(date || null)}
            blockedDates={blockedDates}
            operatingHours={operatingHours}
            turnDuration={turnDuration}
            appointments={citas}
            onTimeSlotSelect={handleTimeSlotSelect}
            selectedService={selectedService ? {
              id: selectedService.id_uuid,
              duration: selectedService.duracion_estimada
            } : undefined}
          />
        </div>

        {/* Lista de Citas */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-medium">Lista de Citas</h2>
          
          <div className="flex justify-between items-center">
            <Input
              placeholder="Buscar citas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={filtroEstado === "pendiente" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFiltroEstado("pendiente")}
                className="text-sm"
              >
                Pendientes
              </Button>
              <Button
                variant={filtroEstado === "en_proceso" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFiltroEstado("en_proceso")}
                className="text-sm"
              >
                En Proceso
              </Button>
              <Button
                variant={filtroEstado === "completada" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFiltroEstado("completada")}
                className="text-sm"
              >
                Completadas
              </Button>
              <Button
                variant={filtroEstado === "todos" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFiltroEstado("todos")}
                className="text-sm"
              >
                Todas
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citasFiltradas.map((cita) => (
                <TableRow key={cita.id_uuid}>
                  <TableCell>{cita.clientes?.nombre}</TableCell>
                  <TableCell>{cita.servicios?.nombre}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/vehiculos?id=${cita.vehiculo_id_uuid}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {cita.vehiculos?.marca} {cita.vehiculos?.modelo}
                      {cita.vehiculos?.placa && ` (${cita.vehiculos.placa})`}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {format(new Date(cita.fecha_hora), "PPP 'a las' p", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cita.estado === 'completada' ? 'bg-green-100 text-green-800' :
                      cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                      cita.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cita.estado}
                    </span>
                  </TableCell>
                  <TableCell>{cita.notas}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 px-2 py-0">
                          <span>Cambiar Estado</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {cita.estado !== 'completada' && (
                          <>
                            <DropdownMenuItem onClick={() => handleUpdateEstado(cita.id_uuid, 'en_proceso')}>
                              Iniciar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateEstado(cita.id_uuid, 'completada')}>
                              Completar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateEstado(cita.id_uuid, 'cancelada')}>
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                        {cita.estado === 'completada' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/transacciones?id_cita=${cita.id_uuid}`}>
                              Crear Transacción
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {citasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No hay citas que mostrar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AppointmentDialog
          open={mostrarFormulario}
          onOpenChange={setMostrarFormulario}
          selectedDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : null}
          selectedSlot={selectedSlot || null}
          preselectedService={selectedService}
          onDateChange={(date) => setSelectedDate(new Date(date))}
          onSlotChange={setSelectedSlot}
          onSave={() => {
            cargarDatos();
            setSelectedService(null);
            setSelectedDate(null);
            setSelectedSlot("");
            setCurrentStep('service');
          }}
        />

        <Toaster />
      </div>
    </div>
  )
}

