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

interface Cliente {
  id: string;           // Cambiado de id_uuid
  names: string;        // Cambiado de nombre
}

export default function NuevoVehiculoPage() {
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
    
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formData, setFormData] = useState({
    client_id: "",      
    make: "",           // Cambiado de marca
    model: "",          // Cambiado de modelo
    year: new Date().getFullYear(), // Cambiado de anio
    license_plate: "",  // Cambiado de placa
    last_km: 0,         // Cambiado de kilometraje_actual
    vin: ""             // Añadido
  })

  useEffect(() => {
    const fetchClientes = async () => {
      const supabase = createClientComponentClient()
      const { data } = await supabase
        .from('client')           // Cambiado de clientes
        .select('id, names')      // Cambiado de id_uuid, nombre
      
      if (data) setClientes(data)
    }

    fetchClientes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase
        .from('vehicles')         
        .insert([{
          client_id: formData.client_id,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          license_plate: formData.license_plate,
          last_km: formData.last_km,
          vin: formData.vin
        }])
        .select()

      if (error) throw error

      router.push(`${getBaseUrl()}/backoffice/vehiculos`)
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
          <Input
            id="make"
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            required
          />
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
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          />
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