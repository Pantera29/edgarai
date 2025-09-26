'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isToday, isBefore, startOfDay, addMinutes, parse, addMonths, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HorarioOperacion, BlockedDate } from '@/types/workshop';
import { Car, Wrench, Battery, Gauge, Settings } from "lucide-react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CalendarIcon } from "lucide-react";
import axios from 'axios';

export interface TimeSlot {
  time: string;
  available: number;
  isBlocked?: boolean;
  blockReason?: string;
  existingAppointments?: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    duration: number;
  }>;
  serviceDuration?: number;
}

interface Service {
  id: string;
  duration_minutes: number;
  service_name: string;
}

interface Appointment {
  id: bigint;
  client_id: string | null;
  vehicle_id: string | null;
  service_id: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  notes?: string | null;
  completion_notes?: string | null;
  client?: {
    id: string;
    names: string;
  };
  services?: {
    id_uuid: string;
    service_name: string;
    duration_minutes: number;
  };
  vehicles?: {
    id_uuid: string;
    make: string;
    model: string;
    license_plate: string | null;
  };
}

interface AppointmentCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  blockedDates: Array<{
    date: string;
    full_day: boolean;
    start_time?: string;
    end_time?: string;
    reason?: string;
  }>;
  operatingHours: Array<{
    day_of_week: number;
    opening_time: string;
    closing_time: string;
    is_working_day: boolean;
    max_simultaneous_services: number;
  }>;
  turnDuration: number;
  appointments: Array<{
    id: string;
    appointment_date: string;
    appointment_time: string;
    services?: Service;
    client?: {
      names: string;
    };
  }>;
  onTimeSlotSelect?: (slot: TimeSlot) => void;
  selectedService?: Service;
  className?: string;
  dealershipId?: string;
  allowPastDates?: boolean;
  workshopId?: string;
}

// Agregar este helper para agrupar slots por hora
const groupSlotsByHour = (slots: TimeSlot[]) => {
  const groups = new Map<string, TimeSlot[]>();
  
  slots.forEach(slot => {
    const hour = slot.time.split(':')[0];
    if (!groups.has(hour)) {
      groups.set(hour, []);
    }
    groups.get(hour)!.push(slot);
  });
  
  return Array.from(groups.entries());
};

// Agregar esta interfaz para el mini timeline
interface TimelineEvent {
  start: string;
  duration: number;
  serviceName: string;
}

// Función helper para obtener el icono según el tipo de servicio
const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes('aceite')) return <Car className="h-3 w-3" />;
  if (name.includes('frenos')) return <Gauge className="h-3 w-3" />;
  if (name.includes('batería')) return <Battery className="h-3 w-3" />;
  if (name.includes('alineación')) return <Settings className="h-3 w-3" />;
  return <Wrench className="h-3 w-3" />;
};

// Definir el tipo de retorno de calculateDayAvailability
interface DayAvailability {
  percentage: number;
  status: 'high' | 'medium' | 'low' | 'blocked';
  totalSlots: number;
  availableSlots: number;
  nextAvailable?: Date;
  peakHours?: string;
  isFullyBlocked: boolean;
  isPartiallyBlocked: boolean;
  blockReason?: string;
}

// Componente para el día del calendario
const CalendarDay = ({ date, dayInfo, onClick, disabled, isSelected }: { 
  date: Date; 
  dayInfo: DayAvailability;
  onClick: () => void;
  disabled: boolean;
  isSelected: boolean;
}) => {
  const baseButtonClass = "w-8 h-8 p-0 font-normal relative text-sm flex items-center justify-center rounded-md";
  
  if (disabled) {
    return (
      <button
        disabled
        className={cn(
          baseButtonClass,
          "text-muted-foreground opacity-50"
        )}
      >
        <time dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'd')}</time>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        baseButtonClass,
        "transition-colors",
        isSelected && "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground",
        !isSelected && "hover:bg-accent hover:text-accent-foreground",
        dayInfo.isFullyBlocked ? "bg-[#F3F4F6] text-gray-500" :
        dayInfo.status === 'high' ? "bg-[#E6F4EA] text-green-700" :
        dayInfo.status === 'medium' ? "bg-[#FEF3C7] text-yellow-700" :
        "bg-[#FEE2E2] text-red-700"
      )}
    >
      <time dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'd')}</time>
    </button>
  );
};

