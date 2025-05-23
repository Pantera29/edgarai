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
  id: string;
  names: string;
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
  }, [params.id, supabase]);

  // Cargar clientes de la agencia
  useEffect(() => {
    const cargarClientes = async () => {
      if (!dataToken.dealership_id) return;
      
      try {
        const { data, error } = await supabase
          .from('client')
          .select('id, names')
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
          <Select 
            value={formData.client_id}
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.names}
                </SelectItem>
              ))}
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