"use client"; // Asegura que el componente se renderice en el cliente

import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
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
import { sendAppointmentConfirmationSMS } from "@/lib/sms";
import { Switch } from "@/components/ui/switch";
import { useClientSearch } from "@/hooks/useClientSearch";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

// Extender la interfaz Vehicle para incluir las propiedades adicionales
interface ExtendedVehicle extends Vehicle {
  id_uuid?: string;
  client?: {
    id: string;
    names?: string;
  };
  model_id?: string; // <-- Agregado para que TypeScript acepte el campo
  vin?: string; // <-- Agregado para incluir el VIN del vehículo
  year?: number; // <-- Agregado para el año del vehículo
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

// Interfaz para workshop
interface Workshop {
  id: string;
  name: string;
  is_main: boolean;
  dealership_id: string;
  address?: string;
  city?: string;
  phone?: string;
  location_url?: string;
  is_active: boolean;
}

// Interfaz para el tipo de appointment
interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_id: string;
  service_id: string;
  notes?: string | null;
  completion_notes?: string | null;
  client?: {
    names: string;
  } | Array<{
    names: string;
  }>;
  services?: {
    service_name: string;
    duration_minutes: number;
  } | Array<{
    service_name: string;
    duration_minutes: number;
  }>;
}

// Función para traducir estados de inglés a español
const traducirEstado = (estado: string | null): string => {
  if (!estado) return 'Desconocido';
  
  const traducciones: Record<string, string> = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmada',
    'in_progress': 'En proceso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'rescheduled': 'Reagendada'
  };
  
  return traducciones[estado] || estado;
};

