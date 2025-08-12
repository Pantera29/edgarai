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
import { verifyToken } from "@/app/jwt/token";
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelector } from "@/components/ui/time-selector";

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function WorkshopConfiguration() {
  const [config, setConfig] = useState<TallerConfig | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('');
  const [workshops, setWorkshops] = useState<any[]>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      // Obtener el dealership_id del token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        toast.error('No se encontró el token de autenticación');
        return;
      }

      const verifiedData = verifyToken(token);
      // Mejor validación: redirigir si el token es null, vacío, no es objeto o no tiene dealership_id
      if (
        !verifiedData ||
        typeof verifiedData !== "object" ||
        Object.keys(verifiedData).length === 0 ||
        !(verifiedData as any).dealership_id
      ) {
        router.push("/login");
        return;
      }

      const dealershipId = verifiedData.dealership_id;
      console.log('Cargando datos para dealership_id:', dealershipId);

      // Cargar talleres primero
      const { data: workshopsData } = await supabase
        .from('workshops')
        .select('*')
        .eq('dealership_id', dealershipId)
        .order('is_main', { ascending: false });

      setWorkshops(workshopsData || []);

      // Seleccionar taller principal por defecto
      const mainWorkshop = workshopsData?.find(w => w.is_main);
      const defaultWorkshopId = mainWorkshop?.id;
      setSelectedWorkshop(defaultWorkshopId);

      // Cargar configuración del taller principal
      if (defaultWorkshopId) {
        const { data: configData, error: configError } = await supabase
          .from('dealership_configuration')
          .select('*')
          .eq('dealership_id', dealershipId)
          .eq('workshop_id', defaultWorkshopId)
          .maybeSingle();

        if (configData) {
          setConfig(configData);
        } else {
          // Crear configuración por defecto
          setConfig({
            dealership_id: dealershipId,
            workshop_id: defaultWorkshopId,
            shift_duration: 30,
            timezone: 'America/Mexico_City',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      // Cargar horarios
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('dealership_id', dealershipId)
        .eq('workshop_id', defaultWorkshopId)
        .order('day_of_week');

      if (schedulesError) {
        console.error('Error al cargar horarios:', schedulesError);
        toast.error('Error al cargar los horarios');
        return;
      }

      console.log('Horarios cargados:', {
        schedules: schedulesData,
        dealershipId
      });

      if (schedulesData && schedulesData.length > 0) {
        setSchedules(schedulesData);
      } else {
        // Crear horarios por defecto con day_of_week de 1 a 7
        const defaultSchedules = DAYS.map((_, index) => ({
          schedule_id: crypto.randomUUID(),
          dealership_id: dealershipId,
          workshop_id: defaultWorkshopId,
          day_of_week: index + 1,
          is_working_day: index !== 0,
          opening_time: '09:00:00',
          closing_time: '18:00:00',
          max_simultaneous_services: 3,
          max_arrivals_per_slot: null,
          reception_end_time: '12:00:00' // ← NUEVO: Valor por defecto
        }));
        console.log('Creando horarios por defecto:', defaultSchedules);
        setSchedules(defaultSchedules);
      }
    } catch (error) {
      console.error('Error general al cargar datos:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Obtener el dealership_id del token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        toast.error('No se encontró el token de autenticación');
        return;
      }

      const verifiedData = verifyToken(token);
      if (!verifiedData?.dealership_id) {
        toast.error('No se pudo verificar el concesionario');
        return;
      }

      const dealershipId = verifiedData.dealership_id;

      // Validar que todos los horarios tengan el dealership_id correcto
      const validateSchedules = (schedules: any[], dealershipId: string) => {
        return schedules.every(schedule => 
          schedule.dealership_id === dealershipId &&
          schedule.day_of_week >= 1 &&
          schedule.day_of_week <= 7
        );
      };

      if (!validateSchedules(schedules, dealershipId)) {
        console.error('Horarios inválidos:', schedules);
        toast.error('Error en la validación de horarios');
        return;
      }

      // Guardar configuración
      const { error: configError } = await supabase
        .from('dealership_configuration')
        .upsert({
          dealership_id: dealershipId,
          workshop_id: selectedWorkshop,
          shift_duration: config?.shift_duration || 30,
          timezone: config?.timezone || 'America/Mexico_City',
          created_at: config?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (configError) {
        console.error('Error al guardar configuración:', configError);
        throw configError;
      }

      // Asegurar que todos los horarios tengan el dealership_id y workshop_id correcto
      const updatedSchedules = schedules.map(schedule => ({
        ...schedule,
        dealership_id: dealershipId,
        workshop_id: selectedWorkshop
      }));

      console.log('Guardando horarios:', {
        schedules: updatedSchedules,
        dealershipId,
        workshopId: selectedWorkshop,
        conflictKey: 'dealership_id,workshop_id,day_of_week'
      });

      // Guardar horarios con condición específica
      const { error: scheduleError } = await supabase
        .from('operating_hours')
        .upsert(updatedSchedules, {
          onConflict: 'dealership_id,workshop_id,day_of_week'
        });

      if (scheduleError) {
        console.error('Error al guardar horarios:', scheduleError);
        throw scheduleError;
      }

      setIsEditing(false);
      toast.success('Configuración guardada correctamente');
      await loadAll();
    } catch (error) {
      console.error('Error general al guardar:', error);
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

  // En handleWorkshopChange, recargar horarios del taller seleccionado
  const handleWorkshopChange = async (workshopId: string) => {
    setSelectedWorkshop(workshopId);
    // Obtener el dealership_id del token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    const verifiedData = verifyToken(token);
    if (!verifiedData?.dealership_id) return;
    // Cargar configuración del taller seleccionado
    const { data: configData } = await supabase
      .from('dealership_configuration')
      .select('*')
      .eq('dealership_id', verifiedData.dealership_id)
      .eq('workshop_id', workshopId)
      .maybeSingle();
    if (configData) {
      setConfig(configData);
    } else {
      setConfig({
        dealership_id: verifiedData.dealership_id,
        workshop_id: workshopId,
        shift_duration: 30,
        timezone: 'America/Mexico_City',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    // Cargar horarios del taller seleccionado
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('dealership_id', verifiedData.dealership_id)
      .eq('workshop_id', workshopId)
      .order('day_of_week');
    if (schedulesError) {
      console.error('Error al cargar horarios:', schedulesError);
      toast.error('Error al cargar los horarios');
      return;
    }
    if (schedulesData && schedulesData.length > 0) {
      setSchedules(schedulesData);
    } else {
      // Crear horarios por defecto con day_of_week de 1 a 7
      const defaultSchedules = DAYS.map((_, index) => ({
        schedule_id: crypto.randomUUID(),
        dealership_id: verifiedData.dealership_id,
        workshop_id: workshopId,
        day_of_week: index + 1,
        is_working_day: index !== 0,
        opening_time: '09:00:00',
        closing_time: '18:00:00',
        max_simultaneous_services: 3,
        max_arrivals_per_slot: null
      }));
      setSchedules(defaultSchedules);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Cargando configuración...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Horarios del Taller</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Modificar Horarios
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {workshops.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Taller</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedWorkshop} 
                onValueChange={handleWorkshopChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un taller" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id}>
                      {workshop.name} {workshop.is_main && "(Principal)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Parámetros Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duración de turno (minutos)
                </label>
                <select
                  value={config?.shift_duration || 30}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    shift_duration: Number(e.target.value)
                  } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-black"
                  disabled={!isEditing}
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Zona Horaria
                </label>
                <select
                  value={config?.timezone || 'America/Mexico_City'}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    timezone: e.target.value
                  } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-black"
                  disabled={!isEditing}
                >
                  <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                  <option value="America/Tijuana">Tijuana (UTC-7)</option>
                  <option value="America/Cancun">Cancún (UTC-5)</option>
                </select>
              </div>
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
                  "p-6 border rounded-lg",
                  schedule.is_working_day ? "bg-card border-gray-200" : "bg-muted border-gray-100"
                )}>
                  {/* Header del día */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={schedule.is_working_day}
                        onCheckedChange={(checked) => 
                          updateSchedule(index, { is_working_day: checked })
                        }
                        disabled={!isEditing}
                      />
                      <Label className="text-lg font-medium">{day}</Label>
                    </div>
                    
                    {!schedule.is_working_day && (
                      <div className="text-sm text-gray-500 italic">
                        Día no laborable
                      </div>
                    )}
                  </div>

                  {schedule.is_working_day && (
                    <div className="space-y-4">
                      {/* Horarios de operación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Horario de Operación</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <TimeSelector
                                value={schedule.opening_time.slice(0, 5)}
                                onChange={(value) => 
                                  updateSchedule(index, { 
                                    opening_time: value + ':00' 
                                  })
                                }
                                disabled={!isEditing}
                              />
                            </div>
                            <span className="text-gray-500">a</span>
                            <div className="flex-1">
                              <TimeSelector
                                value={schedule.closing_time.slice(0, 5)}
                                onChange={(value) => 
                                  updateSchedule(index, { 
                                    closing_time: value + ':00' 
                                  })
                                }
                                disabled={!isEditing}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Horario de Recepción</Label>
                          <TimeSelector
                            value={schedule.reception_end_time ? schedule.reception_end_time.slice(0, 5) : ''}
                            onChange={(value) => 
                              updateSchedule(index, { 
                                reception_end_time: value ? value + ':00' : null 
                              })
                            }
                            disabled={!isEditing}
                          />
                          <div className="text-xs text-gray-500">
                            Límite para recibir nuevas citas
                          </div>
                        </div>
                      </div>

                      {/* Capacidad y llegadas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Capacidad Simultánea</Label>
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
                            className="w-full"
                          />
                          <div className="text-xs text-gray-500">
                            Servicios que pueden ejecutarse en paralelo
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Límite de Llegadas</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={schedule.max_arrivals_per_slot || ''}
                            onChange={(e) => 
                              updateSchedule(index, { 
                                max_arrivals_per_slot: e.target.value ? parseInt(e.target.value) : null 
                              })
                            }
                            disabled={!isEditing}
                            className="w-full"
                            placeholder="Sin límite"
                          />
                          <div className="text-xs text-gray-500">
                            Máximo clientes por horario exacto (0 = sin límite)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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