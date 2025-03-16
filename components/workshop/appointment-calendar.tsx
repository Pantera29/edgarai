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
  className?: string;
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
  className
}: AppointmentCalendarProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [monthYear, setMonthYear] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

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
      format(new Date(app.fecha_hora), 'yyyy-MM-dd') === dateStr
    );
    
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
    
    if (!schedule || !schedule.is_working_day) {
      return [];
    }
    
    const slots: TimeSlot[] = [];
    const startTime = parse(schedule.opening_time, 'HH:mm:ss', date);
    const endTime = parse(schedule.closing_time, 'HH:mm:ss', date);
    
    // Filtrar citas para este día
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingAppointments = appointments.filter(app => 
      format(new Date(app.fecha_hora), 'yyyy-MM-dd') === dateStr
    );
    
    // Generar slots con intervalos según la duración del turno
    for (let time = startTime; isBefore(time, endTime); time = addMinutes(time, turnDuration)) {
      const timeString = format(time, 'HH:mm:ss');
      const slotAppointments = existingAppointments.filter(app => {
        const appTime = format(new Date(app.fecha_hora), 'HH:mm');
        const appEndTime = format(
          addMinutes(new Date(app.fecha_hora), app.services.duration_minutes),
          'HH:mm'
        );
        
        const slotTime = format(time, 'HH:mm');
        const slotEndTime = format(addMinutes(time, turnDuration), 'HH:mm');
        
        return (
          (appTime <= slotTime && appEndTime > slotTime) ||
          (appTime >= slotTime && appTime < slotEndTime)
        );
      });
      
      const occupiedSpaces = slotAppointments.length;
      const isBlocked = isTimeBlocked(date, timeString);
      const available = isBlocked ? 0 : 
        Math.max(0, schedule.max_simultaneous_services - occupiedSpaces);
      
      const mappedAppointments = slotAppointments.map(app => ({
        id: app.id_uuid,
        clientName: app.clientes.nombre,
        serviceName: app.services.service_name,
        duration: app.services.duration_minutes
      }));
      
      slots.push({
        time: timeString,
        available,
        isBlocked,
        blockReason: isBlocked ? getBlockReason(date, timeString) : undefined,
        existingAppointments: mappedAppointments.length > 0 ? mappedAppointments : undefined
      });
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

  const renderTimeSlots = () => {
    if (!selectedDate || !timeSlots.length) return null;

    return (
      <div className="p-6">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {timeSlots.map((slot, index) => {
            const isBlocked = slot.isBlocked;
            const isSelected = slot.time === selectedSlot;
            const hasAppointments = slot.existingAppointments && slot.existingAppointments.length > 0;
            
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto py-4 relative group transition-all",
                  isBlocked ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50' :
                  slot.available === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50' :
                  isSelected ? 'bg-primary/20 border-primary ring-2 ring-primary ring-offset-2 font-semibold shadow-sm' :
                  'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400'
                )}
                disabled={isBlocked || slot.available === 0}
                onClick={() => {
                  if (!isBlocked && slot.available > 0) {
                    console.log('Slot seleccionado:', slot);
                    setSelectedSlot(slot.time);
                    if (slot && slot.time) {
                      console.log('Enviando slot al componente padre:', slot);
                      onTimeSlotSelect?.(slot);
                    } else {
                      console.error('Error: slot no tiene la propiedad time', slot);
                    }
                  }
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base font-semibold">{slot.time}</span>
                  <span className="text-xs font-medium">
                    {slot.available} {slot.available === 1 ? 'espacio' : 'espacios'}
                  </span>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute inset-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="w-64">
                      <div className="space-y-2">
                        {isBlocked ? (
                          <p className="text-red-600">{slot.blockReason}</p>
                        ) : (
                          <>
                            <p className="font-medium">
                              {slot.available} {slot.available === 1 ? 'espacio disponible' : 'espacios disponibles'}
                            </p>
                            {hasAppointments && (
                              <div className="text-sm space-y-1">
                                <p className="text-muted-foreground">Citas agendadas:</p>
                                {slot.existingAppointments?.map((app, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span>{app.serviceName}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Button>
            );
          })}
        </div>
      </div>
    );
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
                    if (date && !isBefore(date, startOfDay(new Date()))) {
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
                          if (!isBefore(date, startOfDay(new Date()))) {
                            onSelect(date);
                          }
                        }}
                        disabled={isBefore(date, startOfDay(new Date()))}
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