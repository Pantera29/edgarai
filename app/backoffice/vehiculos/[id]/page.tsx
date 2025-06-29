"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBaseUrl } from "@/lib/utils"
import { verifyToken } from '../../../jwt/token'
import { toast } from "@/components/ui/use-toast"
import { carBrands } from "@/lib/car-brands"
import { useClientSearch } from '@/hooks/useClientSearch'
import React from 'react'

interface Cliente {
  id: string;
  names: string;
  phone_number: string;
}

interface VehicleMake {
  id: string;
  name: string;
}

interface DealershipBrand {
  make_id: string;
  vehicle_makes: VehicleMake;
}

interface PageProps {
  params: {
    id: string;
  };
}

function ClienteComboBox({
  value,
  onSelect,
  clients,
  loading,
  error,
  searchClients,
  addSelectedClient,
  getClientById
}: {
  value: string;
  onSelect: (id: string) => void;
  clients: any[];
  loading: boolean;
  error: string | null;
  searchClients: (query: string) => void;
  addSelectedClient: (client: any) => void;
  getClientById: (id: string) => any;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const selectedClient = getClientById(value);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    searchClients(newSearch);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      addSelectedClient(client);
      onSelect(clientId);
      setOpen(false);
      setSearch('');
    }
  };

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
            placeholder="Buscar cliente por nombre..."
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

