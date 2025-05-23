"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { verifyToken } from "../jwt/token"
import { CalendarEvent, CalendarView } from "@/types"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import type { CalendarApi } from '@fullcalendar/core'

const calendarViews: CalendarView[] = [
  { type: 'dayGridMonth', title: 'Mes' },
  { type: 'timeGridWeek', title: 'Semana' },
  { type: 'timeGridDay', title: 'Día' }
]

const statusColors = {
  pending: '#f59e0b', // amber-500
  confirmed: '#3b82f6', // blue-500
  in_progress: '#8b5cf6', // violet-500
  completed: '#22c55e', // green-500
  cancelled: '#ef4444' // red-500
}

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const [token, setToken] = useState<string>("")
  const [dataToken, setDataToken] = useState<object>({})
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [currentView, setCurrentView] = useState<CalendarView>(calendarViews[0])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentRange, setCurrentRange] = useState<{start: string, end: string} | null>(null)
  
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

      console.log('🔍 Supabase data:', data)
      console.log('❌ Supabase error:', error)

      if (error) throw error

      const formattedEvents = data.map(appointment => {
        const date = appointment.appointment_date
        const time = appointment.appointment_time
        const normalizedTime = normalizeTime(time)
        const startStr = `${date}T${normalizedTime}`
        const startDate = new Date(startStr)
        const endDate = new Date(startDate)
        endDate.setMinutes(endDate.getMinutes() + 60)

        console.log('Procesando cita:', {
          id: appointment.id,
          date,
          time,
          normalizedTime,
          startStr,
          startDate,
          endDate
        })

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Cita con fecha/hora inválida, se omite:', appointment)
          return null
        }

        return {
          id: appointment.id,
          title: `${appointment.client.names} - ${appointment.service.service_name}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          status: appointment.status,
          client: appointment.client,
          vehicle: appointment.vehicle,
          service: appointment.service,
          notes: appointment.notes,
          dealership_id: appointment.dealership_id
        }
      }).filter(Boolean)

      const validEvents = formattedEvents.filter((e): e is CalendarEvent => !!e)
      setEvents(validEvents)
      console.log('📅 formattedEvents:', validEvents)
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

  // Nueva función para normalizar el formato de hora
  const normalizeTime = (time: string): string => {
    // Si ya tiene formato HH:mm:ss, devolver igual
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time
    // Si tiene formato H:mm o HH:mm, agregar :00 y ceros a la hora si falta
    const match = /^(\d{1,2}):(\d{2})$/.exec(time)
    if (match) {
      const hour = match[1].padStart(2, '0')
      return `${hour}:${match[2]}:00`
    }
    // Si no, devolver como está
    return time
  }

  const handleEventClick = (info: any) => {
    const event = events.find(e => e.id === info.event.id)
    if (event) {
      setSelectedEvent(event)
      setDialogOpen(true)
    }
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
    if (dataToken && (dataToken as any).dealership_id) {
      loadEvents((dataToken as any).dealership_id, start, end)
    }
  }

  // Funciones para navegación personalizada
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Calendario de Citas</h1>
        <div className="space-x-2">
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

      {/* Botones personalizados de navegación */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={handlePrev}>&lt;</Button>
        <Button variant="secondary" onClick={handleToday}>Hoy</Button>
        <Button variant="outline" onClick={handleNext}>&gt;</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 min-h-[500px]">
        {loading && (
          <div className="text-center py-8 text-gray-500">Cargando citas...</div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView.type}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Cliente</h3>
                <p>{selectedEvent.client.names}</p>
                <p>{selectedEvent.client.phone_number}</p>
                <p>{selectedEvent.client.email}</p>
              </div>
              <div>
                <h3 className="font-semibold">Vehículo</h3>
                <p>{selectedEvent.vehicle.make} {selectedEvent.vehicle.model} ({selectedEvent.vehicle.year})</p>
                <p>Placa: {selectedEvent.vehicle.license_plate}</p>
              </div>
              <div>
                <h3 className="font-semibold">Servicio</h3>
                <p>{selectedEvent.service.service_name}</p>
                <p>Duración: {selectedEvent.service.duration_minutes} minutos</p>
                <p>Precio: ${selectedEvent.service.price}</p>
              </div>
              <div>
                <h3 className="font-semibold">Horario</h3>
                <p>Inicio: {format(new Date(selectedEvent.start), 'PPpp', { locale: es })}</p>
                <p>Fin: {format(new Date(selectedEvent.end), 'PPpp', { locale: es })}</p>
              </div>
              {selectedEvent.notes && (
                <div>
                  <h3 className="font-semibold">Notas</h3>
                  <p>{selectedEvent.notes}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/backoffice/citas/${selectedEvent.id}/editar?token=${token}`)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 