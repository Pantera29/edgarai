'use client';

import { useState, useEffect } from "react";
import { Servicio } from "@/types/workshop";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface ServiceSelectorProps {
  selectedService: Servicio | null;
  onServiceSelect: (service: Servicio | null) => void;
}

export function ServiceSelector({ selectedService, onServiceSelect }: ServiceSelectorProps) {
  const [services, setServices] = useState<Servicio[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('service_name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-medium mb-4">Seleccionar Servicio</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {services.map((service) => (
          <Button
            key={service.id_uuid}
            variant={selectedService?.id_uuid === service.id_uuid ? "default" : "outline"}
            className={cn(
              "h-auto py-4 px-3 flex flex-col items-center justify-center text-center",
              selectedService?.id_uuid === service.id_uuid && "border-primary"
            )}
            onClick={() => onServiceSelect(service)}
          >
            <span className="font-medium">{service.service_name}</span>
            <span className="text-sm text-muted-foreground mt-1">
              {service.duration_minutes} min
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
} 