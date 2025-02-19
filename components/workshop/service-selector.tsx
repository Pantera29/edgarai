'use client';

import { useState, useEffect } from "react";
import { Servicio } from "@/types/workshop";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  selectedService: Servicio | null;
  onServiceSelect: (service: Servicio | null) => void;
}

export function ServiceSelector({ selectedService, onServiceSelect }: ServiceSelectorProps) {
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    const { data } = await supabase
      .from('servicios')
      .select('*')
      .order('nombre');
    
    if (data) {
      setServicios(data);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-medium mb-4">Seleccionar Servicio</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {servicios.map((servicio) => (
          <Button
            key={servicio.id_uuid}
            variant={selectedService?.id_uuid === servicio.id_uuid ? "default" : "outline"}
            className={cn(
              "h-auto py-4 px-3 flex flex-col items-center justify-center text-center",
              selectedService?.id_uuid === servicio.id_uuid && "border-primary"
            )}
            onClick={() => onServiceSelect(servicio)}
          >
            <span className="font-medium">{servicio.nombre}</span>
            <span className="text-sm text-muted-foreground mt-1">
              {servicio.duracion_estimada} min
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
} 