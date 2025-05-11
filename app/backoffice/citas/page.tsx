"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { CalendarClock, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, Clock, AlertTriangle, TrendingUp, CheckCircle, ArrowRightLeft, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentCalendar, TimeSlot } from "@/components/workshop/appointment-calendar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { stringToSafeDate } from './nueva/page'

// Mover esta definición al inicio, antes de las interfaces
type EstadoCita = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'

interface Cliente {
  id: string            // Cambiado de id_uuid
  names: string         // Cambiado de nombre
}

interface Servicio {
  id_uuid: string
  service_name: string
}

interface CitaDB {
  id: bigint                  // Cambiado de id_uuid a id
  created_at: string
  appointment_date: string | null  // Cambiado de fecha_hora
  appointment_time: string | null  // Añadido
  client_id: string | null
  vehicle_id: string | null
  service_id: string | null
  dealership_id: string | null
  status: string | null        // Cambiado de estado
}

interface Cita {
  id: bigint                   // Cambiado de id_uuid a id
  created_at: string
  appointment_date: string | null  // Cambiado de fecha_hora
  appointment_time: string | null  // Añadido
  client_id: string | null
  vehicle_id: string | null
  service_id: string | null
  dealership_id: string | null
  status: string | null         // Cambiado de estado
  cancelled_at?: string        // Añadido
  cancellation_reason?: string // Añadido
  rescheduled_at?: string      // Añadido
  notes?: string | null        // Añadido
  rescheduling_history?: {     // Añadido
    fecha_original: string
    hora_original: string
  }
  client: {
    id: string
    names: string
  } | null
  services: {
    id_uuid: string
    service_name: string
  } | null
  vehicles: {
    id_uuid: string
    make: string
    model: string
    license_plate: string | null
    client_id: string
  } | null
}

// Crear una función auxiliar para formatear la fecha correctamente
const formatearFecha = (fechaStr: string) => {
  // Parseamos la fecha directamente desde YYYY-MM-DD sin ajuste de zona horaria
  const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
  
  // Crear fecha a mediodía para evitar problemas de zona horaria
  const fecha = new Date(year, month-1, day, 12, 0, 0);
  
  // Formatear la fecha en español (día/mes/año)
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'  // Usar UTC para evitar ajustes de zona horaria
  });
};

// Función para traducir estados de inglés a español
const traducirEstado = (estado: string | null): string => {
  if (!estado) return 'Desconocido';
  
  const traducciones: Record<string, string> = {
    'pending': 'Pendiente',
    'in_progress': 'En proceso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'rescheduled': 'Reagendada'
  };
  
  return traducciones[estado] || estado;
};