// Componente para mostrar una cita individual
const AppointmentItem = ({ appointment }: { 
  appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    duration: number;
  }
}) => {
  const getServiceEmoji = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('aceite') || name.includes('service')) return '🚗';
    if (name.includes('diagnóstico') || name.includes('revisión')) return '🔧';
    if (name.includes('rápido') || name.includes('express')) return '⚡';
    return '🔧';
  };

  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className="w-5">{getServiceEmoji(appointment.serviceName)}</span>
      <span className="font-medium">{appointment.clientName}</span>
      <span className="text-muted-foreground">- {appointment.serviceName}</span>
    </div>
  );
};

// Componente para mostrar los espacios disponibles
const AvailableSpaces = ({ count }: { count: number }) => {
  if (count === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className="text-muted-foreground">
        {Array(count).fill('○').join(' ')}
      </span>
      <span className="text-muted-foreground">
        {count} {count === 1 ? 'espacio libre' : 'espacios libres'}
      </span>
    </div>
  );
};

// Componente para el slot de tiempo
const TimeSlotItem = ({ slot }: { slot: TimeSlot }) => {
  const hasAppointments = slot.existingAppointments && slot.existingAppointments.length > 0;
  
  return (
    <div className={cn(
      "rounded-lg p-3 space-y-2",
      slot.available === 0 ? "bg-red-50" : 
      hasAppointments ? "bg-yellow-50" : "bg-green-50"
    )}>
      <div className="flex justify-between items-center">
        <span className="font-semibold">{slot.time}</span>
        <span className={cn(
          "text-sm",
          slot.available === 0 ? "text-red-700" :
          hasAppointments ? "text-yellow-700" : "text-green-700"
        )}>
          {slot.available} {slot.available === 1 ? 'espacio' : 'espacios'}
        </span>
      </div>
      
      <div className="space-y-1 pl-4 border-l-2 border-border">
        {slot.existingAppointments?.map((app, idx) => (
          <AppointmentItem key={idx} appointment={app} />
        ))}
        <AvailableSpaces count={slot.available} />
      </div>
    </div>
  );
};

