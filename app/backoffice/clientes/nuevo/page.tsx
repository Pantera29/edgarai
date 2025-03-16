"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBaseUrl } from "@/lib/utils"
import { verifyToken } from '../../../jwt/token'
import { useEffect, useState } from "react"

export default function NuevoClientePage() {
  const router = useRouter()
  
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

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
  
  const [formData, setFormData] = useState({
    names: "",           // Cambiado de nombre
    email: "",
    phone_number: ""     // Cambiado de telefono
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClientComponentClient()

    try {
      const { data, error } = await supabase
        .from('client')           // Cambiado de clientes
        .insert([{
          ...formData,
          dealership_id: '6b58f82d-baa6-44ce-9941-1a61975d20b5' // Agregar dealership_id
        }])
        .select()

      if (error) throw error

      router.push(`${getBaseUrl()}/backoffice/clientes`)
    } catch (error) {
      console.error('Error al crear cliente:', error)
    }
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="names">Nombre</Label>
          <Input
            id="names"
            value={formData.names}
            onChange={(e) => setFormData({ ...formData, names: e.target.value })}
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
          <Label htmlFor="phone_number">Teléfono</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
          />
        </div>
        <Button type="submit">Guardar Cliente</Button>
      </form>
    </div>
  )
} 