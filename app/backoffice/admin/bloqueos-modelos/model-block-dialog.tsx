'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Car } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { verifyToken } from '@/app/jwt/token';
import { cn } from '@/lib/utils';
import { VehicleMakeModelSelector } from '@/components/VehicleMakeModelSelector';

interface ModelBlockedDate {
  id: string;
  dealership_id: string;
  make: string;
  model: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ModelBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBlock: ModelBlockedDate | null;
  onSave: () => void;
}

export default function ModelBlockDialog({
  open,
  onOpenChange,
  editingBlock,
  onSave
}: ModelBlockDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [dealershipId, setDealershipId] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Obtener el dealership_id del token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      const verifiedData = verifyToken(token);
      if (verifiedData && (verifiedData as any).dealership_id) {
        setDealershipId((verifiedData as any).dealership_id);
      }
    }

    if (editingBlock) {
      // Para edición, necesitamos convertir los nombres a IDs
      // Por ahora usamos los nombres directamente, pero en una implementación completa
      // deberíamos buscar los IDs correspondientes
      setSelectedMakeId(editingBlock.make); // Temporalmente usamos el nombre como ID
      setSelectedModelId(editingBlock.model); // Temporalmente usamos el nombre como ID
      setStartDate(new Date(editingBlock.start_date));
      setEndDate(new Date(editingBlock.end_date));
      setReason(editingBlock.reason);
    } else {
      setSelectedMakeId('');
      setSelectedModelId('');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
    }
  }, [editingBlock, open]);

  const handleSave = async () => {
    if (!selectedMakeId || !selectedModelId || !startDate || !endDate || !reason.trim()) {
      toast({
        title: '¡Error!',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive'
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: '¡Error!',
        description: 'La fecha de fin debe ser posterior a la fecha de inicio',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Obtener los nombres de marca y modelo a partir de los IDs
      let makeName = selectedMakeId;
      let modelName = selectedModelId;

      // Si tenemos IDs válidos (no son nombres), buscar los nombres correspondientes
      if (selectedMakeId && selectedModelId && !selectedMakeId.includes(' ')) {
        try {
          // Obtener nombre de la marca
          const { data: makeData, error: makeError } = await supabase
            .from('vehicle_makes')
            .select('name')
            .eq('id', selectedMakeId)
            .single();

          if (!makeError && makeData) {
            makeName = makeData.name;
          }

          // Obtener nombre del modelo
          const { data: modelData, error: modelError } = await supabase
            .from('vehicle_models')
            .select('name')
            .eq('id', selectedModelId)
            .single();

          if (!modelError && modelData) {
            modelName = modelData.name;
          }
        } catch (error) {
          console.error('Error obteniendo nombres de marca/modelo:', error);
        }
      }

      // Obtener el dealership_id del token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        toast({
          title: '¡Error!',
          description: 'No se encontró el token de autenticación',
          variant: 'destructive'
        });
        return;
      }

      const verifiedData = verifyToken(token);
      if (!verifiedData || !(verifiedData as any).dealership_id) {
        toast({
          title: '¡Error!',
          description: 'Token inválido',
          variant: 'destructive'
        });
        return;
      }

      const blockData = {
        dealership_id: (verifiedData as any).dealership_id,
        make: makeName,
        model: modelName,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        reason: reason.trim(),
        is_active: true
      };

      if (editingBlock) {
        // Actualizar bloqueo existente usando API
        const response = await fetch(`/api/model-blocked-dates/${editingBlock.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blockData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al actualizar bloqueo');
        }

        toast({
          title: '¡Éxito!',
          description: 'Bloqueo actualizado correctamente',
          variant: 'default'
        });
      } else {
        // Crear nuevo bloqueo usando API
        const response = await fetch('/api/model-blocked-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blockData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear bloqueo');
        }

        toast({
          title: '¡Éxito!',
          description: 'Bloqueo creado correctamente',
          variant: 'default'
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar bloqueo:', error);
      toast({
        title: '¡Error!',
        description: 'Error al guardar el bloqueo',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {editingBlock ? 'Editar Bloqueo por Modelo' : 'Nuevo Bloqueo por Modelo'}
          </DialogTitle>
          <DialogDescription>
            {editingBlock 
              ? 'Modifica la configuración del bloqueo para este modelo de vehículo'
              : 'Configura un bloqueo de calendario para un modelo específico de vehículo'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <VehicleMakeModelSelector
            dealershipId={dealershipId}
            onMakeChange={setSelectedMakeId}
            onModelChange={setSelectedModelId}
            selectedMake={selectedMakeId}
            selectedModel={selectedModelId}
            disabled={isLoading}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo del Bloqueo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Falta de repuestos específicos para este modelo"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Guardando...' : (editingBlock ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 