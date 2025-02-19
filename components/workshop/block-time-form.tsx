'use client';

import { useState } from 'react';
import { BlockedTime } from '@/types/workshop';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  selectedDate: Date | null;
  onBlock: (blockedTime: BlockedTime) => void;
}

export default function BlockTimeForm({ selectedDate, onBlock }: Props) {
  const [blockData, setBlockData] = useState<Partial<BlockedTime>>({
    type: 'FULL_DAY',
    reason: '',
    affectedBays: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !blockData.reason) return;

    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    
    if (blockData.type === 'PARTIAL_DAY') {
      startDate.setHours(parseInt(blockData.startTime?.split(':')[0] || '0'));
      startDate.setMinutes(parseInt(blockData.startTime?.split(':')[1] || '0'));
      endDate.setHours(parseInt(blockData.endTime?.split(':')[0] || '0'));
      endDate.setMinutes(parseInt(blockData.endTime?.split(':')[1] || '0'));
    }

    onBlock({
      id: Date.now().toString(),
      startDate,
      endDate,
      reason: blockData.reason,
      affectedBays: blockData.affectedBays || [],
      type: blockData.type as 'FULL_DAY' | 'PARTIAL_DAY'
    });

    setBlockData({
      type: 'FULL_DAY',
      reason: '',
      affectedBays: []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Fecha Seleccionada</Label>
        <div className="text-sm text-muted-foreground">
          {selectedDate && format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Bloqueo</Label>
        <RadioGroup
          defaultValue="FULL_DAY"
          onValueChange={(value: 'FULL_DAY' | 'PARTIAL_DAY') => 
            setBlockData({ ...blockData, type: value })
          }
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="FULL_DAY" id="full_day" />
            <Label htmlFor="full_day" className="cursor-pointer">Día Completo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="PARTIAL_DAY" id="partial_day" />
            <Label htmlFor="partial_day" className="cursor-pointer">Horario Específico</Label>
          </div>
        </RadioGroup>
      </div>

      {blockData.type === 'PARTIAL_DAY' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hora Inicio</Label>
            <Input
              type="time"
              value={blockData.startTime}
              onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Hora Fin</Label>
            <Input
              type="time"
              value={blockData.endTime}
              onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Motivo</Label>
        <Input
          placeholder="Ingrese el motivo del bloqueo"
          value={blockData.reason}
          onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedDate || !blockData.reason}
      >
        Bloquear Tiempo
      </Button>
    </form>
  );
} 