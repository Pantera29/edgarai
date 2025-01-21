'use client';

import { useState, useEffect } from 'react';
import { ServiceBay } from '@/types/workshop';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Service {
  id: string;
  name: string;
  description: string;
}

interface Props {
  bays: ServiceBay[];
  onUpdate: (bays: ServiceBay[]) => void;
}

export default function ServiceBayConfiguration({ bays, onUpdate }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [newBay, setNewBay] = useState<Partial<ServiceBay>>({
    name: '',
    type: '',
    serviceTypeIds: [],
    isActive: true
  });
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadServices() {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description');
      
      if (data && !error) {
        setServices(data);
      }
    }

    loadServices();
  }, []);

  const addBay = () => {
    if (!newBay.name || !newBay.type) return;
    
    onUpdate([...bays, {
      id: Date.now().toString(),
      name: newBay.name,
      type: newBay.type,
      serviceTypeIds: newBay.serviceTypeIds || [],
      isActive: true
    }]);
    
    setNewBay({ 
      name: '', 
      type: '', 
      serviceTypeIds: [],
      isActive: true 
    });
  };

  const getServiceNameById = (id: string) => {
    return services.find(service => service.id === id)?.name || '';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {bays.map(bay => (
          <div key={bay.id} className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium">{bay.name}</h3>
                <p className="text-sm text-muted-foreground">{bay.type}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={bay.isActive}
                    onCheckedChange={(checked) => {
                      onUpdate(bays.map(b => 
                        b.id === bay.id ? { ...b, isActive: checked } : b
                      ));
                    }}
                  />
                  <Label>Activa</Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdate(bays.filter(b => b.id !== bay.id))}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {bay.serviceTypeIds.length > 0 && (
              <div className="flex gap-2 mt-2">
                {bay.serviceTypeIds.map((serviceId) => (
                  <Badge key={serviceId} variant="secondary">
                    {getServiceNameById(serviceId)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-4">Agregar Nueva Bahía</h3>
        <div className="grid gap-4">
          <div>
            <Label>Nombre</Label>
            <Input
              placeholder="Nombre de la bahía"
              value={newBay.name}
              onChange={(e) => setNewBay({ ...newBay, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Input
              placeholder="Tipo de bahía"
              value={newBay.type}
              onChange={(e) => setNewBay({ ...newBay, type: e.target.value })}
            />
          </div>
          <div>
            <Label>Servicios que puede atender</Label>
            <Select
              onValueChange={(value) => {
                const currentServices = newBay.serviceTypeIds || [];
                if (!currentServices.includes(value)) {
                  setNewBay({
                    ...newBay,
                    serviceTypeIds: [...currentServices, value]
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(newBay.serviceTypeIds?.length ?? 0) > 0 && (
              <div className="flex gap-2 mt-2">
                {newBay.serviceTypeIds?.map((serviceId) => (
                  <Badge 
                    key={serviceId} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      setNewBay({
                        ...newBay,
                        serviceTypeIds: newBay.serviceTypeIds?.filter(id => id !== serviceId)
                      });
                    }}
                  >
                    {getServiceNameById(serviceId)} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button onClick={addBay} disabled={!newBay.name || !newBay.type}>
            Agregar Bahía
          </Button>
        </div>
      </div>
    </div>
  );
} 