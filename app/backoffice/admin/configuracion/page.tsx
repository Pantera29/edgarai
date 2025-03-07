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
      // Obtener un dealership_id válido
      const { data: dealershipData, error: dealershipError } = await supabase
        .from('dealerships')
        .select('id')
        .limit(1)
        .single();

      if (dealershipError) {
        console.error('Error al cargar dealership:', dealershipError);
        toast.error('Error al cargar la información del concesionario');
        return;
      }

      const validDealershipId = dealershipData?.id;

      // Cargar configuración
      const { data: configData } = await supabase
        .from('dealership_configuration')
        .select('*')
        .eq('dealership_id', validDealershipId)
        .limit(1)
        .single();

      if (configData) {
        setConfig(configData);
      } else {
        // Si no existe una configuración, crear una predeterminada
        const defaultConfig: TallerConfig = {
          dealership_id: validDealershipId,
          shift_duration: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setConfig(defaultConfig);
      }

      // Cargar horarios
      const { data: schedulesData } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('dealership_id', validDealershipId)
        .order('day_of_week');

      if (schedulesData && schedulesData.length > 0) {
        setSchedules(schedulesData);
      } else {
        // Crear horarios por defecto con day_of_week de 1 a 7
        const defaultSchedules = DAYS.map((_, index) => ({
          schedule_id: crypto.randomUUID(),
          dealership_id: validDealershipId, // Usar un ID válido de dealership
          day_of_week: index + 1, // Ajustar a 1-7
          is_working_day: index !== 0,
          opening_time: '09:00:00',
          closing_time: '18:00:00',
          max_simultaneous_services: 3
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
      // Obtener un dealership_id válido
      const { data: dealershipData, error: dealershipError } = await supabase
        .from('dealerships')
        .select('id')
        .limit(1)
        .single();

      if (dealershipError) {
        console.error('Error al cargar dealership:', dealershipError);
        toast.error('Error al guardar: no se encontró un concesionario válido');
        return;
      }

      const validDealershipId = dealershipData?.id;

      // Asegurarse de que config tenga el dealership_id correcto
      const updatedConfig = {
        ...config,
        dealership_id: validDealershipId,
        updated_at: new Date().toISOString()
      };

      // Guardar todo
      const { error: configError } = await supabase
        .from('dealership_configuration')
        .upsert(updatedConfig);

      if (configError) throw configError;

      // Asegurar que todos los horarios tengan el dealership_id correcto
      const updatedSchedules = schedules.map(schedule => ({
        ...schedule,
        dealership_id: validDealershipId
      }));

      const { error: scheduleError } = await supabase
        .from('operating_hours')
        .upsert(updatedSchedules);

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
        schedule.day_of_week === index + 1 // Ajustar a 1-7
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
                value={config?.shift_duration || 30}
                onChange={(e) => setConfig(prev => ({
                  ...prev!,
                  shift_duration: parseInt(e.target.value)
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
              const schedule = schedules.find(s => s.day_of_week === index + 1); // Ajustar a 1-7
              if (!schedule) return null;

              return (
                <div key={index} className={cn(
                  "p-4 border rounded-lg",
                  schedule.is_working_day ? "bg-card" : "bg-muted"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={schedule.is_working_day}
                        onCheckedChange={(checked) => 
                          updateSchedule(index, { is_working_day: checked })
                        }
                        disabled={!isEditing}
                      />
                      <Label>{day}</Label>
                    </div>

                    {schedule.is_working_day && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Input
                            type="time"
                            value={schedule.opening_time.slice(0, 5)}
                            onChange={(e) => 
                              updateSchedule(index, { 
                                opening_time: e.target.value + ':00' 
                              })
                            }
                            disabled={!isEditing}
                            className="w-32"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={schedule.closing_time.slice(0, 5)}
                            onChange={(e) => 
                              updateSchedule(index, { 
                                closing_time: e.target.value + ':00' 
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
                          value={schedule.max_simultaneous_services}
                          onChange={(e) => 
                            updateSchedule(index, { 
                              max_simultaneous_services: parseInt(e.target.value) 
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