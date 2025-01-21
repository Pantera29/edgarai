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
          .from('horarios_operacion')
          .select('*')
          .eq('id_taller', tallerId)
          .order('dia_semana');

        if (error) {
          console.error('Error al cargar horarios:', error);
          toast.error('Error al cargar los horarios');
          return;
        }

        if (data && data.length > 0) {
          const mappedSchedules = data.map(horario => ({
            id: horario.id_horario,
            id_taller: horario.id_taller,
            dia_semana: horario.dia_semana,
            hora_apertura: horario.hora_apertura,
            hora_cierre: horario.hora_cierre,
            activo: horario.es_dia_laboral,
            servicios_simultaneos_max: horario.servicios_simultaneos_max
          }));
          setSchedules(mappedSchedules);
        } else {
          const defaultSchedules = Array.from({ length: 7 }, (_, index) => ({
            id: crypto.randomUUID(),
            id_taller: tallerId,
            dia_semana: index,
            hora_apertura: '09:00',
            hora_cierre: '18:00',
            activo: index !== 0,
            servicios_simultaneos_max: 3
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
          if (schedule.dia_semana === dayOfWeek) {
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
          const existingSchedule = schedules.find(s => s.dia_semana === index);
          const isLaboral = existingSchedule?.activo ?? false;

          // Validar horarios si es día laboral
          if (isLaboral) {
            const apertura = existingSchedule?.hora_apertura || '09:00:00';
            const cierre = existingSchedule?.hora_cierre || '18:00:00';
            
            if (apertura >= cierre) {
              toast.error(`Horario inválido para ${DAYS[index]}`);
              throw new Error('Horario inválido');
            }
          }

          return {
            id_horario: existingSchedule?.id || crypto.randomUUID(),
            id_taller: tallerId,
            dia_semana: index,
            es_dia_laboral: isLaboral,
            hora_apertura: isLaboral 
              ? `${existingSchedule?.hora_apertura}:00` 
              : '09:00:00',
            hora_cierre: isLaboral 
              ? `${existingSchedule?.hora_cierre}:00` 
              : '18:00:00',
            servicios_simultaneos_max: isLaboral 
              ? Math.max(1, Math.min(10, existingSchedule?.servicios_simultaneos_max || 3))
              : 3,
            creado_el: new Date().toISOString(),
            actualizado_el: new Date().toISOString()
          };
        });

        const { error } = await supabase
          .from('horarios_operacion')
          .upsert(schedulesToSave, {
            onConflict: 'id_taller,dia_semana'
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
          const schedule = schedules.find(s => s.dia_semana === index);
          if (!schedule) return null;

          return (
            <div 
              key={index}
              className={cn(
                "flex flex-col gap-4 p-4 rounded-lg border transition-colors",
                schedule.activo 
                  ? "bg-card border-border" 
                  : "bg-muted/50 border-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={schedule.activo}
                    onCheckedChange={(checked) => 
                      handleScheduleChange(index, { activo: checked })
                    }
                    disabled={readOnly}
                  />
                  <Label className={cn(
                    "font-medium",
                    !schedule.activo && "text-muted-foreground"
                  )}>
                    {day}
                  </Label>
                </div>
                
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={schedule.servicios_simultaneos_max}
                  onChange={(e) => 
                    handleScheduleChange(index, { 
                      servicios_simultaneos_max: parseInt(e.target.value) 
                    })
                  }
                  className="w-24"
                  disabled={readOnly || !schedule.activo}
                  placeholder="Max"
                />
              </div>
              
              {schedule.activo && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={schedule.hora_apertura}
                    onChange={(e) => 
                      handleScheduleChange(index, { hora_apertura: e.target.value })
                    }
                    className="w-32"
                    disabled={readOnly}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={schedule.hora_cierre}
                    onChange={(e) => 
                      handleScheduleChange(index, { hora_cierre: e.target.value })
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