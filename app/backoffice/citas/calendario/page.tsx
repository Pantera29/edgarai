"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { verifyToken } from "@/app/jwt/token"
import { CalendarEvent, CalendarView } from "@/types"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import type { CalendarApi } from '@fullcalendar/core'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { AppointmentCalendar, TimeSlot } from "@/components/workshop/appointment-calendar"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const calendarViews: CalendarView[] = [
  { type: 'dayGridMonth', title: 'Mes' },
  { type: 'timeGridWeek', title: 'Semana' },
  { type: 'timeGridDay', title: 'Día' }
]

const statusColors = {
  pending: '#60a5fa', // azul (bg-blue-400)
  confirmed: '#22c55e', // verde (bg-green-500)
  in_progress: '#facc15', // amarillo (bg-yellow-400)
  completed: '#4ade80', // verde claro (bg-green-400)
  cancelled: '#f87171', // rojo (bg-red-400)
  rescheduled: '#a78bfa' // violeta (bg-purple-400)
}

// Tipo local para service con id_uuid opcional
type ServiceWithIdUuid = {
  service_name: string;
  duration_minutes: number;
  price: number;
  id_uuid?: string;
};

// Agregar service_id al tipo CalendarEvent localmente
// Si CalendarEvent está importado, crear un tipo extendido
type CalendarEventWithServiceId = CalendarEvent & { service_id: string };

