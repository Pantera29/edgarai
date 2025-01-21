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
import { toast } from "sonner";
import { BlockedDate, HorarioOperacion } from '@/types/workshop';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
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
}: Props) {
  const [date, setDate] = useState<Date | null>(null);
  const [motivo, setMotivo] = useState('');
  const [diaCompleto, setDiaCompleto] = useState(true);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Obtener el horario operativo del día seleccionado
  const getDaySchedule = (date: Date | null) => {
    if (!date) return null;
    const dayOfWeek = date.getDay();
    return operatingHours.find(h => h.dia_semana === dayOfWeek);
  };

  const currentSchedule = getDaySchedule(date);

  useEffect(() => {
    if (open) {
      if (editingBlock) {
        setDate(parseISO(editingBlock.fecha));
        setMotivo(editingBlock.motivo);
        setDiaCompleto(editingBlock.dia_completo);
        setHoraInicio(editingBlock.hora_inicio || '09:00');
        setHoraFin(editingBlock.hora_fin || '18:00');
      } else if (selectedDate) {
        setDate(selectedDate);
        setMotivo('');
        setDiaCompleto(true);
        // Establecer horarios por defecto según el día
        const schedule = getDaySchedule(selectedDate);
        if (schedule) {
          setHoraInicio(schedule.hora_apertura);
          setHoraFin(schedule.hora_cierre);
        }
      }
    }
  }, [open, editingBlock, selectedDate]);

  const validateSchedule = () => {
    if (!currentSchedule?.es_dia_laboral) {
      return {
        isValid: false,
        message: 'Este día está configurado como no operativo'
      };
    }

    if (!diaCompleto) {
      if (horaInicio >= horaFin) {
        return {
          isValid: false,
          message: 'La hora de fin debe ser posterior a la hora de inicio'
        };
      }

      if (horaInicio < currentSchedule.hora_apertura || horaFin > currentSchedule.hora_cierre) {
        return {
          isValid: false,
          message: `El horario debe estar dentro del horario operativo (${currentSchedule.hora_apertura} - ${currentSchedule.hora_cierre})`
        };
      }
    }

    return { isValid: true };
  };

  const handleSave = async () => {
    console.log('Iniciando guardado...'); // Debug

    if (!date || !motivo.trim()) {
      console.log('Faltan campos requeridos:', { date, motivo }); // Debug
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const validation = validateSchedule();
    console.log('Resultado validación:', validation); // Debug

    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setIsLoading(true);
    try {
      // Obtener el id_taller de la configuración actual
      const { data: configData, error: configError } = await supabase
        .from('configuracion_taller')
        .select('id_taller')
        .limit(1)
        .single();

      if (configError || !configData?.id_taller) {
        console.error('Error al obtener id_taller:', configError);
        throw new Error('No se encontró el ID del taller');
      }

      // Usar startOfDay para evitar problemas de zona horaria
      const normalizedDate = startOfDay(date);
      
      const blockData = {
        id_bloqueo: editingBlock?.id_bloqueo || crypto.randomUUID(),
        id_taller: configData.id_taller,
        fecha: format(normalizedDate, 'yyyy-MM-dd'),
        motivo: motivo.trim(),
        dia_completo: diaCompleto,
        hora_inicio: diaCompleto ? null : horaInicio,
        hora_fin: diaCompleto ? null : horaFin,
        creado_el: editingBlock?.creado_el || new Date().toISOString(),
        actualizado_el: new Date().toISOString()
      };

      console.log('Guardando bloqueo:', blockData); // Debug

      // Usar upsert para manejar tanto creación como edición
      const { error: saveError } = await supabase
        .from('fechas_bloqueadas')
        .upsert(blockData, {
          onConflict: 'id_bloqueo',
          ignoreDuplicates: false // Asegura que se actualice si existe
        });

      if (saveError) {
        console.error('Error al guardar bloqueo:', saveError);
        throw saveError;
      }

      toast.success(
        editingBlock 
          ? 'Bloqueo actualizado correctamente'
          : 'Bloqueo creado correctamente'
      );
      
      onSave(); // Recargar la lista de bloqueos
      onOpenChange(false); // Cerrar el modal
    } catch (error) {
      console.error('Error al guardar el bloqueo:', error);
      toast.error('Error al guardar el bloqueo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={(e) => {
            console.log('Form submit iniciado');  // Debug
            e.preventDefault();
            e.stopPropagation();
            
            // Verificar los datos antes de guardar
            console.log('Datos del formulario:', {
              date,
              motivo,
              diaCompleto,
              horaInicio,
              horaFin,
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

          {date && !currentSchedule?.es_dia_laboral && (
            <div className="relative w-full rounded-lg border p-4 border-destructive/50 text-destructive">
              <AlertCircle className="h-4 w-4 absolute left-4 top-4" />
              <div className="text-sm pl-7">
                Este día está configurado como no operativo en los horarios regulares del taller.
                Por favor selecciona otro día.
              </div>
            </div>
          )}

          {date && currentSchedule?.es_dia_laboral && (
            <div className="relative w-full rounded-lg border p-4">
              <Clock className="h-4 w-4 absolute left-4 top-4" />
              <div className="text-sm pl-7">
                Horario operativo del día: {currentSchedule.hora_apertura} - {currentSchedule.hora_cierre}
              </div>
            </div>
          )}

          <div className="grid gap-4 py-4">
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
            <div className="grid gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Mantenimiento programado"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={diaCompleto}
                onCheckedChange={setDiaCompleto}
              />
              <Label>Día completo</Label>
            </div>
            {!diaCompleto && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="hora_inicio">Hora de inicio</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hora_fin">Hora de fin</Label>
                  <Input
                    id="hora_fin"
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
              onClick={() => console.log('Click en botón submit')}  // Debug
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