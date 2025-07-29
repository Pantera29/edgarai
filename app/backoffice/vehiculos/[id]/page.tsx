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
import { useToast } from "@/hooks/use-toast"
import { carBrands } from "@/lib/car-brands"
import { useClientSearch } from '@/hooks/useClientSearch'
import { ModelComboBox } from "@/components/ModelComboBox"
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

interface VehicleModel {
  id: string;
  name: string;
  make_id: string;
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

export default function EditarVehiculoPage({ params }: PageProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<{dealership_id?: string}>({});
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcasPermitidas, setMarcasPermitidas] = useState<string[]>([]);
  const [marcasConId, setMarcasConId] = useState<VehicleMake[]>([]);
  const [modelosDisponibles, setModelosDisponibles] = useState<VehicleModel[]>([]);
  const [formData, setFormData] = useState({
    client_id: "",
    make: "",
    model_id: '', // ID del modelo seleccionado
    model_name: '', // Nombre para mostrar (opcional)
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

  // Efecto para cargar las marcas permitidas con IDs
  useEffect(() => {
    const cargarMarcasPermitidas = async () => {
      if (!dataToken.dealership_id) return;

      try {
        // Obtener marcas permitidas para el dealership (FILTRADO POR DEALERSHIP_ID)
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

        // IMPORTANTE: Si no hay marcas configuradas, cargar todas las marcas disponibles
        if (!marcas || marcas.length === 0) {
          const { data: todasMarcas, error: errorTodasMarcas } = await supabase
            .from('vehicle_makes')
            .select('id, name')
            .order('name');

          if (errorTodasMarcas) {
            console.error('Error cargando todas las marcas:', errorTodasMarcas);
            setMarcasPermitidas(carBrands); // Fallback a constante
            return;
          }

          setMarcasConId(todasMarcas || []);
          setMarcasPermitidas(todasMarcas?.map(m => m.name) || carBrands);
        } else {
          // Extraer marcas con IDs del dealership_brands
          const marcasArray = marcas as unknown as DealershipBrand[];
          const marcasConIdArray = marcasArray.map(m => m.vehicle_makes);
          setMarcasConId(marcasConIdArray);
          setMarcasPermitidas(marcasArray.map(m => m.vehicle_makes.name));
        }
      } catch (error) {
        console.error('Error al cargar marcas permitidas:', error);
        setMarcasPermitidas(carBrands); // Fallback
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
            model_id: vehiculo.model_id || '', // Usar model_id si existe
            model_name: vehiculo.model || '', // Usar model como nombre
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

  // Nuevo efecto para cargar modelos cuando cambia la marca
  useEffect(() => {
    const cargarModelos = async () => {
      if (!formData.make || !dataToken.dealership_id) {
        setModelosDisponibles([]);
        return;
      }

      // IMPORTANTE: Solo cargar modelos de marcas permitidas para el dealership
      try {
        // Encontrar el ID de la marca seleccionada
        const marcaSeleccionada = marcasConId.find(m => m.name === formData.make);
        if (!marcaSeleccionada) {
          console.error('Marca no encontrada:', formData.make);
          setModelosDisponibles([]);
          return;
        }

        // Cargar modelos de esa marca (ya filtrados por dealership via marcasConId)
        const { data: modelos, error } = await supabase
          .from('vehicle_models')
          .select('id, name, make_id')
          .eq('make_id', marcaSeleccionada.id)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error cargando modelos:', error);
          return;
        }

        setModelosDisponibles(modelos || []);
        
        // Limpiar modelo seleccionado si no está en nueva lista
        if (formData.model_id) {
          const modeloExiste = modelos?.find(m => m.id === formData.model_id);
          if (!modeloExiste) {
            setFormData(prev => ({ ...prev, model_id: '', model_name: '' }));
          }
        }
      } catch (error) {
        console.error('Error al cargar modelos:', error);
      }
    };

    cargarModelos();
  }, [formData.make, marcasConId, dataToken.dealership_id]);

  // Función para limpiar modelo al cambiar marca
  const handleMakeChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      make: value,
      model_id: '', // Limpiar modelo seleccionado
      model_name: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validaciones básicas
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
      }

      if (!formData.make.trim()) {
        toast({
          title: "Error",
          description: "La marca es requerida",
          variant: "destructive"
        });
        return;
      }

      if (!formData.model_id) {
        toast({
          title: "Error",
          description: "Debe seleccionar un modelo",
          variant: "destructive"
        });
        return;
      }

      // Obtener nombre del modelo seleccionado
      const modeloSeleccionado = modelosDisponibles.find(m => m.id === formData.model_id);
      if (!modeloSeleccionado) {
        toast({
          title: "Error", 
          description: "Modelo seleccionado no válido",
          variant: "destructive"
        });
        return;
      }

      // Preparar datos para el endpoint
      const vehicleData = {
        client_id: formData.client_id,
        make: formData.make,
        model: modeloSeleccionado.name, // Nombre del modelo
        year: formData.year,
        license_plate: formData.license_plate || undefined,
        vin: formData.vin || undefined,
        last_km: formData.last_km || undefined
      };

      console.log('Enviando actualización al endpoint:', vehicleData);

      // USAR ENDPOINT para actualización
      const response = await fetch(`/api/vehicles/update/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error del endpoint:", result);
        
        // Mensaje de error por defecto
        let errorMessage = "Error al actualizar el vehículo";
        
        // Manejar errores específicos según el status code
        if (response.status === 409) {
          if (result.message.includes('VIN')) {
            errorMessage = "Ya existe otro vehículo con este VIN. Por favor, verifique el número VIN ingresado.";
          } else if (result.message.includes('license plate')) {
            errorMessage = "Ya existe otro vehículo con esta placa. Por favor, verifique el número de placa ingresado.";
          } else {
            errorMessage = "Ya existe otro vehículo con estos datos. Por favor, verifique la información ingresada.";
          }
        } else if (response.status === 404) {
          if (result.message.includes('Vehicle not found')) {
            errorMessage = "El vehículo no se encontró. Por favor, verifique que el vehículo existe.";
          } else if (result.message.includes('Client not found')) {
            errorMessage = "El cliente seleccionado no existe. Por favor, seleccione un cliente válido.";
          } else {
            errorMessage = "No se encontró la información solicitada. Por favor, verifique los datos ingresados.";
          }
        } else if (response.status === 400) {
          if (result.message.includes('No valid fields')) {
            errorMessage = "No hay campos válidos para actualizar. Por favor, modifique al menos un campo.";
          } else {
            errorMessage = "Datos de entrada inválidos. Por favor, verifique el formato de los campos.";
          }
        } else if (result.message) {
          errorMessage = result.message;
        }
        
        // Mostrar el error en el frontend
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        
        return;
      }

      console.log('✅ Vehículo actualizado:', result);

      toast({
        title: "Éxito",
        description: "Vehículo actualizado correctamente"
      });

      router.push(`/backoffice/vehiculos?token=${token}`);
    } catch (error: any) {
      console.error('Error general:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al actualizar el vehículo. Por favor, intente nuevamente."
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
            onValueChange={handleMakeChange}
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
          <ModelComboBox
            modelos={modelosDisponibles}
            onSelect={(value) => {
              const modeloSeleccionado = modelosDisponibles.find(m => m.id === value);
              setFormData({ 
                ...formData, 
                model_id: value,
                model_name: modeloSeleccionado?.name || ''
              });
            }}
            value={formData.model_id}
            disabled={!formData.make}
            placeholder={
              !formData.make 
                ? "Seleccione una marca primero" 
                : modelosDisponibles.length === 0 
                  ? "Cargando modelos..." 
                  : "Seleccionar modelo"
            }
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