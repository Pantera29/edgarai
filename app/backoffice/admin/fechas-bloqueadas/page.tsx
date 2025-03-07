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
import { BlockedDate, HorarioOperacion, SelectedDateInfo } from "@/types/workshop";
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
  const [selectedDate, setSelectedDate] = useState<SelectedDateInfo | null>(null);
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
        .from('blocked_dates')
        .select('*')
        .order('date');

      if (blockedError) throw blockedError;
      setBlockedDates(blockedData || []);

      // Cargar horarios de operación
      const { data: hoursData, error: hoursError } = await supabase
        .from('operating_hours')
        .select('*')
        .order('day_of_week');

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

  const getDayOfWeek = (date: Date): number => {
    const day = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const dbDay = day === 0 ? 1 : day + 1; // Convertir a formato DB: 1 = Domingo, 2 = Lunes, ..., 7 = Sábado
    console.log('Conversión día:', { date, jsDay: day, dbDay });
    return dbDay;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dayOfWeek = getDayOfWeek(date);
      const schedule = operatingHours.find(h => h.day_of_week === dayOfWeek);
      
      console.log('Selección de fecha:', {
        date,
        dayOfWeek,
        schedule,
        allSchedules: operatingHours
      });

      if (!schedule || !schedule.is_working_day) {
        setSelectedDate({
          date,
          isNonWorkingDay: true,
          schedule: null
        });
      } else {
        setSelectedDate({
          date,
          isNonWorkingDay: false,
          schedule
        });
      }
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
        .from('blocked_dates')
        .delete()
        .eq('block_id', blockToDelete.block_id);

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
                    key={block.block_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">
                        {format(parseISO(block.date), 'PPP', { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">{block.reason}</p>
                      {!block.full_day && (
                        <p className="text-sm">
                          {block.start_time} - {block.end_time}
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
              {blockToDelete && format(parseISO(blockToDelete.date), 'PPP', { locale: es })}.
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