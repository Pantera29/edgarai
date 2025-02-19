'use client';

import { useState, useEffect } from 'react';
import { TallerConfig } from '@/types/workshop';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Clock } from 'lucide-react';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function WorkshopConfiguration() {
  const [config, setConfig] = useState<TallerConfig | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      // Cargar configuración
      const { data: configData } = await supabase
        .from('configuracion_taller')
        .select('*')
        .limit(1)
        .single();

      if (configData) {
        setConfig(configData);
      }

      // Cargar horarios
      const { data: schedulesData } = await supabase
        .from('horarios_operacion')
        .select('*')
        .order('dia_semana');

      if (schedulesData && schedulesData.length > 0) {
        setSchedules(schedulesData);
      } else {
        // Crear horarios por defecto con dia_semana de 1 a 7
        const defaultSchedules = DAYS.map((_, index) => ({
          id_horario: crypto.randomUUID(),
          id_taller: configData?.id_taller || crypto.randomUUID(),
          dia_semana: index + 1, // Ajustar a 1-7
          es_dia_laboral: index !== 0,
          hora_apertura: '09:00:00',
          hora_cierre: '18:00:00',
          servicios_simultaneos_max: 3
        }));
        setSchedules(defaultSchedules);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Guardar todo
      const { error: configError } = await supabase
        .from('configuracion_taller')
        .upsert({
          ...config,
          actualizado_el: new Date().toISOString()
        });

      if (configError) throw configError;

      const { error: scheduleError } = await supabase
        .from('horarios_operacion')
        .upsert(schedules);

      if (scheduleError) throw scheduleError;

      setIsEditing(false);
      toast.success('Configuración guardada correctamente');
      await loadAll();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const updateSchedule = (index: number, updates: any) => {
    setSchedules(current =>
      current.map(schedule =>
        schedule.dia_semana === index + 1 // Ajustar a 1-7
          ? { ...schedule, ...updates }
          : schedule
      )
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando configuración...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración del Taller</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Modificar Configuración
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Duración del Turno (minutos)</Label>
              <Input
                type="number"
                min="15"
                max="60"
                step="5"
                value={config?.duracion_turno || 30}
                onChange={(e) => setConfig(prev => ({
                  ...prev!,
                  duracion_turno: parseInt(e.target.value)
                }))}
                disabled={!isEditing}
                className="max-w-[200px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios de Operación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day, index) => {
              const schedule = schedules.find(s => s.dia_semana === index + 1); // Ajustar a 1-7
              if (!schedule) return null;

              return (
                <div key={index} className={cn(
                  "p-4 border rounded-lg",
                  schedule.es_dia_laboral ? "bg-card" : "bg-muted"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={schedule.es_dia_laboral}
                        onCheckedChange={(checked) => 
                          updateSchedule(index, { es_dia_laboral: checked })
                        }
                        disabled={!isEditing}
                      />
                      <Label>{day}</Label>
                    </div>

                    {schedule.es_dia_laboral && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Input
                            type="time"
                            value={schedule.hora_apertura.slice(0, 5)}
                            onChange={(e) => 
                              updateSchedule(index, { 
                                hora_apertura: e.target.value + ':00' 
                              })
                            }
                            disabled={!isEditing}
                            className="w-32"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={schedule.hora_cierre.slice(0, 5)}
                            onChange={(e) => 
                              updateSchedule(index, { 
                                hora_cierre: e.target.value + ':00' 
                              })
                            }
                            disabled={!isEditing}
                            className="w-32"
                          />
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={schedule.servicios_simultaneos_max}
                          onChange={(e) => 
                            updateSchedule(index, { 
                              servicios_simultaneos_max: parseInt(e.target.value) 
                            })
                          }
                          disabled={!isEditing}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar Cambios
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 