'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "@/hooks/use-toast";
import { BlockedDate, HorarioOperacion, SelectedDateInfo } from '@/types/workshop';
import { verifyToken } from "@/app/jwt/token";

interface BlockDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: SelectedDateInfo | null;
  editingBlock: BlockedDate | null;
  onSave: () => void;
  operatingHours: HorarioOperacion[];
}

export default function BlockDateDialog({
  open,
  onOpenChange,
  selectedDate,
  editingBlock,
  onSave,
  operatingHours
}: BlockDateDialogProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [motivo, setMotivo] = useState('');
  const [tipoBloqueo, setTipoBloqueo] = useState<'solo_limite' | 'dia_completo' | 'horario_parcial'>('solo_limite');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [maxCitas, setMaxCitas] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const getDaySchedule = (date: Date | null): HorarioOperacion | undefined => {
    if (!date) return undefined;
    
    // Convertir día de la semana (0-6) al formato de la base de datos (1-7)
    const dayOfWeek = date.getDay();
    const dbDayOfWeek = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
    
    // Buscar TODOS los horarios para este día
    const daySchedules = operatingHours.filter(h => h.day_of_week === dbDayOfWeek);
    
    // Un día es laborable si AL MENOS UN workshop trabaja ese día
    const isWorkingDay = daySchedules.some(h => h.is_working_day);
    
    // Para mostrar información, usar el primer horario que trabaje, o el primero disponible
    const workingSchedule = daySchedules.find(h => h.is_working_day) || daySchedules[0];
    
    console.log('Día de la semana:', {
      date,
      jsDay: dayOfWeek,
      dbDay: dbDayOfWeek,
      daySchedules,
      isWorkingDay,
      workingSchedule
    });
    
    // Retornar un objeto con la información consolidada
    return workingSchedule ? {
      ...workingSchedule,
      is_working_day: isWorkingDay
    } : undefined;
  };

  const currentSchedule = getDaySchedule(date);

  useEffect(() => {
    if (open) {
      if (editingBlock) {
        setDate(parseISO(editingBlock.date));
        setMotivo(editingBlock.reason);
        setHoraInicio(editingBlock.start_time || '09:00');
        setHoraFin(editingBlock.end_time || '18:00');
        setMaxCitas(editingBlock.max_total_appointments?.toString() || '');
        
        // Determinar el tipo de bloqueo basado en los datos existentes
        if (editingBlock.full_day) {
          setTipoBloqueo('dia_completo');
        } else if (editingBlock.start_time && editingBlock.end_time) {
          setTipoBloqueo('horario_parcial');
        } else {
          setTipoBloqueo('solo_limite');
        }
      } else if (selectedDate) {
        setDate(selectedDate.date);
        setMotivo('');
        setTipoBloqueo('solo_limite');
        setMaxCitas('');
        
        // Verificar si el día seleccionado es laborable usando la nueva lógica
        const dayOfWeek = selectedDate.date.getDay();
        const dbDayOfWeek = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
        const daySchedules = operatingHours.filter(h => h.day_of_week === dbDayOfWeek);
        const isWorkingDay = daySchedules.some(h => h.is_working_day);
        
        if (!isWorkingDay) {
          toast({
            title: "¡Error!",
            description: "Este día está configurado como no operativo en los horarios regulares del taller. Por favor selecciona otro día.",
            variant: "destructive"
          });
          onOpenChange(false);
          return;
        }

        // Usar el horario del schedule que viene en selectedDate
        if (selectedDate.schedule) {
          setHoraInicio(selectedDate.schedule.opening_time);
          setHoraFin(selectedDate.schedule.closing_time);
        }
      }
    }
  }, [open, editingBlock, selectedDate]);

  // Función auxiliar para convertir tiempo a minutos (acepta formato HH:mm o HH:mm:ss)
  const timeToMinutes = (timeStr: string): number => {
    // Normalizar el formato: convertir HH:mm a HH:mm:00 si es necesario
    const normalized = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    const [hours, minutes] = normalized.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateSchedule = () => {
    console.log('Iniciando validación de horario:', {
      date,
      currentSchedule,
      tipoBloqueo,
      horaInicio,
      horaFin
    });

    // Si no hay fecha o no se encontró el horario, no se puede continuar
    if (!date || !currentSchedule) {
      console.log('Validación fallida: Fecha o horario no encontrado');
      return false;
    }

    // Verificar si es un día laboral
    if (!currentSchedule.is_working_day) {
      console.log('Validación fallida: Día no laboral');
      toast({
        title: "¡Error!",
        description: "No se pueden programar bloqueos en días no laborales.",
        variant: "destructive"
      });
      return false;
    }

    // Solo validar horarios si es bloqueo parcial
    if (tipoBloqueo === 'horario_parcial' && horaInicio && horaFin) {
      console.log('Validando horario parcial:', {
        horaInicio,
        horaFin,
        openingTime: currentSchedule.opening_time,
        closingTime: currentSchedule.closing_time
      });

      // Convertir todos los tiempos a minutos para comparación correcta
      const inicioMinutes = timeToMinutes(horaInicio);
      const finMinutes = timeToMinutes(horaFin);
      const openingMinutes = timeToMinutes(currentSchedule.opening_time);
      const closingMinutes = timeToMinutes(currentSchedule.closing_time);

      console.log('Comparación de tiempos en minutos:', {
        inicioMinutes,
        finMinutes,
        openingMinutes,
        closingMinutes,
        inicioValido: inicioMinutes >= openingMinutes,
        finValido: finMinutes <= closingMinutes
      });

      // Validar que las horas estén dentro del horario de operación
      if (inicioMinutes < openingMinutes || finMinutes > closingMinutes) {
        console.log('Validación fallida: Horario fuera de rango');
        const openingFormatted = currentSchedule.opening_time.slice(0, 5);
        const closingFormatted = currentSchedule.closing_time.slice(0, 5);
        toast({
          title: "¡Error!",
          description: `El horario seleccionado (${horaInicio} - ${horaFin}) está fuera del horario permitido para ese día: ${openingFormatted} - ${closingFormatted}. Por favor selecciona un rango dentro del horario operativo.`,
          variant: "destructive"
        });
        return false;
      }

      if (inicioMinutes >= finMinutes) {
        console.log('Validación fallida: Hora de inicio mayor o igual a hora de fin');
        toast({
          title: "¡Error!",
          description: "La hora de inicio debe ser anterior a la hora de fin.",
          variant: "destructive"
        });
        return false;
      }
    }

    // Para solo límite, validar que se haya especificado un límite
    if (tipoBloqueo === 'solo_limite' && (!maxCitas.trim() || parseInt(maxCitas.trim()) < 0)) {
      console.log('Validación fallida: Límite de citas no válido');
      toast({
        title: "¡Error!",
        description: "Para establecer solo un límite de citas, debes especificar un número válido (0 o mayor).",
        variant: "destructive"
      });
      return false;
    }

    console.log('Validación exitosa');
    return true;
  };

  const handleSave = async () => {
    console.log('Iniciando guardado de bloqueo:', {
      date,
      motivo,
      tipoBloqueo,
      horaInicio,
      horaFin,
      maxCitas,
      editingBlock
    });

    if (!date || !motivo.trim()) {
      console.log('Faltan campos requeridos:', { date, motivo });
      toast({
        title: "¡Error!",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const validation = validateSchedule();
    console.log('Resultado validación:', validation);

    if (!validation) {
      console.log('Validación fallida, abortando guardado');
      return;
    }

    setIsLoading(true);
    try {
      // Obtener el dealership_id del token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        console.log('Error: Token no encontrado');
        toast({
          title: "¡Error!",
          description: "No se encontró el token de autenticación",
          variant: "destructive"
        });
        return;
      }

      const verifiedData = verifyToken(token);
      if (!verifiedData?.dealership_id) {
        console.log('Error: No se pudo verificar el concesionario');
        toast({
          title: "¡Error!",
          description: "No se pudo verificar el concesionario",
          variant: "destructive"
        });
        return;
      }

      // Usar startOfDay para evitar problemas de zona horaria
      const normalizedDate = startOfDay(date);

      // Preparar datos para guardar
      const maxAppointments = maxCitas.trim() ? parseInt(maxCitas.trim()) : null;
      const blockData = {
        block_id: editingBlock?.block_id || crypto.randomUUID(),
        dealership_id: verifiedData.dealership_id,
        date: format(normalizedDate, 'yyyy-MM-dd'),
        reason: motivo.trim(),
        full_day: tipoBloqueo === 'dia_completo',
        start_time: tipoBloqueo === 'horario_parcial' ? horaInicio : null,
        end_time: tipoBloqueo === 'horario_parcial' ? horaFin : null,
        max_total_appointments: maxAppointments,
        created_at: editingBlock?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Datos a guardar:', blockData);

      // Usar upsert para manejar tanto creación como edición
      const { error: saveError } = await supabase
        .from('blocked_dates')
        .upsert(blockData, {
          onConflict: 'block_id',
          ignoreDuplicates: false // Asegura que se actualice si existe
        });

      if (saveError) {
        console.error('Error al guardar bloqueo:', saveError);
        throw saveError;
      }

      console.log('Bloqueo guardado exitosamente');
      toast({
        title: "¡Éxito!",
        description: editingBlock ? 'Bloqueo actualizado correctamente' : 'Bloqueo creado correctamente',
        variant: "default"
      });
      
      onSave(); // Recargar la lista de bloqueos
      onOpenChange(false); // Cerrar el modal
    } catch (error) {
      console.error('Error completo al guardar el bloqueo:', error);
      toast({
        title: "¡Error!",
        description: "Error al guardar el bloqueo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dateStr = selectedDate?.date ? format(selectedDate.date, 'yyyy-MM-dd') : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={(e) => {
            console.log('Form submit iniciado');  // Debug
            e.preventDefault();
            e.stopPropagation();
            
            // Verificar los datos antes de guardar
            console.log('Datos del formulario:', {
              date,
              motivo,
              tipoBloqueo,
              horaInicio,
              horaFin,
              maxCitas,
              editingBlock
            });

            handleSave();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? 'Editar Bloqueo' : 'Nuevo Bloqueo'}
            </DialogTitle>
          </DialogHeader>

          {date && !currentSchedule?.is_working_day && (
            <div className="relative w-full rounded-lg border p-4 border-destructive/50 text-destructive">
              <AlertCircle className="h-4 w-4 absolute left-4 top-4" />
              <div className="text-sm pl-7">
                Este día está configurado como no operativo en los horarios regulares del taller.
                Por favor selecciona otro día.
              </div>
            </div>
          )}

          {date && currentSchedule?.is_working_day && (
            <div className="relative w-full rounded-lg border p-4">
              <Clock className="h-4 w-4 absolute left-4 top-4" />
              <div className="text-sm pl-7">
                Horario operativo del día: {currentSchedule.opening_time.slice(0, 5)} - {currentSchedule.closing_time.slice(0, 5)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Columna izquierda - Calendario */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Calendar
                  mode="single"
                  selected={date || undefined}
                  onSelect={(date: Date | undefined) => setDate(date || null)}
                  locale={es}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Columna derecha - Formulario */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Input
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Mantenimiento programado"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Tipo de configuración</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="solo_limite"
                      name="tipoBloqueo"
                      value="solo_limite"
                      checked={tipoBloqueo === 'solo_limite'}
                      onChange={(e) => setTipoBloqueo(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="solo_limite" className="text-sm font-normal">
                      Solo límite de citas (sin bloquear horarios)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="horario_parcial"
                      name="tipoBloqueo"
                      value="horario_parcial"
                      checked={tipoBloqueo === 'horario_parcial'}
                      onChange={(e) => setTipoBloqueo(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="horario_parcial" className="text-sm font-normal">
                      Bloquear horario específico
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="dia_completo"
                      name="tipoBloqueo"
                      value="dia_completo"
                      checked={tipoBloqueo === 'dia_completo'}
                      onChange={(e) => setTipoBloqueo(e.target.value as any)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="dia_completo" className="text-sm font-normal">
                      Bloquear día completo
                    </Label>
                  </div>
                </div>
              </div>

              {tipoBloqueo === 'solo_limite' && (
                <div className="grid gap-2 p-4 bg-blue-50 rounded-lg border">
                  <Label htmlFor="max_citas">Límite máximo de citas</Label>
                  <Input
                    id="max_citas"
                    type="number"
                    value={maxCitas}
                    onChange={(e) => setMaxCitas(e.target.value)}
                    placeholder="Ej: 5"
                    min="0"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Número máximo de citas totales permitidas este día. Los horarios funcionan normalmente.
                  </p>
                </div>
              )}

              {(tipoBloqueo === 'horario_parcial' || tipoBloqueo === 'dia_completo') && (
                <div className="grid gap-2">
                  <Label htmlFor="max_citas_opcional">Límite máximo de citas (opcional)</Label>
                  <Input
                    id="max_citas_opcional"
                    type="number"
                    value={maxCitas}
                    onChange={(e) => setMaxCitas(e.target.value)}
                    placeholder="Ej: 5 (vacío = sin límite)"
                    min="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    Límite adicional de citas. Dejar vacío para no limitar.
                  </p>
                </div>
              )}
              
              {tipoBloqueo === 'horario_parcial' && (
                <div className="grid gap-4 p-4 bg-red-50 rounded-lg border">
                  <h4 className="font-medium">Horario a bloquear</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="hora_inicio">Hora de inicio</Label>
                    <Input
                      id="hora_inicio"
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hora_fin">Hora de fin</Label>
                    <Input
                      id="hora_fin"
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
              onClick={() => console.log('Click en botón submit')}  // Debug
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Guardando...</span>
                </>
              ) : (
                editingBlock ? 'Actualizar' : 'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 