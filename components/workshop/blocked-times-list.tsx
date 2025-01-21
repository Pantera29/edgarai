'use client';

import { BlockedTime } from '@/types/workshop';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  blockedTimes: BlockedTime[];
  onDelete: (id: string) => void;
}

export default function BlockedTimesList({ blockedTimes, onDelete }: Props) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (blockedTimes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No hay tiempos bloqueados</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blockedTimes.map(block => (
        <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
          <div>
            <p className="font-medium">{block.reason}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={block.type === 'FULL_DAY' ? 'default' : 'secondary'}>
                {block.type === 'FULL_DAY' ? 'Día Completo' : 'Parcial'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {block.type === 'FULL_DAY' 
                  ? formatDate(block.startDate).split(',')[0]
                  : `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`
                }
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(block.id)}
            className="text-destructive hover:text-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
} 