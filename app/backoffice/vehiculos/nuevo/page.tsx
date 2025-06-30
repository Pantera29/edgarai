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
import { useClientSearch } from "@/hooks/useClientSearch"
import React from "react"

interface Cliente {
  id: string;           // Cambiado de id_uuid
  names: string;        // Cambiado de nombre
  phone_number: string;
}

interface TokenData {
  dealership_id: string;
  [key: string]: any;
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

// ClienteComboBox copiado exactamente de la página de crear cita
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

export default function NuevoVehiculoPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<TokenData | null>(null);
  const [marcasPermitidas, setMarcasPermitidas] = useState<string[]>([]);
  const [marcasConId, setMarcasConId] = useState<VehicleMake[]>([]);
  const [modelosDisponibles, setModelosDisponibles] = useState<VehicleModel[]>([]);
  
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);
  
  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token");
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
        setDataToken(verifiedDataToken as TokenData);
      } else {
        router.push("/login");
      }
    }
  }, [searchParams, router]); 

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

  const [vinError, setVinError] = useState<string | null>(null);

  const validateVin = (vin: string) => {
    if (!vin) {
      setVinError(null);
      return;
    }

    if (vin.length !== 17) {
      setVinError("El VIN debe tener exactamente 17 caracteres");
      return;
    }

    if (/[IOQ]/i.test(vin)) {
      setVinError("El VIN no puede contener las letras I, O o Q");
      return;
    }

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setVinError("El VIN solo puede contener letras (A-Z, excepto I, O, Q) y números (0-9)");
      return;
    }

    setVinError(null);
  };

  // Efecto para cargar las marcas permitidas con IDs
  useEffect(() => {
    const cargarMarcasPermitidas = async () => {
      if (!dataToken?.dealership_id) return;

      try {
        const supabase = createClientComponentClient();
        
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
  }, [dataToken?.dealership_id]);

  // Nuevo efecto para cargar modelos cuando cambia la marca
  useEffect(() => {
    const cargarModelos = async () => {
      if (!formData.make || !dataToken?.dealership_id) {
        setModelosDisponibles([]);
        return;
      }

      // IMPORTANTE: Solo cargar modelos de marcas permitidas para el dealership
      try {
        const supabase = createClientComponentClient();
        
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
  }, [formData.make, marcasConId, dataToken?.dealership_id]);

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
      if (!formData.client_id) {
        toast({
          title: "Error",
          description: "Debe seleccionar un cliente",
          variant: "destructive"
        });
        return;
      }

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
        validateVin(formData.vin);
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

      console.log('Enviando al endpoint:', vehicleData);

      // USAR ENDPOINT en lugar de Supabase directo
      const response = await fetch('/api/vehicles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear el vehículo');
      }

      console.log('✅ Vehículo creado:', result);

      toast({
        title: "Vehículo creado",
        description: "El vehículo ha sido registrado exitosamente."
      });

      router.push(`/backoffice/vehiculos?token=${token}`);

    } catch (error: any) {
      console.error('Error al crear vehículo:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el vehículo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Nuevo Vehículo</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="cliente">Propietario</Label>
          <ClienteComboBox
            dealershipId={dataToken?.dealership_id || ""}
            onSelect={(id) => setFormData({ ...formData, client_id: id })}
            value={formData.client_id}
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
          <Select
            value={formData.model_id}
            onValueChange={(value) => {
              const modeloSeleccionado = modelosDisponibles.find(m => m.id === value);
              setFormData({ 
                ...formData, 
                model_id: value,
                model_name: modeloSeleccionado?.name || ''
              });
            }}
            required
            disabled={!formData.make} // Deshabilitado hasta seleccionar marca
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.make 
                  ? "Seleccione una marca primero" 
                  : modelosDisponibles.length === 0 
                    ? "Cargando modelos..." 
                    : "Seleccionar modelo"
              } />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {modelosDisponibles.length === 0 ? (
                <SelectItem value="empty" disabled>
                  {!formData.make ? "Seleccione una marca primero" : "No hay modelos disponibles"}
                </SelectItem>
              ) : (
                modelosDisponibles.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.id}>
                    {modelo.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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
            onChange={(e) => {
              const newVin = e.target.value.toUpperCase();
              setFormData({ ...formData, vin: newVin });
              validateVin(newVin);
            }}
            placeholder="17 caracteres alfanuméricos"
            maxLength={17}
            className={vinError ? "border-red-500" : ""}
          />
          {vinError && (
            <p className="text-sm text-red-500 mt-1">{vinError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            El VIN debe tener 17 caracteres. No puede contener las letras I, O o Q.
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
        <Button type="submit">Guardar Vehículo</Button>
      </form>
    </div>
  )
} 