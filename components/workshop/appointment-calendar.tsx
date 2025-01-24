'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const baseButtonClass = "w-[34px] h-[34px] p-0 font-normal relative text-sm flex items-center justify-center";
  
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
        "hover:bg-accent hover:text-accent-foreground",
        isSelected && "ring-2 ring-primary ring-offset-1",
        dayInfo.isFullyBlocked ? "bg-[#F3F4F6] text-gray-500" :
        dayInfo.isPartiallyBlocked ? "bg-white border border-dashed border-yellow-400" :
        dayInfo.status === 'high' ? "bg-[#E6F4EA] text-green-700" :
        dayInfo.status === 'medium' ? "bg-[#FEF3C7] text-yellow-700" :
        "bg-[#FEE2E2] text-red-700"
      )}
    >
      <time dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'd')}</time>
      {dayInfo.availableSlots > 0 && !dayInfo.isFullyBlocked && (
        <div className="absolute bottom-0.5 left-0 right-0 flex justify-center">
          <div className="h-1 w-1 rounded-full bg-current opacity-70" />
        </div>
      )}
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
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

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
                  isSelected ? 'bg-primary/20 border-primary ring-2 ring-primary ring-offset-1' :
                  'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-400'
                )}
                disabled={isBlocked || !selectedService || slot.available === 0}
                onClick={() => {
                  if (!isBefore(selectedDate!, startOfDay(new Date()))) {
                    onTimeSlotSelect && onTimeSlotSelect(slot);
                    setSelectedSlot(slot.time);
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
          <div className="bg-white rounded-xl border shadow-sm space-y-4 w-full max-w-[300px]">
            {/* Título del calendario */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">
                Calendario de disponibilidad
              </h3>
            </div>
            
            {/* Calendario */}
            <div className="p-4">
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
                className="w-full [&_.rdp]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-cell]:w-[36px] [&_.rdp-cell]:h-[36px] [&_.rdp-head_cell]:w-[36px] [&_.rdp-head_cell]:h-[36px] [&_.rdp-head_cell]:font-normal [&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:text-muted-foreground [&_.rdp-button]:w-[34px] [&_.rdp-button]:h-[34px] [&_.rdp-nav]:hidden"
              />
            </div>

            {/* Leyenda */}
            <div className="px-4 pb-4">
              <CalendarLegend />
            </div>
          </div>
        </div>

        {/* Columna de los Slots - eliminar el border-l */}
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