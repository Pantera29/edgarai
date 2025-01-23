import React, { useState, useEffect, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Cliente, Vehiculo, Servicio } from '@/types/workshop';
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  selectedSlot: string | null;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
  onSave: () => void;
  preselectedService?: Servicio | null;
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  onSave,
  preselectedService,
}: AppointmentDialogProps) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehiculo[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [notas, setNotas] = useState('');
  const [servicios, setServicios] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  // Cargar clientes y vehículos
  useEffect(() => {
    const loadData = async () => {
      console.log('Iniciando carga de datos...');
      try {
        // Cargar clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre');

        console.log('Clientes cargados:', clientesData);

        if (clientesError) throw clientesError;
        setClientes(clientesData || []);

        // Cargar vehículos
        console.log('Intentando cargar vehículos...');
        const { data: vehiculosData, error: vehiculosError } = await supabase
          .from('vehiculos')
          .select('*')
          .order('marca, modelo');

        console.log('Respuesta de vehículos:', { data: vehiculosData, error: vehiculosError });

        if (vehiculosError) throw vehiculosError;
        setVehiculos(vehiculosData || []);

        // Cargar servicios
        const { data: serviciosData, error: serviciosError } = await supabase
          .from('servicios')
          .select('*')
          .order('nombre');

        console.log('Servicios cargados:', serviciosData);

        if (serviciosError) throw serviciosError;
        setServicios(serviciosData || []);
      } catch (error) {
        console.error('Error detallado al cargar datos:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar la información"
        });
      }
    };

    if (open) {
      console.log('Modal abierto, iniciando carga...');
      loadData();
      // Usar el servicio preseleccionado si existe
      if (preselectedService) {
        setSelectedService(preselectedService.id_uuid);
      }
    }
  }, [open, preselectedService]);

  // Filtrar vehículos cuando se selecciona un cliente
  useEffect(() => {
    if (selectedClient) {
      const clientVehicles = vehiculos.filter(v => v.id_cliente_uuid === selectedClient);
      console.log('Vehículos filtrados:', clientVehicles); // Para debug
      setFilteredVehicles(clientVehicles);
      setSelectedVehicle('');
    } else {
      setFilteredVehicles([]);
      setSelectedVehicle('');
    }
  }, [selectedClient, vehiculos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedVehicle || !selectedService || !selectedDate || !selectedSlot) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor complete todos los campos"
      });
      return;
    }

    try {
      // Combinar fecha y hora
      const fechaHora = `${selectedDate}T${selectedSlot}`;

      const { error } = await supabase
        .from('citas')
        .insert([
          {
            cliente_id_uuid: selectedClient,
            vehiculo_id_uuid: selectedVehicle,  // Asegurarnos de que este campo se está enviando
            servicio_id_uuid: selectedService,
            fecha_hora: fechaHora,
            estado: estado,
            notas: notas,
          }
        ]);

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Cita agendada correctamente"
      });
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar la cita:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al agendar la cita"
      });
    }
  };

  // En el renderizado, agregar un log para ver qué datos tenemos
  console.log('Estado actual:', {
    clientes,
    vehiculos,
    servicios,
    selectedClient,
    selectedVehicle
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Nueva Cita</DialogTitle>
          <DialogDescription>
            Complete los datos de la cita. Todos los campos son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* PRIMERO: Selector de cliente */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cliente" className="text-right">Cliente</Label>
              <div className="col-span-3">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id_uuid} value={cliente.id_uuid}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SEGUNDO: Selector de vehículo */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehiculo" className="text-right">Vehículo</Label>
              <div className="col-span-3">
                <Select 
                  value={selectedVehicle} 
                  onValueChange={setSelectedVehicle}
                  disabled={!selectedClient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedClient 
                        ? "Primero seleccione un cliente" 
                        : "Seleccione un vehículo"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVehicles.map((vehiculo) => (
                      <SelectItem key={vehiculo.id_uuid} value={vehiculo.id_uuid}>
                        {`${vehiculo.marca} ${vehiculo.modelo}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TERCERO: Selector de servicio */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="servicio" className="text-right">Servicio</Label>
              <div className="col-span-3">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map((servicio) => (
                      <SelectItem key={servicio.id_uuid} value={servicio.id_uuid}>
                        {servicio.nombre} ({servicio.duracion_estimada} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Fecha y Hora</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Select 
                    value={selectedDate || ''} 
                    onValueChange={onDateChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccione fecha" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Generar próximos 7 días */}
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        return (
                          <SelectItem 
                            key={i} 
                            value={format(date, 'yyyy-MM-dd')}
                          >
                            {format(date, 'EEEE d MMM', { locale: es })}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={selectedSlot || ''} 
                    onValueChange={onSlotChange}
                    disabled={!selectedDate}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccione hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Generar horarios cada 15 minutos entre 8:00 y 18:00 */}
                      {Array.from({ length: 40 }, (_, i) => {
                        const hour = Math.floor(i / 4) + 8;
                        const minutes = (i % 4) * 15;
                        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        return (
                          <SelectItem key={i} value={time}>
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado" className="text-right">Estado</Label>
              <div className="col-span-3">
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notas */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notas" className="text-right">Notas</Label>
              <div className="col-span-3">
                <textarea 
                  value={notas} 
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotas(e.target.value)}
                  placeholder="Agregue notas adicionales aquí..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Agendar Cita</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 