// Componente mejorado para el combobox de clientes con búsqueda server-side
function ClienteComboBox({ 
  dealershipId, 
  onSelect, 
  value 
}: { 
  dealershipId: string;
  onSelect: (id: string) => void; 
  value: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);
  
  // Usar el hook personalizado para búsqueda de clientes
  const { 
    clients, 
    loading, 
    error, 
    searchClients, 
    addSelectedClient, 
    getClientById 
  } = useClientSearch(dealershipId);

  // Buscar el cliente seleccionado
  const selectedClient = getClientById(value);

  // Manejar cambios en la búsqueda
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    searchClients(newSearch);
  };

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      addSelectedClient(client);
      onSelect(clientId);
      setOpen(false);
      setSearch('');
    }
  };

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

  // Cargar clientes seleccionados previamente al abrir
  React.useEffect(() => {
    if (open && selectedClient) {
      addSelectedClient(selectedClient);
    }
  }, [open, selectedClient, addSelectedClient]);

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
            placeholder="Buscar cliente por nombre o teléfono..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {loading ? (
              <li className="px-3 py-2 text-gray-500 text-center">
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600 mr-2"></div>
                  Buscando...
                </div>
              </li>
            ) : error ? (
              <li className="px-3 py-2 text-red-500 text-center">
                Error: {error}
              </li>
            ) : clients.length > 0 ? (
              clients.map((cliente) => (
                <li
                  key={cliente.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === cliente.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => handleClientSelect(cliente.id)}
                >
                  {cliente.names} ({cliente.phone_number})
                </li>
              ))
            ) : search.trim() ? (
              <li className="px-3 py-2 text-gray-400 text-center">
                No se encontraron clientes
              </li>
            ) : (
              <li className="px-3 py-2 text-gray-400 text-center">
                Escribe para buscar clientes
              </li>
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
        {selectedService ? (
          <div>
            <span className="font-medium">
              {selectedService.service_name} ({selectedService.duration_minutes} min)
            </span>
            {selectedService.description && (
              <span className="text-gray-500"> - {selectedService.description}</span>
            )}
          </div>
        ) : (
          "Selecciona un servicio..."
        )}
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
                  <span className="font-medium">
                    {servicio.service_name} ({servicio.duration_minutes} min)
                  </span>
                  {servicio.description && (
                    <span className="text-gray-500"> - {servicio.description}</span>
                  )}
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

// Componente para seleccionar mecánicos de forma similar al ServiceComboBox
function MechanicComboBox({ mechanics, onSelect, value, loading }: { mechanics: any[], onSelect: (id: string) => void, value: string, loading: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Buscar el mecánico seleccionado
  const selectedMechanic = mechanics.find(m => m.id === value);

  // Filtrar mecánicos por búsqueda de nombre
  const filtered = search.trim() === ''
    ? mechanics
    : mechanics.filter(mechanic =>
        mechanic.name.toLowerCase().includes(search.toLowerCase())
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
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600 mr-2"></div>
            Cargando mecánicos...
          </div>
        ) : selectedMechanic ? (
          <div>
            <span className="font-medium">{selectedMechanic.name}</span>
            {selectedMechanic.specialties && selectedMechanic.specialties.length > 0 && (
              <span className="text-gray-500"> - {selectedMechanic.specialties.join(', ')}</span>
            )}
          </div>
        ) : (
          "Selecciona un mecánico (opcional)"
        )}
      </button>
      {open && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-3 py-2 border-b outline-none bg-white text-black"
            placeholder="Buscar mecánico por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((mechanic) => (
                <li
                  key={mechanic.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === mechanic.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => {
                    onSelect(mechanic.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <div>
                    <span className="font-medium">{mechanic.name}</span>
                    {mechanic.specialties && mechanic.specialties.length > 0 && (
                      <span className="text-gray-500"> - {mechanic.specialties.join(', ')}</span>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">No se encontraron mecánicos</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Componente para seleccionar servicios específicos de forma similar al ServiceComboBox
function SpecificServiceComboBox({ specificServices, onSelect, value }: { specificServices: any[], onSelect: (id: string) => void, value: string }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Buscar el servicio específico seleccionado
  const selectedSpecific = specificServices.find(s => s.id === value);

  // Filtrar servicios específicos por búsqueda de nombre
  const filtered = search.trim() === ''
    ? specificServices
    : specificServices.filter(ss =>
        ss.service_name.toLowerCase().includes(search.toLowerCase())
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
        {selectedSpecific ? (
          <span className="font-medium">
            {selectedSpecific.service_name}
            {selectedSpecific.kilometers ? ` - ${selectedSpecific.kilometers} km` : ''}
            {selectedSpecific.months ? ` - ${selectedSpecific.months} meses` : ''}
          </span>
        ) : (
          "Seleccione un servicio específico (opcional)"
        )}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-3 py-2 border-b outline-none bg-white text-black"
            placeholder="Buscar servicio específico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((ss) => (
                <li
                  key={ss.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === ss.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => {
                    onSelect(ss.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="font-medium">
                    {ss.service_name}
                    {ss.kilometers ? ` - ${ss.kilometers} km` : ''}
                    {ss.months ? ` - ${ss.months} meses` : ''}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">No se encontraron servicios específicos</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// 🆕 Modal para crear cliente rápido
function QuickCreateClientModal({ 
  isOpen, 
  onClose, 
  onClientCreated, 
  dealershipId, 
  token 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (clientId: string, clientData: ExtendedClient) => void;
  dealershipId: string;
  token: string;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    names: '',
    phone_number: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({
    names: '',
    phone_number: '',
    email: ''
  });

  // Reset form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({ names: '', phone_number: '', email: '' });
      setFormErrors({ names: '', phone_number: '', email: '' });
    }
  }, [isOpen]);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return 'El teléfono debe tener 10 dígitos';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email) return ''; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email inválido';
    }
    return '';
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo al escribir
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const errors = {
      names: formData.names.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres' : '',
      phone_number: validatePhone(formData.phone_number),
      email: validateEmail(formData.email)
    };

    setFormErrors(errors);

    if (errors.names || errors.phone_number || errors.email) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          names: formData.names.trim(),
          phone_number: formData.phone_number.replace(/\D/g, ''),
          email: formData.email.trim() || undefined,
          dealership_id: dealershipId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Error al crear el cliente"
        });
        setIsSubmitting(false);
        return;
      }

      // El endpoint devuelve { client: {...} }
      const clientData = result.client;
      
      // Crear objeto cliente para pasar al callback
      const newClient: ExtendedClient = {
        id: clientData.id,
        names: clientData.names,
        phone_number: clientData.phone_number,
        email: clientData.email || ''
      };

      toast({
        title: "Cliente creado",
        description: `${newClient.names} ha sido creado exitosamente`
      });

      onClientCreated(clientData.id, newClient);
      onClose();

    } catch (error) {
      console.error('Error al crear cliente:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al crear el cliente"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Complete los datos básicos del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-names">Nombre *</Label>
            <Input
              id="quick-names"
              value={formData.names}
              onChange={(e) => handleChange('names', e.target.value)}
              placeholder="Juan Pérez"
              disabled={isSubmitting}
            />
            {formErrors.names && (
              <p className="text-sm text-red-500">{formErrors.names}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-phone">Teléfono *</Label>
            <Input
              id="quick-phone"
              value={formData.phone_number}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '');
                if (cleaned.length <= 10) {
                  handleChange('phone_number', cleaned);
                }
              }}
              placeholder="5512345678"
              maxLength={10}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Formato: 10 dígitos sin espacios</p>
            {formErrors.phone_number && (
              <p className="text-sm text-red-500">{formErrors.phone_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-email">Email (opcional)</Label>
            <Input
              id="quick-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="juan@example.com"
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <p className="text-sm text-red-500">{formErrors.email}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 🆕 Modal para crear vehículo rápido
function QuickCreateVehicleModal({ 
  isOpen, 
  onClose, 
  onVehicleCreated, 
  clientId,
  dealershipId, 
  token 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onVehicleCreated: (vehicleId: string, vehicleData: ExtendedVehicle) => void;
  clientId: string;
  dealershipId: string;
  token: string;
}) {
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [makes, setMakes] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    make: '',
    model_id: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    make: '',
    model_id: '',
    year: '',
    vin: ''
  });

  // Reset form y cargar marcas cuando se abre el modal
  useEffect(() => {
    if (isOpen && dealershipId) {
      setFormData({
        make: '',
        model_id: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: ''
      });
      setFormErrors({ make: '', model_id: '', year: '', vin: '' });
      setModels([]);
      loadMakes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dealershipId]);

  const loadMakes = async () => {
    if (!dealershipId) {
      console.error('❌ No hay dealershipId para cargar marcas');
      return;
    }
    
    setLoadingMakes(true);
    console.log('🚗 Cargando marcas para dealership:', dealershipId);
    
    try {
      // Cargar marcas permitidas para este dealership desde dealership_brands
      const { data: dealershipBrands, error: dbError } = await supabase
        .from('dealership_brands')
        .select('make_id')
        .eq('dealership_id', dealershipId);

      if (dbError) {
        console.error('Error en dealership_brands:', dbError);
        throw dbError;
      }

      console.log('Marcas del dealership:', dealershipBrands?.length || 0);
      const makeIds = dealershipBrands?.map(db => db.make_id) || [];

      if (makeIds.length === 0) {
        // Si no hay marcas específicas asignadas, cargar todas
        console.log('⚠️ No hay marcas asignadas al dealership, cargando todas...');
        const { data: allMakes, error: allError } = await supabase
          .from('vehicle_makes')
          .select('id, name')
          .order('name');

        if (allError) {
          console.error('Error cargando todas las marcas:', allError);
          throw allError;
        }
        
        console.log('✅ Marcas totales cargadas:', allMakes?.length || 0);
        setMakes(allMakes || []);
        
        if (!allMakes || allMakes.length === 0) {
          toast({
            variant: "destructive",
            title: "Sin marcas disponibles",
            description: "No hay marcas configuradas en el sistema. Contacta al administrador."
          });
        }
      } else {
        // Cargar solo las marcas asignadas al dealership
        console.log('Cargando marcas filtradas:', makeIds.length);
        const { data: filteredMakes, error: fmError } = await supabase
          .from('vehicle_makes')
          .select('id, name')
          .in('id', makeIds)
          .order('name');

        if (fmError) {
          console.error('Error cargando marcas filtradas:', fmError);
          throw fmError;
        }
        
        console.log('✅ Marcas filtradas cargadas:', filteredMakes?.length || 0);
        setMakes(filteredMakes || []);
      }
    } catch (error) {
      console.error('❌ Error cargando marcas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar las marcas disponibles. Verifica tu conexión."
      });
      setMakes([]);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (makeId: string) => {
    setLoadingModels(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select('id, name')
        .eq('make_id', makeId)
        .order('name');

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error cargando modelos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los modelos"
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleMakeChange = (makeId: string) => {
    setFormData(prev => ({ ...prev, make: makeId, model_id: '' }));
    setFormErrors(prev => ({ ...prev, make: '', model_id: '' }));
    setModels([]);
    if (makeId) {
      loadModels(makeId);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateVin = (vin: string) => {
    if (!vin) return ''; // VIN es opcional
    if (vin.length !== 17) {
      return 'El VIN debe tener exactamente 17 caracteres';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const currentYear = new Date().getFullYear();
    const errors = {
      make: !formData.make ? 'Debe seleccionar una marca' : '',
      model_id: !formData.model_id ? 'Debe seleccionar un modelo' : '',
      year: formData.year < 1900 || formData.year > currentYear + 1 
        ? `El año debe estar entre 1900 y ${currentYear + 1}` 
        : '',
      vin: validateVin(formData.vin)
    };

    setFormErrors(errors);

    if (errors.make || errors.model_id || errors.year || errors.vin) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Obtener el nombre del modelo seleccionado
      const selectedModel = models.find(m => m.id === formData.model_id);
      if (!selectedModel) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Modelo seleccionado no válido"
        });
        setIsSubmitting(false);
        return;
      }

      // Obtener el nombre de la marca seleccionada
      const selectedMake = makes.find(m => m.id === formData.make);

      const response = await fetch('/api/vehicles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          make: selectedMake?.name || '',
          model: selectedModel.name,
          year: formData.year,
          license_plate: formData.license_plate.trim() || undefined,
          vin: formData.vin.trim() || undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Error al crear el vehículo"
        });
        setIsSubmitting(false);
        return;
      }

      // Crear objeto vehículo para pasar al callback
      const newVehicle: ExtendedVehicle = {
        id: result.id || result.vehicle?.id,
        id_uuid: result.id_uuid || result.vehicle?.id_uuid,
        client_id: clientId,
        make: selectedMake?.name || '',
        model: selectedModel.name,
        year: formData.year,
        license_plate: formData.license_plate.trim() || '',
        vin: formData.vin.trim() || '',
        model_id: formData.model_id
      };

      toast({
        title: "Vehículo creado",
        description: `${newVehicle.make} ${newVehicle.model} ha sido creado exitosamente`
      });

      onVehicleCreated(result.id || result.vehicle?.id, newVehicle);
      onClose();

    } catch (error) {
      console.error('Error al crear vehículo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al crear el vehículo"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Vehículo</DialogTitle>
          <DialogDescription>
            Complete los datos básicos del vehículo. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mostrar cliente asociado */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Cliente:</span> Se creará para el cliente seleccionado
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-make">Marca *</Label>
            <Select
              value={formData.make}
              onValueChange={handleMakeChange}
              disabled={isSubmitting || loadingMakes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingMakes ? "Cargando marcas..." : "Seleccionar marca"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {makes.map((make) => (
                  <SelectItem key={make.id} value={make.id}>
                    {make.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.make && (
              <p className="text-sm text-red-500">{formErrors.make}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-model">Modelo *</Label>
            <Select
              value={formData.model_id}
              onValueChange={(value) => handleChange('model_id', value)}
              disabled={isSubmitting || !formData.make || loadingModels}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.make 
                    ? "Primero seleccione una marca" 
                    : loadingModels 
                    ? "Cargando modelos..." 
                    : "Seleccionar modelo"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.model_id && (
              <p className="text-sm text-red-500">{formErrors.model_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-year">Año *</Label>
            <Input
              id="quick-year"
              type="number"
              value={formData.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value) || new Date().getFullYear())}
              min={1900}
              max={new Date().getFullYear() + 1}
              disabled={isSubmitting}
            />
            {formErrors.year && (
              <p className="text-sm text-red-500">{formErrors.year}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-plates">Placas (opcional)</Label>
            <Input
              id="quick-plates"
              value={formData.license_plate}
              onChange={(e) => handleChange('license_plate', e.target.value.toUpperCase())}
              placeholder="ABC1234"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-vin">VIN (opcional)</Label>
            <Input
              id="quick-vin"
              value={formData.vin}
              onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
              placeholder="17 caracteres alfanuméricos"
              maxLength={17}
              disabled={isSubmitting}
            />
            {formErrors.vin && (
              <p className="text-sm text-red-500">{formErrors.vin}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                "Crear Vehículo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NuevaReservaPage() {

  const [token, setToken] = useState<string>("");
  const [verifiedDataToken, setVerifiedDataToken] = useState<any>(null);
  const [tallerConfig, setTallerConfig] = useState<TallerConfig | null>(null);
  const [dealershipName, setDealershipName] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenValue = params.get("token"); // Obtiene el token de los query params
    if (tokenValue) {
      setToken(tokenValue); // Actualiza el estado con el token
      const verifiedData = verifyToken(tokenValue);
      
      if (
        !verifiedData ||
        typeof verifiedData !== "object" ||
        Object.keys(verifiedData).length === 0 ||
        !(verifiedData as any).dealership_id
      ) {
        router.push("/login");
        return;
      }
      setVerifiedDataToken(verifiedData);
      
      if (verifiedData.dealership_id) {
        // Cargar el nombre del concesionario
        loadDealershipInfo(verifiedData.dealership_id);
      }
    }
  }, [router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [vehiculos, setVehiculos] = useState<ExtendedVehicle[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [filteredVehicles, setFilteredVehicles] = useState<ExtendedVehicle[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('');
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [estado, setEstado] = useState<'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'>('pending');
  const [notas, setNotas] = useState('');
  const [servicios, setServicios] = useState<ExtendedService[]>([]);
  const [filteredServices, setFilteredServices] = useState<ExtendedService[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [operatingHours, setOperatingHours] = useState<HorarioOperacion[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(true); // Mantener el estado del diálogo abierto
  const supabase = createClientComponentClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [allowPastDates, setAllowPastDates] = useState(false);
  const [selectedClientData, setSelectedClientData] = useState<ExtendedClient | null>(null);

  // Estado para mecánicos
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<string>('');
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  // 🆕 Estados para los modales de creación rápida
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);

  // Hook para búsqueda de clientes
  const { getClientById, addSelectedClient } = useClientSearch(verifiedDataToken?.dealership_id || '');

  // Obtener el texto del cliente seleccionado
  const selectedClientText = React.useMemo(() => {
    if (!selectedClient || !selectedClientData) return "";
    return `${selectedClientData.names} (${selectedClientData.phone_number})`;
  }, [selectedClient, selectedClientData]);

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
    
    return `${vehicle.make} ${vehicle.model}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}${vehicle.vin ? ` - VIN: ${vehicle.vin}` : ''}`;
  }, [selectedVehicle, filteredVehicles]);

  // Obtener el texto del taller seleccionado
  const selectedWorkshopText = React.useMemo(() => {
    if (!selectedWorkshop) return "";
    
    const workshop = workshops.find(w => w.id === selectedWorkshop);
    if (!workshop) return "";
    
    return `${workshop.name}${workshop.is_main ? ' (Principal)' : ''}`;
  }, [selectedWorkshop, workshops]);

  // Obtener el texto del servicio seleccionado
  const selectedServiceText = React.useMemo(() => {
    console.log('Recalculando selectedServiceText. selectedService:', selectedService);
    console.log('Servicios disponibles:', filteredServices);
    
    if (!selectedService) return "";
    
    // Intentar encontrar el servicio tanto por id como por id_uuid
    const service = filteredServices.find(s => 
      s.id === selectedService || 
      s.id_uuid === selectedService
    );
    
    console.log('Servicio encontrado:', service);
    
    if (!service) return "";
    
    const text = `${service.service_name} (${service.duration_minutes} min)`;
    console.log('Texto del servicio seleccionado:', text);
    return text;
  }, [selectedService, filteredServices]);

  // Obtener el texto del mecánico seleccionado
  const selectedMechanicText = React.useMemo(() => {
    if (!selectedMechanic) return "";
    
    const mechanic = mechanics.find(m => m.id === selectedMechanic);
    if (!mechanic) return "";
    
    let text = mechanic.name;
    if (mechanic.specialties && mechanic.specialties.length > 0) {
      text += ` (${mechanic.specialties.join(', ')})`;
    }
    
    return text;
  }, [selectedMechanic, mechanics]);

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
        { data: vehiculosData, error: vehiculosError },
        { data: serviciosData, error: serviciosError },
        { data: workshopsData, error: workshopsError }
      ] = await Promise.all([
        supabase.from('vehicles').select('*').order('make, model').limit(100000), // Límite muy alto para prácticamente sin límite
        supabase.from('services').select('*').eq('dealership_id', verifiedDataToken.dealership_id).order('service_name'),
        supabase.from('workshops').select('*').eq('dealership_id', verifiedDataToken.dealership_id).eq('is_active', true).order('is_main', { ascending: false }).order('name')
      ]);

      if (vehiculosError) {
        throw vehiculosError;
      }
      if (serviciosError){
        throw serviciosError;
      } 
      if (workshopsError) {
        throw workshopsError;
      }
      
      console.log('Vehículos cargados:', vehiculosData?.length || 0);
      console.log('Servicios cargados:', serviciosData?.length || 0);
      console.log('Talleres cargados:', workshopsData?.length || 0);
      
      setVehiculos(vehiculosData || []);
      setServicios(serviciosData || []);
      setWorkshops(workshopsData || []);

      // Seleccionar taller principal por defecto si existe
      const mainWorkshop = workshopsData?.find(w => w.is_main);
      if (mainWorkshop) {
        setSelectedWorkshop(mainWorkshop.id);
        console.log('Taller principal seleccionado por defecto:', mainWorkshop.name);
      }
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
      console.log('Cargando citas con headers:', {
        'x-request-source': 'backoffice'
      });
      
      const response = await fetch(
        `/api/appointments/availability?date=${date}&service_id=${selectedService}&dealership_id=${verifiedDataToken?.dealership_id}&workshop_id=${selectedWorkshop}`,
        {
          headers: {
            'x-request-source': 'backoffice'
          }
        }
      );
      
      const data = await response.json();
      
      console.log('Respuesta del endpoint:', data);
      
      // Formatear los datos para que sean compatibles con el componente AppointmentCalendar
      const formattedAppointments = data?.map((app: Appointment) => {
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
      if (!verifiedDataToken?.dealership_id || !selectedWorkshop) {
        console.error('No se encontró dealership_id o workshop_id');
        return;
      }

      const { data, error } = await supabase
        .from('dealership_configuration')
        .select('*')
        .eq('dealership_id', verifiedDataToken.dealership_id)
        .eq('workshop_id', selectedWorkshop)
        .maybeSingle();

      if (error) {
        console.error('Error al cargar la configuración:', error);
        return;
      }

      setTallerConfig(data || {
        dealership_id: verifiedDataToken.dealership_id,
        workshop_id: selectedWorkshop,
        shift_duration: 30,
        timezone: 'America/Mexico_City'
      });
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
    }
  };

  // Efecto para cargar configuración cuando cambia el taller seleccionado
  useEffect(() => {
    if (selectedWorkshop) {
      loadConfig();
    }
  }, [selectedWorkshop]);

  // Efecto para cargar mecánicos cuando cambia el taller seleccionado
  useEffect(() => {
    if (selectedWorkshop) {
      loadMechanics(selectedWorkshop);
    } else {
      setMechanics([]);
      setSelectedMechanic('');
    }
  }, [selectedWorkshop]);

  // Efecto para filtrar servicios cuando cambia el taller seleccionado
  useEffect(() => {
    if (!selectedWorkshop) {
      setFilteredServices([]);
      setSelectedService('');
      return;
    }

    // Filtrar servicios que están disponibles en el taller seleccionado
    const filterServicesByWorkshop = async () => {
      try {
        const { data: workshopServices, error } = await supabase
          .from('workshop_services')
          .select('service_id, is_available')
          .eq('workshop_id', selectedWorkshop)
          .eq('is_available', true);

        if (error) {
          console.error('Error al cargar servicios del taller:', error);
          // Si hay error, mostrar todos los servicios como fallback
          setFilteredServices(servicios);
          return;
        }

        if (workshopServices && workshopServices.length > 0) {
          const availableServiceIds = workshopServices.map(ws => ws.service_id);
          const filtered = servicios.filter(service => 
            availableServiceIds.includes(service.id_uuid || service.id)
          );
          setFilteredServices(filtered);
          console.log(`Servicios disponibles para el taller: ${filtered.length}`);
        } else {
          // Si no hay servicios asignados específicamente, mostrar todos los servicios
          setFilteredServices(servicios);
          console.log('No hay servicios específicos asignados al taller, mostrando todos');
        }

        // Resetear servicio seleccionado si no está disponible en el nuevo taller
        if (selectedService) {
          const isServiceAvailable = filteredServices.some(service => 
            (service.id_uuid || service.id) === selectedService
          );
          if (!isServiceAvailable) {
            setSelectedService('');
          }
        }
      } catch (error) {
        console.error('Error al filtrar servicios por taller:', error);
        setFilteredServices(servicios);
      }
    };

    filterServicesByWorkshop();
  }, [selectedWorkshop, servicios]);

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
      const service = filteredServices.find(s => s.id === selectedService);
      if (service) {
        console.log('Servicio encontrado por id:', service);
      } else {
        // Intentar buscar por otras propiedades si existe alguna confusión con los campos
        console.log('Buscando servicio por otras propiedades...');
        const serviceById = filteredServices.find(s => String(s.id) === String(selectedService));
        const serviceByUuid = filteredServices.find(s => s.id_uuid === selectedService);
        console.log('Por id convertido a string:', serviceById);
        console.log('Por id_uuid:', serviceByUuid);
      }
    }
  }, [selectedService, filteredServices]);

  // Estado para specific services
  const [specificServices, setSpecificServices] = useState<any[]>([]);
  const [selectedSpecificService, setSelectedSpecificService] = useState<string>('');
  const [loadingSpecificServices, setLoadingSpecificServices] = useState(false);

  // Efecto para cargar specific services cuando cambia vehículo
  useEffect(() => {
    const fetchSpecificServices = async () => {
      setSpecificServices([]);
      setSelectedSpecificService('');
      if (!selectedVehicle || !verifiedDataToken?.dealership_id) return;
      // Buscar el vehículo seleccionado para obtener el model_id
      const vehiculo = filteredVehicles.find(v => v.id === selectedVehicle || v.id_uuid === selectedVehicle);
      if (!vehiculo || !vehiculo.model_id) return;
      setLoadingSpecificServices(true);
      try {
        const res = await fetch(`/api/services/specific-by-model?model_id=${vehiculo.model_id}&dealership_id=${verifiedDataToken.dealership_id}`);
        const data = await res.json();
        if (data && Array.isArray(data.specific_services)) {
          setSpecificServices(data.specific_services);
        } else {
          setSpecificServices([]);
        }
      } catch (error) {
        console.log('❌ Error al cargar specific services:', error);
        setSpecificServices([]);
      } finally {
        setLoadingSpecificServices(false);
      }
    };
    fetchSpecificServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, verifiedDataToken?.dealership_id]);

  // Estado para removed_additional
  const [removedAdditional, setRemovedAdditional] = useState(false);

  // Resetear removedAdditional cuando cambia el specific service seleccionado
  useEffect(() => {
    const ss = specificServices.find(s => s.id === selectedSpecificService);
    if (ss && ss.includes_additional) {
      setRemovedAdditional(false); // Por default, incluir adicionales
    } else {
      setRemovedAdditional(false); // Oculto o no aplica, default false
    }
  }, [selectedSpecificService, specificServices]);

  // Función para cargar mecánicos del taller seleccionado
  const loadMechanics = async (workshopId: string) => {
    if (!workshopId || !verifiedDataToken?.dealership_id) {
      setMechanics([]);
      setSelectedMechanic('');
      return;
    }

    setLoadingMechanics(true);
    try {
      console.log('🔧 Cargando mecánicos para el taller:', workshopId);
      
      const response = await fetch(`/api/mechanics?workshop_id=${workshopId}&is_active=true`);
      
      if (!response.ok) {
        throw new Error('Error al cargar mecánicos');
      }
      
      const result = await response.json();
      const mechanicsData = result.data || [];
      
      console.log('🔧 Mecánicos cargados:', mechanicsData.length);
      setMechanics(mechanicsData);
      
      // Resetear mecánico seleccionado al cambiar de taller
      setSelectedMechanic('');
      
    } catch (error) {
      console.error('Error al cargar mecánicos:', error);
      setMechanics([]);
      setSelectedMechanic('');
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los mecánicos del taller"
      });
    } finally {
      setLoadingMechanics(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Valores al enviar:", {
      cliente: selectedClient,
      vehiculo: selectedVehicle,
      taller: selectedWorkshop,
      mecanico: selectedMechanic,
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
      taller: !selectedWorkshop,
      servicio: !selectedService,
      fecha: !selectedDate,
      hora: !selectedSlot
    };

    // Validación opcional: si hay mecánicos disponibles, sugerir seleccionar uno
    if (mechanics.length > 0 && !selectedMechanic) {
      console.log("⚠️ Advertencia: Hay mecánicos disponibles pero no se seleccionó ninguno");
      // No es un error crítico, solo una advertencia
    }
    
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
        vehicle_id: selectedVehicle,
        service_id: selectedService,
        appointment_date: selectedDate,
        dealership_id: verifiedDataToken?.dealership_id || '6b58f82d-baa6-44ce-9941-1a61975d20b5',
        workshop_id: selectedWorkshop,
        appointment_time: selectedSlot,
        status: estado,
        notes: notas,
        channel: 'manual',
        ...(selectedSpecificService ? { specific_service_id: selectedSpecificService } : {}),
        // Solo enviar removed_additional si el servicio tiene adicionales
        ...((selectedSpecificService && specificServices.find(s => s.id === selectedSpecificService)?.includes_additional)
          ? { removed_additional: removedAdditional } : {}),
        // Agregar mecánico asignado si se seleccionó uno
        ...(selectedMechanic ? { assigned_mechanic_id: selectedMechanic } : {})
      };
      
      console.log("Datos finales a enviar al endpoint:", appointmentData);
      console.log("🔍 [DEBUG] Token a enviar:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...'
      });
      
      // Usar el endpoint de la API en lugar de inserción directa
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // 🔍 Agregar token para trazabilidad
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();
      console.log("🔍 [DEBUG] Respuesta del endpoint:", {
        status: response.status,
        ok: response.ok,
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : []
      });

      if (!response.ok) {
        console.error("Error del endpoint:", result);
        
        // Mensaje de error por defecto
        let errorMessage = "Error al agendar la cita";
        
        // Si es un error de duplicación
        if (result.error && result.error.includes('23505')) {
          errorMessage = "Ya existe una cita para este vehículo en el horario seleccionado";
        } else if (result.message) {
          errorMessage = result.message;
        }
        
        // Mostrar el error en el frontend
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        
        setIsSubmitting(false);
        return;
      }
      
      console.log("Cita creada con éxito:", result.appointment);
      const data = result.appointment;

      // El endpoint de la API ya maneja el envío de SMS
      toast({
        title: "Cita agendada",
        description: "La cita se ha creado exitosamente"
      });
      
      // Redirigir al calendario de citas en vez de la lista
      router.replace('/backoffice/citas/calendario?token=' + token);
      
    } catch (error) {
      console.error("Error general:", error);
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

    // Obtener datos del cliente seleccionado
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('id, names, phone_number')
        .eq('id', clientId)
        .single();
      if (clientError) throw clientError;
      if (clientData) {
        setSelectedClientData({
          id: clientData.id,
          names: clientData.names,
          phone_number: clientData.phone_number,
          email: ""
        });
        console.log('Datos del cliente seleccionado:', clientData);
      }
    } catch (error) {
      console.error('Error obteniendo datos del cliente:', error);
    }

    // Si no hay ID de cliente, limpiar vehículos
    if (!clientId) {
      setFilteredVehicles([]);
      setSelectedClientData(null);
      return;
    }

    // Cargar vehículos específicamente para este cliente
    try {
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
      const vehiculosValidados = data ? data.map(vehiculo => {
        console.log(`Vehículo cargado: ID=${vehiculo.id}, Make=${vehiculo.make}, Model=${vehiculo.model}`);
        return vehiculo;
      }) : [];
      setFilteredVehicles(vehiculosValidados);
      if (vehiculosValidados.length > 0) {
        const primerVehiculo = vehiculosValidados[0];
        const idVehiculo = primerVehiculo.id_uuid || primerVehiculo.id;
        console.log("Pre-seleccionando vehículo por defecto:", {
          make: primerVehiculo.make,
          model: primerVehiculo.model,
          id: idVehiculo
        });
        setSelectedVehicle(idVehiculo);
        toast({
          title: "Vehículo seleccionado",
          description: `${primerVehiculo.make} ${primerVehiculo.model}`,
          duration: 3000
        });
      }
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

  // 🆕 Callback para cuando se crea un cliente nuevo desde el modal
  const handleClientCreated = async (clientId: string, clientData: ExtendedClient) => {
    console.log('✅ Cliente creado desde modal:', clientId, clientData);
    
    // 1. Agregar al cache del hook de búsqueda PRIMERO
    addSelectedClient(clientData);
    
    // 2. Esperar un tick para que React procese el estado del hook
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 3. Actualizar estado del cliente seleccionado
    setSelectedClient(clientId);
    setSelectedClientData(clientData);
    
    console.log('✅ Estado del cliente actualizado:', { clientId, clientData });
    
    // 4. Limpiar vehículos y cargar los del nuevo cliente (probablemente vacío)
    setFilteredVehicles([]);
    setSelectedVehicle('');
    
    // 5. Intentar cargar vehículos del nuevo cliente
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .order('make, model');
      
      if (error) throw error;
      
      console.log('Vehículos del nuevo cliente:', data?.length || 0);
      setFilteredVehicles(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "✅ Cliente creado",
          description: "Ahora puedes crear un vehículo para este cliente usando el botón [+]",
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error cargando vehículos del nuevo cliente:', error);
      // No mostramos error al usuario porque el cliente sí se creó
    }
  };

  // 🆕 Callback para cuando se crea un vehículo nuevo desde el modal
  const handleVehicleCreated = (vehicleId: string, vehicleData: ExtendedVehicle) => {
    console.log('Vehículo creado:', vehicleId, vehicleData);
    
    // Agregar a la lista de vehículos filtrados
    setFilteredVehicles(prev => [...prev, vehicleData]);
    
    // Seleccionar automáticamente el nuevo vehículo
    const idToSelect = vehicleData.id_uuid || vehicleData.id;
    setSelectedVehicle(idToSelect);
    
    toast({
      title: "¡Listo!",
      description: "Vehículo creado y seleccionado. Continúa con el resto del formulario.",
      duration: 3000
    });
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
            <div className="col-span-11 flex gap-2">
              <div className="flex-1">
                <ClienteComboBox
                  dealershipId={verifiedDataToken?.dealership_id || ''}
                  onSelect={handleClientSelection}
                  value={selectedClient}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowCreateClientModal(true)}
                title="Crear nuevo cliente"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="vehiculo" className="text-right col-span-1">Vehículo</Label>
            <div className="col-span-11 flex gap-2">
              <div className="flex-1">
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
                          {`${vehiculo.make} ${vehiculo.model}${vehiculo.license_plate ? ` (${vehiculo.license_plate})` : ''}${vehiculo.vin ? ` - VIN: ${vehiculo.vin}` : ''}`}
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (!selectedClient) {
                    toast({
                      variant: "destructive",
                      title: "Cliente requerido",
                      description: "Debe seleccionar un cliente antes de crear un vehículo"
                    });
                    return;
                  }
                  setShowCreateVehicleModal(true);
                }}
                disabled={!selectedClient}
                title={!selectedClient ? "Primero seleccione un cliente" : "Crear nuevo vehículo"}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="taller" className="text-right col-span-1">Taller</Label>
            <div className="col-span-11">
              <Select 
                value={selectedWorkshop || ''} 
                onValueChange={(value) => {
                  console.log("Taller seleccionado:", value);
                  setSelectedWorkshop(value);
                  setSelectedService(''); // Resetear servicio al cambiar taller
                }}
                disabled={!selectedVehicle}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedVehicle 
                      ? "Primero seleccione un vehículo" 
                      : "Seleccione un taller"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {workshops.length > 0 ? (
                    workshops.map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id}>
                        {workshop.name} {workshop.is_main && '(Principal)'}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No hay talleres disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Solo mostrar la sección de mecánico si hay mecánicos disponibles */}
          {mechanics.length > 0 && (
            <div className="grid grid-cols-12 items-center gap-4">
              <Label htmlFor="mecanico" className="text-right col-span-1">Mecánico</Label>
              <div className="col-span-11">
                {loadingMechanics ? (
                  <div className="text-sm text-muted-foreground">Cargando mecánicos...</div>
                ) : (
                  <MechanicComboBox
                    mechanics={mechanics}
                    onSelect={setSelectedMechanic}
                    value={selectedMechanic}
                    loading={loadingMechanics}
                  />
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="servicio" className="text-right col-span-1">Servicio</Label>
            <div className="col-span-11">
              <ServiceComboBox
                servicios={filteredServices}
                onSelect={setSelectedService}
                value={selectedService}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="specificService" className="text-right col-span-1">Servicio Específico</Label>
            <div className="col-span-11">
              {loadingSpecificServices ? (
                <div className="text-sm text-muted-foreground">Cargando servicios específicos...</div>
              ) : specificServices.length > 0 ? (
                <SpecificServiceComboBox
                  specificServices={specificServices}
                  onSelect={setSelectedSpecificService}
                  value={selectedSpecificService}
                />
              ) : (
                <div className="text-sm text-muted-foreground">No hay servicios específicos para este modelo</div>
              )}
            </div>
          </div>

          {selectedSpecificService && (() => {
            const ss = specificServices.find(s => s.id === selectedSpecificService);
            if (!ss || !ss.includes_additional) return null;
            return (
              <div className="grid grid-cols-12 items-center gap-4 mt-2">
                <Label htmlFor="switchAdicionales" className="text-right col-span-1">¿Incluir adicionales?</Label>
                <div className="col-span-11">
                  <Switch
                    id="switchAdicionales"
                    checked={!removedAdditional}
                    onCheckedChange={v => setRemovedAdditional(!v ? true : false)}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">{!removedAdditional ? 'Sí, incluir adicionales' : 'No, quitar adicionales'}</span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-12 items-center gap-4">
            <Label htmlFor="allowPastDates" className="text-right col-span-1">Permitir fechas pasadas</Label>
            <div className="col-span-11">
              <Switch
                checked={allowPastDates}
                onCheckedChange={setAllowPastDates}
                id="allowPastDates"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 items-start gap-4">
            <Label className="text-right col-span-1 pt-4">Fecha y Hora</Label>
            <div className="col-span-11">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <AppointmentCalendar
                  allowPastDates={allowPastDates}
                  selectedDate={selectedDate ? stringToSafeDate(selectedDate) : new Date()}
                  onSelect={(date) => handleSelectDate(date)}
                  blockedDates={blockedDates.map(date => ({
                    ...date,
                    start_time: date.start_time || undefined,
                    end_time: date.end_time || undefined
                  }))}
                  operatingHours={operatingHours.filter(h => h.workshop_id === selectedWorkshop)}
                  turnDuration={tallerConfig?.shift_duration || 30}
                  appointments={appointments}
                  onTimeSlotSelect={(slot) => {
                    console.log('Slot seleccionado en el componente padre:', slot);
                    setSelectedSlot(slot.time);
                  }}
                  selectedService={selectedService ? {
                    id: selectedService,
                    service_name: filteredServices.find(s => 
                      s.id === selectedService || 
                      s.id_uuid === selectedService
                    )?.service_name || '',
                    duration_minutes: filteredServices.find(s => 
                      s.id === selectedService || 
                      s.id_uuid === selectedService
                    )?.duration_minutes || tallerConfig?.shift_duration || 30
                  } : undefined}
                  dealershipId={verifiedDataToken?.dealership_id}
                  workshopId={selectedWorkshop}
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
                onValueChange={(value: string) => setEstado(value as 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
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
                <span className="font-medium">Taller:</span>
                <span>{selectedWorkshopText || 'No seleccionado'}</span>
              </div>
              {/* Solo mostrar mecánico en el resumen si hay uno seleccionado */}
              {selectedMechanic && (
                <div className="grid grid-cols-2">
                  <span className="font-medium">Mecánico:</span>
                  <span>{selectedMechanicText}</span>
                </div>
              )}
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
                    estado === 'confirmed' ? 'bg-green-100 text-green-800' :
                    estado === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    estado === 'completed' ? 'bg-green-100 text-green-800' :
                    estado === 'cancelled' ? 'bg-red-100 text-red-800' :
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
              {selectedSpecificService && specificServices.length > 0 && (() => {
                const ss = specificServices.find(s => s.id === selectedSpecificService);
                if (!ss) return null;
                return (
                  <>
                    <div className="grid grid-cols-2">
                      <span className="font-medium">Servicio Específico:</span>
                      <span>
                        {ss.service_name}
                        {ss.kilometers ? ` - ${ss.kilometers} km` : ''}
                        {ss.months ? ` - ${ss.months} meses` : ''}
                      </span>
                    </div>
                    {ss.includes_additional && (
                      <div className="grid grid-cols-2">
                        <span className="font-medium">Adicionales seleccionados:</span>
                        <span>{!removedAdditional ? 'Sí, incluir adicionales' : 'No, quitar adicionales'}</span>
                      </div>
                    )}
                  </>
                );
              })()}
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

      {/* 🆕 Modales de creación rápida */}
      <QuickCreateClientModal
        isOpen={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onClientCreated={handleClientCreated}
        dealershipId={verifiedDataToken?.dealership_id || ''}
        token={token}
      />

      <QuickCreateVehicleModal
        isOpen={showCreateVehicleModal}
        onClose={() => setShowCreateVehicleModal(false)}
        onVehicleCreated={handleVehicleCreated}
        clientId={selectedClient}
        dealershipId={verifiedDataToken?.dealership_id || ''}
        token={token}
      />
    </div>
  );
}
