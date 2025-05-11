"use client"; // Asegura que el componente se renderice en el cliente

import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Client, Vehicle, Service, AppointmentStatus, BlockedDate, HorarioOperacion, TallerConfig } from '@/types/workshop';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AppointmentCalendar } from "@/components/workshop/appointment-calendar";
import moment from 'moment-timezone';
import { verifyToken } from "@/app/jwt/token"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { stringToSafeDate } from '@/lib/utils/date';

// Extender la interfaz Vehicle para incluir las propiedades adicionales
interface ExtendedVehicle extends Vehicle {
  id_uuid?: string;
  client?: {
    id: string;
    names?: string;
  };
}

// Interfaz para clientes extendida
interface ExtendedClient extends Client {
  names: string;
}

// Interfaz para servicios extendida
interface ExtendedService extends Service {
  id: string;
  id_uuid?: string;
  service_name: string;
  duration_minutes: number;
}

// Función para traducir estados de inglés a español
const traducirEstado = (estado: string | null): string => {
  if (!estado) return 'Desconocido';
  
  const traducciones: Record<string, string> = {
    'pending': 'Pendiente',
    'in_progress': 'En proceso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'rescheduled': 'Reagendada'
  };
  
  return traducciones[estado] || estado;
};

// Componente mejorado y simplificado para el combobox de clientes
function ClienteComboBox({ clientes, onSelect, value }: { clientes: ExtendedClient[], onSelect: (id: string) => void, value: string }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Buscar el cliente seleccionado
  const selectedClient = clientes.find(c => c.id === value);

  // Filtrar clientes por búsqueda de nombre
  const filtered = search.trim() === ''
    ? clientes
    : clientes.filter(cliente =>
        cliente.names.toLowerCase().includes(search.toLowerCase())
      );

  // Cerrar el dropdown si se hace clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={triggerRef}>
      <button
        type="button"
        className="w-full border rounded-md px-3 py-2 text-left bg-white"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedClient
          ? `${selectedClient.names} (${selectedClient.phone_number})`
          : "Selecciona un cliente..."}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-3 py-2 border-b outline-none bg-white text-black"
            placeholder="Buscar cliente por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((cliente) => (
                <li
                  key={cliente.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === cliente.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => {
                    onSelect(cliente.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {cliente.names} ({cliente.phone_number})
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">No se encontraron clientes</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Componente para seleccionar servicios de forma similar al ClienteComboBox
function ServiceComboBox({ servicios, onSelect, value }: { servicios: ExtendedService[], onSelect: (id: string) => void, value: string }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Buscar el servicio seleccionado
  const selectedService = servicios.find(s => s.id === value || s.id_uuid === value);

  // Filtrar servicios por búsqueda de nombre
  const filtered = search.trim() === ''
    ? servicios
    : servicios.filter(servicio =>
        servicio.service_name.toLowerCase().includes(search.toLowerCase())
      );

  // Cerrar el dropdown si se hace clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={triggerRef}>
      <button
        type="button"
        className="w-full border rounded-md px-3 py-2 text-left bg-white"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedService
          ? `${selectedService.service_name} (${selectedService.duration_minutes} min)`
          : "Selecciona un servicio..."}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-3 py-2 border-b outline-none bg-white text-black"
            placeholder="Buscar servicio por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((servicio) => (
                <li
                  key={servicio.id_uuid || servicio.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === servicio.id || value === servicio.id_uuid ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => {
                    onSelect(servicio.id_uuid || servicio.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  {servicio.service_name} ({servicio.duration_minutes} min)
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">No se encontraron servicios</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function NuevaReservaPage() {

  const [token, setToken] = useState<string>("");
  const [verifiedDataToken, setVerifiedDataToken] = useState<any>(null);
  const [tallerConfig, setTallerConfig] = useState<TallerConfig | null>(null);
  const [dealershipName, setDealershipName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenValue = params.get("token"); // Obtiene el token de los query params
    if (tokenValue) {
      setToken(tokenValue); // Actualiza el estado con el token
      const verifiedData = verifyToken(tokenValue);
      
      setVerifiedDataToken(verifiedData);
      
      if (!verifiedData) {
        router.push("/login"); // Redirigir si el token es inválido
      } else if (verifiedData.dealership_id) {
        // Cargar el nombre del concesionario
        loadDealershipInfo(verifiedData.dealership_id);
      }
    }
  }, [router]);

  const { toast } = useToast();
  const [clientes, setClientes] = useState<ExtendedClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehiculos, setVehiculos] = useState<ExtendedVehicle[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [filteredVehicles, setFilteredVehicles] = useState<ExtendedVehicle[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [estado, setEstado] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [notas, setNotas] = useState('');
  const [servicios, setServicios] = useState<ExtendedService[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [operatingHours, setOperatingHours] = useState<HorarioOperacion[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(true); // Mantener el estado del diálogo abierto
  const supabase = createClientComponentClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadDealershipInfo = async (dealershipId: string) => {
    try {
      const { data, error } = await supabase
        .from('dealerships')
        .select('name')
        .eq('id', dealershipId)
        .single();

      if (error) throw error;
      if (data) {
        setDealershipName(data.name);
      }
    } catch (error) {
      console.error('Error al cargar información del concesionario:', error);
    }
  };

  // Filtrar clientes basado en la búsqueda
  const filteredClientes = React.useMemo(() => {
    if (!searchQuery) return clientes;
    
    const query = searchQuery.toLowerCase();
    return clientes.filter(cliente => 
      cliente.names.toLowerCase().includes(query) ||
      cliente.phone_number.toLowerCase().includes(query)
    );
  }, [clientes, searchQuery]);

  // Obtener el texto del vehículo seleccionado
  const selectedVehicleText = React.useMemo(() => {
    if (!selectedVehicle) return "";
    
    // Buscar el vehículo tanto por id como por id_uuid
    const vehicle = filteredVehicles.find(v => 
      v.id === selectedVehicle || 
      (v.id_uuid && v.id_uuid === selectedVehicle)
    );
    
    if (!vehicle) {
      console.warn("No se encontró el vehículo para el resumen con ID:", selectedVehicle);
      return "";
    }
    
    return `${vehicle.make} ${vehicle.model}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`;
  }, [selectedVehicle, filteredVehicles]);

  // Obtener el texto del cliente seleccionado
  const selectedClientText = React.useMemo(() => {
    if (!selectedClient) return "";
    const client = clientes.find(c => c.id === selectedClient);
    if (!client) return "";
    return `${client.names} (${client.phone_number})`;
  }, [selectedClient, clientes]);

  // Obtener el texto del servicio seleccionado
  const selectedServiceText = React.useMemo(() => {
    console.log('Recalculando selectedServiceText. selectedService:', selectedService);
    console.log('Servicios disponibles:', servicios);
    
    if (!selectedService) return "";
    
    // Intentar encontrar el servicio tanto por id como por id_uuid
    const service = servicios.find(s => 
      s.id === selectedService || 
      s.id_uuid === selectedService
    );
    
    console.log('Servicio encontrado:', service);
    
    if (!service) return "";
    
    const text = `${service.service_name} (${service.duration_minutes} min)`;
    console.log('Texto del servicio seleccionado:', text);
    return text;
  }, [selectedService, servicios]);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      // Creamos una nueva fecha para evitar problemas de zona horaria
      // Extraemos el año, mes y día correctamente
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      // Creamos una nueva fecha con esos valores pero a las 12 del mediodía para evitar problemas de zona horaria
      const fixedDate = new Date(year, month, day, 12, 0, 0);
      
      // Formateamos la fecha corregida
      const formattedDate = moment(fixedDate).format('YYYY-MM-DD');
      
      console.log("Fecha seleccionada:", {
        fechaOriginal: date,
        fechaCorregida: fixedDate,
        fechaFormateada: formattedDate
      });
      
      setSelectedDate(formattedDate);
      loadAppointments(formattedDate);
    } else {
      setSelectedDate(null);
    }
  };
  
  const loadData = async () => {
    try {
      // Verificar que tenemos el dealership_id del token
      if (!verifiedDataToken?.dealership_id) {
        console.error('No se encontró dealership_id en el token');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo verificar el concesionario"
        });
        return;
      }

      const [
        { data: clientesData, error: clientesError },
        { data: vehiculosData, error: vehiculosError },
        { data: serviciosData, error: serviciosError }
      ] = await Promise.all([
        // Filtrar clientes por dealership_id
        supabase
          .from('client')
          .select('*')
          .eq('dealership_id', verifiedDataToken.dealership_id)
          .order('names'),
        supabase.from('vehicles').select('*').order('make, model'),
        supabase.from('services').select('*').eq('dealership_id', verifiedDataToken.dealership_id).order('service_name')
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
      
      console.log('Clientes cargados:', clientesData?.length || 0);
      console.log('Vehículos cargados:', vehiculosData?.length || 0);
      console.log('Un ejemplo de vehículo:', vehiculosData?.[0]);
      
      setClientes(clientesData || []);
      setVehiculos(vehiculosData || []);
      setServicios(serviciosData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar la información"
      });
    }
  };

  const loadOperatingHours = async () => {
    try {
      if (!verifiedDataToken?.dealership_id) {
        console.error('No se encontró dealership_id en el token');
        return;
      }

      const { data, error } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('dealership_id', verifiedDataToken.dealership_id)
        .order('day_of_week');

      if (error) {
        console.error('Error al cargar horarios:', error);
        return;
      }

      setOperatingHours(data || []);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  };

  const loadBlockedDates = async () => {
    try {
      if (!verifiedDataToken?.dealership_id) {
        console.error('No se encontró dealership_id en el token');
        return;
      }

      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('dealership_id', verifiedDataToken.dealership_id)
        .order('date');

      if (error) {
        console.error('Error al cargar fechas bloqueadas:', error);
        return;
      }

      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error al cargar fechas bloqueadas:', error);
    }
  };

  const loadAppointments = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('appointment')
        .select(`
          id,
          appointment_date,
          appointment_time,
          service_id,
          client_id,
          client:client_id(names),
          services:service_id(service_name, duration_minutes)
        `)
        .eq('appointment_date', date);
        
      if (error) throw error;
      
      console.log('Datos originales de citas:', data);
      
      // Formatear los datos para que sean compatibles con el componente AppointmentCalendar
      const formattedAppointments = data?.map(app => {
        // Asegurar que client y services sean objetos, no arrays
        const clientObj = Array.isArray(app.client) ? app.client[0] : app.client;
        const serviceObj = Array.isArray(app.services) ? app.services[0] : app.services;
        return {
          id: app.id,
          appointment_date: app.appointment_date,
          appointment_time: app.appointment_time,
          client_id: app.client_id,
          service_id: app.service_id,
          status: 'pending', // o el valor real si lo tienes
          client: clientObj ? { id: app.client_id, names: clientObj.names } : undefined,
          services: serviceObj ? {
            id_uuid: app.service_id,
            service_name: serviceObj.service_name,
            duration_minutes: serviceObj.duration_minutes
          } : undefined
        };
      }) || [];
      
      console.log('Citas formateadas:', formattedAppointments);
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error cargando citas:", error);
    }
  };

  const loadConfig = async () => {
    try {
      if (!verifiedDataToken?.dealership_id) {
        console.error('No se encontró dealership_id en el token');
        return;
      }

      const { data, error } = await supabase
        .from('dealership_configuration')
        .select('*')
        .eq('dealership_id', verifiedDataToken.dealership_id)
        .single();

      if (error) {
        console.error('Error al cargar la configuración:', error);
        return;
      }

      setTallerConfig(data);
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
    }
  };

  useEffect(() => {
    if (verifiedDataToken?.dealership_id) {
      loadData();
      loadOperatingHours();
      loadBlockedDates();
      loadConfig();
    }
  }, [verifiedDataToken]);

  // Depurar la estructura de un item de servicio cuando se cargan
  useEffect(() => {
    if (servicios.length > 0) {
      console.log('Estructura de un servicio:', servicios[0]);
    }
  }, [servicios]);

  // Efectos adicionales para depurar
  useEffect(() => {
    console.log('selectedService cambió a:', selectedService);
    // Forzar la actualización del texto cuando cambia el servicio seleccionado
    if (selectedService) {
      const service = servicios.find(s => s.id === selectedService);
      if (service) {
        console.log('Servicio encontrado por id:', service);
      } else {
        // Intentar buscar por otras propiedades si existe alguna confusión con los campos
        console.log('Buscando servicio por otras propiedades...');
        const serviceById = servicios.find(s => String(s.id) === String(selectedService));
        const serviceByUuid = servicios.find(s => s.id_uuid === selectedService);
        console.log('Por id convertido a string:', serviceById);
        console.log('Por id_uuid:', serviceByUuid);
      }
    }
  }, [selectedService, servicios]);

  useEffect(() => {
    if (selectedClient) {
      console.log("Filtrando vehículos para cliente ID:", selectedClient);
      console.log("Vehículos disponibles antes del filtrado:", vehiculos);
      
      // Filtrar los vehículos que pertenecen al cliente seleccionado
      const vehiculosFiltrados = vehiculos.filter(v => {
        // Verificar si hay coincidencia con client_id
        const matchesClientId = v.client_id === selectedClient;
        
        // Verificar si hay coincidencia con client.id 
        const matchesNestedClientId = v.client && v.client.id === selectedClient;
        
        // Verificar si hay otros tipos de coincidencia (conversión de tipos)
        const matchesStringConversion = 
          String(v.client_id) === String(selectedClient);
        
        console.log(`Vehículo ${v.id_uuid || v.id}: client_id=${v.client_id}, coincide=${matchesClientId || matchesNestedClientId || matchesStringConversion}`);
        
        return matchesClientId || matchesNestedClientId || matchesStringConversion;
      });
      
      console.log("Vehículos filtrados para el cliente:", vehiculosFiltrados);
      
      // Pre-seleccionar el primer vehículo si hay vehículos disponibles
      if (vehiculosFiltrados.length > 0) {
        const primerVehiculo = vehiculosFiltrados[0];
        const idVehiculo = primerVehiculo.id_uuid || primerVehiculo.id;
        
        console.log("Pre-seleccionando vehículo por defecto:", {
          make: primerVehiculo.make,
          model: primerVehiculo.model,
          id: idVehiculo
        });
        
        setSelectedVehicle(idVehiculo);
        
        // Notificar al usuario que se ha seleccionado un vehículo por defecto
        toast({
          title: "Vehículo seleccionado",
          description: `${primerVehiculo.make} ${primerVehiculo.model}`,
          duration: 3000
        });
      } else {
        setSelectedVehicle('');
      }
      
      setFilteredVehicles(vehiculosFiltrados);
    } else {
      setFilteredVehicles([]);
      setSelectedVehicle('');
    }
  }, [selectedClient, vehiculos, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Valores al enviar:", {
      cliente: selectedClient,
      vehiculo: selectedVehicle,
      servicio: selectedService,
      fecha: selectedDate,
      hora: selectedSlot,
      estado: estado,
      fechaOriginal: selectedDate,
      fechaISOString: selectedDate ? new Date(selectedDate).toISOString() : null
    });
    
    // Verificación de campos obligatorios
    const camposFaltantes = {
      cliente: !selectedClient,
      vehiculo: !selectedVehicle,
      servicio: !selectedService,
      fecha: !selectedDate,
      hora: !selectedSlot
    };
    
    const faltanCampos = Object.values(camposFaltantes).some(Boolean);
    
    if (faltanCampos) {
      console.error("Validación fallida - Campos faltantes:", camposFaltantes);
      
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor complete todos los campos obligatorios"
      });
      return;
    }
    
    // Verificar que el vehículo seleccionado exista en la lista filtrada
    const vehiculoEncontrado = filteredVehicles.find(v => 
      (v.id_uuid && v.id_uuid === selectedVehicle) || v.id === selectedVehicle
    );
    
    if (!vehiculoEncontrado) {
      console.error("Error crítico: El vehículo seleccionado no existe en la lista filtrada", {
        selectedVehicle,
        vehiculosDisponibles: filteredVehicles.map(v => ({ 
          id: v.id, 
          id_uuid: v.id_uuid,
          make: v.make, 
          model: v.model 
        }))
      });
      
      toast({
        variant: "destructive",
        title: "Error de selección",
        description: "El vehículo seleccionado no es válido. Por favor, seleccione nuevamente."
      });
      return;
    }
    
    console.log("Vehículo verificado correctamente:", {
      id: vehiculoEncontrado.id,
      id_uuid: vehiculoEncontrado.id_uuid,
      make: vehiculoEncontrado.make,
      model: vehiculoEncontrado.model
    });
    
    setIsSubmitting(true);
    
    try {
      // Usamos el ID verificado del vehículo
      const appointmentData = {
        client_id: selectedClient,
        vehicle_id: selectedVehicle, // ID que ya verificamos
        service_id: selectedService,
        appointment_date: selectedDate,
        dealership_id: verifiedDataToken?.dealership_id || '6b58f82d-baa6-44ce-9941-1a61975d20b5',
        appointment_time: selectedSlot,
        status: estado,
        notes: notas,
        channel: 'manual' // Siempre enviar manual desde el backoffice
      };
      
      console.log("Datos finales a insertar:", appointmentData);
      console.log("Fecha formateada que se envía a la BD:", appointmentData.appointment_date);
      
      const { data, error } = await supabase
        .from('appointment')
        .insert([appointmentData])
        .select();

      if (error) {
        console.error("Error detallado de Supabase:", {
          mensaje: error.message,
          detalles: error.details,
          codigo: error.code,
          hint: error.hint
        });
        throw error;
      }
      
      console.log("Cita creada con éxito:", data);
      
      toast({
        title: "Cita agendada",
        description: "La cita se ha creado exitosamente"
      });
      router.replace('/backoffice/citas?token=' + token);
      
    } catch (error) {
      console.error("Error completo al agendar cita:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al agendar la cita"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modificar la función que se llama cuando se selecciona un cliente
  const handleClientSelection = async (clientId: string) => {
    console.log('Cliente seleccionado:', clientId);
    setSelectedClient(clientId);
    setSelectedVehicle(''); // Resetear vehículo seleccionado
    
    // Si no hay ID de cliente, limpiar vehículos
    if (!clientId) {
      setFilteredVehicles([]);
      return;
    }
    
    // Cargar vehículos específicamente para este cliente
    try {
      // Primero mostrar un toast de carga
      toast({
        title: "Cargando vehículos",
        description: "Obteniendo vehículos del cliente...",
        duration: 2000,
      });
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .order('make, model');
        
      if (error) throw error;
      
      console.log('Vehículos disponibles para el cliente:', data);
      
      // Verificar si los vehículos tienen el formato correcto
      const vehiculosValidados = data ? data.map(vehiculo => {
        console.log(`Vehículo cargado: ID=${vehiculo.id}, Make=${vehiculo.make}, Model=${vehiculo.model}`);
        return vehiculo;
      }) : [];
      
      setFilteredVehicles(vehiculosValidados);
      
      if (!vehiculosValidados || vehiculosValidados.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin vehículos",
          description: "Este cliente no tiene vehículos registrados. Por favor, registre un vehículo primero."
        });
      } else {
        toast({
          title: "Vehículos cargados",
          description: `${vehiculosValidados.length} vehículo(s) disponible(s)`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los vehículos del cliente"
      });
    }
  };

  // Función auxiliar para garantizar consistencia en los IDs
  const ensureConsistentId = (vehicle: any) => {
    // Si tiene id_uuid, usar ese
    if (vehicle && vehicle.id_uuid) return vehicle.id_uuid;
    // De lo contrario usar id regular
    if (vehicle && vehicle.id) return vehicle.id;
    // Si es un string, asumir que ya es un ID
    if (typeof vehicle === 'string') return vehicle;
    // Por defecto retornar undefined
    return undefined;
  };

  // Hacer foco solo cuando el dropdown se abre
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  return (
    <div className="container mx-auto py-6 px-2 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Nueva Cita</h1>
        
        <div className="space-y-6">
          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="cliente" className="text-right col-span-1">Cliente</Label>
            <div className="col-span-11">
              <ClienteComboBox
                clientes={clientes}
                onSelect={handleClientSelection}
                value={selectedClient}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="vehiculo" className="text-right col-span-1">Vehículo</Label>
            <div className="col-span-11">
              <Select 
                value={selectedVehicle || ''} 
                onValueChange={(value) => {
                  console.log("Vehículo seleccionado - ID recibido:", value);
                  setSelectedVehicle(value);
                }}
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
                  {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((vehiculo) => (
                      <SelectItem 
                        key={vehiculo.id_uuid || vehiculo.id} 
                        value={vehiculo.id_uuid || vehiculo.id}
                      >
                        {`${vehiculo.make} ${vehiculo.model}${vehiculo.license_plate ? ` (${vehiculo.license_plate})` : ''}`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      {selectedClient ? "No hay vehículos asociados a este cliente" : "Seleccione un cliente primero"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="servicio" className="text-right col-span-1">Servicio</Label>
            <div className="col-span-11">
              <ServiceComboBox
                servicios={servicios}
                onSelect={setSelectedService}
                value={selectedService}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 items-start gap-4">
            <Label className="text-right col-span-1 pt-4">Fecha y Hora</Label>
            <div className="col-span-11">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <AppointmentCalendar
                  selectedDate={selectedDate ? stringToSafeDate(selectedDate) : new Date()}
                  onSelect={(date) => handleSelectDate(date)}
                  blockedDates={blockedDates.map(date => ({
                    ...date,
                    start_time: date.start_time || undefined,
                    end_time: date.end_time || undefined
                  }))}
                  operatingHours={operatingHours}
                  turnDuration={tallerConfig?.shift_duration || 30}
                  appointments={appointments}
                  onTimeSlotSelect={(slot) => {
                    console.log('Slot seleccionado en el componente padre:', slot);
                    setSelectedSlot(slot.time);
                  }}
                  selectedService={selectedService ? {
                    id: selectedService,
                    service_name: servicios.find(s => 
                      s.id === selectedService || 
                      s.id_uuid === selectedService
                    )?.service_name || '',
                    duration_minutes: servicios.find(s => 
                      s.id === selectedService || 
                      s.id_uuid === selectedService
                    )?.duration_minutes || tallerConfig?.shift_duration || 30
                  } : undefined}
                  dealershipId={verifiedDataToken?.dealership_id}
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
                onValueChange={(value: string) => setEstado(value as 'pending' | 'in_progress' | 'completed' | 'cancelled')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
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

        {/* Nueva sección de resumen de la cita */}
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-medium mb-3">Resumen de la cita</h2>
          <div className="bg-blue-50 p-4 rounded-md text-sm">
            <div className="space-y-2">
              <div className="grid grid-cols-2">
                <span className="font-medium">Cliente:</span>
                <span>{selectedClientText || 'No seleccionado'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-medium">Vehículo:</span>
                <span>{selectedVehicleText || 'No seleccionado'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-medium">Servicio:</span>
                <span>{selectedServiceText || 'No seleccionado'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-medium">Fecha:</span>
                <span>{selectedDate || 'No seleccionada'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-medium">Horario:</span>
                <span>{selectedSlot || 'No seleccionado'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-medium">Estado:</span>
                <span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    estado === 'pending' ? 'bg-blue-100 text-blue-800' :
                    estado === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    estado === 'completed' ? 'bg-green-100 text-green-800' :
                    estado === 'cancelled' ? 'bg-red-100 text-red-800' :
                    estado === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {traducirEstado(estado)}
                  </span>
                </span>
              </div>
              {notas && (
                <div className="grid grid-cols-2">
                  <span className="font-medium">Notas:</span>
                  <span className="break-words">{notas}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón de acción */}
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