export default function CalendarioCitasPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<object>({})
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [currentView, setCurrentView] = useState<CalendarView>(calendarViews[1])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentRange, setCurrentRange] = useState<{start: string, end: string} | null>(null)
  const [metricas, setMetricas] = useState({
    total: 0,
    pendientes: 0,
    confirmadas: 0,
    enProceso: 0,
    completadas: 0,
    canceladas: 0
  })
  const [calendarTitle, setCalendarTitle] = useState<string>("")
  const [rescheduleDialog, setRescheduleDialog] = useState(false)
  const [selectedCita, setSelectedCita] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [operatingHours, setOperatingHours] = useState<any[]>([])
  const [blockedDates, setBlockedDates] = useState<any[]>([])
  const [rescheduleStatus, setRescheduleStatus] = useState<string>("")
  const [cancelReason, setCancelReason] = useState("")
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const calendarRef = useRef<any>(null)

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
        setDataToken(verifiedDataToken)
        const now = new Date()
        const start = format(startOfMonth(now), 'yyyy-MM-dd')
        const end = format(endOfMonth(now), 'yyyy-MM-dd')
        setCurrentRange({ start, end })
        loadEvents(verifiedDataToken.dealership_id, start, end)
      }
    }
  }, [searchParams, router])

  const loadEvents = async (dealershipId: string, start: string, end: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointment')
        .select(`
          *,
          client:client_id (names, phone_number, email),
          vehicle:vehicle_id (make, model, license_plate, year),
          service:service_id (service_name, duration_minutes, price)
        `)
        .eq('dealership_id', dealershipId)
        .gte('appointment_date', start)
        .lte('appointment_date', end)

      if (error) throw error

      const formattedEvents = data.map(appointment => {
        const date = appointment.appointment_date
        const time = appointment.appointment_time
        const normalizedTime = normalizeTime(time)
        const startStr = `${date}T${normalizedTime}`
        const startDate = new Date(startStr)
        const endDate = new Date(startDate)
        endDate.setMinutes(endDate.getMinutes() + 60)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Cita con fecha/hora inválida, se omite:', appointment)
          return null
        }

        return {
          id: appointment.id,
          service_id: appointment.service_id,
          title: `${appointment.client.names} - ${(appointment.service as ServiceWithIdUuid).service_name}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          status: appointment.status,
          client: appointment.client,
          vehicle: appointment.vehicle,
          service: appointment.service ? (appointment.service as ServiceWithIdUuid) : undefined,
          notes: appointment.notes,
          dealership_id: appointment.dealership_id
        } as CalendarEventWithServiceId
      }).filter((e): e is CalendarEventWithServiceId => !!e)

      const validEvents = formattedEvents;
      setEvents(validEvents)

      // Actualizar métricas
      const metricas = {
        total: validEvents.length,
        pendientes: validEvents.filter(e => e.status === 'pending').length,
        confirmadas: validEvents.filter(e => e.status === 'confirmed').length,
        enProceso: validEvents.filter(e => e.status === 'in_progress').length,
        completadas: validEvents.filter(e => e.status === 'completed').length,
        canceladas: validEvents.filter(e => e.status === 'cancelled').length
      }
      setMetricas(metricas)

    } catch (error) {
      console.error('Error cargando eventos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const normalizeTime = (time: string): string => {
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time
    const match = /^(\d{1,2}):(\d{2})$/.exec(time)
    if (match) {
      const hour = match[1].padStart(2, '0')
      return `${hour}:${match[2]}:00`
    }
    return time
  }

  const handleEventClick = (info: any) => {
    console.log('Evento clickeado:', info);
    const cita = {
      id: info.event.id,
      start: info.event.startStr,
      end: info.event.endStr,
      ...info.event.extendedProps
    };
    console.log('Cita construida:', cita);
    setSelectedCita(cita)
    setRescheduleDialog(true)
    setSelectedDate(null)
    setSelectedSlot(null)
    console.log('Modal de reagendamiento abierto');
  }

  const handleDateClick = (info: any) => {
    router.push(`/backoffice/citas/nueva?token=${token}&date=${info.dateStr}`)
  }

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view)
    calendarRef.current?.getApi().changeView(view.type)
  }

  const handleDatesSet = (arg: any) => {
    const start = format(arg.view.currentStart, 'yyyy-MM-dd')
    const end = format(arg.view.currentEnd, 'yyyy-MM-dd')
    setCurrentRange({ start, end })
    updateCalendarTitle()
    if (dataToken && (dataToken as any).dealership_id) {
      loadEvents((dataToken as any).dealership_id, start, end)
    }
  }

  const handlePrev = () => {
    const calendarApi: CalendarApi = calendarRef.current?.getApi()
    calendarApi?.prev()
  }

  const handleNext = () => {
    const calendarApi: CalendarApi = calendarRef.current?.getApi()
    calendarApi?.next()
  }

  const handleToday = () => {
    const calendarApi: CalendarApi = calendarRef.current?.getApi()
    calendarApi?.today()
  }

  const updateCalendarTitle = () => {
    const calendarApi: CalendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      setCalendarTitle(calendarApi.view.title)
    }
  }

  useEffect(() => {
    updateCalendarTitle()
  }, [currentView])

  // Cargar horarios de operación y fechas bloqueadas (puedes adaptar esto a tu lógica de datos)
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const { data: horarios } = await supabase.from('operating_hours').select('*')
        setOperatingHours(horarios || [])
        const { data: fechasBloqueadas } = await supabase.from('blocked_dates').select('*')
        setBlockedDates(fechasBloqueadas || [])
      } catch (error) {
        console.error("Error cargando configuración:", error)
      }
    }
    cargarConfiguracion()
  }, [])

  useEffect(() => {
    if (selectedCita) {
      setRescheduleStatus(selectedCita.status || "pending")
    }
  }, [selectedCita])

  // Lógica para reagendar la cita y/o cambiar status usando el endpoint
  const confirmarCambiosCita = async () => {
    if (!selectedCita) return;
    try {
      const nuevosDatos: Record<string, any> = {};
      
      // Solo incluir fecha y hora si se seleccionaron nuevas
      if (selectedDate) {
        nuevosDatos.appointment_date = selectedDate.toISOString().split('T')[0];
      }
      if (selectedSlot) {
        nuevosDatos.appointment_time = selectedSlot.time;
      }
      
      // Incluir el cambio de estado si es diferente
      if (selectedCita.status !== rescheduleStatus) {
        nuevosDatos.status = rescheduleStatus;
      }

      // Si no hay cambios, no hacer nada
      if (Object.keys(nuevosDatos).length === 0) {
        toast({ title: "Sin cambios", description: "No se realizaron cambios en la cita." });
        return;
      }

      // PATCH al endpoint
      const response = await fetch(`/api/appointments/update/${selectedCita.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevosDatos)
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }
      setRescheduleDialog(false)
      setSelectedCita(null)
      setSelectedDate(null)
      setSelectedSlot(null)
      toast({ title: "Cita actualizada", description: "La cita ha sido actualizada exitosamente" })
      // Opcional: recargar eventos
      if (dataToken && (dataToken as any).dealership_id && currentRange) {
        loadEvents((dataToken as any).dealership_id, currentRange.start, currentRange.end)
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar la cita", variant: "destructive" })
    }
  }

  // Lógica para cancelar la cita usando el endpoint
  const cancelarCita = async () => {
    if (!selectedCita) return;
    if (selectedCita.status === 'cancelled' || selectedCita.status === 'completed') return;
    try {
      const response = await fetch(`/api/appointments/update/${selectedCita.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }
      setRescheduleDialog(false)
      setSelectedCita(null)
      setSelectedDate(null)
      setSelectedSlot(null)
      toast({ title: "Cita cancelada", description: "La cita ha sido cancelada exitosamente" })
      // Opcional: recargar eventos
      if (dataToken && (dataToken as any).dealership_id && currentRange) {
        loadEvents((dataToken as any).dealership_id, currentRange.start, currentRange.end)
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cancelar la cita", variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto p-4">
      {/* Título de la página */}
      <h1 className="text-3xl font-bold tracking-tight mb-6">Calendario de Citas</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Total Citas */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col min-w-[160px] h-[100px] justify-between">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-sm font-medium text-muted-foreground">Total Citas</span>
            <span className="rounded-md bg-blue-100 p-1"><Calendar className="h-4 w-4 text-blue-600" /></span>
          </div>
          <div className="flex-1 flex items-end">
            <span className="text-3xl font-bold">{metricas.total}</span>
          </div>
        </div>
        {/* Pendientes */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col min-w-[160px] h-[100px] justify-between">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-sm font-medium text-muted-foreground">Citas Pendientes</span>
            <span className="rounded-md bg-yellow-100 p-1"><Clock className="h-4 w-4 text-yellow-600" /></span>
          </div>
          <div className="flex-1 flex items-end">
            <span className="text-3xl font-bold">{metricas.pendientes}</span>
          </div>
        </div>
        {/* Confirmadas */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col min-w-[160px] h-[100px] justify-between">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-sm font-medium text-muted-foreground">Citas Confirmadas</span>
            <span className="rounded-md bg-green-100 p-1"><CheckCircle className="h-4 w-4 text-green-600" /></span>
          </div>
          <div className="flex-1 flex items-end">
            <span className="text-3xl font-bold">{metricas.confirmadas}</span>
          </div>
        </div>
        {/* En Proceso */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col min-w-[160px] h-[100px] justify-between">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-sm font-medium text-muted-foreground">En Proceso</span>
            <span className="rounded-md bg-blue-100 p-1"><AlertCircle className="h-4 w-4 text-blue-600" /></span>
          </div>
          <div className="flex-1 flex items-end">
            <span className="text-3xl font-bold">{metricas.enProceso}</span>
          </div>
        </div>
        {/* Completadas */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col min-w-[160px] h-[100px] justify-between">
          <div className="flex flex-row items-center justify-between space-y-0 pb-1">
            <span className="text-sm font-medium text-muted-foreground">Completadas</span>
            <span className="rounded-md bg-green-100 p-1"><CheckCircle className="h-4 w-4 text-green-600" /></span>
          </div>
          <div className="flex-1 flex items-end">
            <span className="text-3xl font-bold">{metricas.completadas}</span>
          </div>
        </div>
      </div>

      {/* Header personalizado del calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrev}>&lt;</Button>
          <Button variant="secondary" onClick={handleToday}>Hoy</Button>
          <Button variant="outline" onClick={handleNext}>&gt;</Button>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <span className="text-xl font-semibold text-gray-800">{calendarTitle}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          {calendarViews.map(view => (
            <Button
              key={view.type}
              variant={currentView.type === view.type ? "default" : "outline"}
              onClick={() => handleViewChange(view)}
            >
              {view.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendario con fuente de la app */}
      <div className="font-sans">
        <div className="bg-white rounded-lg shadow p-4 min-h-[500px]">
          {loading && (
            <div className="text-center py-8 text-gray-500">Cargando citas...</div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: '', // Ocultamos los botones nativos
              center: 'title',
              right: ''
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Lista'
            }}
            locale="es"
            events={events.map(event => ({
              ...event,
              backgroundColor: statusColors[event.status],
              borderColor: statusColors[event.status]
            }))}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            nowIndicator={true}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            datesSet={handleDatesSet}
          />
        </div>
      </div>

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
                <div>{selectedCita.service?.service_name}</div>
                <div className="font-medium">Vehículo:</div>
                <div>{`${selectedCita.vehicle?.make} ${selectedCita.vehicle?.model}`}</div>
                <div className="font-medium">Fecha y Hora Actual:</div>
                <div>
                  {selectedCita.start && selectedCita.end ?
                    `${format(new Date(selectedCita.start), 'dd/MM/yyyy HH:mm')} - ${format(new Date(selectedCita.end), 'HH:mm')}` :
                    'No especificada'}
                </div>
                <div className="font-medium">Estado:</div>
                <div>
                  <Select value={rescheduleStatus} onValueChange={setRescheduleStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="in_progress">En Proceso</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-grow overflow-auto">
                <AppointmentCalendar
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  blockedDates={blockedDates}
                  operatingHours={operatingHours}
                  turnDuration={selectedCita.service?.duration_minutes || 30}
                  appointments={events.map(ev => ({
                    id: ev.id,
                    appointment_date: ev.start ? ev.start.split('T')[0] : '',
                    appointment_time: ev.start ? ev.start.split('T')[1]?.substring(0,5) : '',
                    services: ev.service && (ev.service as ServiceWithIdUuid).id_uuid ? {
                      id: (ev.service as ServiceWithIdUuid).id_uuid!,
                      service_name: (ev.service as ServiceWithIdUuid).service_name,
                      duration_minutes: (ev.service as ServiceWithIdUuid).duration_minutes || 30
                    } : undefined,
                    client: ev.client ? { names: ev.client.names } : undefined
                  }))}
                  onTimeSlotSelect={setSelectedSlot}
                  selectedService={selectedCita && selectedCita.service_id ? {
                    id: selectedCita.service_id,
                    service_name: selectedCita.service?.service_name || '',
                    duration_minutes: selectedCita.service?.duration_minutes || 30
                  } : undefined}
                  dealershipId={selectedCita.dealership_id}
                />
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm">
                  {selectedDate && selectedSlot ? (
                    <span className="font-medium">
                      Nueva fecha y hora: {format(selectedDate, 'dd/MM/yyyy')} a las {selectedSlot.time.substring(0, 5)}
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
                setRescheduleDialog(false)
                setSelectedDate(null)
                setSelectedSlot(null)
                setSelectedCita(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarCambiosCita}
              disabled={selectedCita && selectedCita.status === rescheduleStatus && (!selectedDate && !selectedSlot)}
            >
              Confirmar cambios
            </Button>
            <Button
              variant="destructive"
              onClick={cancelarCita}
              disabled={selectedCita && (selectedCita.status === 'cancelled' || selectedCita.status === 'completed')}
            >
              Cancelar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ocultar el título nativo de FullCalendar */}
      <style>{`.fc-toolbar-title { display: none !important; }`}</style>
    </div>
  )
} 