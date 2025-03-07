"use client"

import { useState, useEffect } from "react"
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { supabase } from "@/lib/supabase"
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/types/database.types'

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

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

type Cita = Database['public']['Tables']['citas']['Row'] & {
  services: Database['public']['Tables']['services']['Row']
}

export function AvailabilityCalendar() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [workingHours] = useState({
    start: 8,
    end: 18,
    interval: 30
  })

  useEffect(() => {
    loadBookedSlots()
  }, [])

  const loadBookedSlots = async () => {
    try {
      const { data: citas, error } = await supabase
        .from('citas')
        .select(`
          *,
          services (*)
        `)
        .gte('fecha_hora', format(new Date(), 'yyyy-MM-dd'))

      if (error) throw error

      // Generar slots disponibles
      const slots: TimeSlot[] = []
      const currentDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      for (let date = new Date(currentDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
          for (let min = 0; min < 60; min += workingHours.interval) {
            const start = new Date(date)
            start.setHours(hour, min, 0, 0)
            
            const end = new Date(start)
            end.setMinutes(end.getMinutes() + workingHours.interval)

            const isBooked = (citas as Cita[] | null)?.some(cita => {
              const citaStart = new Date(cita.fecha_hora)
              const citaEnd = new Date(citaStart.getTime() + (cita.services?.duration_minutes || 60) * 60000)
              return (start >= citaStart && start < citaEnd) || 
                     (end > citaStart && end <= citaEnd)
            })

            slots.push({
              start,
              end,
              available: !isBooked
            })
          }
        }
      }

      setTimeSlots(slots)
    } catch (error) {
      console.error('Error cargando slots:', error)
    }
  }

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={timeSlots.map(slot => ({
          title: slot.available ? 'Disponible' : 'Ocupado',
          start: slot.start,
          end: slot.end,
          allDay: false,
          className: slot.available ? 'bg-green-200' : 'bg-red-200'
        }))}
        step={30}
        timeslots={2}
        defaultView="week"
        views={['week', 'day']}
        min={new Date(0, 0, 0, workingHours.start, 0, 0)}
        max={new Date(0, 0, 0, workingHours.end, 0, 0)}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          week: "Semana",
          day: "Día"
        }}
      />
    </div>
  )
} 