"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBaseUrl } from "@/lib/utils"

interface Cliente {
  id_uuid: string;
  nombre: string;
}

export default function NuevoVehiculoPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [formData, setFormData] = useState({
    id_cliente_uuid: "",
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    placa: "",
    kilometraje_actual: 0
  })

  useEffect(() => {
    const fetchClientes = async () => {
      const supabase = createClientComponentClient()
      const { data } = await supabase
        .from('clientes')
        .select('id_uuid, nombre')
      
      if (data) setClientes(data)
    }

    fetchClientes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([formData])
        .select()

      if (error) throw error

      router.push(`${getBaseUrl()}/vehiculos`)
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
            value={formData.id_cliente_uuid}
            onValueChange={(value) => setFormData({ ...formData, id_cliente_uuid: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id_uuid} value={cliente.id_uuid}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="marca">Marca</Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Input
            id="modelo"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="anio">Año</Label>
          <Input
            id="anio"
            type="number"
            value={formData.anio}
            onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="placa">Placa</Label>
          <Input
            id="placa"
            value={formData.placa}
            onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kilometraje">Kilometraje</Label>
          <Input
            id="kilometraje"
            type="number"
            value={formData.kilometraje_actual}
            onChange={(e) => setFormData({ ...formData, kilometraje_actual: parseInt(e.target.value) })}
            required
          />
        </div>
        <Button type="submit">Guardar Vehículo</Button>
      </form>
    </div>
  )
} 