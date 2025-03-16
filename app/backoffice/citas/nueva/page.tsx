"use client"; // Asegura que el componente se renderice en el cliente

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Client, Vehicle, Service, AppointmentStatus, BlockedDate, HorarioOperacion } from '@/types/workshop';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AppointmentCalendar } from "@/components/workshop/appointment-calendar";
import moment from 'moment-timezone';
import { verifyToken } from "@/app/jwt/token"


const handleDate = (date: string) => {
  if(!date) 
    return new Date();
  const returnedDate = new Date(date);
  returnedDate.setDate(returnedDate.getDate() + 1);
  return returnedDate;
}

export default function NuevaReservaPage() {

  const [token, setToken] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenValue = params.get("token"); // Obtiene el token de los query params
    if (tokenValue) {
      setToken(tokenValue); // Actualiza el estado con el token
      const verifiedDataToken = verifyToken(tokenValue);
      
      if (!verifiedDataToken) {
        router.push("/login"); // Redirigir si el token es inválido
      }
    }
  }, [router]);






  const { toast } = useToast();
  const [clientes, setClientes] = useState<Client[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [estado, setEstado] = useState<'pendiente' | 'en_proceso' | 'completada' | 'cancelada'>('pendiente');
  const [notas, setNotas] = useState('');
  const [servicios, setServicios] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [operatingHours, setOperatingHours] = useState<HorarioOperacion[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(true); // Mantener el estado del diálogo abierto
  const supabase = createClientComponentClient();


  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      // Formatear la fecha a 'yyyy-MM-dd' usando moment
      const formattedDate = moment(date).format('YYYY-MM-DD');
      setSelectedDate(formattedDate);
    } else {
      setSelectedDate(null);
    }
  };
  
  const loadData = async () => {
    try {
      const [
        { data: clientesData, error: clientesError },
        { data: vehiculosData, error: vehiculosError },
        { data: serviciosData, error: serviciosError }
      ] = await Promise.all([
        supabase.from('client').select('*').order('names'),
        supabase.from('vehicles').select('*').order('make, model'),
        supabase.from('services').select('*').order('service_name')
      ]);

      if (clientesError){
        throw clientesError;
      } 
        if (vehiculosError) {
          throw vehiculosError;
        }
      if (serviciosError){
        throw serviciosError;

      } 
      setClientes(clientesData );
      setVehiculos(vehiculosData );
      setServicios(serviciosData );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar la información"
      });
    }
  };

  const loadOperatingHours = async () => {
    const { data, error } = await supabase.from('operating_hours').select('*').order('day_of_week');
    if (!error) {
      setOperatingHours(data || []);
    }
  };

  const loadBlockedDates = async () => {
    const { data, error } = await supabase.from('blocked_dates').select('*');
    if (!error) {
      setBlockedDates(data || []);
    }
  };

  useEffect(() => {
    loadData();
    loadOperatingHours();
    loadBlockedDates();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      setFilteredVehicles(vehiculos.filter(v => v.client_id === selectedClient));
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
      const { error } = await supabase
        .from('appointment')
        .insert([{
          client_id: selectedClient,
          vehicle_id: selectedVehicle,
          service_id: selectedService,
          appointment_date: selectedDate,
          dealership_id:'6b58f82d-baa6-44ce-9941-1a61975d20b5',
          is_booked:true,
          appointment_time: selectedSlot
        }]);

      if (error) throw error;
      
      toast({
        title: "Cita agendada",
        description: "La cita se ha creado exitosamente"
      });
      router.replace('/backoffice/citas?token=' + token);
      
    } catch (error) {
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
    <div className="container mx-auto py-6 px-2 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Nueva Cita</h1>
        
        <div className="space-y-6">
          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="cliente" className="text-right col-span-1">Cliente</Label>
            <div className="col-span-11">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.names} ( {cliente.phone_number} ) 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="vehiculo" className="text-right col-span-1">Vehículo</Label>
            <div className="col-span-11">
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
                    <SelectItem key={vehiculo.id} value={vehiculo.id}>
                      {`${vehiculo.make} ${vehiculo.model}${vehiculo.license_plate ? ` (${vehiculo.license_plate})` : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="servicio" className="text-right col-span-1">Servicio</Label>
            <div className="col-span-11">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.service_name} ({servicio.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 items-start gap-4">
            <Label className="text-right col-span-1 pt-4">Fecha y Hora</Label>
            <div className="col-span-11">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <AppointmentCalendar
                  selectedDate={selectedDate ? handleDate(selectedDate) : new Date()}
                  onSelect={(date) => handleSelectDate(date)}
                  blockedDates={blockedDates}
                  operatingHours={operatingHours}
                  turnDuration={30}
                  appointments={appointments}
                  onTimeSlotSelect={(slot) => setSelectedSlot(slot.time)}
                  selectedService={selectedService ? {
                    id: selectedService,
                    duration: servicios.find(s => s.id === selectedService)?.duration_minutes || 0
                  } : undefined}
                />
                {selectedSlot && (
                  <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-md text-center">
                    Horario seleccionado: <span className="font-medium">{selectedSlot}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="estado" className="text-right col-span-1">Estado</Label>
            <div className="col-span-11">
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

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="notas" className="text-right col-span-1">Notas</Label>
            <div className="col-span-11">
              <textarea 
                value={notas} 
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotas(e.target.value)}
                placeholder="Agregue notas adicionales aquí..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button 
            type="button"
            onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}
