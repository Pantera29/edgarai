'use client';

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
  spaces: number;
}

interface TimeSlotsProps {
  selectedDate: Date | null;
  timeSlots: TimeSlot[];
  onTimeSlotSelect: (slot: TimeSlot) => void;
}

export function TimeSlots({ selectedDate, timeSlots, onTimeSlotSelect }: TimeSlotsProps) {
  return (
    <div className="bg-white rounded-xl p-6">
      {selectedDate ? (
        <>
          <h3 className="text-lg font-medium mb-4">
            Horarios disponibles para {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          {/* Contenido de los slots */}
        </>
      ) : (
        <div className="text-center space-y-2">
          <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p>Seleccione una fecha para ver los horarios disponibles</p>
        </div>
      )}
    </div>
  );
} 