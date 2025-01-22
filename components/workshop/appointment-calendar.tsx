'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isToday, isBefore, startOfDay, addMinutes, parse, addMonths } from 'date-fns';
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

export interface TimeSlot {
  time: string;
  available: number;
  isBlocked: boolean;
  blockReason?: string;
  existingAppointments?: {
    id: string;
    clientName: string;
    serviceName: string;
    duration: number;
  }[];
}

interface AppointmentCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date | undefined) => void;
  blockedDates: BlockedDate[];
  operatingHours: HorarioOperacion[];
  turnDuration: number;
  appointments: Array<any>;
  onTimeSlotSelect?: (slot: TimeSlot) => void;
  selectedService?: {
    id: string;
    duration: number;
  };
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
const CalendarDay = ({ date, dayInfo, onClick, disabled }: { 
  date: Date; 
  dayInfo: DayAvailability;
  onClick: () => void;
  disabled: boolean;
}) => {
  if (disabled) {
    return (
      <button
        disabled
        className="w-9 h-9 p-0 font-normal text-muted-foreground opacity-50"
      >
        <time dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'd')}</time>
      </button>
    );
  }

  const content = (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 p-0 font-normal relative",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        dayInfo.isFullyBlocked ? "bg-[#F3F4F6] text-gray-900" :
        dayInfo.isPartiallyBlocked ? "bg-white border-2 border-dashed border-yellow-400" :
        dayInfo.status === 'high' ? "bg-[#E6F4EA] text-green-900" :
        dayInfo.status === 'medium' ? "bg-[#FEF3C7] text-yellow-900" :
        "bg-[#FEE2E2] text-red-900"
      )}
    >
      <time dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'd')}</time>
      {dayInfo.availableSlots > 0 && !dayInfo.isFullyBlocked && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <div className="h-1 w-1 rounded-full bg-current opacity-60" />
        </div>
      )}
    </button>
  );

  if (dayInfo.isFullyBlocked) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>{content}</HoverCardTrigger>
        <HoverCardContent className="w-80 p-4">
          <div className="space-y-2">
            <p className="font-medium text-red-600">{dayInfo.blockReason}</p>
            <p className="text-sm text-muted-foreground">Este día no está disponible para agendar citas.</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{content}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="font-medium">{format(date, 'PPPP', { locale: es })}</p>
            <div className="text-sm text-muted-foreground">
              {dayInfo.isPartiallyBlocked && (
                <p className="text-yellow-600 font-medium mb-2">
                  ⚠️ Día parcialmente bloqueado: {dayInfo.blockReason}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p>Espacios totales:</p>
                  <p>Espacios ocupados:</p>
                  <p>Espacios disponibles:</p>
                </div>
                <div className="text-right">
                  <p>{dayInfo.totalSlots}</p>
                  <p>{dayInfo.totalSlots - dayInfo.availableSlots}</p>
                  <p className="font-medium">{dayInfo.availableSlots}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full",
                  dayInfo.status === 'high' ? "bg-green-500" :
                  dayInfo.status === 'medium' ? "bg-yellow-500" :
                  "bg-red-500"
                )}
                style={{ width: `${100 - ((dayInfo.availableSlots / dayInfo.totalSlots) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(100 - ((dayInfo.availableSlots / dayInfo.totalSlots) * 100))}% de ocupación
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
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
    <div className="flex flex-wrap gap-3 text-sm mt-4 px-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-[#E6F4EA]" />
        <span>Alta disponibilidad</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-yellow-50" />
        <span>Parcialmente ocupado</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-[#FEE2E2]" />
        <span>Baja disponibilidad</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-[#F3F4F6]" />
        <span>Día bloqueado</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-white border-2 border-dashed border-yellow-400" />
        <span>Parcialmente bloqueado</span>
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
  selectedService
}: AppointmentCalendarProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [monthYear, setMonthYear] = useState<Date>(new Date());

  const calculateDayAvailability = (date: Date): DayAvailability => {
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1;
    const schedule = operatingHours.find(h => h.dia_semana === dayOfWeek);
    const dateStr = format(date, 'yyyy-MM-dd');
    const block = blockedDates.find(b => b.fecha === dateStr);
    
    if (!schedule || !schedule.es_dia_laboral) {
      return { 
        percentage: 0, 
        status: 'blocked', 
        totalSlots: 0, 
        availableSlots: 0,
        isFullyBlocked: true,
        isPartiallyBlocked: false,
        blockReason: 'Día no laborable'
      };
    }

    if (block?.dia_completo) {
      return { 
        percentage: 0, 
        status: 'blocked', 
        totalSlots: 0, 
        availableSlots: 0,
        isFullyBlocked: true,
        isPartiallyBlocked: false,
        blockReason: block.motivo
      };
    }

    const isPartiallyBlocked = !!block && !block.dia_completo;

    // Calcular slots totales del día
    const startTime = parse(schedule.hora_apertura, 'HH:mm:ss', date);
    const endTime = parse(schedule.hora_cierre, 'HH:mm:ss', date);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const totalSlots = Math.floor(totalMinutes / turnDuration) * schedule.servicios_simultaneos_max;

    // Calcular slots ocupados
    const dayAppointments = appointments.filter(app => 
      format(new Date(app.fecha_hora), 'yyyy-MM-dd') === dateStr
    );

    const occupiedSlots = dayAppointments.reduce((acc, app) => {
      const duration = app.servicios.duracion_estimada;
      return acc + Math.ceil(duration / turnDuration);
    }, 0);

    const availablePercentage = ((totalSlots - occupiedSlots) / totalSlots) * 100;

    const occupancyPercentage = 100 - availablePercentage; // Convertimos disponibilidad a ocupación
    
    // Determinar el estado basado en ocupación
    let status: DayAvailability['status'];
    if (occupancyPercentage > 80) {
      status = 'low';        // Baja disponibilidad (ocupación > 80%)
    } else if (occupancyPercentage > 50) {
      status = 'medium';     // Parcialmente ocupado (ocupación entre 50% y 80%)
    } else {
      status = 'high';       // Alta disponibilidad (ocupación < 50%)
    }

    return {
      percentage: availablePercentage,
      status,
      totalSlots,
      availableSlots: totalSlots - occupiedSlots,
      nextAvailable: undefined,
      peakHours: undefined,
      isFullyBlocked: false,
      isPartiallyBlocked,
      blockReason: block?.motivo
    };
  };

  // Generar slots de tiempo disponibles para el día seleccionado
  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1;
    const schedule = operatingHours.find(h => h.dia_semana === dayOfWeek);
    
    if (!schedule || !schedule.es_dia_laboral) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const startTime = parse(schedule.hora_apertura, 'HH:mm:ss', date);
    const endTime = parse(schedule.hora_cierre, 'HH:mm:ss', date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Obtener citas existentes para este día
    const dayAppointments = appointments.filter(app => 
      format(new Date(app.fecha_hora), 'yyyy-MM-dd') === dateStr
    );
    
    let currentTime = startTime;
    while (currentTime < endTime) {
      const timeStr = format(currentTime, 'HH:mm');
      const isBlocked = isTimeBlocked(date, timeStr);
      
      // Encontrar citas que ocupan este slot
      const slotAppointments = dayAppointments.filter(app => {
        const appTime = format(new Date(app.fecha_hora), 'HH:mm');
        const appEndTime = format(
          addMinutes(new Date(app.fecha_hora), app.servicios.duracion_estimada),
          'HH:mm'
        );
        return timeStr >= appTime && timeStr < appEndTime;
      });

      // Calcular espacios disponibles
      const occupiedSpaces = slotAppointments.length;
      const availableSpaces = isBlocked ? 0 : 
        Math.max(0, schedule.servicios_simultaneos_max - occupiedSpaces);

      slots.push({
        time: timeStr,
        available: availableSpaces,
        isBlocked,
        blockReason: isBlocked ? getBlockReason(date, timeStr) : undefined,
        existingAppointments: slotAppointments.map(app => ({
          id: app.id_uuid,
          clientName: app.clientes.nombre,
          serviceName: app.servicios.nombre,
          duration: app.servicios.duracion_estimada
        }))
      });

      currentTime = addMinutes(currentTime, turnDuration);
    }

    return slots;
  };

  const isTimeBlocked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const block = blockedDates.find(b => b.fecha === dateStr);
    
    if (!block) return false;
    if (block.dia_completo) return true;
    
    if (block.hora_inicio && block.hora_fin) {
      return time >= block.hora_inicio && time <= block.hora_fin;
    }
    
    return false;
  };

  const getBlockReason = (date: Date, time: string): string => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const block = blockedDates.find(b => b.fecha === dateStr);
    return block?.motivo || 'Horario no disponible';
  };

  const validateServiceDuration = (slot: TimeSlot) => {
    if (!selectedService) return true;
    
    const requiredSlots = Math.ceil(selectedService.duration / turnDuration);
    const currentIndex = timeSlots.findIndex(s => s.time === slot.time);
    
    for (let i = 0; i < requiredSlots; i++) {
      const nextSlot = timeSlots[currentIndex + i];
      if (!nextSlot || nextSlot.isBlocked || nextSlot.available === 0) {
        return false;
      }
    }
    return true;
  };

  const getSlotStyle = (slot: TimeSlot) => {
    if (slot.isBlocked || slot.available === 0) {
      return "bg-red-100 text-red-800 cursor-not-allowed";
    }
    if (selectedService) {
      const isValid = validateServiceDuration(slot);
      if (!isValid) {
        return "bg-red-100 text-red-800 cursor-not-allowed";
      }
    }
    return "bg-green-100 text-green-800 hover:bg-green-200";
  };

  useEffect(() => {
    if (selectedDate) {
      const slots = generateTimeSlots(selectedDate);
      setTimeSlots(slots);
    }
  }, [selectedDate, operatingHours, blockedDates, turnDuration]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex">
        <div className={cn(
          "transition-all duration-300",
          showDetails ? "w-[60%]" : "w-full"
        )}>
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => {
              if (date && !isBefore(date, startOfDay(new Date()))) {
                onSelect(date);
                setShowDetails(true);
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
                    if (!isBefore(date, startOfDay(new Date()))) {
                      onSelect(date);
                      setShowDetails(true);
                    }
                  }}
                  disabled={isBefore(date, startOfDay(new Date()))}
                />
              )
            }}
            className="rounded-lg border p-4"
          />
          <CalendarLegend />
        </div>

        {showDetails && selectedDate && (
          <div className="w-[40%]">
            <DayDetailsPanel
              date={selectedDate}
              slots={timeSlots}
              onClose={() => setShowDetails(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
} 