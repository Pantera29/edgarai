'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock, Clock, AlertCircle } from 'lucide-react';
import { HorarioOperacion, BlockedDate } from '@/types/workshop';

interface EnhancedCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date | undefined) => void;
  blockedDates: BlockedDate[];
  operatingHours: HorarioOperacion[];
}

export function EnhancedCalendar({
  selectedDate,
  onSelect,
  blockedDates,
  operatingHours
}: EnhancedCalendarProps) {
  const [modifiers, setModifiers] = useState<any>({});
  const [modifierStyles, setModifierStyles] = useState<any>({});

  useEffect(() => {
    // Obtener los días no laborables
    const inactiveDays = operatingHours
      .filter(h => !h.es_dia_laboral)
      .map(h => h.dia_semana);

    console.log('Días no laborables de BD:', inactiveDays); // Debug

    setModifiers({
      nonOperational: (date: Date) => {
        // Convertir el día de JS (0-6) a formato BD (1-7)
        const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1;
        const isInactive = inactiveDays.includes(dayOfWeek);
        
        // Debug
        if (isInactive) {
          console.log('Día marcado como no operativo:', {
            fecha: format(date, 'yyyy-MM-dd'),
            diaSemanaJS: date.getDay(),
            diaSemanaBD: dayOfWeek,
            inactiveDays
          });
        }
        
        return isInactive;
      },
      fullyBlocked: (date: Date) => {
        return blockedDates.some(block => 
          block.fecha === format(date, 'yyyy-MM-dd') && block.dia_completo
        );
      },
      partiallyBlocked: (date: Date) => {
        return blockedDates.some(block => 
          block.fecha === format(date, 'yyyy-MM-dd') && !block.dia_completo
        );
      },
      past: (date: Date) => isBefore(date, startOfDay(new Date())) && !isToday(date),
      today: (date: Date) => isToday(date)
    });

    // Configurar los estilos de los modificadores
    setModifierStyles({
      // Días no operativos
      nonOperational: {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        cursor: 'not-allowed',
        position: 'relative',
        '&::after': {
          content: '"⊘"',
          position: 'absolute',
          top: '2px',
          right: '2px',
          fontSize: '0.75rem',
          opacity: 0.5
        }
      },
      // Días completamente bloqueados
      fullyBlocked: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        position: 'relative',
        '&::after': {
          content: '"🔒"',
          position: 'absolute',
          top: '2px',
          right: '2px',
          fontSize: '0.75rem'
        },
        '&:hover': {
          backgroundColor: '#FECACA'
        }
      },
      // Días parcialmente bloqueados
      partiallyBlocked: {
        background: 'linear-gradient(135deg, #FFFFFF 50%, #FFEDD5 50%)',
        color: '#111827',
        position: 'relative',
        '&::after': {
          content: '"⏰"',
          position: 'absolute',
          top: '2px',
          right: '2px',
          fontSize: '0.75rem',
          color: '#F97316'
        }
      },
      // Días pasados
      past: {
        opacity: 0.6,
        cursor: 'not-allowed',
        '&:hover': {
          backgroundColor: 'transparent'
        }
      },
      // Día actual
      today: {
        backgroundColor: '#2563EB',
        color: '#FFFFFF',
        fontWeight: 'bold',
        '&:hover': {
          backgroundColor: '#1D4ED8'
        }
      }
    });
  }, [blockedDates, operatingHours]);

  const getDayState = (date: Date) => {
    // Usar la misma lógica de conversión
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1;
    const dateStr = format(date, 'yyyy-MM-dd');
    const isWorkingDay = operatingHours.find(h => h.dia_semana === dayOfWeek)?.es_dia_laboral;
    const blockInfo = blockedDates.find(b => b.fecha === dateStr);

    // Debug para verificar
    console.log('getDayState:', {
      fecha: dateStr,
      dayOfWeek,
      isWorkingDay,
      horarios: operatingHours
    });

    if (!isWorkingDay) {
      return {
        type: 'nonOperational',
        message: 'Taller cerrado regularmente'
      };
    }

    if (blockInfo?.dia_completo) {
      return {
        type: 'fullyBlocked',
        message: `Bloqueado: ${blockInfo.motivo}`
      };
    }

    if (blockInfo && !blockInfo.dia_completo) {
      return {
        type: 'partiallyBlocked',
        message: `Bloqueado de ${blockInfo.hora_inicio} a ${blockInfo.hora_fin}: ${blockInfo.motivo}`
      };
    }

    if (isBefore(date, startOfDay(new Date()))) {
      return {
        type: 'past',
        message: 'Fecha pasada'
      };
    }

    return {
      type: 'available',
      message: 'Disponible para citas'
    };
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Leyenda simplificada */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#F3F4F6]" />
            <span>No operativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#FEE2E2]" />
            <span>Completamente bloqueado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-white to-[#FFEDD5]" />
            <span>Parcialmente bloqueado</span>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={onSelect}
          locale={es}
          modifiers={modifiers}
          modifiersStyles={modifierStyles}
          disabled={(date) => {
            const state = getDayState(date);
            return state.type === 'nonOperational';
          }}
          className="rounded-lg border border-[#E5E7EB] p-4 bg-white shadow-sm"
        />
      </div>
    </TooltipProvider>
  );
} 