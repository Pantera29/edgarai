"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBaseUrl } from "@/lib/utils"

export default function NuevoClientePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([formData])
        .select()

      if (error) throw error

      router.push(`${getBaseUrl()}/clientes`)
    } catch (error) {
      console.error('Error al crear cliente:', error)
    }
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            required
          />
        </div>
        <Button type="submit">Guardar Cliente</Button>
      </form>
    </div>
  )
} 