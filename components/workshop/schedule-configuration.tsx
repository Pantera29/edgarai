'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { HorarioOperacion } from '@/types/workshop';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "sonner";
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

interface Props {
  tallerId: string;
  readOnly?: boolean;
  onConfigChange?: () => void;
}

// Definir la interfaz para los métodos expuestos
export interface ScheduleConfigurationRef {
  saveSchedules: () => Promise<boolean>;
}

const ScheduleConfiguration = forwardRef<ScheduleConfigurationRef, Props>(
  ({ tallerId, readOnly = false, onConfigChange }, ref) => {
    const [schedules, setSchedules] = useState<HorarioOperacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
      if (tallerId) {
        loadSchedules();
      }
    }, [tallerId]);

    const loadSchedules = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('operating_hours')
          .select('*')
          .eq('dealership_id', tallerId)
          .order('day_of_week');

        if (error) {
          console.error('Error al cargar horarios:', error);
          toast.error('Error al cargar los horarios');
          return;
        }

        if (data && data.length > 0) {
          const mappedSchedules = data.map(horario => ({
            id: horario.schedule_id,
            dealership_id: horario.dealership_id,
            day_of_week: horario.day_of_week,
            opening_time: horario.opening_time,
            closing_time: horario.closing_time,
            is_working_day: horario.is_working_day,
            max_simultaneous_services: horario.max_simultaneous_services
          }));
          setSchedules(mappedSchedules);
        } else {
          const defaultSchedules = Array.from({ length: 7 }, (_, index) => ({
            id: crypto.randomUUID(),
            dealership_id: tallerId,
            day_of_week: index + 1,
            opening_time: '09:00:00',
            closing_time: '18:00:00',
            is_working_day: true,
            max_simultaneous_services: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setSchedules(defaultSchedules);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleScheduleChange = (dayOfWeek: number, updates: Partial<HorarioOperacion>) => {
      if (readOnly) return;

      setSchedules(current =>
        current.map(schedule => {
          if (schedule.day_of_week === dayOfWeek) {
            return { ...schedule, ...updates };
          }
          return schedule;
        })
      );
      onConfigChange?.();
    };

    const saveSchedules = async () => {
      try {
        const schedulesToSave = Array.from({ length: 7 }, (_, index) => {
          const existingSchedule = schedules.find(s => s.day_of_week === index);
          const isLaboral = existingSchedule?.is_working_day ?? false;

          // Validar horarios si es día laboral
          if (isLaboral) {
            const apertura = existingSchedule?.opening_time || '09:00:00';
            const cierre = existingSchedule?.closing_time || '18:00:00';
            
            if (apertura >= cierre) {
              toast.error(`Horario inválido para ${DAYS[index]}`);
              throw new Error('Horario inválido');
            }
          }

          return {
            schedule_id: existingSchedule?.id || crypto.randomUUID(),
            dealership_id: tallerId,
            day_of_week: index,
            is_working_day: isLaboral,
            opening_time: isLaboral 
              ? `${existingSchedule?.opening_time}:00` 
              : '09:00:00',
            closing_time: isLaboral 
              ? `${existingSchedule?.closing_time}:00` 
              : '18:00:00',
            max_simultaneous_services: isLaboral 
              ? Math.max(1, Math.min(10, existingSchedule?.max_simultaneous_services || 3))
              : 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        const { error } = await supabase
          .from('operating_hours')
          .upsert(schedulesToSave, {
            onConflict: 'dealership_id,day_of_week'
          });

        if (error) {
          console.error('Error al guardar horarios:', error);
          toast.error('Error al guardar los horarios');
          return false;
        }

        await loadSchedules();
        toast.success('Horarios guardados correctamente');
        return true;
      } catch (error) {
        console.error('Error al guardar horarios:', error);
        toast.error('Error al guardar los horarios');
        return false;
      }
    };

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const element = document.getElementById('schedule-configuration');
        if (element) {
          (element as any).saveSchedules = saveSchedules;
        }
      }
    }, [schedules, tallerId]);

    // Exponer el método saveSchedules a través de ref
    useImperativeHandle(ref, () => ({
      saveSchedules
    }));

    if (isLoading) {
      return <div className="text-center py-4">Cargando horarios...</div>;
    }

    return (
      <div id="schedule-configuration" className="space-y-4">
        {DAYS.map((day, index) => {
          const schedule = schedules.find(s => s.day_of_week === index);
          if (!schedule) return null;

          return (
            <div 
              key={index}
              className={cn(
                "flex flex-col gap-4 p-4 rounded-lg border transition-colors",
                schedule.is_working_day 
                  ? "bg-card border-border" 
                  : "bg-muted/50 border-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={schedule.is_working_day}
                    onCheckedChange={(checked) => 
                      handleScheduleChange(index, { is_working_day: checked })
                    }
                    disabled={readOnly}
                  />
                  <Label className={cn(
                    "font-medium",
                    !schedule.is_working_day && "text-muted-foreground"
                  )}>
                    {day}
                  </Label>
                </div>
                
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={schedule.max_simultaneous_services}
                  onChange={(e) => 
                    handleScheduleChange(index, { 
                      max_simultaneous_services: parseInt(e.target.value) 
                    })
                  }
                  className="w-24"
                  disabled={readOnly || !schedule.is_working_day}
                  placeholder="Max"
                />
              </div>
              
              {schedule.is_working_day && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={schedule.opening_time}
                    onChange={(e) => 
                      handleScheduleChange(index, { opening_time: e.target.value })
                    }
                    className="w-32"
                    disabled={readOnly}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={schedule.closing_time}
                    onChange={(e) => 
                      handleScheduleChange(index, { closing_time: e.target.value })
                    }
                    className="w-32"
                    disabled={readOnly}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

ScheduleConfiguration.displayName = 'ScheduleConfiguration';

export default ScheduleConfiguration; 