// Panel de detalles actualizado
const DayDetailsPanel = ({ 
  date, 
  slots, 
  onClose 
}: { 
  date: Date; 
  slots: TimeSlot[]; 
  onClose: () => void;
}) => {
  return (
    <div className="h-full border-l">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">
          {format(date, 'PPPP', { locale: es })}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
      <ScrollArea className="h-[calc(100%-4rem)]">
        <div className="p-4 space-y-3">
          {groupSlotsByHour(slots).map(([hour, hourSlots]) => (
            <div key={hour} className="space-y-2">
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {hour}:00
                </div>
              </div>
              {hourSlots.map((slot, idx) => (
                <TimeSlotItem key={`${slot.time}-${idx}`} slot={slot} />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const CalendarLegend = () => {
  return (
    <div className="flex justify-center gap-6 text-xs mt-4 px-4">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded bg-[#E6F4EA]" />
        <span>Disponible</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded bg-yellow-50" />
        <span>Moderado</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded bg-[#FEE2E2]" />
        <span>Limitado</span>
      </div>
    </div>
  );
};

export function AppointmentCalendar({
  selectedDate,
  onSelect,
  blockedDates,
  operatingHours,
  turnDuration,
  appointments,
  onTimeSlotSelect,
  selectedService,
  className,
  dealershipId,
  allowPastDates = false,
  workshopId
}: AppointmentCalendarProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [monthYear, setMonthYear] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const [backendSlots, setBackendSlots] = useState<TimeSlot[] | null>(null);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [nextAvailableDates, setNextAvailableDates] = useState<Array<{
    date: string;
    availableSlots: number;
    timeSlots: string[];
    dayName: string;
    isWeekend: boolean;
  }> | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Log de los props recibidos para depuración
  console.log('AppointmentCalendar props:', { selectedDate, selectedService, dealershipId });

  const calculateDayAvailability = (date: Date): DayAvailability => {
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1;
    const schedule = operatingHours.find(h => h.day_of_week === dayOfWeek);
    const dateStr = format(date, 'yyyy-MM-dd');
    const block = blockedDates.find(b => b.date === dateStr);
    
    if (!schedule || !schedule.is_working_day) {
      return { 
        percentage: 0, 
        status: 'blocked', 
        totalSlots: 0, 
        availableSlots: 0,
        isFullyBlocked: true,
        isPartiallyBlocked: false
      };
    }
    
    if (block?.full_day) {
      return { 
        percentage: 0, 
        status: 'blocked', 
        totalSlots: 0, 
        availableSlots: 0,
        isFullyBlocked: true,
        isPartiallyBlocked: false,
        blockReason: block.reason
      };
    }

    const startTime = parse(schedule.opening_time, 'HH:mm:ss', date);
    const endTime = parse(schedule.closing_time, 'HH:mm:ss', date);
    const totalMinutes = differenceInMinutes(endTime, startTime);
    const totalSlots = Math.floor(totalMinutes / turnDuration) * schedule.max_simultaneous_services;
    
    // Filtrar citas para este día
    const existingAppointments = appointments.filter(app => 
      app.appointment_date && format(new Date(app.appointment_date), 'yyyy-MM-dd') === dateStr
    );
    console.log('existingAppointments para el día:', dateStr, existingAppointments);
    
    const isPartiallyBlocked = !!block && !block.full_day;
        
    // Calcular disponibilidad
    let availableSlots = totalSlots;
    if (existingAppointments.length > 0 || isPartiallyBlocked) {
      availableSlots = generateTimeSlots(date).reduce((total, slot) => 
        total + (slot.available || 0), 0);
    }
    
    const percentage = totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0;
    
    let status: DayAvailability['status'] = 'high';
    if (percentage <= 30) status = 'low';
    else if (percentage <= 70) status = 'medium';
    
    return {
      percentage,
      status: isPartiallyBlocked ? 'blocked' : status,
      totalSlots,
      availableSlots,
      isFullyBlocked: false,
      isPartiallyBlocked,
      blockReason: block?.reason
    };
  };

  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1;
    const schedule = operatingHours.find(h => h.day_of_week === dayOfWeek);
    
    console.log('generateTimeSlots para fecha:', date, 'dayOfWeek:', dayOfWeek, 'schedule:', schedule);
    if (!schedule || !schedule.is_working_day) {
      return [];
    }
    
    const slots: TimeSlot[] = [];
    const startTime = parse(schedule.opening_time, 'HH:mm:ss', date);
    const endTime = parse(schedule.closing_time, 'HH:mm:ss', date);
    
    // Filtrar citas para este día
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingAppointments = appointments.filter(app => 
      app.appointment_date && format(new Date(app.appointment_date), 'yyyy-MM-dd') === dateStr
    );
    
    // Generar slots con intervalos según la duración del turno
    let currentTime = startTime;
    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm:ss');
      
      // Verificar si el slot está bloqueado
      const isBlocked = isTimeBlocked(date, timeString);
      
      // Verificar si el servicio cabe completo antes del cierre
      const serviceEndTime = addMinutes(currentTime, selectedService ? selectedService.duration_minutes : turnDuration);
      if (serviceEndTime > endTime) {
        break;
      }
      
      // Contar citas existentes en este slot
      const slotAppointments = existingAppointments.filter(app => {
        if (!app.appointment_date || !app.appointment_time || !app.services?.duration_minutes) {
          return false;
        }
        // Calcular minutos desde medianoche para el slot y la cita
        const slotMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const appTime = parse(app.appointment_time, 'HH:mm:ss', new Date());
        const appMinutes = appTime.getHours() * 60 + appTime.getMinutes();
        const appEndMinutes = appMinutes + app.services.duration_minutes;
        const slotEndMinutes = slotMinutes + turnDuration;
        const overlaps = (appMinutes < slotEndMinutes && appEndMinutes > slotMinutes);
        if (overlaps) {
          console.log('Cita solapada con slot', timeString, ':', app);
        }
        return overlaps;
      });
      
      const occupiedSpaces = slotAppointments.length;
      // Usar la capacidad máxima del taller para este día
      const maxSimultaneous = schedule.max_simultaneous_services ?? 1;
      const available = isBlocked ? 0 : Math.max(0, maxSimultaneous - occupiedSpaces);
      
      const mappedAppointments = slotAppointments.map(app => ({
        id: app.id.toString(),
        clientName: app.client ? app.client.names : 'Cliente',
        serviceName: app.services ? app.services.service_name : 'Servicio',
        duration: app.services ? app.services.duration_minutes : 30
      }));
      
      slots.push({
        time: timeString,
        available,
        isBlocked,
        blockReason: isBlocked ? getBlockReason(date, timeString) : undefined,
        existingAppointments: mappedAppointments.length > 0 ? mappedAppointments : undefined
      });
      
      currentTime = addMinutes(currentTime, turnDuration);
    }
    
    return slots;
  };

  const isTimeBlocked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const block = blockedDates.find(b => b.date === dateStr);
    
    if (!block) return false;
    if (block.full_day) return true;
    
    if (block.start_time && block.end_time) {
      return time >= block.start_time && time <= block.end_time;
    }
    
    return false;
  };

  const getBlockReason = (date: Date, time: string): string => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const block = blockedDates.find(b => b.date === dateStr);
    return block?.reason || 'Horario no disponible';
  };

  useEffect(() => {
    console.log('DEBUG backendSlots: selectedDate, selectedService, dealershipId', {
      selectedDate,
      selectedService,
      dealershipId
    });
    const fetchBackendSlots = async () => {
      if (!selectedDate || !selectedService || !dealershipId) {
        setBackendSlots(null);
        setBackendMessage(null);
        setIsLoadingSlots(false);
        return;
      }
      
      // Activar loading al cambiar fecha
      setIsLoadingSlots(true);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      const minLoadingPromise = new Promise(resolve => {
        loadingTimeoutRef.current = setTimeout(resolve, 2000);
      });
      console.log('🔄 Cargando slots para fecha:', format(selectedDate, 'yyyy-MM-dd'));
      
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await axios.get(`/api/appointments/availability`, {
          params: {
            date: dateStr,
            service_id: selectedService.id,
            dealership_id: dealershipId,
            workshop_id: workshopId
          },
          headers: {
            'x-request-source': 'backoffice'
          }
        });
        // Log completo de la respuesta del endpoint
        console.log('✅ Respuesta completa del endpoint de disponibilidad:', response.data);
        
        // El endpoint devuelve un array de strings (horarios disponibles)
        const slots = Array.isArray(response.data.availableSlots)
          ? response.data.availableSlots.map((time: string) => ({
              time,
              available: 1,
              existingAppointments: []
            }))
          : [];
        setBackendSlots(slots);
        
        // Guardar el mensaje si existe
        setBackendMessage(response.data.message || null);
        
        // Guardar próximo slot disponible si existe
        if (response.data.nextAvailableSlot) {
          console.log('📅 Próximo slot disponible:', response.data.nextAvailableSlot);
          // Convertir nextAvailableSlot al formato esperado por el frontend
          const nextSlot = response.data.nextAvailableSlot;
          setNextAvailableDates([{
            date: nextSlot.date,
            availableSlots: 1,
            timeSlots: [nextSlot.time],
            dayName: nextSlot.dayName,
            isWeekend: false
          }]);
        } else {
          setNextAvailableDates(null);
        }
        
        console.log('✅ Slots cargados exitosamente:', slots.length, 'horarios disponibles');
        await minLoadingPromise;
      } catch (error: any) {
        console.error('❌ Error consultando disponibilidad al backend:', error);
        setBackendSlots(null);
        setBackendMessage('Error consultando disponibilidad.');
        await minLoadingPromise;
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchBackendSlots();
  }, [selectedDate, selectedService, dealershipId]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  // Función para traducir mensajes conocidos
  const traducirMensajeDisponibilidad = (msg: string | null): string => {
    if (!msg) return 'No hay horarios disponibles';
    
    // Traducir mensajes completos del inglés al español
    if (msg.includes('No availability for the requested date')) {
      if (msg.includes('Daily limit reached')) {
        return 'No hay disponibilidad para la fecha solicitada. Se alcanzó el límite diario para este servicio. Aquí tienes fechas alternativas con disponibilidad: Los horarios específicos se mostrarán cuando seleccione una fecha.';
      }
      if (msg.includes('not a working day')) {
        return 'No hay disponibilidad para la fecha solicitada. El concesionario no opera en el día seleccionado. Aquí tienes fechas alternativas con disponibilidad: Los horarios específicos se mostrarán cuando seleccione una fecha.';
      }
      if (msg.includes('blocked')) {
        return 'No hay disponibilidad para la fecha solicitada. El día está bloqueado para agendar citas. Aquí tienes fechas alternativas con disponibilidad: Los horarios específicos se mostrarán cuando seleccione una fecha.';
      }
      return 'No hay disponibilidad para la fecha solicitada. Aquí tienes fechas alternativas con disponibilidad: Los horarios específicos se mostrarán cuando seleccione una fecha.';
    }
    
    // Remover la nota técnica sobre slots no incluidos y reemplazarla con un mensaje más amigable
    if (msg.includes('Note: Time slots are not included')) {
      const baseMessage = msg.replace(' (Note: Time slots are not included in this response for optimization. If you want to display available times, you must make a separate request with the selected date.)', '');
      return baseMessage + ' Los horarios específicos se mostrarán cuando seleccione una fecha.';
    }
    
    // Mapeo de mensajes conocidos del endpoint
    if (msg.includes('is not available on')) return 'El servicio no está disponible en el día seleccionado. Por favor, elige otro día o consulta con el taller.';
    if (msg.includes('Daily limit reached')) return 'Se alcanzó el límite diario de citas para este servicio.';
    if (msg.includes('not a working day')) return 'El concesionario no opera en el día seleccionado.';
    if (msg.includes('blocked')) return 'El día está bloqueado para agendar citas.';
    if (msg.includes('No operating hours configured')) return 'No hay horarios configurados para este concesionario.';
    if (msg.includes('Service not available for this workshop')) return 'El servicio no está disponible para este taller.';
    if (msg.includes('Error fetching')) return 'Error al consultar la disponibilidad. Intenta nuevamente.';
    if (msg.includes('parameters are required')) return 'Faltan datos obligatorios para consultar la disponibilidad.';
    // Mensaje por defecto
    return msg;
  };

  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    // Siempre usar los slots del backend
    if (selectedService && dealershipId) {
      if (isLoadingSlots) {
        return (
          <div className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <div className="text-muted-foreground">
                Cargando horarios disponibles...
              </div>
            </div>
          </div>
        );
      }

      if (backendSlots === null) {
        return (
          <div className="p-6">
            <div className="text-center text-muted-foreground">
              Seleccione un servicio para ver los horarios disponibles
            </div>
          </div>
        );
      }

      // Procesar los slots del backend para asegurar el formato correcto
      const processedSlots = backendSlots.map(slot => ({
        time: slot.time,
        available: 1,
        existingAppointments: []
      }));

      return (
        <div className="p-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {processedSlots.length === 0 ? (
              <div className="col-span-full space-y-4">
                <div className="text-center text-muted-foreground">
                  {traducirMensajeDisponibilidad(backendMessage)}
                </div>
                
                {/* Mostrar próximas fechas disponibles */}
                {nextAvailableDates && nextAvailableDates.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">
                      📅 Próximas fechas disponibles:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {nextAvailableDates.map((dateInfo, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-left h-auto py-2 px-3",
                            dateInfo.isWeekend 
                              ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" 
                              : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          )}
                          onClick={() => {
                            const newDate = new Date(dateInfo.date);
                            onSelect(newDate);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {dateInfo.dayName} {dateInfo.date.split('-').reverse().join('/')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {dateInfo.availableSlots} horarios disponibles
                            </span>
                            {dateInfo.timeSlots.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Desde {dateInfo.timeSlots[0].substring(0, 5)}
                              </span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              processedSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    "h-auto py-4 relative group transition-all",
                    slot.available ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                  )}
                  disabled={!slot.available}
                  onClick={() => {
                    if (slot.available) {
                      setSelectedSlot(slot.time);
                      onTimeSlotSelect?.(slot);
                    }
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold">{slot.time.substring(0, 5)}</span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      );
    }

    // Si no hay servicio o dealershipId, no mostrar nada
    return null;
  };

  return (
    <div className="h-full p-1">
      <div className="grid grid-cols-1 lg:grid-cols-[0.6fr,1.4fr] gap-8">
        {/* Columna del Calendario */}
        <div className="w-full flex justify-center">
          <div className="bg-white rounded-xl border shadow-sm space-y-4 w-full max-w-[350px]">
            {/* Título del calendario */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">
                Calendario de disponibilidad
              </h3>
            </div>
            
            {/* Contenedor del Calendario con padding ajustado */}
            <div className="flex justify-center px-2 py-4">
              <div className="w-fit">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => {
                    if (date && (allowPastDates || !isBefore(date, startOfDay(new Date())))) {
                      onSelect(date);
                    }
                  }}
                  month={monthYear}
                  onMonthChange={setMonthYear}
                  locale={es}
                  components={{
                    Day: ({ date }) => (
                      <CalendarDay 
                        date={date}
                        dayInfo={calculateDayAvailability(date)}
                        onClick={() => {
                          if (allowPastDates || !isBefore(date, startOfDay(new Date()))) {
                            onSelect(date);
                          }
                        }}
                        disabled={!allowPastDates && isBefore(date, startOfDay(new Date()))}
                        isSelected={selectedDate ? format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') : false}
                      />
                    )
                  }}
                  className="[&_.rdp-months]:flex [&_.rdp-months]:justify-center [&_.rdp-day]:h-8 [&_.rdp-day]:w-8 [&_.rdp-day_button]:h-8 [&_.rdp-day_button]:w-8 [&_.rdp-head_cell]:text-sm [&_.rdp-cell]:p-0"
                />
              </div>
            </div>

            {/* Leyenda */}
            <div className="pb-4">
              <CalendarLegend />
            </div>
          </div>
        </div>

        {/* Columna de los Slots */}
        <div className="lg:pl-0">
          {selectedDate ? (
            <div ref={slotsRef} className="space-y-6">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="text-lg font-medium">
                  Horarios disponibles para {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </h3>
              </div>
              <div className="bg-white rounded-xl border shadow-sm">
                {renderTimeSlots()}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-white rounded-xl border shadow-sm text-muted-foreground">
              <div className="text-center space-y-2">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p>Seleccione una fecha para ver los horarios disponibles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 