function CitasPageContent() {
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<{dealership_id?: string} | null>(null);
  const [citas, setCitas] = useState<Cita[]>([])
  const [cancelDialog, setCancelDialog] = useState(false)
  const [rescheduleDialog, setRescheduleDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState(false)
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [statusNote, setStatusNote] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [operatingHours, setOperatingHours] = useState<any[]>([])
  const [blockedDates, setBlockedDates] = useState<any[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null)
  const router = useRouter();
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Nuevo estado para métricas
  const [metricas, setMetricas] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completadas: 0,
    canceladas: 0
  });

  const [notaDialog, setNotaDialog] = useState(false)
  const [notaSeleccionada, setNotaSeleccionada] = useState<string | null>(null)

  const [tallerConfig, setTallerConfig] = useState<any>(null);
  const [dealershipId, setDealershipId] = useState<string | null>(null);

  // Efecto principal para token y dealership_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenValue = params.get("token");
    if (tokenValue) {
      setToken(tokenValue);
      const verifiedDataToken = verifyToken(tokenValue);
      
      if (!verifiedDataToken) {
        router.push("/login");
      } else {
        setDataToken(verifiedDataToken);
      }
    }
  }, [router]);

  // Efecto para cargar citas cuando cambia el dataToken o los filtros
  useEffect(() => {
    if (dataToken?.dealership_id) {
      cargarCitas(dataToken.dealership_id);
    }
  }, [dataToken, filtroEstado]);

  const cargarCitas = async (dealershipIdFromToken: string) => {
    if (!dealershipIdFromToken) {
      console.error("No se proporcionó dealership_id");
      return;
    }

    try {
      let query = supabase
        .from('appointment')
        .select(`
          id,
          created_at,
          appointment_date,
          appointment_time,
          client_id,
          vehicle_id,
          service_id,
          dealership_id,
          status,
          cancelled_at,
          cancellation_reason,
          rescheduled_at,
          rescheduling_history,
          notes,
          client!appointment_client_id_fkey (
            id,
            names
          ),
          services!appointment_service_id_fkey (
            id_uuid,
            service_name
          ),
          vehicles!appointment_vehicle_id_fkey (
            id_uuid,
            make,
            model,
            license_plate,
            client_id
          )
        `)
        .eq('dealership_id', dealershipIdFromToken)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      const { data: citasData, error } = await query;

      if (error) throw error;
      console.log("Citas cargadas para dealership_id", dealershipIdFromToken, ":", citasData);
      
      // Obtener la fecha actual en formato YYYY-MM-DD
      const fechaActual = new Date().toISOString().split('T')[0];
      
      // Ordenar las citas: primero las futuras, luego las pasadas
      const citasOrdenadas = [...citasData as unknown as Cita[]].sort((a, b) => {
        // Si alguna cita no tiene fecha, ponerla al final
        if (!a.appointment_date) return 1;
        if (!b.appointment_date) return -1;

        // Comparar con la fecha actual
        const esFuturaA = a.appointment_date >= fechaActual;
        const esFuturaB = b.appointment_date >= fechaActual;

        // Si ambas son futuras o ambas son pasadas, ordenar por fecha y hora
        if (esFuturaA === esFuturaB) {
          if (a.appointment_date !== b.appointment_date) {
            return a.appointment_date.localeCompare(b.appointment_date);
          }
          // Si las fechas son iguales, ordenar por hora
          return (a.appointment_time || '').localeCompare(b.appointment_time || '');
        }

        // Poner las citas futuras primero
        return esFuturaA ? -1 : 1;
      });
      
      setCitas(citasOrdenadas);
    } catch (error) {
      console.error("Error cargando citas:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las citas"
      })
    }
  }

  // Obtener horarios de operación y fechas bloqueadas
  const cargarConfiguracion = async () => {
    try {
      // Cargar horarios de operación
      const { data: horarios, error: errorHorarios } = await supabase
        .from('operating_hours')
        .select('*')
      
      if (errorHorarios) throw errorHorarios;
      setOperatingHours(horarios || []);
      
      // Cargar fechas bloqueadas
      const { data: fechasBloqueadas, error: errorFechas } = await supabase
        .from('blocked_dates')
        .select('*')
      
      if (errorFechas) throw errorFechas;
      setBlockedDates(fechasBloqueadas || []);
    } catch (error) {
      console.error("Error cargando configuración:", error);
    }
  }

  // Función para cancelar una cita
  const cancelarCita = async () => {
    if (!selectedCita) return;
    
    // Verificar que la cita no esté ya en un estado final
    const status = selectedCita.status?.toLowerCase();
    if (status === 'cancelled' || status === 'cancelada' || status === 'completed' || status === 'completada') {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se puede cancelar una cita que ya está ${traducirEstado(selectedCita.status).toLowerCase()}`
      });
      setCancelDialog(false);
      setSelectedCita(null);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('appointment')
        .update({ 
          status: 'cancelled', // Estado en inglés
          cancellation_reason: cancelReason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', selectedCita.id)
      
      if (error) throw error;
      
      // Actualizar la lista de citas con un typecasting seguro
      setCitas(prev => prev.map(cita => {
        if (cita.id === selectedCita.id) {
          return {
            ...cita,
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: cancelReason
          } as Cita; // Forzar el tipo para evitar errores
        }
        return cita;
      }));
      
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada exitosamente",
      });
      
      // Cerrar el diálogo
      setCancelDialog(false);
      setCancelReason("");
      setSelectedCita(null);
    } catch (error) {
      console.error("Error cancelando cita:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la cita"
      });
    }
  }
  
  // Función para reagendar una cita
  const reagendarCita = async () => {
    if (!selectedCita || !selectedDate || !selectedSlot) return;
    
    // Verificar que la cita no esté ya en un estado final
    const status = selectedCita.status?.toLowerCase();
    if (status === 'cancelled' || status === 'cancelada' || status === 'completed' || status === 'completada') {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se puede reagendar una cita que ya está ${traducirEstado(selectedCita.status).toLowerCase()}`
      });
      setRescheduleDialog(false);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedCita(null);
      return;
    }
    
    try {
      // Guardar datos originales para historial
      const datosOriginales = {
        fecha_original: selectedCita.appointment_date || '',
        hora_original: selectedCita.appointment_time || ''
      };
      
      // Formato de fecha para la base de datos (YYYY-MM-DD)
      const nuevaFecha = selectedDate.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('appointment')
        .update({ 
          appointment_date: nuevaFecha,
          appointment_time: selectedSlot.time,
          status: 'pending', // Cambiado de 'rescheduled' a 'pending'
          rescheduled_at: new Date().toISOString(),
          rescheduling_history: datosOriginales
        })
        .eq('id', selectedCita.id)
      
      if (error) throw error;
      
      // Actualizar la lista de citas con un typecasting seguro
      setCitas(prev => prev.map(cita => {
        if (cita.id === selectedCita.id) {
          return {
            ...cita,
            appointment_date: nuevaFecha,
            appointment_time: selectedSlot.time,
            status: 'pending', // Cambiado de 'rescheduled' a 'pending'
            rescheduled_at: new Date().toISOString(),
            rescheduling_history: datosOriginales
          } as Cita; // Forzar el tipo para evitar errores
        }
        return cita;
      }));
      
      toast({
        title: "Cita reagendada",
        description: `La cita ha sido reagendada para el ${formatearFecha(nuevaFecha)} a las ${selectedSlot.time.substring(0, 5)}`,
      });
      
      // Cerrar el diálogo
      setRescheduleDialog(false);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedCita(null);
    } catch (error) {
      console.error("Error reagendando cita:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo reagendar la cita"
      });
    }
  }

  // Función para cambiar el estado de una cita
  const cambiarEstadoCita = async () => {
    if (!selectedCita || !selectedStatus) return;
    
    try {
      const { error } = await supabase
        .from('appointment')
        .update({ 
          status: selectedStatus,
          notes: statusNote || null
        })
        .eq('id', selectedCita.id)
      
      if (error) throw error;
      
      // Actualizar la lista de citas
      setCitas(prev => prev.map(cita => {
        if (cita.id === selectedCita.id) {
          return {
            ...cita,
            status: selectedStatus,
            notes: statusNote || null
          } as Cita;
        }
        return cita;
      }));
      
      toast({
        title: "Estado actualizado",
        description: `La cita ha sido actualizada a estado: ${traducirEstado(selectedStatus)}`,
      });
      
      // Cerrar el diálogo y limpiar estados
      setStatusDialog(false);
      setSelectedStatus("");
      setStatusNote("");
      setSelectedCita(null);
    } catch (error) {
      console.error("Error actualizando estado de cita:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la cita"
      });
    }
  }

  // Efecto para cargar configuración
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // Efecto para calcular métricas
  useEffect(() => {
    const calcularMetricas = () => {
      const total = citas.length;
      const pendientes = citas.filter(cita => cita.status === 'pending').length;
      const enProceso = citas.filter(cita => cita.status === 'in_progress').length;
      const completadas = citas.filter(cita => cita.status === 'completed').length;
      const canceladas = citas.filter(cita => cita.status === 'cancelled').length;

      setMetricas({
        total,
        pendientes,
        enProceso,
        completadas,
        canceladas
      });
    };

    calcularMetricas();
  }, [citas]);

  // Filtrar citas según el estado seleccionado
  const citasFiltradas = useMemo(() => {
    console.log("Estados de citas:", citas.map(cita => ({id: cita.id, estado: cita.status, traducido: traducirEstado(cita.status)})));
    return filtroEstado 
      ? citas.filter(cita => cita.status === filtroEstado)
      : citas;
  }, [citas, filtroEstado]);

  // Calcular el total de páginas basado en las citas filtradas
  const totalPages = Math.ceil(citasFiltradas.length / itemsPerPage);

  // Obtener las citas para la página actual
  const citasPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return citasFiltradas.slice(startIndex, endIndex);
  }, [citasFiltradas, currentPage]);

  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para generar el rango de páginas a mostrar
  const getPageRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  // Copiar lógica de handleSelectDate de nueva cita
  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const fixedDate = new Date(year, month, day, 12, 0, 0);
      setSelectedDate(fixedDate);
      // Aquí podrías cargar citas si es necesario
    } else {
      setSelectedDate(null);
    }
  };

  // Obtener dealershipId y tallerConfig del token o de la configuración
  useEffect(() => {
    if (dataToken?.dealership_id) {
      setDealershipId(dataToken.dealership_id);
      // Aquí podrías cargar la configuración del taller
    }
  }, [dataToken]);

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-5">
          <h1 className="text-3xl font-bold tracking-tight col-span-4">Citas</h1>
          <div className="text-right">
            
            <Link href={`/backoffice/citas/nueva?token=${token}`}>
              <Button type="submit" className="relative" > Agendar Cita </Button>
            </Link>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Citas */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Citas</h3>
              <div className="rounded-md bg-blue-100 p-1">
                <CalendarClock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{metricas.total}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />
                Total de citas registradas
              </p>
            </div>
          </Card>

          {/* Citas Pendientes */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Citas Pendientes</h3>
              <div className="rounded-md bg-yellow-100 p-1">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{metricas.pendientes}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <AlertTriangle className="inline h-3 w-3 mr-1" />
                Requieren atención
              </p>
            </div>
          </Card>

          {/* Citas en Proceso */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">En Proceso</h3>
              <div className="rounded-md bg-blue-100 p-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{metricas.enProceso}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                Servicios en curso
              </p>
            </div>
          </Card>

          {/* Citas Completadas */}
          <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Completadas</h3>
              <div className="rounded-md bg-green-100 p-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{metricas.completadas}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Servicios finalizados
              </p>
            </div>
          </Card>
        </div>

        {/* Lista de Citas */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Lista de Citas</h2>
            <div className="flex gap-2">
              <Button 
                variant={filtroEstado === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado(null)}
              >
                Todas
              </Button>
              <Button 
                variant={filtroEstado === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("pending")}
              >
                Pendientes
              </Button>
              <Button 
                variant={filtroEstado === "in_progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("in_progress")}
              >
                En proceso
              </Button>
              <Button 
                variant={filtroEstado === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("completed")}
              >
                Completadas
              </Button>
              <Button 
                variant={filtroEstado === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroEstado("cancelled")}
              >
                Canceladas
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
                <TableHead className="w-32">Estado</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Historial</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citasPaginadas.map((cita) => (
                <TableRow key={cita.id.toString()}>
                  <TableCell>{cita.client?.names}</TableCell>
                  <TableCell>{cita.services?.service_name}</TableCell>
                  <TableCell>{`${cita.vehicles?.make} ${cita.vehicles?.model} (${cita.vehicles?.license_plate || 'Sin placa'})`}</TableCell>
                  <TableCell>
                    {cita.appointment_date && cita.appointment_time ? 
                      `${formatearFecha(cita.appointment_date)} ${cita.appointment_time.substring(0, 5)}` : 
                      'No especificada'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block min-w-[100px] text-center px-2 py-1 rounded-full text-xs font-medium ${
                      cita.status?.toLowerCase() === 'pending' ? 'bg-blue-100 text-blue-800' :
                      cita.status?.toLowerCase() === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      cita.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                      cita.status?.toLowerCase() === 'cancelled' || cita.status?.toLowerCase() === 'cancelada' ? 'bg-red-100 text-red-800' :
                      cita.status?.toLowerCase() === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {traducirEstado(cita.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {cita.notes ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNotaSeleccionada(cita.notes || null)
                          setNotaDialog(true)
                        }}
                        title="Ver nota completa"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {cita.status === 'cancelled' && cita.cancelled_at && (
                      <div>
                        <p>Cancelada: {new Date(cita.cancelled_at).toLocaleDateString('es-ES')}</p>
                        {cita.cancellation_reason && (
                          <p>Motivo: {cita.cancellation_reason}</p>
                        )}
                      </div>
                    )}
                    {cita.rescheduled_at && cita.rescheduling_history && (
                      <div>
                        <p>Fecha Anterior: {formatearFecha(cita.rescheduling_history.fecha_original)} {cita.rescheduling_history.hora_original.substring(0, 5)}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(cita.status?.toLowerCase() === 'pending' || 
                        cita.status?.toLowerCase() === 'in_progress' || 
                        cita.status?.toLowerCase() === 'pendiente' || 
                        cita.status?.toLowerCase() === 'en proceso') && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSelectedCita(cita);
                              setRescheduleDialog(true);
                            }}
                          >
                            <CalendarClock className="h-3 w-3" />
                            <span>Reagendar</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSelectedCita(cita);
                              setSelectedStatus(cita.status || '');
                              setStatusDialog(true);
                            }}
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            <span>Cambiar Estado</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {citasPaginadas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {filtroEstado 
                      ? `No hay citas ${traducirEstado(filtroEstado).toLowerCase()} para mostrar`
                      : 'No hay citas para mostrar'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Paginación - Modificada para mostrarse siempre que haya al menos una cita */}
          {citasFiltradas.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border-t pt-4">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Mostrando {Math.min(citasFiltradas.length, ((currentPage - 1) * itemsPerPage) + 1)} a {Math.min(currentPage * itemsPerPage, citasFiltradas.length)} de {citasFiltradas.length} citas
              </div>
              <div className="order-1 sm:order-2">
                <Pagination>
                  <PaginationContent>
                    {totalPages > 1 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        
                        {getPageRange().map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>

        {/* Diálogo de Cancelación */}
        <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancelar Cita</DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea cancelar esta cita?
              </DialogDescription>
            </DialogHeader>
            
            {selectedCita && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Cliente:</div>
                  <div>{selectedCita.client?.names}</div>
                  
                  <div className="font-medium">Servicio:</div>
                  <div>{selectedCita.services?.service_name}</div>
                  
                  <div className="font-medium">Vehículo:</div>
                  <div>{`${selectedCita.vehicles?.make} ${selectedCita.vehicles?.model}`}</div>
                  
                  <div className="font-medium">Fecha y Hora:</div>
                  <div>
                    {selectedCita.appointment_date && selectedCita.appointment_time ? 
                      `${formatearFecha(selectedCita.appointment_date)} ${selectedCita.appointment_time.substring(0, 5)}` : 
                      'No especificada'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="cancelReason" className="text-sm font-medium">
                    Motivo de cancelación (opcional)
                  </label>
                  <Textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Indique el motivo de la cancelación"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelDialog(false);
                  setCancelReason("");
                  setSelectedCita(null);
                }}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={cancelarCita}
              >
                Confirmar Cancelación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de Reagendamiento */}
        <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
          <DialogContent className="sm:max-w-[80%] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Reagendar Cita</DialogTitle>
              <DialogDescription>
                Seleccione una nueva fecha y hora para la cita
              </DialogDescription>
            </DialogHeader>
            
            {selectedCita && (
              <div className="flex flex-col space-y-4 flex-grow overflow-hidden">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Cliente:</div>
                  <div>{selectedCita.client?.names}</div>
                  
                  <div className="font-medium">Servicio:</div>
                  <div>{selectedCita.services?.service_name}</div>
                  
                  <div className="font-medium">Vehículo:</div>
                  <div>{`${selectedCita.vehicles?.make} ${selectedCita.vehicles?.model}`}</div>
                  
                  <div className="font-medium">Fecha y Hora Actual:</div>
                  <div>
                    {selectedCita.appointment_date && selectedCita.appointment_time ? 
                      `${formatearFecha(selectedCita.appointment_date)} ${selectedCita.appointment_time.substring(0, 5)}` : 
                      'No especificada'}
                  </div>
                </div>
                
                <div className="flex-grow overflow-auto">
                  <AppointmentCalendar
                    selectedDate={selectedDate ? stringToSafeDate(typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0]) : new Date()}
                    onSelect={(date) => {
                      console.log('Fecha seleccionada en reagendamiento:', date);
                      handleSelectDate(date);
                    }}
                    blockedDates={blockedDates}
                    operatingHours={operatingHours}
                    turnDuration={tallerConfig?.shift_duration || 30}
                    appointments={citasFiltradas as any}
                    onTimeSlotSelect={(slot) => {
                      console.log('Slot seleccionado en reagendamiento:', slot);
                      setSelectedSlot(slot);
                    }}
                    selectedService={selectedCita.services ? {
                      id: selectedCita.services.id_uuid,
                      service_name: selectedCita.services.service_name,
                      duration_minutes: (selectedCita.services as any).duration_minutes || tallerConfig?.shift_duration || 30
                    } : undefined}
                    dealershipId={dealershipId || undefined}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm">
                    {selectedDate && selectedSlot ? (
                      <span className="font-medium">
                        Nueva fecha y hora: {formatearFecha(selectedDate.toISOString().split('T')[0])} a las {selectedSlot.time.substring(0, 5)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Seleccione una fecha y hora para continuar
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleDialog(false);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setSelectedCita(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={reagendarCita}
                disabled={!selectedDate || !selectedSlot}
              >
                Confirmar Reagendamiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Cambio de Estado */}
        <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cambiar Estado de la Cita</DialogTitle>
              <DialogDescription>
                Seleccione el nuevo estado para esta cita
              </DialogDescription>
            </DialogHeader>
            
            {selectedCita && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Cliente:</div>
                  <div>{selectedCita.client?.names}</div>
                  
                  <div className="font-medium">Servicio:</div>
                  <div>{selectedCita.services?.service_name}</div>
                  
                  <div className="font-medium">Vehículo:</div>
                  <div>{`${selectedCita.vehicles?.make} ${selectedCita.vehicles?.model}`}</div>
                  
                  <div className="font-medium">Fecha y Hora:</div>
                  <div>
                    {selectedCita.appointment_date && selectedCita.appointment_time ? 
                      `${formatearFecha(selectedCita.appointment_date)} ${selectedCita.appointment_time.substring(0, 5)}` : 
                      'No especificada'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Nuevo Estado
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('pending')}
                      className="w-full"
                    >
                      Pendiente
                    </Button>
                    <Button
                      variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('in_progress')}
                      className="w-full"
                    >
                      En Proceso
                    </Button>
                    <Button
                      variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('completed')}
                      className="w-full"
                    >
                      Completada
                    </Button>
                    <Button
                      variant={selectedStatus === 'cancelled' ? 'default' : 'outline'}
                      onClick={() => setSelectedStatus('cancelled')}
                      className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                      Cancelada
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="statusNote" className="text-sm font-medium">
                    Nota (opcional)
                  </label>
                  <Textarea
                    id="statusNote"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Agregue una nota sobre el cambio de estado"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialog(false);
                  setSelectedStatus("");
                  setStatusNote("");
                  setSelectedCita(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={cambiarEstadoCita}
                disabled={!selectedStatus}
                variant={selectedStatus === 'cancelled' ? 'destructive' : 'default'}
              >
                Confirmar Cambio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para ver nota completa */}
        <Dialog open={notaDialog} onOpenChange={setNotaDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nota de la Cita</DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-line break-words text-sm">
              {notaSeleccionada}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotaDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Toaster />
      </div>
    </div>
  )
}

export default function CitasPage() {
  return (
    <div className="flex-1 p-8">
      <Suspense fallback={<div className="animate-spin h-32 w-32"></div>}>
        <CitasPageContent />
      </Suspense>
    </div>
  )
}
