"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { verifyToken } from '../../../../jwt/token'
import { useToast } from "@/hooks/use-toast"
import { carBrands } from "@/lib/car-brands"
import { useClientSearch } from '@/hooks/useClientSearch'
import { ModelComboBox } from "@/components/ModelComboBox"
import { ChangeVehicleOwnerDialog } from "@/components/ChangeVehicleOwnerDialog"
import { ArrowLeft, Car, UserCog } from "lucide-react"
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

interface TokenData {
  dealership_id: string;
}

interface PageProps {
  params: {
    id: string
  }
}

export default function EditarVehiculoPage({ params }: PageProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<TokenData | null>(null);
  const [marcasPermitidas, setMarcasPermitidas] = useState<string[]>([]);
  const [marcasConId, setMarcasConId] = useState<VehicleMake[]>([]);
  const [modelosDisponibles, setModelosDisponibles] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [changeOwnerDialogOpen, setChangeOwnerDialogOpen] = useState(false);
  const [currentOwner, setCurrentOwner] = useState<Cliente | null>(null);
  
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
    model_id: '', 
    model_name: '', 
    year: new Date().getFullYear(),
    license_plate: "",  
    last_km: 0,         
    vin: ""             
  });

  const [vinError, setVinError] = useState<string | null>(null);

  const validateVin = (vin: string) => {
    if (vin.length === 0) {
      setVinError(null);
      return;
    }
    
    if (vin.length !== 17) {
      setVinError("El VIN debe tener exactamente 17 caracteres");
      return;
    }
    
    const invalidChars = /[IOQ]/;
    if (invalidChars.test(vin)) {
      setVinError("El VIN no puede contener las letras I, O o Q");
      return;
    }
    
    setVinError(null);
  };

  // Cargar marcas permitidas para el dealership
  useEffect(() => {
    const cargarMarcasPermitidas = async () => {
      if (!dataToken?.dealership_id) return;
      
      try {
        const response = await fetch(`/api/dealership-brands?dealership_id=${dataToken.dealership_id}`);
        if (response.ok) {
          const data = await response.json();
          const marcas = data.map((brand: any) => brand.name);
          setMarcasPermitidas(marcas);
          
          // También cargar marcas con ID para el ModelComboBox
          setMarcasConId(data);
        } else {
          // Fallback a todas las marcas si no hay restricciones
          setMarcasPermitidas(carBrands);
        }
      } catch (error) {
        console.error('Error al cargar marcas:', error);
        // Fallback
        setMarcasPermitidas(carBrands);
      }
    };

    cargarMarcasPermitidas();
  }, [dataToken?.dealership_id]);

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    const cargarModelos = async () => {
      if (!formData.make || !marcasConId.length) {
        setModelosDisponibles([]);
        return;
      }

      try {
        const marcaSeleccionada = marcasConId.find(m => m.name === formData.make);
        if (!marcaSeleccionada) {
          setModelosDisponibles([]);
          return;
        }

        const response = await fetch(`/api/vehicles/makes-models?make_id=${marcaSeleccionada.id}`);
        if (response.ok) {
          const data = await response.json();
          setModelosDisponibles(data.models || []);
        } else {
          setModelosDisponibles([]);
        }
      } catch (error) {
        console.error('Error al cargar modelos:', error);
        setModelosDisponibles([]);
      }
    };

    cargarModelos();
  }, [formData.make, marcasConId]);

  // Hook para búsqueda de clientes
  const {
    clients,
    selectedClients,
    loading: clientLoading,
    error: clientError,
    searchClients,
    addSelectedClient,
    getClientById
  } = useClientSearch(dataToken?.dealership_id || '');

  // Cargar datos del vehículo
  useEffect(() => {
    console.log('🔄 Iniciando carga de vehículo...');
    const cargarVehiculo = async () => {
      try {
        const response = await fetch(`/api/vehicles/${params.id}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar la información del vehículo');
        }
        
        const vehiculo = await response.json();
        console.log('🚗 Vehículo cargado:', vehiculo);
        if (vehiculo) {
          setFormData({
            client_id: vehiculo.client_id || '',
            make: vehiculo.make || '',
            model_id: vehiculo.model_id || '',
            model_name: vehiculo.model || '',
            year: vehiculo.year || new Date().getFullYear(),
            license_plate: vehiculo.license_plate || '',
            last_km: vehiculo.last_km || 0,
            vin: vehiculo.vin || ""
          });
          
          // Buscar y agregar el cliente propietario al hook para que aparezca seleccionado
          console.log('🔍 Verificando cliente:', {
            client_id: vehiculo.client_id,
            client: vehiculo.client,
            has_client_id: !!vehiculo.client_id,
            has_client: !!vehiculo.client
          });
          
          if (vehiculo.client_id && vehiculo.client) {
            console.log('➕ Agregando cliente seleccionado:', vehiculo.client);
            const clientData = {
              id: vehiculo.client.id,
              names: vehiculo.client.names,
              phone_number: vehiculo.client.phone_number,
              email: vehiculo.client.email
            };
            addSelectedClient(clientData);
            setCurrentOwner(clientData);
          } else {
            console.log('❌ No se puede agregar cliente:', {
              reason: !vehiculo.client_id ? 'No client_id' : 'No client data'
            });
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

    if (params.id && dataToken?.dealership_id) {
      cargarVehiculo();
    }
  }, [params.id, dataToken?.dealership_id, getClientById, addSelectedClient, toast]);

  const handleOwnerChangeSuccess = (newOwner: Cliente) => {
    // Actualizar el estado local con el nuevo titular
    setFormData({ ...formData, client_id: newOwner.id });
    setCurrentOwner(newOwner);
    
    toast({
      title: "✅ Titular actualizado",
      description: `El vehículo ahora pertenece a ${newOwner.names}`,
    });
  };

  const handleOwnerChangeError = (error: string) => {
    toast({
      title: "Error al cambiar titular",
      description: error,
      variant: "destructive",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (vinError) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige el error del VIN antes de continuar",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/vehicles/update/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: formData.client_id,
          make: formData.make,
          model: formData.model_name,
          year: formData.year,
          license_plate: formData.license_plate,
          vin: formData.vin,
          last_km: formData.last_km
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error del endpoint:", result);
        
        // Manejo específico de errores
        if (result.message?.includes("VIN already exists")) {
          toast({
            title: "Error",
            description: "Ya existe un vehículo con este VIN. Por favor usa un VIN diferente.",
            variant: "destructive"
          });
        } else if (result.message?.includes("License plate already exists")) {
          toast({
            title: "Error", 
            description: "Ya existe un vehículo con esta placa. Por favor usa una placa diferente.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: result.message || "Error al actualizar el vehículo",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Éxito",
        description: "Vehículo actualizado correctamente",
      });

      // Redirigir a la lista de vehículos
      router.push(`/backoffice/vehiculos?token=${token}`);
      
    } catch (error) {
      console.error('Error al actualizar vehículo:', error);
      toast({
        title: "Error",
        description: "Error inesperado al actualizar el vehículo",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando información del vehículo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Vehículo</h1>
            <p className="text-muted-foreground">
              Modifica la información del vehículo
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente (Titular)</Label>
            <div className="flex gap-2">
              <Input
                id="client_id"
                value={currentOwner?.names || 'Sin titular asignado'}
                disabled
                className="flex-1 bg-muted"
              />
              <Button 
                type="button"
                variant="outline"
                onClick={() => setChangeOwnerDialogOpen(true)}
                className="whitespace-nowrap"
              >
                <UserCog className="w-4 h-4 mr-2" />
                Cambiar
              </Button>
            </div>
            {currentOwner && (
              <p className="text-sm text-muted-foreground">
                Teléfono: {currentOwner.phone_number}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="make">Marca</Label>
            <Select
              value={formData.make}
              onValueChange={(value) => {
                setFormData({ ...formData, make: value, model_id: '', model_name: '' });
                setModelosDisponibles([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar marca" />
              </SelectTrigger>
              <SelectContent>
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
              onSelect={(modelId: string) => {
                const modelo = modelosDisponibles.find(m => m.id === modelId);
                setFormData({ ...formData, model_id: modelId, model_name: modelo?.name || '' });
              }}
              value={formData.model_id}
              placeholder={
                formData.model_name 
                  ? formData.model_name 
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

          <div className="flex space-x-4">
            <Button type="submit">
              <Car className="w-4 h-4 mr-2" />
              Actualizar Vehículo
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de cambio de titular */}
      <ChangeVehicleOwnerDialog
        open={changeOwnerDialogOpen}
        onOpenChange={setChangeOwnerDialogOpen}
        currentOwner={currentOwner}
        dealershipId={dataToken?.dealership_id || ''}
        vehicleId={params.id}
        onSuccess={handleOwnerChangeSuccess}
        onError={handleOwnerChangeError}
      />
    </div>
  )
}
