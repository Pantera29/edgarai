import React, { useState, useEffect, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Cliente, Vehiculo, Servicio, AppointmentStatus, BlockedDate, HorarioOperacion } from '@/types/workshop';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AppointmentCalendar, TimeSlot } from "@/components/workshop/appointment-calendar"
import { verifyToken } from "@/app/jwt/token"

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  selectedSlot: string | null;
  preselectedService: Servicio | null;
  preselectedVehicleId: string | null;
  onDateChange: (date: string) => void;
  onSlotChange: (slot: string) => void;
  onSave: () => void;
  recommendedServiceId?: string | null;
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedSlot,
  preselectedService,
  preselectedVehicleId,
  onDateChange,
  onSlotChange,
  onSave,
  recommendedServiceId,
}: AppointmentDialogProps) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehiculo[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [estado, setEstado] = useState<'pendiente' | 'en_proceso' | 'completada' | 'cancelada'>('pendiente');
  const [notas, setNotas] = useState('');
  const [servicios, setServicios] = useState<any[]>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [operatingHours, setOperatingHours] = useState<HorarioOperacion[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  const loadData = async () => {
    
      const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
        null
      );
      const [token, setToken] = useState<string>("");
      const [dataToken, setDataToken] = useState<object>({});
    
      const router = useRouter();
    
      useEffect(() => {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          setSearchParams(params); // Guarda los query params en el estado
        }
      }, []);
    
      useEffect(() => {
        if (searchParams) {
          const tokenValue = searchParams.get("token"); // Obtiene el token de los query params
          if (tokenValue) {
            setToken(tokenValue); // Usa setToken para actualizar el estado
            const verifiedDataToken = verifyToken(tokenValue); // Verifica el token
            
            // Si el token no es válido, redirigir al login
            if (verifiedDataToken === null) {
              router.push("/login");
            }
            setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken
    
          }
        }
      }, [searchParams, router]); 
    
    
    

    try {
      const [
        { data: clientesData, error: clientesError },
        { data: vehiculosData, error: vehiculosError },
        { data: serviciosData, error: serviciosError }
      ] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('vehiculos').select('*').order('marca, modelo'),
        supabase.from('servicios').select('*').order('nombre')
      ]);

      if (clientesError) throw clientesError;
      if (vehiculosError) throw vehiculosError;
      if (serviciosError) throw serviciosError;

      setClientes(clientesData || []);
      setVehiculos(vehiculosData || []);
      setServicios(serviciosData || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar la información"
      });
    }
  };

  const loadOperatingHours = async () => {
    const { data, error } = await supabase
      .from('horarios_operacion')
      .select('*')
      .order('dia_semana');

    if (!error) {
      setOperatingHours(data || []);
    }
  };

  const loadBlockedDates = async () => {
    const { data, error } = await supabase
      .from('fechas_bloqueadas')
      .select('*');

    if (!error) {
      setBlockedDates(data || []);
    }
  };

  useEffect(() => {
    if (open) {
      const loadAppointments = async () => {
        const { data, error } = await supabase
          .from('citas')
          .select(`
            *,
            servicios:servicio_id_uuid (
              id_uuid,
              nombre,
              duracion_estimada
            ),
            clientes!citas_cliente_id_uuid_fkey (
              id_uuid,
              nombre
            )
          `)
          .gte('fecha_hora', new Date().toISOString())
          .order('fecha_hora');

        if (!error) {
          setAppointments(data || []);
        }
      };

      loadData();
      loadAppointments();
      loadOperatingHours();
      loadBlockedDates();
    }
  }, [open]);

  useEffect(() => {
    if (open && vehiculos.length > 0) {
      if (preselectedService) {
        setSelectedService(preselectedService.id_uuid);
      }
      if (preselectedVehicleId) {
        const vehicle = vehiculos.find(v => v.id_uuid === preselectedVehicleId);
        if (vehicle) {
          setSelectedVehicle(preselectedVehicleId);
          setSelectedClient(vehicle.id_cliente_uuid);
        }
      }
    }
  }, [open, vehiculos, preselectedService, preselectedVehicleId]);

  useEffect(() => {
    if (selectedClient) {
      setFilteredVehicles(vehiculos.filter(v => v.id_cliente_uuid === selectedClient));
    } else {
      setFilteredVehicles([]);
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

    setIsSubmitting(true);
    try {
      const fechaHora = `${selectedDate}T${selectedSlot}`;
      
      // Crear la cita
      const { data, error } = await supabase
        .from('citas')
        .insert([{
          cliente_id_uuid: selectedClient,
          vehiculo_id_uuid: selectedVehicle,
          servicio_id_uuid: selectedService,
          fecha_hora: fechaHora,
          estado: estado,
          notas: notas,
          recommended_service_id: recommendedServiceId || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Si existe un servicio recomendado, actualizar su estado
      if (recommendedServiceId) {
        const { error: updateError } = await supabase
          .from('recommended_services')
          .update({ status: 'scheduled' })
          .eq('id', recommendedServiceId);

        if (updateError) throw updateError;

        toast({
          title: "Cita agendada",
          description: "La cita se ha creado y el servicio recomendado ha sido actualizado",
          duration: 5000
        });
      } else {
        toast({
          title: "Cita agendada",
          description: "La cita se ha creado exitosamente"
        });
      }
      
      onOpenChange(false);
      onSave();
      router.replace('/citas');
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al agendar la cita"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
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
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-4">Fecha y Hora</Label>
                <div className="col-span-3">
                  <div className="grid grid-cols-[400px,1fr] gap-6">
                    {/* Calendario */}
                    <div className="bg-white rounded-xl border shadow-sm">
                      <AppointmentCalendar
                        selectedDate={selectedDate ? new Date(selectedDate) : null}
                        onSelect={(date) => onDateChange(format(date!, 'yyyy-MM-dd'))}
                        blockedDates={blockedDates}
                        operatingHours={operatingHours}
                        turnDuration={15}
                        appointments={appointments}
                        onTimeSlotSelect={(slot) => onSlotChange(slot.time)}
                        selectedService={selectedService ? {
                          id: selectedService,
                          duration: servicios.find(s => s.id_uuid === selectedService)?.duracion_estimada || 0
                        } : undefined}
                      />
                    </div>

                    {/* Horarios */}
                    <div className="bg-white rounded-xl border shadow-sm">
                      <div className="p-4">
                        <h3 className="text-lg font-medium">
                          Horarios disponibles
                        </h3>
                      </div>
                      {/* Los horarios se mostrarán aquí */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado" className="text-right">Estado</Label>
              <div className="col-span-3">
                <Select 
                  value={estado} 
                  onValueChange={(value: string) => setEstado(value as AppointmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
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
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="relative"
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Agendar Cita</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  </div>
                </>
              ) : (
                "Agendar Cita"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 