export default function EditarVehiculoPage({ params }: PageProps) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<{dealership_id?: string}>({});
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcasPermitidas, setMarcasPermitidas] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    last_km: 0,
    vin: ""
  });

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Obtener y verificar token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      const tokenValue = params.get("token");
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [router]);

  // Nuevo efecto para cargar las marcas permitidas
  useEffect(() => {
    const cargarMarcasPermitidas = async () => {
      if (!dataToken.dealership_id) return;

      try {
        const { data: marcas, error } = await supabase
          .from('dealership_brands')
          .select(`
            make_id,
            vehicle_makes!inner (
              id,
              name
            )
          `)
          .eq('dealership_id', dataToken.dealership_id);

        if (error) {
          console.error('Error cargando marcas permitidas:', error);
          return;
        }

        // Si no hay marcas configuradas, permitir todas
        if (!marcas || marcas.length === 0) {
          setMarcasPermitidas(carBrands);
        } else {
          const marcasArray = marcas as unknown as DealershipBrand[];
          setMarcasPermitidas(marcasArray.map(m => m.vehicle_makes.name));
        }
      } catch (error) {
        console.error('Error al cargar marcas permitidas:', error);
        setMarcasPermitidas(carBrands); // Por defecto, mostrar todas las marcas
      }
    };

    cargarMarcasPermitidas();
  }, [dataToken.dealership_id, supabase]);

  // Hook para búsqueda de clientes
  const {
    clients,
    loading: clientLoading,
    error: clientError,
    searchClients,
    addSelectedClient,
    getClientById
  } = useClientSearch(dataToken.dealership_id || '');

  // Cargar datos del vehículo
  useEffect(() => {
    const cargarVehiculo = async () => {
      try {
        const { data: vehiculo, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id_uuid', params.id)
          .single();

        if (error) throw error;
        if (vehiculo) {
          setFormData({
            client_id: vehiculo.client_id,
            make: vehiculo.make,
            model: vehiculo.model,
            year: vehiculo.year,
            license_plate: vehiculo.license_plate,
            last_km: vehiculo.last_km || 0,
            vin: vehiculo.vin || ""
          });
          // Buscar y agregar el cliente propietario al hook para que aparezca seleccionado
          if (vehiculo.client_id) {
            const { data: cliente } = await supabase
              .from('client')
              .select('id, names, phone_number')
              .eq('id', vehiculo.client_id)
              .single();
            if (cliente) {
              addSelectedClient(cliente);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar vehículo:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información del vehículo",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      cargarVehiculo();
    }
  }, [params.id, supabase, addSelectedClient]);

  // Cargar clientes de la agencia
  useEffect(() => {
    const cargarClientes = async () => {
      if (!dataToken.dealership_id) return;
      
      try {
        const { data, error } = await supabase
          .from('client')
          .select('id, names, phone_number')
          .eq('dealership_id', dataToken.dealership_id)
          .order('names');

        if (error) throw error;
        setClientes(data || []);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    };

    cargarClientes();
  }, [dataToken.dealership_id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validaciones
      if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
        toast({
          title: "Error",
          description: "El año debe estar entre 1900 y el año siguiente",
          variant: "destructive"
        });
        return;
      }

      if (formData.last_km < 0) {
        toast({
          title: "Error",
          description: "El kilometraje no puede ser negativo",
          variant: "destructive"
        });
        return;
      }

      if (formData.license_plate.length < 5 || formData.license_plate.length > 8) {
        toast({
          title: "Error",
          description: "La placa debe tener entre 5 y 8 caracteres",
          variant: "destructive"
        });
        return;
      }

      // Validación mejorada para el VIN
      if (formData.vin) {
        if (formData.vin.length !== 17) {
          toast({
            title: "Error",
            description: "El VIN debe tener exactamente 17 caracteres",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar que no contenga I, O o Q
        if (/[IOQ]/i.test(formData.vin)) {
          toast({
            title: "Error",
            description: "El VIN no puede contener las letras I, O o Q",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar que solo contenga letras y números permitidos
        if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(formData.vin)) {
          toast({
            title: "Error",
            description: "El VIN solo puede contener letras (A-Z, excepto I, O, Q) y números (0-9)",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar que el primer carácter sea M para vehículos fabricados en México
        if (formData.vin.charAt(0) !== 'M') {
          toast({
            title: "Advertencia",
            description: "El primer carácter del VIN debería ser 'M' para vehículos fabricados en México",
            variant: "default"
          });
          // No bloqueamos el envío, solo mostramos una advertencia
        }
      }

      if (!formData.make.trim()) {
        toast({
          title: "Error",
          description: "La marca es requerida",
          variant: "destructive"
        });
        return;
      }

      if (!formData.model.trim()) {
        toast({
          title: "Error",
          description: "El modelo es requerido",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('vehicles')
        .update({
          client_id: formData.client_id,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          license_plate: formData.license_plate,
          last_km: formData.last_km,
          vin: formData.vin,
          dealership_id: dataToken.dealership_id
        })
        .eq('id_uuid', params.id)
        .eq('dealership_id', dataToken.dealership_id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Vehículo actualizado correctamente"
      });

      router.push(`/backoffice/vehiculos?token=${token}`);
    } catch (error) {
      console.error('Error al actualizar vehículo:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el vehículo",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Editar Vehículo</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="cliente">Propietario</Label>
          <ClienteComboBox
            value={formData.client_id}
            onSelect={(id) => setFormData({ ...formData, client_id: id })}
            clients={clients}
            loading={clientLoading}
            error={clientError}
            searchClients={searchClients}
            addSelectedClient={addSelectedClient}
            getClientById={getClientById}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="make">Marca</Label>
          <Select
            value={formData.make}
            onValueChange={(value) => setFormData({ ...formData, make: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar marca" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {marcasPermitidas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Año</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="license_plate">Placa</Label>
          <Input
            id="license_plate"
            value={formData.license_plate}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vin">VIN</Label>
          <Input
            id="vin"
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
            placeholder="17 caracteres alfanuméricos"
            maxLength={17}
          />
          <p className="text-xs text-muted-foreground">
            El VIN debe tener 17 caracteres. No puede contener las letras I, O o Q. 
            Para vehículos fabricados en México, debe comenzar con 'M'.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_km">Kilometraje</Label>
          <Input
            id="last_km"
            type="number"
            value={formData.last_km}
            onChange={(e) => setFormData({ ...formData, last_km: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="flex space-x-4">
          <Button type="submit">Guardar Cambios</Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push(`/backoffice/vehiculos?token=${token}`)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
} 