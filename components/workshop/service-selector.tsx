'use client';

import { Servicio } from "@/types/workshop";

interface ServiceSelectorProps {
  selectedService: Servicio | null;
  onServiceSelect: (service: Servicio | null) => void;
}

export function ServiceSelector({ selectedService, onServiceSelect }: ServiceSelectorProps) {
  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-lg font-medium mb-4">Seleccionar Servicio</h3>
      {/* Contenido del selector de servicio */}
    </div>
  );
} 