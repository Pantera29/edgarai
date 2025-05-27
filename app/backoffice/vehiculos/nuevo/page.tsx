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

interface Cliente {
  id: string;           // Cambiado de id_uuid
  names: string;        // Cambiado de nombre
}

interface TokenData {
  dealership_id: string;
  [key: string]: any;
}

interface VehicleMake {
  id: string;
  name: string;
}

interface DealershipBrand {
  make_id: string;
  vehicle_makes: VehicleMake;
}

export default function NuevoVehiculoPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<TokenData | null>(null);
  const [marcasPermitidas, setMarcasPermitidas] = useState<string[]>([]);
  
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

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_id: "",      
    make: "",           
    model: "",          
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

  useEffect(() => {
    const fetchClientes = async () => {
      if (!dataToken?.dealership_id) return;
      
      try {
        setLoading(true);
        setError(null);
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('client')
          .select('id, names')
          .eq('dealership_id', dataToken.dealership_id)
          .order('names', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setClientes(data);
        }
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setError('Error al cargar la lista de clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [dataToken]);

  // Nuevo efecto para cargar las marcas permitidas
  useEffect(() => {
    const cargarMarcasPermitidas = async () => {
      if (!dataToken?.dealership_id) return;

      try {
        const supabase = createClientComponentClient();
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
  }, [dataToken?.dealership_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClientComponentClient()

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

      if (!formData.model.trim()) {
        toast({
          title: "Error",
          description: "El modelo es requerido",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('vehicles')         
        .insert([{
          client_id: formData.client_id,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          license_plate: formData.license_plate,
          last_km: formData.last_km,
          vin: formData.vin,
          dealership_id: dataToken?.dealership_id
        }])
        .select()

      if (error) throw error

      toast({
        title: "Vehículo creado",
        description: "El vehículo ha sido registrado exitosamente."
      });

      // Redirigir a la página de vehículos con el token (sin refresh=true)
      router.push(`/backoffice/vehiculos?token=${token}`)
    } catch (error) {
      console.error('Error al crear vehículo:', error)
    }
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Nuevo Vehículo</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="cliente">Propietario</Label>
          <Select 
            value={formData.client_id}
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar cliente"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {error ? (
                <SelectItem value="error">Error al cargar clientes</SelectItem>
              ) : clientes.length === 0 ? (
                <SelectItem value="empty">No hay clientes disponibles</SelectItem>
              ) : (
                clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.names}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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