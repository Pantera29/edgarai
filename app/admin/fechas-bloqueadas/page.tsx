'use client';

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BlockedDate, HorarioOperacion } from "@/types/workshop";
import BlockDateDialog from "@/components/workshop/block-date-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EnhancedCalendar } from '@/components/workshop/enhanced-calendar';

export default function BlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedDate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<BlockedDate | null>(null);
  const [operatingHours, setOperatingHours] = useState<HorarioOperacion[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar fechas bloqueadas
      const { data: blockedData, error: blockedError } = await supabase
        .from('fechas_bloqueadas')
        .select('*')
        .order('fecha');

      if (blockedError) throw blockedError;
      setBlockedDates(blockedData || []);

      // Cargar horarios de operación
      const { data: hoursData, error: hoursError } = await supabase
        .from('horarios_operacion')
        .select('*')
        .order('dia_semana');

      if (hoursError) throw hoursError;
      
      // Debug
      console.log('Horarios cargados:', hoursData);
      
      setOperatingHours(hoursData || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowDialog(true);
    }
  };

  const handleAddBlock = () => {
    setEditingBlock(null);
    setSelectedDate(null);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!blockToDelete) return;

    try {
      const { error } = await supabase
        .from('fechas_bloqueadas')
        .delete()
        .eq('id_bloqueo', blockToDelete.id_bloqueo);

      if (error) throw error;

      toast.success('Bloqueo eliminado correctamente');
      await loadData();
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
      toast.error('Error al eliminar el bloqueo');
    } finally {
      setBlockToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fechas Bloqueadas</h1>
        <Button onClick={handleAddBlock}>
          Agregar Bloqueo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendario */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedCalendar
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              blockedDates={blockedDates}
              operatingHours={operatingHours}
            />
          </CardContent>
        </Card>

        {/* Lista de bloqueos */}
        <Card>
          <CardHeader>
            <CardTitle>Bloqueos Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p>Cargando bloqueos...</p>
              ) : blockedDates.length === 0 ? (
                <p className="text-muted-foreground">No hay fechas bloqueadas configuradas</p>
              ) : (
                blockedDates.map(block => (
                  <div
                    key={block.id_bloqueo}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {format(parseISO(block.fecha), 'PPP', { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">{block.motivo}</p>
                      {!block.dia_completo && (
                        <p className="text-sm">
                          {block.hora_inicio} - {block.hora_fin}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBlock(block);
                          setShowDialog(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setBlockToDelete(block);
                          setShowDeleteDialog(true);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BlockDateDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedDate={selectedDate}
        editingBlock={editingBlock}
        onSave={loadData}
        operatingHours={operatingHours}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el bloqueo para el día{' '}
              {blockToDelete && format(parseISO(blockToDelete.fecha), 'PPP', { locale: es })}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 